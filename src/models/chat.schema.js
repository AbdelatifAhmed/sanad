const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
{
  _id: ObjectId,
  bookingId: { type: ObjectId, ref: 'Booking' },
  senderId: { type: ObjectId, ref: 'User' },
  receiverId: { type: ObjectId, ref: 'User' },
  messageText: String,
  isRead: { type: Boolean, default: false },
  createdAt: Date
})


module.exports = mongoose.model('ChatMessage', chatMessageSchema);