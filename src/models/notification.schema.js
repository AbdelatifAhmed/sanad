const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    senderId: {
      type: ObjectId,
      ref: "User",
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ["booking", "tracking", "review", "payment", "system_alert", "proposal", "jobpost"],
      required: true,
    },
    relatedId: {
      type: ObjectId,
      default: null,
    },
    relatedModel: {
      type: String,
      enum: ["Booking", "Review", null],
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ recipientId: 1, createdAt: -1 });

notificationSchema.index({ recipientId: 1, isRead: 1 });

notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 },
);

module.exports = mongoose.model("Notification", notificationSchema);
