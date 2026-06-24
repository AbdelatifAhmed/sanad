const mongoose = require("mongoose");

const companionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    companionType: {
      type: String,
      enum: ["general", "specialized"],
      required: true,
    },
    specialization: {
      type: String,
      enum: ["none", "nursing", "physiotherapy", "companionship_companion", "dementia"],
      default: "none",
    },
    bio: {
      type: String,
      required: [true, "bio is required "],
    },
    bioEmbedding: {
      type: [Number],
      required: false,
      select: false,
    },
    hourlyRate: {
      type: Number,
      required: [true, "hourly rate is required"],
      min: 0,
    },
    skills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skill",
      },
    ],
    hobbies: [{ type: String, trim: true }],
    availability: [
      {
        day: {
          type: String,
          enum: [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ],
        },
        slots: [String],
      },
    ],
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    documents: {
      nationalIdCard: {
        url: { type: String, required: true },
        public_id: { type: String, required: true }
      },
      criminalRecord: {
        url: { type: String, required: true },
        public_id: { type: String, required: true }
      },
      Certificates: [
        {
          name: { type: String, required: true },
          url: { type: String, required: true },
          public_id: { type: String, required: true }
        }
      ],
      syndicateCard: {
        url: { type: String },
        public_id: { type: String }
      }
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, "التقييم لا يقل عن 0"],
      max: [5, "التقييم لا يزيد عن 5"],
      set: (val) => Math.round(val * 10) / 10,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    totalWorkHours: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

companionSchema.index({ companionType: 1, specialization: 1, hourlyRate: 1 });

module.exports = mongoose.model("Companion", companionSchema);
