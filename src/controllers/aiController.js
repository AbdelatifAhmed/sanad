const { sessionAgent } = require("../services/ai/sessionAgent");
const AppError = require("../utiles/AppError");
const catchAsync = AppError.catchAsync;

const getLang = (req) =>
  req.headers["accept-language"] || req.body.lang || "ar";

const requireMessage = (message, lang) => {
  if (!message)
    throw new AppError(
      lang === "en"
        ? "Message content is required"
        : "محتوى الرسالة مطلوب ولا يمكن أن يكون فارغاً",
      400
    );
};

const handleFamilyChat = catchAsync(async (req, res, next) => {
  const lang = getLang(req);
  const { message } = req.body;
  requireMessage(message, lang);

  const reply = await sessionAgent(req.user.id, message, "family_assistant", lang);
  res.status(200).json({ status: "success", data: { reply } });
});

const handleCompanionChat = catchAsync(async (req, res, next) => {
  const lang = getLang(req);
  const { message } = req.body;
  requireMessage(message, lang);

  const reply = await sessionAgent(req.user.id, message, "companion_support", lang);
  res.status(200).json({ status: "success", data: { reply } });
});

module.exports = { handleFamilyChat, handleCompanionChat };