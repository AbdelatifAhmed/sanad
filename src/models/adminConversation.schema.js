const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

/**
 * AdminConversation — a support thread between Admin and a Family/Companion user.
 * Completely separate from the existing Family↔Companion ChatMessage schema.
 */
const adminConversationSchema = new mongoose.Schema(
  {
    // The non-admin participant
    userId: {
      type: ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      enum: ['family', 'companion'],
      required: true,
    },

    // Admin participant (always an admin user)
    adminId: {
      type: ObjectId,
      ref: 'User',
      default: null,
    },

    // Denormalised last-message snapshot for conversation list rendering
    lastMessage: {
      type: String,
      default: '',
    },
    lastMessageTime: {
      type: Date,
      default: null,
    },
    lastMessageSenderId: {
      type: ObjectId,
      default: null,
    },

    // Per-participant unread counters
    unreadByAdmin: {
      type: Number,
      default: 0,
      min: 0,
    },
    unreadByUser: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Conversation lifecycle
    status: {
      type: String,
      enum: ['open', 'waiting_for_admin', 'waiting_for_user', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },

    // Timestamps for lifecycle events
    resolvedAt:  { type: Date, default: null },
    closedAt:    { type: Date, default: null },
    reopenedAt:  { type: Date, default: null },
    reopenCount: { type: Number, default: 0 },

    // Optional subject / topic for the conversation
    subject: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
  },
  { timestamps: true }
);

// Index for fast list queries
adminConversationSchema.index({ userId: 1, updatedAt: -1 });
adminConversationSchema.index({ status: 1, updatedAt: -1 });
adminConversationSchema.index({ userRole: 1, updatedAt: -1 });

module.exports = mongoose.model('AdminConversation', adminConversationSchema);
