const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

/**
 * Companion Debt Schema
 * Tracks the debt (negative balance) for companions from cash payments.
 * When a companion receives a cash payment, the adminFee is recorded as debt.
 * The companion must pay off the debt through wallet top-up or bank transfer.
 */
const companionDebtSchema = new mongoose.Schema(
  {
    companionId: {
      type: ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    totalDebt: {
      type: Number,
      default: 0,
    },
    debtHistory: [
      {
        bookingId: {
          type: ObjectId,
          ref: "Booking",
        },
        paymentId: {
          type: ObjectId,
          ref: "Payment",
        },
        amount: Number, // adminFee amount
        reason: String, // e.g., "cash_payment_admin_fee"
        recordedAt: {
          type: Date,
          default: Date.now,
        },
        settled: {
          type: Boolean,
          default: false,
        },
        settledAt: Date,
      },
    ],
    status: {
      type: String,
      enum: ["active", "frozen", "cleared"],
      default: "active",
    },
  },
  { timestamps: true }
);

companionDebtSchema.index({ totalDebt: 1 });
companionDebtSchema.index({ status: 1 });

module.exports = mongoose.model("CompanionDebt", companionDebtSchema);
