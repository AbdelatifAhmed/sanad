const llm = require("../../../config/llm");
const Companion = require("../../../models/companion.schema");
const JobPost = require("../../../models/jobPost.schema");
const { queryLocalKnowledge } = require("../ragService");
const { companionAgentOutputSchema, getCompanionSystemPrompt } = require("../prompts/companionPrompt");

const execute = async (userMessage, formattedHistory = [], lang = "ar", userId = null) => {
  try {
    const ragContext = await queryLocalKnowledge(userMessage, "companion");
    const structuredLlm = llm.withStructuredOutput(companionAgentOutputSchema);
    
    const systemPrompt = `${getCompanionSystemPrompt(lang)}\n\nCONTEXT FROM KNOWLEDGE BASE:\n${ragContext || "No context found."}`;
    const systemMessage = { role: "system", content: systemPrompt };

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
