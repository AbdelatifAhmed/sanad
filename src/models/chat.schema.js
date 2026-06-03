const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const chatMessageSchema = new mongoose.Schema(
  {
    bookingId: { type: ObjectId, ref: 'Booking', required: true },
    senderId: { type: ObjectId, ref: 'User', required: true },
    receiverId: { type: ObjectId, ref: 'User', required: true },
    messageText: { type: String, required: true },
    isRead: { type: Boolean, default: false }
  },
  { 
    timestamps: true 
  }
);

chatMessageSchema.index({ bookingId: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);