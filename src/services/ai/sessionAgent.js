const llm = require('../../config/llm');
const { SystemMessage, HumanMessage, AIMessage } = require('@langchain/core/messages');
const AIChatSession = require('../../models/aiChatSession.schema.js');

const { familyOutputSchema, getFamilySystemPrompt } = require('./prompts/familyPrompt.js');
const { companionOutputSchema, getCompanionSystemPrompt } = require('./prompts/companionPrompt.js');

const promptMap = {
  family_assistant: getFamilySystemPrompt,
  companion_support: getCompanionSystemPrompt
};

const schemaMap = {
  family_assistant: familyOutputSchema,
  companion_support: companionOutputSchema
};

const sessionAgent = async (userId, userMessage, agentType, lang = 'ar') => {
  let session = await AIChatSession.findOne({ userId, agentType });
  if (!session) {
    session = new AIChatSession({ userId, agentType, messages: [] });
  }

  const recentMessages = session.messages.slice(-10);
  
  const selectedPromptStyle = promptMap[agentType](lang);
  const systemPrompt = new SystemMessage(selectedPromptStyle);

  const currentSchema = schemaMap[agentType];
  const structuredLlm = llm.withStructuredOutput(currentSchema);

  const formattedHistory = recentMessages.map((msg) => {
    return msg.sender === 'user' ? new HumanMessage(msg.text) : new AIMessage(msg.text);
  });

  const response = await structuredLlm.invoke([
    systemPrompt,
    ...formattedHistory,
    new HumanMessage(userMessage)
  ]);

  session.messages.push({ sender: 'user', text: userMessage });
  session.messages.push({ sender: 'ai', text: response.aiReply });
  await session.save();

  return {
    responseType: response.responseType,
    reply: response.aiReply,
    filters: response.extractedFilters || {}
  };
};

module.exports = { sessionAgent };