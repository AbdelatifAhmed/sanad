const axios = require("axios");
require("dotenv").config();

const SUPPORTED_MODELS = [
  "openai-fast",
  "openai",
  "gpt-5.4-mini",
  "gpt-5.4",
  "mistral-small-3.2",
  "mistral",
  "deepseek",
  "gemini-flash-lite-3.1",
  "gemini-3-flash",
];

const DEFAULT_MODEL = "openai-fast";
const DEFAULT_TIMEOUT_MS = Number(process.env.AI_MODEL_TIMEOUT_MS || 60000);
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

const getModelPriority = () => {
  const requested = (process.env.ACTIVE_AI_MODEL || DEFAULT_MODEL)
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  const normalized = [];
  if (!requested.includes(DEFAULT_MODEL)) normalized.push(DEFAULT_MODEL);

  for (const model of requested) {
    if (SUPPORTED_MODELS.includes(model) && !normalized.includes(model)) normalized.push(model);
  }

  for (const model of SUPPORTED_MODELS) {
    if (!normalized.includes(model)) normalized.push(model);
  }

  return normalized;
};

class DynamicGatewayLLM {
  constructor() {
    this.models = getModelPriority();
    this.timeoutMs = Number(process.env.AI_MODEL_TIMEOUT_MS || 15000);
    this.globalTimeoutMs = Number(process.env.AI_GLOBAL_TIMEOUT_MS || 45000);
  }

