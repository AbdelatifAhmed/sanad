const { z } = require('zod');

const companionOutputSchema = z.object({
  aiReply: z.string().describe("The professional and guidance-focused reply directed to the companion"),
  extractedFilters: z.object({
    jobType: z.string().optional().describe("The type of work they are interested in: full-time, part-time, volunteer")
  }).optional()
});

const getCompanionSystemPrompt = (lang) => `
You are the Sanad Companion Support Agent. Your role is to guide and support caregivers and volunteers.
Current language: [${lang.toUpperCase()}].

Provide professional advice, crisis management steps, and platform rule explanations based on their queries.
`;

module.exports = { companionOutputSchema, getCompanionSystemPrompt };
