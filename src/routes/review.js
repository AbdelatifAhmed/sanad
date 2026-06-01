const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { authenticate } = require("../middleware/authMiddleware");
const { isFamily } = require("../middleware/RoleMiddleware");

router.post("/", authenticate, isFamily, reviewController.createReview);

router.get("/my", authenticate, isFamily, reviewController.getMyReviews);

router.get("/companion/:id", reviewController.getCompanionReviews);

router.delete("/:id", authenticate, isFamily, reviewController.deleteReview);

module.exports = router;
