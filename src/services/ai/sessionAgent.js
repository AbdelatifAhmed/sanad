const llm = require('../../config/llm');
const { SystemMessage, HumanMessage, AIMessage } = require('@langchain/core/messages');
const AIChatSession = require('../../models/aiChatSession.schema.js');
const familyPrompt = require('./prompts/familyPrompt.js');
const companionPrompt = require('./prompts/companionPrompt.js');
const { z } = require('zod');

const promptMap = {
  family_assistant: familyPrompt,
  companion_support: companionPrompt
};

const aiOutputSchema = z.object({
  responseType: z.enum(["text", "filtered_data"]).describe(
    "Choose 'text' for general chat or a normal question. Choose 'filtered_data' when the user specifies conditions or criteria (price, skill, days, date, or geographic location) that require database filtering."
  ),
  aiReply: z.string().describe("The natural and friendly text reply directed to the user"),
  extractedFilters: z.object({
    searchQuery: z.string().optional().describe("Semantic search (companion skills or details about the family's patient case)"),
    maxRate: z.number().optional().describe("The maximum price or budget"),
    days: z.array(z.string()).optional().describe("The selected days"),
    startDate: z.string().optional().describe("The start date in YYYY-MM-DD format"),
    endDate: z.string().optional().describe("The end date in YYYY-MM-DD format"),
    
    city: z.string().optional().describe("The city extracted from text, e.g., 'مدينة نصر', 'المعادي', 'مصر الجديدة'"),
    governorate: z.string().optional().describe("The governorate/state extracted, e.g., 'القاهرة', 'الجيزة', 'الإسكندرية'"),
    readableAddress: z.string().optional().describe("Any specific neighborhood or street details mentioned by the user for location mapping")
  }).optional()
});

const structuredLlm = llm.withStructuredOutput(aiOutputSchema);

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