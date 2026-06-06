const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const jobPostSchema = new mongoose.Schema(
  {
    familyId: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "عنوان الطلب مطلوب"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "تفاصيل الحالة المطلوبة مطلوبة"],
      trim: true,
    },
    serviceType: {
      type: String,
      required: [true, "نوع الخدمة مطلوب"],
      enum: [
        "elderly_care",
        "child_care",
        "home_nursing",
        "physical_therapy",
        "companionship",
      ],
    },
    requiredSkills: [
      {
        type: ObjectId,
        ref: "Skill",
      },
    ],
    budgetPerHour: {
      type: Number,
      required: [true, "سعر الساعة المقترح مطلوب"],
      min: [1, "السعر يجب أن يكون أكبر من 0"],
    },
    location: {
      geo: {
        type: { type: String, default: "Point" },
        coordinates: { type: [Number], required: true }, // [longitude, latitude]
      },
      readableAddress: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
    },
    status: {
      type: String,
      enum: ["open", "filled", "closed"],
      default: "open",
    },
  },
  { timestamps: true },
);

jobPostSchema.index({ "location.geo": "2dsphere" });

jobPostSchema.index({
  "location.governorate": 1,
  "location.city": 1,
  serviceType: 1,
});

jobPostSchema.index({ requiredSkills: 1 });

module.exports = mongoose.model("JobPost", jobPostSchema);
