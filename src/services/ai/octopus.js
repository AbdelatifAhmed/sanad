const { sessionAgent } = require("./sessionAgent");
const Companion = require("../../models/Companion");
const rateFilter = require("./filters/rateFilter");
const dayFilter = require("./filters/dayFilter");
const dateFilter = require("./filters/dateFilter");
const orchestrateAiChat = async (
  userId,
  userMessage,
  agentType,
  lang = "ar",
) => {
  const aiResult = await sessionAgent(userId, userMessage, agentType, lang);

  if (aiResult.responseType === "text") {
    return {
      responseType: "text",
      reply: aiResult.reply,
      activeFilters: {},
      results: [],
    };
  }

  let mongoQuery = {};
  const extracted = aiResult.filters;

  mongoQuery = rateFilter(mongoQuery, extracted.maxRate);
  mongoQuery = dayFilter(mongoQuery, extracted.days);
  mongoQuery = dateFilter(mongoQuery, extracted.startDate, extracted.endDate);

  let dbResults = [];

  if (agentType === "family_assistant") {
    if (extracted.searchQuery) {
      const { searchCompanions } = require("./ragService");
      dbResults = await searchCompanions(extracted.searchQuery, mongoQuery);
    } else {
      dbResults = await Companion.find(mongoQuery).populate(
        "userId",
        "-password",
      );
    }
  } else if (agentType === "companion_support") {
    dbResults = [];
  }

  return {
    responseType: "filtered_data",
    reply: aiResult.reply,
    activeFilters: extracted,
    results: dbResults,
  };
};

module.exports = { orchestrateAiChat };
