const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

/**
 * AdminMessage — a single message in an admin support conversation.
 * Extensible attachment schema supports future file types without schema changes.
 */
const adminMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: ObjectId,
      ref: 'AdminConversation',
      required: true,
      index: true,
    },

    senderId: {
      type: ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['admin', 'family', 'companion'],
      required: true,
    },

    receiverId: {
      type: ObjectId,
      ref: 'User',
      required: true,
    },
    receiverRole: {
      type: String,
      enum: ['admin', 'family', 'companion'],
      required: true,
    },

    // Message content
    messageType: {
      type: String,
      enum: ['text', 'image', 'pdf', 'document', 'system'],
      default: 'text',
    },
    text: {
      type: String,
      trim: true,
      default: '',
    },

    // Flexible attachment — add new file types without changing the schema
    attachment: {
      url:         { type: String, default: null },
      publicId:    { type: String, default: null },
      fileName:    { type: String, default: null },
      fileSize:    { type: Number, default: null },
      mimeType:    { type: String, default: null },
      // Reserved for future attachment types (audio, video, etc.)
      attachmentType: { type: String, default: null },
    },

    // Message state flags
    isRead:    { type: Boolean, default: false },
    isEdited:  { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }, // soft-delete only
  },
  { timestamps: true }
);

adminMessageSchema.index({ conversationId: 1, createdAt: 1 });
adminMessageSchema.index({ senderId: 1, createdAt: -1 });
adminMessageSchema.index({ receiverId: 1, isRead: 1 });

module.exports = mongoose.model('AdminMessage', adminMessageSchema);
