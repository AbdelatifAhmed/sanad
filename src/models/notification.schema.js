// Notifications Schema
const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema(
{
  _id: ObjectId,
  recipientId: { type: ObjectId, ref: 'User' }, // العائلة أو المرافق
  title: String,                                // مثال: "وصول السند"
  message: String,                              // مثال: "وصل أحمد الآن إلى موقع الخدمة"
  isRead: { type: Boolean, default: false },
  type: { type: String, enum: ['tracking', 'booking', 'system_alert'] },
  createdAt: Date
})

module.exports = mongoose.model('Notification', notificationSchema);