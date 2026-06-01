const { sessionAgent } = require("../services/ai/sessionAgent");
const ragService = require("../services/ai/ragService");
const AIChatSession = require("../models/aiChatSession.schema.js");

const handleFamilyChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { message } = req.body;

    const lang = req.headers["accept-language"] || req.body.lang || "ar";

    if (!message) {
      return res.status(400).json({
        status: "fail",
        message:
          lang === "en"
            ? "Message content is required"
            : "محتوى الرسالة مطلوب ولا يمكن أن يكون فارغاً",
      });
    }

    const reply = await sessionAgent(userId, message, "family_assistant", lang);

    return res.status(200).json({
      status: "success",
      data: {
        reply,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "AI Server Error",
      error: error.message,
    });
  }
};

const handleCompanionChat = async (req, res) => {
  try {
    const { message, lang } = req.body;
    const clientLang = req.headers["accept-language"] || lang || "ar";

    const reply = await sessionAgent(
      req.user.id,
      message,
      "companion_support",
      clientLang,
    );
    return res.status(200).json({ status: "success", data: { reply } });
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
        message:
          lang === "en" ? "search query is required" : "جملة البحث مطلوبة",
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
