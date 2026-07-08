const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ["moderation", "ai", "admin", "registration", "verification", "booking", "profile"],
    },
    type: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    actorName: {
      type: String,
      required: true,
    },
    actorRole: {
      type: String,
      required: true,
      enum: ["ai", "admin", "family", "companion", "system"],
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    relatedModel: {
      type: String,
      default: null,
    },
    icon: {
      type: String,
      default: "history",
    },
    iconBg: {
      type: String,
      default: "bg-gray-100",
    },
    iconColor: {
      type: String,
      default: "text-gray-700",
    },
    badgeLabel: {
      type: String,
      default: "Activity",
    },
    badgeClass: {
      type: String,
      default: "bg-gray-50 text-gray-700 border-gray-200",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);
