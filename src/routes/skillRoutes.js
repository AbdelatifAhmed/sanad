const express = require("express");
const router = express.Router();
const {
  getAllSkills,
  createSkill,
} = require("../controllers/skillController.js");
const { authenticate } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/roleMiddleware.js");

router.get("/", getAllSkills);

router.post("/", authenticate, isAdmin, createSkill);

module.exports = router;
