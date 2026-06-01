const express = require("express");
const router = express.Router();
const aiRoutes = require("./aiRoutes");
const companionAdminRoutes = require("./admin/campanionAdmin");
const userAdminRoutes = require("../controllers/admin/userAdmin");
const authRoutes = require("./authRoutes");
const bookingRoutes = require("./bookingRoutes");
const companionRoutes = require("./companion");
const familyRoutes = require("./family");
router.use("/admin/companions", companionAdminRoutes);
router.use("/admin/users", userAdminRoutes);
router.use("/auth", authRoutes);
router.use("/ai", aiRoutes);
router.use("/bookings", bookingRoutes);
router.use("/companion", companionRoutes);
router.use("/family", familyRoutes);

module.exports = router;
