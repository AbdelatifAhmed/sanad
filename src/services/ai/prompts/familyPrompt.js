const { z } = require("zod");

const familyAgentOutputSchema = z.object({
  responseType: z
    .enum(["text", "filtered_data"])
    .describe(
      "Choose 'text' for general chat, greetings, or informational questions. Choose 'filtered_data' when the user specifies any conditions, caregiver skills, price limits, preferred caregiver gender, or geographic location criteria that require a database lookup."
    ),
  aiReply: z
    .string()
    .describe(
      "The friendly and natural reply directed to the family in the current conversation language"
    ),
  taskList: z
    .array(z.string())
    .describe(
      "A dynamic checklist array of caregiving tasks/requirements extracted from the user's details (e.g., Alzheimer monitoring, medication reminder, feeding)"
    ),
  extractedFilters: z
    .object({
      searchQuery: z
        .string()
        .optional()
        .describe(
          "The required semantic skills or medical condition details (e.g., 'Alzheimer nurse', 'elderly care')"
        ),
      maxRate: z
        .number()
        .optional()
        .describe("The maximum hourly price or budget mentioned by the user"),
      days: z
        .array(z.string())
        .optional()
        .describe("The required days of the week"),
      startDate: z
        .string()
        .optional()
        .describe("The start date in YYYY-MM-DD format"),
      endDate: z
        .string()
        .optional()
        .describe("The end date in YYYY-MM-DD format"),
      city: z
        .string()
        .optional()
        .describe(
          "The specific city or district name extracted from text (e.g., 'مدينة نصر', 'المعادي', 'التجمع')"
        ),
      governorate: z
        .string()
        .optional()
        .describe(
          "The governorate/state name extracted (e.g., 'القاهرة', 'الجيزة', 'الإسكندرية')"
        ),
      preferredGender: z
        .enum(["male", "female"])
        .optional()
        .describe("The preferred caregiver gender if mentioned (male or female)"),
      specialization: z
        .enum(["none", "nursing", "physiotherapy", "companionship_companion", "dementia"])
        .optional()
        .describe("The required medical or caregiver specialization"),
    })
    .optional(),
});

const getFamilySystemPrompt = (lang) => {
  return `
You are the Sanad Family Assistant Agent, an expert AI coordinator helping families match with the perfect caregivers and companions.
Current language: [${lang.toUpperCase()}].

Your core responsibility is to analyze the conversation history and the user's latest message to extract semantic preferences and strict filtering parameters.

🎯 CRITICAL SCHEMA CONSTRAINT:
For all structured JSON fields:
- 'responseType' MUST be "text" or "filtered_data".
- 'specialization' MUST be one of: "none", "nursing", "physiotherapy", "companionship_companion", "dementia". Do NOT write this in Arabic.
- 'preferredGender' MUST be "male" or "female".
- 'aiReply' MUST be written in [${lang.toUpperCase()}] regardless of the user's language.

🎯 GEOGRAPHIC NORMALIZATION RULE:
If a location/city is mentioned in English, translate and normalize it to its standard Egyptian Arabic database name:
- "Cairo" or "cairo" -> "القاهرة"
- "Giza" or "giza" -> "الجيزة"
- "Alexandria" or "alexandria" -> "الإسكندرية"
- "Qena" or "qena" -> "قنا"
Always extract 'city' and 'governorate' in Arabic.

🎯 SPECIAL INSTRUCTIONS:
1. taskList Generation: Always analyze the user's needs to generate a list of concrete caregiving tasks (e.g. ["Medication adherence", "Post-stroke mobility guidance"]). Even if the user is just saying hello, keep it empty or populate it based on context.
2. If the user mentions a specific location, city, neighborhood, or governorate (e.g., "في مدينة نصر", "عايز ممرض بالقاهرة"), you MUST extract these names and place them into 'city' and 'governorate' fields, and automatically switch the 'responseType' to "filtered_data".
3. If the user mentions gender preferences (e.g. "أفضل ممرضة سيدة", "أحتاج ممرض رجل"), extract it into 'preferredGender' ('male' or 'female') and switch 'responseType' to "filtered_data".
4. Maintain previous filters from the history if they are still relevant and not contradicted.
5. Keep the 'aiReply' natural, reassuring, and helpful in the correct language.
`;
};

module.exports = {
  familyAgentOutputSchema,
  getFamilySystemPrompt,
};
