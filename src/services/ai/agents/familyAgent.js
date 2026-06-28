const { z } = require("zod");
const llm = require("../../../config/llm");

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

🎯 SPECIAL INSTRUCTIONS:
1. taskList Generation: Always analyze the user's needs to generate a list of concrete caregiving tasks (e.g. ["Medication adherence", "Post-stroke mobility guidance"]). Even if the user is just saying hello, keep it empty or populate it based on context.
2. If the user mentions a specific location, city, neighborhood, or governorate (e.g., "في مدينة نصر", "عايز ممرض بالقاهرة"), you MUST extract these names and place them into 'city' and 'governorate' fields, and automatically switch the 'responseType' to "filtered_data".
3. If the user mentions gender preferences (e.g. "أفضل ممرضة سيدة", "أحتاج ممرض رجل"), extract it into 'preferredGender' ('male' or 'female') and switch 'responseType' to "filtered_data".
4. Maintain previous filters from the history if they are still relevant and not contradicted.
5. Keep the 'aiReply' natural, reassuring, and helpful in the correct language.
`;
};

const execute = async (userMessage, formattedHistory = [], lang = "ar") => {
  try {
    const structuredLlm = llm.withStructuredOutput(familyAgentOutputSchema);
    const systemMessage = { role: "system", content: getFamilySystemPrompt(lang) };

    const promptMessages = [
      systemMessage,
      ...formattedHistory,
      { role: "user", content: userMessage }
    ];

    const response = await structuredLlm.invoke(promptMessages);
    return response;
  } catch (error) {
    console.error("FamilyAgent error:", error);
    return {
      responseType: "text",
      aiReply: lang === "ar" ? "عذرًا، حدث خطأ أثناء معالجة طلبك." : "Sorry, an error occurred while processing your request.",
      taskList: [],
      extractedFilters: {}
    };
  }
};

const generateCarePlan = async (conditionDescription, skillsList = [], lang = "ar") => {
  try {
    const carePlanOutputSchema = z.object({
      tasksList: z.array(z.string()).describe("A structured checklist of recommended caregiving tasks"),
      requiredSkills: z.array(z.string()).describe("Selected Skill ObjectId strings strictly from the provided list that are needed")
    });

    const structuredLlm = llm.withStructuredOutput(carePlanOutputSchema);

    const skillsContext = skillsList.map(s => `- ID: ${s._id}, Name (EN): ${s.nameEn}, Name (AR): ${s.nameAr}, Category: ${s.category}`).join("\n");

    const systemPrompt = `
You are the Sanad Care Plan and Clinical Coordinator Agent.
Your job is to analyze the family's description of a patient's medical/physical condition and recommend:
1. A tasksList of concrete caregiving actions/routines to pre-fill their posting form.
2. A list of requiredSkills IDs strictly selected from the provided platform skills.

Available platform skills:
${skillsContext}

Determine matched requiredSkills IDs carefully based on user needs. Return an empty array if no strong skill matches exist.
Write tasksList in: [${lang.toUpperCase()}].
`;

    const response = await structuredLlm.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: conditionDescription }
    ]);

    return response;
  } catch (error) {
    console.error("FamilyAgent.generateCarePlan error:", error);
    return {
      tasksList: [],
      requiredSkills: []
    };
  }
};

module.exports = {
  execute,
  generateCarePlan,
  familyAgentOutputSchema,
};
