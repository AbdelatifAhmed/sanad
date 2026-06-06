const { sessionAgent } = require("../services/ai/sessionAgent");
const ragService = require("../services/ai/ragService");
const { orchestrateAiChat } = require('../services/ai/octopus');
const AIChatSession = require("../models/aiChatSession.schema.js");

const handleFamilyChat = async (req, res) => {
  try {
    const { message, lang } = req.body;
    const clientLang = req.headers['accept-language'] || lang || 'ar';

    if (!message) {
      return res.status(400).json({ status: 'fail', message: 'message is required' });
    }

    const result = await orchestrateAiChat(req.user.id, message, 'family_assistant', clientLang);

    return res.status(200).json({
      status: 'success',
      data: {
        responseType: result.responseType,
        reply: result.reply,
        activeFilters: result.activeFilters,
        companions: result.results
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const handleCompanionChat = async (req, res) => {
  try {
    const { message, lang } = req.body;
    const clientLang = req.headers["accept-language"] || lang || "ar";

    if (!message) {
      return res.status(400).json({
        status: "fail",
        message: clientLang === "en" ? "Message is required" : "Message content is required"
      });
    }

    const result = await orchestrateAiChat(req.user.id, message, "companion_support", clientLang);

    return res.status(200).json({
      status: "success",
      data: {
        responseType: result.responseType,
        reply: result.reply,
        activeFilters: result.activeFilters,
        results: result.results
      }
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const smartSearch = async (req, res) => {
  try {
    const { query, limit, city, governorate } = req.body;
    const lang = req.headers["accept-language"] || "ar";

    if (!query) {
      return res.status(400).json({
        status: "fail",
        message: lang === "en" ? "search query is required" : "جملة البحث مطلوبة",
      });
    }

    const searchLimit = parseInt(limit) || 5;

    let postLookupFilter = {};
    if (city) postLookupFilter["userInfo.location.city"] = city;
    if (governorate) postLookupFilter["userInfo.location.governorate"] = governorate;

    
    const companions = await ragService.searchCompanions(
      query, 
      {}, 
      searchLimit, 
      postLookupFilter
    );

    return res.status(200).json({
      status: "success",
      results: companions.length,
      data: { companions },
    });
  } catch (error) {
    console.error("Error in smartSearch Controller:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const clearChatSession = async (req, res) => {
  try {
    const { agentType } = req.body;

    if (!agentType) {
      return res.status(400).json({
        status: "fail",
        message:
          req.headers["accept-language"] === "en"
            ? "agentType is required"
            : "نوع الـ agentType مطلوب",
      });
    }

    const deletedSession = await AIChatSession.findOneAndDelete({
      userId: req.user.id,
      agentType,
    });

    return res.status(200).json({
      status: "success",
      message:
        req.headers["accept-language"] === "en"
          ? "Chat history cleared and context window initialized."
          : "تم مسح تاريخ المحادثة بالكامل وبدء جلسة جديدة بنجاح.",
    });
  } catch (error) {
    console.error("Error clearing chat session:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  handleFamilyChat,
  handleCompanionChat,
  smartSearch,
  clearChatSession,
};
