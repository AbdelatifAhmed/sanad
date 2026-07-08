const { ChatOpenAI } = require("@langchain/openai");
require("dotenv").config();

const openAIApiKey = process.env.OPEN_AI_API_KEY || process.env.OPENAI_API_KEY;

const model = new ChatOpenAI({
  apiKey: openAIApiKey,
  modelName: "gpt-4o-mini",
  temperature: 0.7,
});

const openAILLM = {
  model,
  async invoke(messages, options = {}) {
    let activeModel = model;
    const { tools, ...restOptions } = options;
    if (tools && Array.isArray(tools)) {
      activeModel = model.bindTools(tools);
    }

    const response = await activeModel.invoke(messages, restOptions);
    
    return {
      content: response.content,
      tool_calls: response.tool_calls || []
    };
  },
  withStructuredOutput(schema) {
    const structuredModel = model.withStructuredOutput(schema);
    return {
      invoke: async (messages, options) => {
        const parsed = await structuredModel.invoke(messages, options);
        if (parsed) {
          if (parsed.response && !parsed.aiReply) parsed.aiReply = parsed.response;
          if (parsed.answer && !parsed.aiReply) parsed.aiReply = parsed.answer;
          if (parsed.sentiment && !parsed.sentimentScore) parsed.sentimentScore = parsed.sentiment;
          if (parsed.violations && !parsed.flaggedViolations) parsed.flaggedViolations = parsed.violations;
          if (parsed.summary && !parsed.auditSummary) parsed.auditSummary = parsed.summary;
          if (parsed.filters && !parsed.extractedFilters) parsed.extractedFilters = parsed.filters;
        }
        return parsed;
      }
    };
  }
};

module.exports = openAILLM;
