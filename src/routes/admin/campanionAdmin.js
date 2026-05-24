const express = require("express");
const router = express.Router();
const companionAdminController = require("../../controllers/admin/companionAdminController");
const { authenticate } = require("../../middleware/authMiddleware");
const { isAdmin } = require("../../middleware/RoleMiddleware");

router.use(authenticate, isAdmin);

router.get(
  "/pending-companions",
  companionAdminController.getPendingCompanions,
);

router.patch("/verify-companion/:id", companionAdminController.verifyCompanion);

module.exports = router;
