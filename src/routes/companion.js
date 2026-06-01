const express = require("express");
const router = express.Router();
const {
  updateCompanionProfile,
  getCompanionSchedule,
  updateCompanionAvailability,
} = require("../controllers/companionController");
const { getCompanionReviews } = require("../controllers/reviewController");
const { authenticate } = require("../middleware/authMiddleware");

router.get("/:id/reviews", getCompanionReviews);

router.use(authenticate);
router.put("/profile", updateCompanionProfile);
router.get("/me/schedule", getCompanionSchedule);
router.patch("/me/availability", updateCompanionAvailability);
module.exports = router;
