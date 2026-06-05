const express = require("express");
const router = express.Router();
const {
  getAdminDashboardStats,
} = require("../../controllers/admin/dashboardStatsController.js");
const { authenticate } = require("../../middleware/authMiddleware");
const { isAdmin } = require("../../middleware/RoleMiddleware");
router.get("/dashboard/stats", authenticate, isAdmin, getAdminDashboardStats);

module.exports = router;
