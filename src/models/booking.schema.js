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
      enum: ["pending", "approved", "active", "completed", "cancelled"],
      default: "approved", 
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
  },
  { timestamps: true },
);

bookingSchema.pre("save", function (next) {
  this.totalPrice = this.totalHours * this.hourlyRateAtBooking;
  if (typeof next === "function") next();
});

bookingSchema.index({ companionId: 1, status: 1 });
bookingSchema.index({ startDate: 1, endDate: 1, workingDays: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
