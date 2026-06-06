const express = require("express");
const router = express.Router();
const {
  getAllSkills,
  createSkill,
} = require("../controllers/skillController.js");
const { authenticate } = require("../middleware/authMiddleware");

router.get("/", getAllSkills);

router.post("/", authenticate, createSkill);

module.exports = router;
