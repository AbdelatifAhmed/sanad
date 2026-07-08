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
      enum: ["card", "wallet"],
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
    verificationPasscode: {
      type: String,
      default: () => Math.floor(1000 + Math.random() * 9000).toString(),
    },
    schedule: [
      {
        date: { type: Date, required: true },
        startTime: { type: String, required: true }, // صيغة HH:MM
        endTime: { type: String, required: true }, // صيغة HH:MM
        tasksList: [
          {
            title: { type: String },
            taskDescription: { type: String },
            isCompleted: { type: Boolean, default: false },
          },
        ],
        checkInTime: { type: Date },
        checkOutTime: { type: Date },
        payoutReleased: { type: Boolean, default: false },
        payoutAmount: { type: Number, default: 0 },
        checkInGeo: {
          lat: { type: Number },
          lng: { type: Number },
        },
        checkInMethod: { type: String }, // 'passcode' or 'geolocation'
        checkInPasscode: { type: String },
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
    complaints: [
      {
        title: { type: String },
        description: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        aiAnalysis: {
          category: { type: String },
          sentiment: { type: String },
          urgencyLevel: { type: String },
          aiConfidence: { type: Number },
          recommendedAction: { type: String },
          aiSummary: { type: String },
        },
      },
    ],
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
