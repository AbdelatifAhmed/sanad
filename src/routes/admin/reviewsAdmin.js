const express = require("express");
const router = express.Router();
const { getAllReviews, toggleReviewVisibility, deleteReview } = require("../../controllers/admin/reviewAdminController");
const { authenticate } = require("../../middleware/authMiddleware");
const { isAdmin } = require("../../middleware/RoleMiddleware");

router.use(authenticate, isAdmin);

router.get("/", getAllReviews);
router.patch("/:id/toggle-visibility", toggleReviewVisibility);
router.delete("/:id", deleteReview);

module.exports = router;
