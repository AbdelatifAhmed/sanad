const llm = require("../../../config/llm");
const { queryLocalKnowledge } = require("../ragService");
const { familyAgentOutputSchema, getFamilySystemPrompt } = require("../prompts/familyPrompt");

const execute = async (userMessage, formattedHistory = [], lang = "ar") => {
  try {
    const ragContext = await queryLocalKnowledge(userMessage, "family");
    const structuredLlm = llm.withStructuredOutput(familyAgentOutputSchema);
    
    const systemPrompt = `${getFamilySystemPrompt(lang)}\n\nCONTEXT FROM KNOWLEDGE BASE:\n${ragContext || "No context found."}`;
    const systemMessage = { role: "system", content: systemPrompt };

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
    const { z } = require("zod");
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
