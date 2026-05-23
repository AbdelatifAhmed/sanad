const express = require("express");
const router = express.Router();
const companionAdminController = require("../../controllers/admin/companionAdminController");
const authMiddleware = require("../../middlewares/authMiddleware");
const { isAdmin } = require("../../middlewares/roleMiddleware");

router.use(authMiddleware, isAdmin);

router.get(
  "/pending-companions",
  companionAdminController.getPendingCompanions,
);

router.patch("/verify-companion/:id", companionAdminController.verifyCompanion);

module.exports = router;
