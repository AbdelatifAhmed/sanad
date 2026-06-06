const Skill = require("../models/skills.schema.js");

const getAllSkills = async (req, res) => {
  try {
    const skills = await Skill.find({}).sort({ nameEn: 1 }).lean();

    return res.status(200).json({
      status: "success",
      results: skills.length,
      data: { skills },
    });
  } catch (error) {
    console.error("Error fetching skills:", error);
    return res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};

const createSkill = async (req, res) => {
  try {
    const { nameAr, nameEn, category } = req.body;

    if (!nameAr || !nameEn || !category) {
      return res.status(400).json({ status: "fail", message: "All fields are required" });
    }

    const newSkill = await Skill.create({ nameAr, nameEn, category });

    return res.status(201).json({
      status: "success",
      data: { skill: newSkill },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ status: "fail", message: "Skill already exists" });
    }
    return res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  getAllSkills,
  createSkill,
};