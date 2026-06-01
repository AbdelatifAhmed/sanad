const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { authenticate } = require("../middleware/authMiddleware");
const { isFamily } = require("../middleware/RoleMiddleware");

router.post("/", authenticate, isFamily, reviewController.createReview);

module.exports = router;
