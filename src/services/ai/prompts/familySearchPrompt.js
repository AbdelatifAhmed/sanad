const { z } = require("zod");

const familySearchSchema = z.object({
  intent: z.enum(["search_companions", "calendar", "platform_qa", "general_chat"]),
  city: z.string().nullable(),
  governorate: z.string().nullable(),
  preferredGender: z.enum(["male", "female"]).nullable(),
  maxHourlyRate: z.number().nullable(),
  specialty: z.enum(["none", "nursing", "physiotherapy", "companionship_companion", "dementia"]).nullable(),
  skills: z.array(z.string()),
  days: z.array(z.string()),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  semanticQuery: z.string().nullable(),
});

const getFamilySearchSystemPrompt = (lang) => {
  return `
You extract strict filters for the Sanad caregiver search and classify the family user's intent.
Return null/empty values when not explicitly implied.

🎯 CRITICAL SCHEMA CONSTRAINT:
- 'intent' MUST be one of: "search_companions", "calendar", "platform_qa", "general_chat".
- 'specialty' MUST be one of: "none", "nursing", "physiotherapy", "companionship_companion", "dementia".
- 'preferredGender' MUST be "male" or "female".
- All day names in 'days' MUST be normalized to English weekday names (e.g. "Monday", "Saturday").

🎯 GEOGRAPHIC NORMALIZATION RULE:
To match MongoDB fields, you MUST translate and normalize all city and governorate names to their standard Egyptian Arabic names:
- "Cairo" or "cairo" -> "القاهرة"
- "Giza" or "giza" -> "الجيزة"
- "Alexandria" or "alexandria" -> "الإسكندرية"
- "Qena" or "qena" -> "قنا"
- "Nasr City" -> "مدينة نصر"
- "Maadi" -> "المعادي"
- "Heliopolis" or "Masr El Gedida" -> "مصر الجديدة"
Always output the 'city' and 'governorate' fields in Arabic (e.g. "القاهرة", "الجيزة") to ensure database matches.

Current response language: ${lang}.
`;
};

module.exports = {
  familySearchSchema,
  getFamilySearchSystemPrompt
};
