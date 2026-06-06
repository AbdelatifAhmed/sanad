const express = require("express");
const router = express.Router();
const { 
  createBooking, 
  updateBookingStatus, 
  getCompanionRequests, 
  respondToBooking,
  checkIn,
  checkOut 
} = require("../controllers/bookingController");
const { authenticate } = require("../middleware/authMiddleware");
const { isFamily } = require("../middleware/RoleMiddleware");

router.use(authenticate);

router.post("/", isFamily, createBooking);
router.get("/companion/requests", getCompanionRequests);
router.put("/:id/respond", respondToBooking);
router.put("/:id/status", updateBookingStatus);
router.patch("/:id/status", updateBookingStatus);
router.post("/:id/check-in", checkIn);
router.post("/:id/check-out", checkOut);

module.exports = router;