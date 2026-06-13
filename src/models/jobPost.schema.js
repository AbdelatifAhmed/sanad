const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const jobPostSchema = new mongoose.Schema(
  {
    familyId: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    beneficiaryId: {
      type: ObjectId,
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
    schedule: {
      workingDays: {
        type: [String],
        required: [true, "يرجى تحديد أيام العمل المطلوبة"],
        enum: [
          "Saturday",
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
      },
      startTime: {
        type: String, // بصيغة HH:MM (مثال "08:30")
        required: [true, "يرجى تحديد وقت بدء العمل"],
        match: [
          /^([01]\d|2[0-3]):([0-5]\d)$/,
          "يرجى إدخال الوقت بصيغة 24 ساعة عادية HH:MM",
        ],
      },
      endTime: {
        type: String, // بصيغة HH:MM (مثال "16:00")
        required: [true, "يرجى تحديد وقت انتهاء العمل"],
        match: [
          /^([01]\d|2[0-3]):([0-5]\d)$/,
          "يرجى إدخال الوقت بصيغة 24 ساعة عادية HH:MM",
        ],
      },
      durationInWeeks: {
        type: Number,
        required: [true, "يرجى تحديد مدة الخدمة بالأسابيع"],
        min: [1, "الحد الأدنى للمدة هو أسبوع واحد"],
      },
    },

    location: {
      geo: {
        type: { type: String, default: "Point" },
        coordinates: { type: [Number], required: true }, // [longitude, latitude]
      },
      readableAddress: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
      governorate: { type: String, required: true, trim: true },
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
jobPostSchema.index({ "schedule.workingDays": 1, "schedule.startTime": 1 });

module.exports = mongoose.model("JobPost", jobPostSchema);
