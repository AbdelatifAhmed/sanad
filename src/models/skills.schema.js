const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema(
  {
    nameAr: {
      type: String,
      required: [true, "اسم المهارة بالعربية مطلوب"],
      trim: true,
      unique: true,
    },
    nameEn: {
      type: String,
      required: [true, "اسم المهارة بالإنجليزية مطلوب"],
      trim: true,
      unique: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["medical", "general_care", "therapy", "mobility_assistance"],
      default: "general_care",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Skill", skillSchema);