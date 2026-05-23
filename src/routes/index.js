const express = require("express");
const router = express.Router();

const companionAdminRoutes = require("./admin/companionAdmin");
const authRoutes = require("./authRoutes");

router.use("/admin/companions", companionAdminRoutes);
router.use("/auth", authRoutes);

module.exports = router;
