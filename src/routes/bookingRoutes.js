const express = require("express");
const router = express.Router();
const { 
  createBooking, 
  updateBookingStatus, 
  getCompanionRequests, 
  respondToBooking,
  checkIn,
  checkOut,
  updateTaskStatus,
  getBookingById,
  getMyBookings,
  fileComplaint
} = require("../controllers/bookingController");
const { authenticate } = require("../middleware/authMiddleware");
const { isFamily, isCompanion } = require("../middleware/RoleMiddleware");

router.use(authenticate);
router.get("/my", getMyBookings);
router.post("/", isFamily, createBooking);
router.get("/companion/requests", getCompanionRequests);
router.put("/:id/respond", respondToBooking);
router.put("/:id/status", updateBookingStatus);
router.patch("/:id/status", updateBookingStatus);
router.post("/:id/check-in", checkIn);
router.post("/:id/check-out", checkOut);

// New booking detail and task update routes
router.get("/:id", getBookingById);
router.patch("/:id/schedule/:scheduleId/tasks/:taskId", isCompanion, updateTaskStatus);
router.post("/:id/complaints", isFamily, fileComplaint);

module.exports = router;