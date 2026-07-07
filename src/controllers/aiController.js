const ragService = require("../services/ai/ragService");
const { orchestrateAiChat } = require('../services/ai/orchestrator');
const AIChatSession = require("../models/aiChatSession.schema.js");

const handleFamilyChat = async (req, res) => {
  try {
    const { message, lang, isAgentActive, sessionId } = req.body;
    const clientLang = req.headers['accept-language'] || lang || 'ar';

    if (!message) {
      return res.status(400).json({ status: 'fail', message: 'message is required' });
    }

    const result = await orchestrateAiChat(req.user.id, message, 'family_assistant', clientLang, !!isAgentActive, sessionId);

    return res.status(200).json({
      status: 'success',
      data: {
        responseType: result.responseType,
        reply: result.reply,
        activeFilters: result.activeFilters,
        companions: result.responseType === 'filtered_data' ? result.results : [],
        sessionId: result.sessionId
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const handleCompanionChat = async (req, res) => {
  try {
    const { message, lang, isAgentActive, sessionId } = req.body;
    const clientLang = req.headers["accept-language"] || lang || "ar";

    if (!message) {
      return res.status(400).json({
        status: "fail",
        message: clientLang === "en" ? "Message is required" : "Message content is required"
      });
    }

    const result = await orchestrateAiChat(req.user.id, message, "companion_support", clientLang, !!isAgentActive, sessionId);

    return res.status(200).json({
      status: "success",
      data: {
        responseType: result.responseType,
        reply: result.reply,
        activeFilters: result.activeFilters,
        results: result.responseType === 'filtered_data' ? result.results : [],
        sessionId: result.sessionId
      }
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const listSessions = async (req, res) => {
  try {
    const { agentType } = req.query;
    const filter = { userId: req.user.id };
    if (agentType) {
      // Map short names to normalized agentType
      filter.agentType = agentType === 'family' ? 'family_assistant' : (agentType === 'companion' ? 'companion_support' : agentType);
    }

    const sessions = await AIChatSession.find(filter)
      .select('_id title agentType createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      status: 'success',
      data: { sessions }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const getSessionDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await AIChatSession.findOne({ _id: id, userId: req.user.id }).lean();

    if (!session) {
      return res.status(404).json({
        status: 'fail',
        message: req.headers['accept-language'] === 'en' ? 'Chat session not found' : 'جلسة المحادثة غير موجودة'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { session }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await AIChatSession.findOneAndDelete({ _id: id, userId: req.user.id });

    if (!deleted) {
      return res.status(404).json({
        status: 'fail',
        message: req.headers['accept-language'] === 'en' ? 'Chat session not found' : 'جلسة المحادثة غير موجودة'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: req.headers['accept-language'] === 'en' ? 'Chat session deleted successfully' : 'تم حذف جلسة المحادثة بنجاح.'
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
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

    await AIChatSession.findOneAndDelete({
      userId: req.user.id,
      agentType: agentType === 'family' ? 'family_assistant' : (agentType === 'companion' ? 'companion_support' : agentType)
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
  listSessions,
  getSessionDetails,
  deleteSession
};
