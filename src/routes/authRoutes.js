const router = require("express").Router();
const authController = require("../controllers/authController");
const rateLimit = require("express-rate-limit");
const messages = require("../utils/messages");
const { authenticate } = require("../middleware/authMiddleware");

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  handler: (req, res) => {
    const lang = req.lang || "en";
    res.status(429).json({
      status: "fail",
      message: messages.auth.rateLimited[lang],
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  handler: (req, res) => {
    const lang = req.lang || "en";
    res.status(429).json({
      status: "fail",
      message: messages.auth.rateLimited[lang],
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", registerRateLimiter, authController.register);
router.post("/login", loginRateLimiter, authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);

// Password recovery and change endpoints
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.put("/change-password", authenticate, authController.changePassword);
const { authenticate } = require("../middleware/authMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);
router.put("/profile", authenticate, authController.updateProfile);

module.exports = router;