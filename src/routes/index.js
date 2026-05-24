const express = require("express");
const router = express.Router();
const aiRoutes = require("./aiRoutes");
const companionAdminRoutes = require("./admin/campanionAdmin");
const authRoutes = require("./authRoutes");
const bookingRoutes = require("./bookingRoutes");

router.use("/admin/companions", companionAdminRoutes);
router.use("/auth", authRoutes);
router.use("/ai", aiRoutes);
router.use("/bookings", bookingRoutes);

module.exports = router;
