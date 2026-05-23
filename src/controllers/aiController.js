const { sessionAgent } = require("../services/ai/sessionAgent");

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
      clientLang
    );
    return res.status(200).json({ status: "success", data: { reply } });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  handleFamilyChat,
  handleCompanionChat,
};
