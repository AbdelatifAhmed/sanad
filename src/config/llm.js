const openAILLM = require("./openAILLM");
const pollinationsLLM = require("./pollinationsLLM");
require("dotenv").config();

const getActiveLLM = () => {
  const provider = (process.env.DEFAULT_MODEL || "polli").trim().toLowerCase();
  console.log(`[LLM Switcher] Active provider: ${provider}`);
  if (provider === "openai") {
    return openAILLM;
  }
  return pollinationsLLM;
};

const llm = {
  get models() {
    const active = getActiveLLM();
    return active.models || ["gpt-4o-mini"];
  },
  get timeoutMs() {
    const active = getActiveLLM();
    return active.timeoutMs || 15000;
  },
  invoke: (messages, options) => {
    return getActiveLLM().invoke(messages, options);
  },
  withStructuredOutput: (schema, options) => {
    return getActiveLLM().withStructuredOutput(schema, options);
  }
};

module.exports = llm;
