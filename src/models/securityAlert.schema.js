const mongoose = require("mongoose");

const securityAlertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messageText: {
      type: String,
      required: true,
    },
    violationType: {
      type: String,
      default: "chat_policy_violation",
    },
    reason: {
      type: String,
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    proposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proposal",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending_review", "reviewed", "resolved"],
      default: "pending_review",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SecurityAlert", securityAlertSchema);
