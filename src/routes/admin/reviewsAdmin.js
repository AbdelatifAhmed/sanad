const express = require("express");
const router = express.Router();
const reviewAdminController = require("../../controllers/admin/reviewAdminController");
const { authenticate } = require("../../middleware/authMiddleware");
const { isAdmin } = require("../../middleware/RoleMiddleware");

router.use(authenticate, isAdmin);

router.get("/", reviewAdminController.getAllReviews);

module.exports = router;
