const express = require("express");
const router = express.Router();
const bookingAdminController = require("../../controllers/admin/bookingAdminController");
const { authenticate } = require("../../middleware/authMiddleware");
const { isAdmin } = require("../../middleware/RoleMiddleware");

router.use(authenticate, isAdmin);

router.get("/", bookingAdminController.getAllBookings);

module.exports = router;
