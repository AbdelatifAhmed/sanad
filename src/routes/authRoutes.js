const router = require("express").Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);
router.put("/profile", authenticate, authController.updateProfile);

module.exports = router;