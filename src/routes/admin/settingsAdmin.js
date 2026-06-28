const express = require("express");
const router = express.Router();
const settingsAdminController = require("../../controllers/admin/settingsAdminController");
const { authenticate } = require("../../middleware/authMiddleware");
const { isAdmin } = require("../../middleware/RoleMiddleware");

// Require auth and admin role for platform settings
router.use(authenticate, isAdmin);

router.get("/", settingsAdminController.getSettings);
router.put("/", settingsAdminController.updateSettings);

module.exports = router;
