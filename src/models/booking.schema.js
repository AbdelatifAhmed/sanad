const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPost",
      required: false, 
    },
    beneficiaryId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true, 
    },
    status: {
      type: String,
      enum: ["pending", "pending_payment", "approved", "active", "completed", "cancelled"],
      default: "pending", 
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "wallet"],
      default: "card",
    },
    adminFee: {
      type: Number,
      default: 0,
    },
    companionEarnings: {
      type: Number,
      default: 0,
    },
    hourlyRateAtBooking: {
      type: Number,
      required: true,
    },
    totalHours: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    workingDays: [String],
    schedule: [
      {
        date: { type: Date, required: true },
        startTime: { type: String, required: true }, // صيغة HH:MM
        endTime: { type: String, required: true }, // صيغة HH:MM
        tasksList: [
          {
            taskDescription: { type: String, required: true },
            isCompleted: { type: Boolean, default: false },
          },
        ],
        checkInTime: { type: Date },
        checkOutTime: { type: Date },
      },
    ],
    notes: {
      type: String,
    },
    location: {
      geo: {
        type: { type: String, default: "Point" },
        coordinates: { type: [Number] },
      },
      readableAddress: { type: String, trim: true },
      city: { type: String, trim: true },
      governorate: { type: String, trim: true },
    },
  },
  { timestamps: true },
);

bookingSchema.pre("save", function (next) {
  const basePrice = this.totalHours * this.hourlyRateAtBooking;
  this.adminFee = basePrice * 0.10;
  this.totalPrice = basePrice + this.adminFee;
  this.companionEarnings = basePrice;
  if (typeof next === "function") next();
});

bookingSchema.index({ companionId: 1, status: 1 });
bookingSchema.index({ startDate: 1, endDate: 1, workingDays: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
