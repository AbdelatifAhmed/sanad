const Skill = require("../../models/skills.schema");
const familyAgent = require("../../services/ai/agents/familyAgent");

/**
 * Controller to generate dynamic care plans.
 * Maps condition description to platform taskLists and skill IDs.
 *
 * POST /api/ai/family/generate-care-plan
 */
const generateCarePlan = async (req, res) => {
  try {
    const { description } = req.body;
    const lang = req.lang || "ar";

    if (!description || !description.trim()) {
      return res.status(400).json({
        status: "fail",
        message: lang === "en" ? "Patient description is required" : "وصف حالة المريض مطلوب",
      });
    }

    // 1. Fetch platform skills natively to match inside the LLM prompt context
    const skills = await Skill.find().lean();

    // 2. Delegate to familyAgent care plan tool
    const plan = await familyAgent.generateCarePlan(description, skills, lang);

    return res.status(200).json({
      status: "success",
      data: plan,
    });
  } catch (error) {
    console.error("Error in generateCarePlan controller:", error);
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

module.exports = {
  generateCarePlan,
};
