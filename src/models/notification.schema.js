const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ["tracking", "booking", "system_alert"],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({
  recipientId: 1,
  createdAt: -1,
});

notificationSchema.index({
  recipientId: 1,
  isRead: 1,
});

module.exports = mongoose.model("Notification", notificationSchema);
