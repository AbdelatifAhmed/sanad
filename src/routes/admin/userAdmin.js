const express = require("express");
const router = express.Router();
const userAdminController = require("../../controllers/admin/userAdminController");
const { authenticate } = require("../../middleware/authMiddleware");
const { isAdmin } = require("../../middleware/RoleMiddleware");

router.use(authenticate, isAdmin);

router.put("/:id/toggle-ban", userAdminController.toggleBan);

module.exports = router;
