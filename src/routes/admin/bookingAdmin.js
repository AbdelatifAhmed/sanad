const express = require("express");
const router = express.Router();
const { getAllBookings, getBookingById, updateBookingStatus } = require("../../controllers/admin/bookingAdminController");
const { authenticate } = require("../../middleware/authMiddleware");
const { isAdmin } = require("../../middleware/RoleMiddleware");

router.use(authenticate, isAdmin);

router.get("/",           getAllBookings);
router.get("/:id",        getBookingById);
router.patch("/:id/status", updateBookingStatus);

module.exports = router;
