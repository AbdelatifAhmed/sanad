const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types; 

const notificationSchema = new mongoose.Schema(
{
  _id: ObjectId,
  recipientId: { type: ObjectId, ref: 'User' }, 
  title: String,
  message: String,
  isRead: { type: Boolean, default: false },
  type: { type: String, enum: ['tracking', 'booking', 'system_alert'] },
  createdAt: Date
})

module.exports = mongoose.model('Notification', notificationSchema);