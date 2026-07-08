const { z } = require("zod");

const companionAgentOutputSchema = z.object({
  aiReply: z
    .string()
    .describe(
      "The professional and supportive advice, shift guidance, crisis resolution steps, or platform rules directed to the companion/caregiver."
    ),
  wantsJobMatching: z
    .boolean()
    .describe(
      "True if the caregiver is asking for job suggestions, matches, or lists of open jobs they can apply to. False otherwise."
    ),
  extractedFilters: z
    .object({
      jobType: z
        .string()
        .optional()
        .describe("The type of work they are interested in (full-time, part-time, volunteer)"),
      serviceType: z
        .string()
        .optional()
        .describe("The specialization or service type category"),
    })
    .optional(),
});

const getCompanionSystemPrompt = (lang) => {
  return `
You are the Sanad Companion Support Agent & Shift Co-Pilot.
Current language: [${lang.toUpperCase()}].

Your role is to guide, support, and advise professional caregivers, nurses, and companions on the platform.

🎯 CRITICAL SCHEMA CONSTRAINT:
- 'wantsJobMatching' MUST be a boolean (true or false).
- 'aiReply' MUST be written in [${lang.toUpperCase()}] regardless of the user's language.
- Any fields in 'extractedFilters' must use English strings.

1. Provide professional, encouraging crisis advice, safety guidelines, and platform policy checks.
2. If the user asks for suitable job posts, shifts, or matches (e.g. "أريد وظائف مناسبة", "suggest jobs for me"), set 'wantsJobMatching' to true.
3. Keep response professional, reassuring, and aligned with Sanad caregiver policies.
`;
};

module.exports = {
  companionAgentOutputSchema,
  getCompanionSystemPrompt,
};
