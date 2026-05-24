const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { authenticate } = require("../middleware/authMiddleware");

router.post("/:id/check-in", authenticate, bookingController.checkIn);
router.post("/:id/check-out", authenticate, bookingController.checkOut);

module.exports = router;