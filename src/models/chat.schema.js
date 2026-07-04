const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const chatMessageSchema = new mongoose.Schema(
  {
    bookingId: { type: ObjectId, ref: 'Booking', required: false },
    proposalId: { type: ObjectId, ref: 'Proposal', required: false },
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
chatMessageSchema.index({ proposalId: 1, createdAt: 1 });
chatMessageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);