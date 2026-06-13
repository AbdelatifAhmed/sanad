const express = require("express");
const router = express.Router();
const { payBooking, getMyPayments, getAdminPayments } = require("../controllers/paymentController");
const { authenticate } = require("../middleware/authMiddleware");
const { isAdmin, isFamily } = require("../middleware/RoleMiddleware");

router.use(authenticate);

// Family pays for bookings
router.post("/:id/pay", isFamily, payBooking);

// Family/Companion get their own payments
router.get("/me", getMyPayments);

// Admin gets all payments/statistics
router.get("/admin", isAdmin, getAdminPayments);

module.exports = router;
