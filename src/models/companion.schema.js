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
      enum: ["none", "nursing", "physiotherapy", "companionship_companion"],
      default: "none",
    },
    bio: {
      type: String,
      required: [true, "bio is required "],
    },
    bioEmbedding: {
      type: [Number],
      required: false,
    },
    hourlyRate: {
      type: Number,
      required: [true, "hourly rate is required"],
      min: 0,
    },

    //needed for rag search and filtering
    skills: [{ type: String, trim: true }],
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
    // (Background Checks)
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    documents: {
      nationalIdUrl: { type: String, required: true },
      criminalRecordUrl: { type: String, required: true },
      syndicateCardUrl: { type: String },
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
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
