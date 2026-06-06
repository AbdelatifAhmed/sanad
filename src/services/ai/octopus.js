const { sessionAgent } = require("./sessionAgent");
const Companion = require("../../models/companion.schema.js");
const rateFilter = require("./filters/rateFilter");
const dayFilter = require("./filters/dayFilter");
const dateFilter = require("./filters/dateFilter");
const { searchCompanions } = require("./ragService");

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
  let postLookupFilter = {};

  const extracted = aiResult.filters;

  mongoQuery = rateFilter(mongoQuery, extracted.maxRate);
  mongoQuery = dayFilter(mongoQuery, extracted.days);
  mongoQuery = dateFilter(mongoQuery, extracted.startDate, extracted.endDate);

  if (extracted.city) {
    postLookupFilter["userInfo.location.city"] = extracted.city;
  }
  if (extracted.governorate) {
    postLookupFilter["userInfo.location.governorate"] = extracted.governorate;
  }
  if (extracted.readableAddress) {
    postLookupFilter["userInfo.location.readableAddress"] = {
      $regex: extracted.readableAddress,
      $options: "i",
    };
  }

  let dbResults = [];

  if (agentType === "family_assistant") {
    if (extracted.searchQuery) {
      dbResults = await searchCompanions(
        extracted.searchQuery,
        mongoQuery,
        5,
        postLookupFilter,
      );
    } else {
      const normalFilter = { ...mongoQuery };
      if (extracted.city) normalFilter["location.city"] = extracted.city;

      dbResults = await Companion.find(normalFilter).populate({
        path: "userId",
        select: "-passwordHash",
      });
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
