const User = require("../../models/user.schema");
const Companion = require("../../models/companion.schema");
const SessionManager = require("./sessionManager");
const guardianShieldAgent = require("./agents/guardianShieldAgent");
const familyAgent = require("./agents/familyAgent");
const companionAgent = require("./agents/companionAgent");
const auditAgent = require("./agents/auditAgent");

// Existing filter helper files
const rateFilter = require("./filters/rateFilter");
const dayFilter = require("./filters/dayFilter");
const dateFilter = require("./filters/dateFilter");
const { searchCompanions } = require("./ragService");

/**
 * Main entrance orchestrator for MERN AI subsystem.
 * Coordinates multi-agent processing of chat conversations.
 *
 * @param {string} userId - User's MongoDB ID.
 * @param {string} userMessage - Raw message text sent by user.
 * @param {string} agentType - 'family_assistant' or 'companion_support'.
 * @param {string} lang - Acceptance language ('ar' or 'en').
 */
const orchestrateAiChat = async (userId, userMessage, agentType, lang = "ar") => {
  // 1. Get history and format it
  const formattedHistory = await SessionManager.getFormattedHistory(userId, agentType);

  // 2. Run Guard Shield (Sequential security audit)
  const safetyResult = await guardianShieldAgent.analyzeMessage(userMessage);
  if (safetyResult.isViolated) {
    const violationWarning = lang === "ar"
      ? "عذرًا، لا يُسمح بمشاركة معلومات الاتصال الشخصية أو الدفع خارج التطبيق لضمان سلامتكم وحقوقكم."
      : "Security Alert: Sharing personal contacts or proposing off-platform cash transactions is forbidden to keep your contracts secure.";

    // Save interaction to session anyway to maintain context of security warnings
    await SessionManager.addMessage(userId, agentType, "user", userMessage);
    await SessionManager.addMessage(userId, agentType, "ai", violationWarning);

    return {
      responseType: "text",
      reply: violationWarning,
      activeFilters: {},
      results: [],
      safetyViolation: true,
    };
  }

  // 3. Delegate to specialized sub-agents based on agent type
  let result = null;

  if (agentType === "family_assistant") {
    // Family Agent Execution
    const familyResult = await familyAgent.execute(userMessage, formattedHistory, lang);

    if (familyResult.responseType === "text") {
      result = {
        responseType: "text",
        reply: familyResult.aiReply,
        activeFilters: {},
        results: [],
        taskList: familyResult.taskList,
      };
    } else {
      // Build native MERN hybrid search filters
      const extracted = familyResult.extractedFilters || {};
      let userQuery = { role: "companion" };
      let hasUserFilters = false;

      // Extract City/Governorate/Gender filters to query the User model natively first
      if (extracted.city) {
        userQuery["location.city"] = { $regex: new RegExp(extracted.city, "i") };
        hasUserFilters = true;
      }
      if (extracted.governorate) {
        userQuery["location.governorate"] = { $regex: new RegExp(extracted.governorate, "i") };
        hasUserFilters = true;
      }
      if (extracted.preferredGender) {
        userQuery["gender"] = extracted.preferredGender;
        hasUserFilters = true;
      }

      let userIds = [];
      if (hasUserFilters) {
        const matchedUsers = await User.find(userQuery).select("_id").lean();
        userIds = matchedUsers.map((u) => u._id);
      }

      // Build Companion collection native queries
      let mongoQuery = {};
      if (hasUserFilters) {
        mongoQuery.userId = { $in: userIds };
      }

      // Apply rate, days, and date filters natively
      mongoQuery = rateFilter(mongoQuery, extracted.maxRate);
      mongoQuery = dayFilter(mongoQuery, extracted.days);
      mongoQuery = dateFilter(mongoQuery, extracted.startDate, extracted.endDate);

      if (extracted.specialization && extracted.specialization !== "none") {
        mongoQuery.specialization = extracted.specialization;
      }

      // Handle address keyword matching if address is present
      let postLookupFilter = {};
      if (extracted.readableAddress) {
        postLookupFilter["userInfo.location.readableAddress"] = {
          $regex: extracted.readableAddress,
          $options: "i",
        };
      }

      let dbResults = [];

      // If user provided a semantic searchQuery, apply Atlas Vector Search on the natively filtered subset
      if (extracted.searchQuery) {
        // Pre-query companion IDs matching native filters to apply deep vector search subset filtering
        const filteredCompanions = await Companion.find(mongoQuery).select("_id").lean();
        const companionIds = filteredCompanions.map((c) => c._id);

        if (companionIds.length > 0) {
          // Vector search using $vectorSearch index restricted to our natively filtered IDs
          const subsetFilter = { _id: { $in: companionIds } };
          dbResults = await searchCompanions(
            extracted.searchQuery,
            subsetFilter,
            5,
            postLookupFilter
          );
        } else {
          dbResults = [];
        }
      } else {
        // Direct native MongoDB query (no semantic vector search query)
        dbResults = await Companion.find(mongoQuery)
          .populate({
            path: "userId",
            select: "-passwordHash",
          })
          .lean();

        // Apply post-lookup address filters manually if needed
        if (extracted.readableAddress) {
          dbResults = dbResults.filter(doc => 
            doc.userId && 
            doc.userId.location && 
            doc.userId.location.readableAddress &&
            new RegExp(extracted.readableAddress, "i").test(doc.userId.location.readableAddress)
          );
        }
      }

      result = {
        responseType: "filtered_data",
        reply: familyResult.aiReply,
        activeFilters: extracted,
        results: dbResults,
        taskList: familyResult.taskList,
      };
    }
  } else if (agentType === "companion_support") {
    // Companion Agent Execution (Shift co-pilot & match adviser)
    const companionResult = await companionAgent.execute(userMessage, formattedHistory, lang, userId);
    
    result = {
      responseType: companionResult.responseType,
      reply: companionResult.reply,
      activeFilters: companionResult.activeFilters,
      results: companionResult.results,
      taskList: [],
    };
  }

  // 4. Update session storage context histories
  if (result) {
    await SessionManager.addMessage(userId, agentType, "user", userMessage);
    await SessionManager.addMessage(userId, agentType, "ai", result.reply);
  }

  // 5. Run auditAgent asynchronously behind the scenes for Sentiment/Compliance
  auditAgent.auditReview(userId, userMessage).catch((err) => {
    console.error("Audit agent background execution error:", err.message);
  });

  return result;
};

module.exports = { orchestrateAiChat };
