const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
{
  _id: ObjectId,
  bookingId: { type: ObjectId, ref: 'Booking' },
  familyId: { type: ObjectId, ref: 'User' },
  companionId: { type: ObjectId, ref: 'User' },
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  createdAt: Date
})

module.exports = mongoose.model('Review', reviewSchema);