const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    companionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    beneficiaryId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'active', 'completed', 'cancelled'],
      default: 'pending'
    },
    hourlyRateAtBooking: { type: Number, required: true },
    totalHours: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    schedule: [
      {
        date: { type: Date, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        tasksList: [
          {
            taskDescription: { type: String, required: true },
            isCompleted: { type: Boolean, default: false }
          }
        ],
        checkInTime: { type: Date },
        checkOutTime: { type: Date }
      }
    ]
  },
  { timestamps: true }
);

bookingSchema.pre('save', function (next) {
  this.totalPrice = this.totalHours * this.hourlyRateAtBooking;
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
