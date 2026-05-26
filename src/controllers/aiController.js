const { sessionAgent } = require("../services/ai/sessionAgent");
const ragService = require("../services/ai/ragService");
const { orchestrateAiChat } = require('../services/ai/octopus');

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
    const { query, limit } = req.body;
    const lang = req.headers["accept-language"] || "ar";

    if (!query) {
      return res.status(400).json({
        status: "fail",
        message: lang === "en" ? "Search query is required" : "Search query is required",
      });
    }

    const companions = await ragService.searchCompanions(query, {}, limit || 5);

    return res.status(200).json({
      status: "success",
      results: companions.length,
      data: { companions },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  handleFamilyChat,
  handleCompanionChat,
  smartSearch,
};
