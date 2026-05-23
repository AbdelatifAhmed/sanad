const express = require("express");
const router = express.Router();
const aiRoutes = require("./aiRoutes");
const companionAdminRoutes = require("./admin/campanionAdmin");
const authRoutes = require("./authRoutes");

router.use("/admin/companions", companionAdminRoutes);
router.use("/auth", authRoutes);
router.use("/ai", aiRoutes);

module.exports = router;
