const { z } = require('zod');

const familyOutputSchema = z.object({
  aiReply: z.string().describe("The friendly and natural reply directed to the family in the current conversation language"),
  extractedFilters: z.object({
    searchQuery: z.string().optional().describe("The required semantic skills"),
    maxRate: z.number().optional().describe("The mentioned price"),
    days: z.array(z.string()).optional().describe("The required days"),
    startDate: z.string().optional().describe("The start date in YYYY-MM-DD format"),
    endDate: z.string().optional().describe("The end date in YYYY-MM-DD format")
  }).optional()
});

const getFamilySystemPrompt = (lang) => `
You are the Sanad Family Assistant Agent. Your role is to help families find companions.
Current language: [${lang.toUpperCase()}].

Analyze the conversation history and the new message to extract any filtering parameters dynamically.
If the user refines their search (e.g., updates rate, adds a day, changes dates), maintain the previous filters from the history unless they contradict the new query.
`;

module.exports = { familyOutputSchema, getFamilySystemPrompt };
