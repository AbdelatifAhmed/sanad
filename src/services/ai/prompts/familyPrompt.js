const { z } = require("zod");

const familyOutputSchema = z.object({
  responseType: z
    .enum(["text", "filtered_data"])
    .describe(
      "Choose 'text' for general chat, greetings, or informational questions. Choose 'filtered_data' when the user specifies any conditions, caregiver skills, price limits, or geographic location criteria that require a database lookup.",
    ),
  aiReply: z
    .string()
    .describe(
      "The friendly and natural reply directed to the family in the current conversation language",
    ),
  extractedFilters: z
    .object({
      searchQuery: z
        .string()
        .optional()
        .describe(
          "The required semantic skills or medical condition details (e.g., 'Alzheimer nurse', 'elderly care')",
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
          "The specific city or district name extracted from text (e.g., 'مدينة نصر', 'المعادي', 'التجمع')",
        ),
      governorate: z
        .string()
        .optional()
        .describe(
          "The governorate/state name extracted (e.g., 'القاهرة', 'الجيزة', 'الإسكندرية')",
        ),
      readableAddress: z
        .string()
        .optional()
        .describe(
          "Any detailed or landmark-based location data provided by the user for precise mapping",
        ),
    })
    .optional(),
});

const getFamilySystemPrompt = (lang) => {
  const isArabic = lang === "ar";

  return `
You are the Sanad Family Assistant Agent, an expert AI coordinator helping families match with the perfect caregivers and companions.
Current language: [${lang.toUpperCase()}].

Your core responsibility is to analyze the conversation history and the user's latest message to extract semantic preferences and strict filtering parameters.

🎯 GEOGRAPHIC & FILTERS INSTRUCTIONS:
1. If the user mentions a specific location, city, neighborhood, or governorate (e.g., "في مدينة نصر", "عايز ممرض بالقاهرة"), you MUST extract these names and place them into 'city' and 'governorate' fields, and automatically switch the 'responseType' to "filtered_data".
2. If the user refines their search (e.g., updates rate, adds a day, changes dates, or mentions a new location), maintain the previous filters from the history unless they explicitly contradict the new query.
3. Keep the 'aiReply' natural, reassuring, and helpful. Always confirm to the family that you are filtering caregivers based on their exact conditions (skills, budget, and proximity/location).
`;
};

module.exports = { familyOutputSchema, getFamilySystemPrompt };
