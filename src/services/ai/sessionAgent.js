const llm = require('../../config/llm');
const { SystemMessage, HumanMessage, AIMessage } = require('@langchain/core/messages');
const AIChatSession = require('../../models/aiChatSession.schema.js');
const familyPrompt = require('./prompts/familyPrompt.js');
const companionPrompt = require('./prompts/companionPrompt.js');

const promptMap = {
  family_assistant: familyPrompt,
  companion_support: companionPrompt
};


const sessionAgent = async (userId, userMessage, agentType, lang = 'ar') => {
  let session = await AIChatSession.findOne({ userId, agentType });
  if (!session) {
    session = new AIChatSession({ userId, agentType, messages: [] });
  }

  const recentMessages = session.messages.slice(-10);


  const selectedPromptStyle = promptMap[agentType](lang);
  const systemPrompt = new SystemMessage(selectedPromptStyle);

  const formattedHistory = recentMessages.map((msg) => {
    return msg.sender === 'user' ? new HumanMessage(msg.text) : new AIMessage(msg.text);
  });

  const conversationQueue = [
    systemPrompt,
    ...formattedHistory,
    new HumanMessage(userMessage)
  ];

  const response = await llm.invoke(conversationQueue);
  const aiReply = response.content;

  session.messages.push({ sender: 'user', text: userMessage });
  session.messages.push({ sender: 'ai', text: aiReply });
  await session.save();

  return aiReply;
};

module.exports = {
  sessionAgent
};