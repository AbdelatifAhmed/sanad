const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: ObjectId,
      ref: "Booking",
      required: true,
    },
    familyId: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    companionId: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    adminFee: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["card", "wallet"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "refunded", "failed", "abandoned"],
      default: "pending",
    },
    transactionId: {
      type: String,
    },
    webhookId: {
      type: String,
    },
    stripePaymentIntentId: {
      type: String,
    },
    payoutReleased: {
      type: Boolean,
      default: false,
    },
    payoutTransactionId: {
      type: String,
    },
    payoutDate: {
      type: Date,
    },
    refundStatus: {
      type: String,
      enum: ["none", "pending", "completed", "failed"],
      default: "none",
    },
    refundTransactionId: {
      type: String,
    },
    refundDate: {
      type: Date,
    },
    refundReason: {
      type: String,
    },
    debtRecorded: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
