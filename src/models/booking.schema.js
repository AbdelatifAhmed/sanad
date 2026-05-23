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
    // تفاصيل الحساب المالي (Hourly Billing)
    hourlyRateAtBooking: { type: Number, required: true }, // تثبيت السعر وقت الحجز لضمان عدم تغير الفاتورة لاحقاً
    totalHours: { type: Number, required: true },
    totalPrice: { type: Number, required: true }, // يحسب تلقائياً: الساعات × السعر
    
    // الجدول والمهام اليومية (يقوم الـ Agent بصياغتها آلياً وتوافق عليها العائلة)
    schedule: [
      {
        date: { type: Date, required: true },
        startTime: { type: String, required: true }, // مثال: "16:00"
        endTime: { type: String, required: true },   // مثال: "20:00"
        tasksList: [
          {
            taskDescription: { type: String, required: true }, // مثال: "المساعدة في الذهاب للجامعة"
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
  if (typeof next === 'function') next();
});

module.exports = mongoose.model('Booking', bookingSchema);