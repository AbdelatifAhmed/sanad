const { z } = require("zod");
const llm = require("../../../config/llm");
const Companion = require("../../../models/companion.schema");
const JobPost = require("../../../models/jobPost.schema");

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
1. Provide professional, encouraging crisis advice, safety guidelines, and platform policy checks.
2. If the user asks for suitable job posts, shifts, or matches (e.g. "أريد وظائف مناسبة", "suggest jobs for me"), set 'wantsJobMatching' to true.
3. Keep response professional, reassuring, and aligned with Sanad caregiver policies.
`;
};

const execute = async (userMessage, formattedHistory = [], lang = "ar", userId = null) => {
  try {
    const structuredLlm = llm.withStructuredOutput(companionAgentOutputSchema);
    const systemMessage = { role: "system", content: getCompanionSystemPrompt(lang) };

    const promptMessages = [
      systemMessage,
      ...formattedHistory,
      { role: "user", content: userMessage }
    ];

    const response = await structuredLlm.invoke(promptMessages);
    
    let matchedJobs = [];

    if (response.wantsJobMatching && userId) {
      try {
        const companionProfile = await Companion.findOne({ userId }).select("+bioEmbedding");
        if (companionProfile && companionProfile.bioEmbedding && companionProfile.bioEmbedding.length > 0) {
          try {
            matchedJobs = await JobPost.aggregate([
              {
                $vectorSearch: {
                  index: "job_vector_index", 
                  path: "requirement_embedding",
                  queryVector: companionProfile.bioEmbedding,
                  numCandidates: 40,
                  limit: 5,
                  filter: { status: "open" }
                }
              },
              {
                $project: {
                  requirement_embedding: 0
                }
              }
            ]);
          } catch (vectorError) {
            console.warn("JobPost vector search failed, falling back to native query:", vectorError.message);
            const filter = { status: "open" };
            if (companionProfile.specialization && companionProfile.specialization !== "none") {
              filter.serviceType = companionProfile.specialization; 
            }
            matchedJobs = await JobPost.find(filter)
              .select("-requirement_embedding")
              .limit(5)
              .lean();
          }
        } else {
          matchedJobs = await JobPost.find({ status: "open" })
            .select("-requirement_embedding")
            .limit(5)
            .lean();
        }
      } catch (dbError) {
        console.error("Job matching database error:", dbError);
      }
    }

    return {
      responseType: response.wantsJobMatching ? "filtered_data" : "text",
      reply: response.aiReply,
      activeFilters: response.extractedFilters || {},
      results: matchedJobs
    };

  } catch (error) {
    console.error("CompanionAgent error:", error);
    return {
      responseType: "text",
      reply: lang === "ar" ? "عذرًا، فشل Co-Pilot في معالجة طلبك حاليًا." : "Sorry, the Co-Pilot failed to process your request at this time.",
      activeFilters: {},
      results: []
    };
  }
};

module.exports = {
  execute,
  companionAgentOutputSchema
};
