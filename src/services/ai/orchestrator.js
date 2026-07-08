const SessionManager = require("./sessionManager");
const { handleFamilyAssistant } = require("./familyOrchestrator");
const { handleCompanionAssistant } = require("./companionOrchestrator");

// Helper to audit reviews (safe background logging/embeddings)
const safeAudit = async (userId, userMessage) => {
  try {
    const Review = require("../../models/reviews.schema");
    const lastReview = await Review.findOne({ familyUserId: userId }).sort({ createdAt: -1 });
    if (lastReview) {
      const auditAgent = require("./agents/auditAgent");
      const ragService = require("./ragService");
      
      const auditResult = await auditAgent.auditComment(userMessage);
      console.log(`Audit Agent result for Review ${lastReview._id}:`, auditResult);

      const embedding = await ragService.generateEmbedding(userMessage);

      await Review.findByIdAndUpdate(lastReview._id, {
        sentimentScore: auditResult.sentimentScore,
        sentimentEmbedding: embedding,
        auditSummary: auditResult.auditSummary,
      });
      console.log(`Updated Review ${lastReview._id} with sentiment embedding.`);
    }
  } catch (err) {
    // Audit errors should not crash the main assistant flow
    console.error("Safe audit background task failed:", err.message);
  }
};

/**
 * Main AI Orchestrator Entry Point
 */
const orchestrateAiChat = async (userId, userMessage, agentType, lang = "ar", isAgentActive = false, sessionId = null) => {
  // 1. Get history for the specific session
  const formattedHistory = await SessionManager.getFormattedHistory(userId, agentType, 10, sessionId);

  // 2. Delegate message to the appropriate modular assistant
  const result = agentType === "companion_support"
    ? await handleCompanionAssistant({ userId, userMessage, formattedHistory, lang, isAgentActive })
    : await handleFamilyAssistant({ userId, userMessage, formattedHistory, lang, isAgentActive });

  // 3. Save the conversation messages in the session
  const userSessionDoc = await SessionManager.addMessage(userId, agentType, "user", userMessage, sessionId);
  const activeSessionId = userSessionDoc._id.toString();

  await SessionManager.addMessage(userId, agentType, "ai", result.reply, activeSessionId);

  // Run audit agent in background
  safeAudit(userId, userMessage);

  // 4. Return result along with the active sessionId
  return {
    ...result,
    sessionId: activeSessionId,
  };
};

module.exports = { orchestrateAiChat };