  async invoke(messages, options = {}) {
    const apiKey = process.env.Ai_API_KEY || process.env.AI_API_KEY || "pollinations_free_access";
    const baseUrl = process.env.AI_BASE_URL || "https://gen.pollinations.ai";
    const requestUrl = new URL("/v1/chat/completions", baseUrl).toString();

    const failures = [];
    const startedAt = Date.now();

    const formattedMessages = messages.map((msg) => {
      if (typeof msg === "string") return { role: "user", content: msg };
      return {
        role:
          msg.role ||
          (msg.constructor.name === "HumanMessage" ? "user" : "assistant"),
        content: msg.content,
      };
    });

    const systemMessage = messages.find(
      (msg) =>
        msg.role === "system" || msg.constructor.name === "SystemMessage",
    );
    const systemPrompt = systemMessage
      ? systemMessage.content
      : options.system_prompt || "You are a helpful assistant.";

    const finalMessages = [
      { role: "system", content: systemPrompt },
      ...formattedMessages.filter((msg) => msg.role !== "system"),
    ];

    for (const modelId of this.models) {
      if (Date.now() - startedAt > this.globalTimeoutMs) {
        console.error("[Pollinations AI] Global timeout exceeded (12s). Failing fast.");
        throw new Error("AI Service Global Timeout Exceeded. Request took too long.");
      }

      try {
        console.log(`[Pollinations AI] Routing request to model: ${modelId}`);

        const payload = {
          messages: finalMessages,
          model: modelId,
          seed: Math.floor(Math.random() * 99999),
          ...(options.jsonMode ? { response_format: { type: "json_object" } } : {}),
          ...(options.tools ? { tools: options.tools } : {}),
        };

        const response = await axios.post(
          requestUrl,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            timeout: Math.min(this.timeoutMs, this.globalTimeoutMs - (Date.now() - startedAt)),
          },
        );

        const aiText =
          typeof response.data === "string"
            ? response.data
            : response.data?.choices?.[0]?.message?.content ||
              response.data?.choices?.[0]?.text ||
              response.data?.content ||
              response.data?.reply ||
              response.data?.message ||
              JSON.stringify(response.data);

        const toolCalls = response.data?.choices?.[0]?.message?.tool_calls || [];
        const normalizedToolCalls = toolCalls.map(tc => ({
          name: tc.function?.name,
          args: typeof tc.function?.arguments === "string" ? JSON.parse(tc.function.arguments) : tc.function?.arguments,
          id: tc.id
        }));

        console.log(`[Pollinations AI] Model [${modelId}] completed in ${Date.now() - startedAt}ms`);

        return {
          content: aiText,
          tool_calls: normalizedToolCalls,
          response_metadata: { model: modelId, raw: response.data },
        };
      } catch (error) {
        const statusCode = error.response?.status;
        const errorMsg = error.response
          ? JSON.stringify(error.response.data)
          : error.message;
        
        failures.push(`${modelId}: ${errorMsg}`);
        console.warn(
          `[Pollinations Warning] Model [${modelId}] failed. Error: ${errorMsg}. Trying next fallback...`,
        );

        if (statusCode === 403 || statusCode === 401) {
          throw new Error(`AI Gateway Authentication/Access Error: ${errorMsg}`);
        }
        
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          throw new Error("AI Gateway Unreachable. Failing fast.");
        }

        if (statusCode && RETRYABLE_STATUS_CODES.has(statusCode) && modelId === DEFAULT_MODEL) {
          console.warn("[Pollinations Warning] Primary model failed with a retryable status; continuing with the next fallback model.");
        }
      }
    }

    throw new Error(
      `All Pollinations models failed. Breakdown: ${failures.join(" | ")}`,
    );
  }

  withStructuredOutput(schema) {
    return {
      invoke: async (messages, options) => {
        const schemaKeys = schema?.shape ? Object.keys(schema.shape) : [];
        const schemaInstruction = [
          "You MUST respond ONLY with a clean, valid JSON object.",
          "Do not wrap the response in markdown formatting (NO ```json).",
          "Do not write conversational text before or after the JSON.",
          "The JSON must match the exact field names and types requested by the caller.",
          schemaKeys.length > 0
            ? `Required top-level field names: ${schemaKeys.join(", ")}.`
            : "",
        ].join(" ");

        const hasSystem = messages.some(
          (msg) =>
            msg.role === "system" || msg.constructor.name === "SystemMessage",
        );
        const enhanceMessages = hasSystem
          ? messages.map((msg) => {
              if (
                msg.role === "system" ||
                msg.constructor.name === "SystemMessage"
              ) {
                return {
                  role: "system",
                  content: `${msg.content}\n\n${schemaInstruction}`,
                };
              }
              return msg;
            })
          : [{ role: "system", content: schemaInstruction }, ...messages];

        const result = await this.invoke(enhanceMessages, {
          ...options,
          jsonMode: true,
        });
        try {
          const cleanText = result.content.replace(/```json|```/g, "").trim();
          const firstBrace = cleanText.indexOf("{");
          const lastBrace = cleanText.lastIndexOf("}");
          const jsonText =
            firstBrace >= 0 && lastBrace > firstBrace
              ? cleanText.slice(firstBrace, lastBrace + 1)
              : cleanText;

          const parsed = JSON.parse(jsonText);

          if (parsed.response && !parsed.aiReply)
            parsed.aiReply = parsed.response;
          if (parsed.answer && !parsed.aiReply) parsed.aiReply = parsed.answer;
          if (parsed.sentiment && !parsed.sentimentScore)
            parsed.sentimentScore = parsed.sentiment;
          if (parsed.violations && !parsed.flaggedViolations)
            parsed.flaggedViolations = parsed.violations;
          if (parsed.summary && !parsed.auditSummary)
            parsed.auditSummary = parsed.summary;
          if (parsed.filters && !parsed.extractedFilters)
            parsed.extractedFilters = parsed.filters;

          return schema?.parse ? schema.parse(parsed) : parsed;
        } catch (e) {
          throw new Error(
            `Failed to parse or validate AI structured output. ${e.message}. Raw text content was: ${result.content}`,
          );
        }
      },
    };
  }
}

const llm = new DynamicGatewayLLM();

module.exports = llm;
module.exports.DynamicGatewayLLM = DynamicGatewayLLM;
module.exports.SUPPORTED_MODELS = SUPPORTED_MODELS;
