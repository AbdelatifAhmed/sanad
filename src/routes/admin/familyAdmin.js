const express = require("express");
const router = express.Router();
const familyAdminController = require("../../controllers/admin/familyAdminController");
const { authenticate } = require("../../middleware/authMiddleware");
const { isAdmin } = require("../../middleware/RoleMiddleware");

// Require auth and admin roles for all subroutes
router.use(authenticate, isAdmin);

router.get("/", familyAdminController.getAllFamilies);
router.get("/:id", familyAdminController.getFamilyDetails);
router.patch("/:id/toggle-ban", familyAdminController.toggleBanFamily);

module.exports = router;
