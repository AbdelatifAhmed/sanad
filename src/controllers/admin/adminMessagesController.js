const mongoose = require('mongoose');
const cloudinary = require('../../config/cloudinary.config');
const streamifier = require('streamifier');
const AdminConversation = require('../../models/adminConversation.schema');
const AdminMessage = require('../../models/adminMessage.schema');
const User = require('../../models/user.schema');
const Notification = require('../../models/notification.schema');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── Helper: find or lazily create the admin user ID ─────────────────────────
const resolveAdminId = async (req) => {
  if (req.user?.role === 'admin') return req.user._id;
  // Fallback: grab any admin from DB (should not normally be needed)
  const admin = await User.findOne({ role: 'admin' }).select('_id').lean();
  return admin?._id ?? null;
};

// ─── Helper: emit socket event safely ────────────────────────────────────────
const emit = (io, roomOrId, event, data) => {
  if (io) io.to(roomOrId.toString()).emit(event, data);
};

// ─── Helper: create notification ─────────────────────────────────────────────
const createNotification = async ({ recipientId, title, message, type, relatedId }) => {
  try {
    const n = new Notification({ recipientId, title, message, type, relatedId });
    await n.save();
    return n;
  } catch (_) { /* non-fatal */ }
};

// ─── Helper: populate conversation with user info ────────────────────────────
const populateConversation = async (conversation) => {
  const user = await User.findById(conversation.userId)
    .select('name avatar email phone role createdAt')
    .lean();
  return { ...conversation.toObject(), user };
};

/* ============================================================
   GET /api/admin/messages
   Query: filter=all|families|caregivers|unread|resolved|open
   ============================================================ */
exports.getConversations = async (req, res) => {
  try {
    const { filter = 'all', search = '', page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};

    switch (filter) {
      case 'families':
        query.userRole = 'family';
        break;
      case 'caregivers':
        query.userRole = 'companion';
        break;
      case 'unread':
        query.unreadByAdmin = { $gt: 0 };
        break;
      case 'resolved':
        query.status = 'resolved';
        break;
      case 'open':
        query.status = 'open';
        break;
      // 'all' — no additional filter
    }

    // Text search on subject or user name (via lookup)
    let conversations = await AdminConversation.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Populate user info
    const userIds = conversations.map((c) => c.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('name avatar email phone role createdAt isBanned')
      .lean();
    const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

    let result = conversations.map((c) => ({
      ...c,
      user: userMap[c.userId?.toString()] || null,
    }));

    // Client-side search filter (after populate)
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.user?.name?.toLowerCase().includes(q) ||
          c.subject?.toLowerCase().includes(q) ||
          c.lastMessage?.toLowerCase().includes(q)
      );
    }

    const total = await AdminConversation.countDocuments(query);

    return res.status(200).json({
      status: 'success',
      data: { conversations: result, total },
    });
  } catch (error) {
    console.error('getConversations error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/* ============================================================
   GET /api/admin/messages/:conversationId
   Full chat history for a conversation
   ============================================================ */
exports.getChatHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;
    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    const conversation = await AdminConversation.findById(conversationId).lean();
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await AdminMessage.find({
      conversationId,
      isDeleted: false,
    })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('senderId', 'name avatar role')
      .populate('receiverId', 'name avatar role')
      .lean();

    const total = await AdminMessage.countDocuments({ conversationId, isDeleted: false });

    const user = await User.findById(conversation.userId)
      .select('name avatar email phone role createdAt')
      .lean();

    return res.status(200).json({
      status: 'success',
      data: { conversation: { ...conversation, user }, messages, total },
    });
  } catch (error) {
    console.error('getChatHistory error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/* ============================================================
   POST /api/admin/messages/send
   Send a message (admin-initiated OR user-initiated)
   Body: { conversationId?, userId?, text, messageType? }
   ============================================================ */
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, userId, text, messageType = 'text', subject } = req.body;
    const sender = req.user;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    let conversation;

    // ── Resolve or create conversation ─────────────────────────────────────
    if (conversationId) {
      if (!isValidObjectId(conversationId)) {
        return res.status(400).json({ error: 'Invalid conversation ID' });
      }
      conversation = await AdminConversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
    } else {
      // User opening a new conversation with admin
      if (sender.role === 'admin') {
        if (!userId || !isValidObjectId(userId)) {
          return res.status(400).json({ error: 'userId required when admin starts conversation' });
        }
        const targetUser = await User.findById(userId).select('role').lean();
        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        conversation = await AdminConversation.findOne({ userId }) ||
          new AdminConversation({
            userId,
            userRole: targetUser.role,
            subject: subject || '',
          });
      } else {
        // family or companion — create or find their conversation with admin
        conversation = await AdminConversation.findOne({ userId: sender._id });
        if (!conversation) {
          conversation = new AdminConversation({
            userId: sender._id,
            userRole: sender.role,
            subject: subject || '',
          });
        }
      }
      await conversation.save();
    }

    // ── Determine receiver ─────────────────────────────────────────────────
    let receiverId, receiverRole;
    if (sender.role === 'admin') {
      receiverId = conversation.userId;
      receiverRole = conversation.userRole;
    } else {
      // Find an admin to reply to — use conversation's adminId or fallback to any admin
      const adminUser = conversation.adminId
        ? await User.findById(conversation.adminId).select('_id role').lean()
        : await User.findOne({ role: 'admin' }).select('_id role').lean();
      receiverId = adminUser._id;
      receiverRole = 'admin';

      // Assign this admin to the conversation if not yet assigned
      if (!conversation.adminId) {
        conversation.adminId = adminUser._id;
      }
    }

    // ── Create message ────────────────────────────────────────────────────
    const message = new AdminMessage({
      conversationId: conversation._id,
      senderId: sender._id,
      senderRole: sender.role,
      receiverId,
      receiverRole,
      messageType,
      text: text.trim(),
    });
    await message.save();

    // ── Update conversation snapshot ──────────────────────────────────────
    conversation.lastMessage = text.trim().substring(0, 100);
    conversation.lastMessageTime = new Date();
    conversation.lastMessageSenderId = sender._id;

    if (sender.role === 'admin') {
      conversation.unreadByUser = (conversation.unreadByUser || 0) + 1;
    } else {
      conversation.unreadByAdmin = (conversation.unreadByAdmin || 0) + 1;
    }
    await conversation.save();

    // ── Populate for response ──────────────────────────────────────────────
    const populated = await AdminMessage.findById(message._id)
      .populate('senderId', 'name avatar role')
      .populate('receiverId', 'name avatar role')
      .lean();

    // ── Real-time via Socket.IO ────────────────────────────────────────────
    const io = req.io;
    emit(io, conversation._id.toString(), 'adminMessage:new', populated);
    emit(io, receiverId.toString(), 'adminMessage:new', populated);

    // ── Notifications ─────────────────────────────────────────────────────
    if (sender.role === 'admin') {
      await createNotification({
        recipientId: receiverId,
        title: 'Admin replied to your message',
        message: text.trim().substring(0, 100),
        type: 'admin_message',
        relatedId: conversation._id,
      });
      emit(io, receiverId.toString(), 'notification:new', {
        type: 'admin_message',
        conversationId: conversation._id,
      });
    } else {
      await createNotification({
        recipientId: receiverId,
        title: `New support message from ${sender.name || sender.role}`,
        message: text.trim().substring(0, 100),
        type: 'support',
        relatedId: conversation._id,
      });
      emit(io, receiverId.toString(), 'notification:new', {
        type: 'support',
        conversationId: conversation._id,
      });
    }

    return res.status(201).json({
      status: 'success',
      data: { message: populated, conversationId: conversation._id },
    });
  } catch (error) {
    console.error('sendMessage error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/* ============================================================
   POST /api/admin/messages/upload
   Upload an attachment (image/pdf/document)
   ============================================================ */
exports.uploadAttachment = async (req, res) => {
  try {
    const { conversationId, messageType = 'document' } = req.body;
    const sender = req.user;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    if (!conversationId || !isValidObjectId(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    const conversation = await AdminConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Security: only participants can upload
    const isParticipant =
      sender.role === 'admin' ||
      conversation.userId.toString() === sender._id.toString();
    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'sanad/admin_messages',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

    let receiverId, receiverRole;
    if (sender.role === 'admin') {
      receiverId = conversation.userId;
      receiverRole = conversation.userRole;
    } else {
      const adminUser = conversation.adminId
        ? await User.findById(conversation.adminId).select('_id role').lean()
        : await User.findOne({ role: 'admin' }).select('_id role').lean();
      receiverId = adminUser._id;
      receiverRole = 'admin';
    }

    const attachmentType = uploadResult.resource_type === 'image' ? 'image' :
      req.file.mimetype === 'application/pdf' ? 'pdf' : 'document';

    const message = new AdminMessage({
      conversationId: conversation._id,
      senderId: sender._id,
      senderRole: sender.role,
      receiverId,
      receiverRole,
      messageType: attachmentType,
      text: req.file.originalname || 'Attachment',
      attachment: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        attachmentType,
      },
    });
    await message.save();

    // Update conversation
    conversation.lastMessage = `[${attachmentType}] ${req.file.originalname}`;
    conversation.lastMessageTime = new Date();
    conversation.lastMessageSenderId = sender._id;
    if (sender.role === 'admin') {
      conversation.unreadByUser = (conversation.unreadByUser || 0) + 1;
    } else {
      conversation.unreadByAdmin = (conversation.unreadByAdmin || 0) + 1;
    }
    await conversation.save();

    const populated = await AdminMessage.findById(message._id)
      .populate('senderId', 'name avatar role')
      .populate('receiverId', 'name avatar role')
      .lean();

    const io = req.io;
    emit(io, conversation._id.toString(), 'adminMessage:new', populated);
    emit(io, receiverId.toString(), 'adminMessage:new', populated);

    return res.status(201).json({ status: 'success', data: { message: populated } });
  } catch (error) {
    console.error('uploadAttachment error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/* ============================================================
   PATCH /api/admin/messages/read
   Body: { conversationId }
   ============================================================ */
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.body;
    if (!conversationId || !isValidObjectId(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    const conversation = await AdminConversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const reader = req.user;

    if (reader.role === 'admin') {
      // Admin is reading — clear admin's unread counter
      await AdminMessage.updateMany(
        { conversationId, receiverId: reader._id, isRead: false },
        { $set: { isRead: true } }
      );
      conversation.unreadByAdmin = 0;
    } else {
      // User is reading
      if (conversation.userId.toString() !== reader._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
      await AdminMessage.updateMany(
        { conversationId, receiverId: reader._id, isRead: false },
        { $set: { isRead: true } }
      );
      conversation.unreadByUser = 0;
    }

    await conversation.save();

    const io = req.io;
    emit(io, conversationId, 'adminMessage:read', { conversationId, readBy: reader._id });

    return res.status(200).json({ status: 'success', message: 'Messages marked as read' });
  } catch (error) {
    console.error('markAsRead error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/* ============================================================
   PATCH /api/admin/messages/resolve
   Body: { conversationId }
   ============================================================ */
exports.resolveConversation = async (req, res) => {
  try {
    const { conversationId } = req.body;
    if (!conversationId || !isValidObjectId(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    const conversation = await AdminConversation.findByIdAndUpdate(
      conversationId,
      { status: 'resolved' },
      { new: true }
    );
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const io = req.io;
    emit(io, conversation._id.toString(), 'adminConversation:resolved', { conversationId });
    emit(io, conversation.userId.toString(), 'adminConversation:resolved', { conversationId });

    // Notify user
    await createNotification({
      recipientId: conversation.userId,
      title: 'Your support conversation has been resolved',
      message: 'An admin has marked your conversation as resolved.',
      type: 'admin_message',
      relatedId: conversation._id,
    });

    return res.status(200).json({ status: 'success', data: { conversation } });
  } catch (error) {
    console.error('resolveConversation error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/* ============================================================
   PATCH /api/admin/messages/reopen
   Body: { conversationId }
   ============================================================ */
exports.reopenConversation = async (req, res) => {
  try {
    const { conversationId } = req.body;
    if (!conversationId || !isValidObjectId(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    const conversation = await AdminConversation.findByIdAndUpdate(
      conversationId,
      { status: 'open' },
      { new: true }
    );
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const io = req.io;
    emit(io, conversation._id.toString(), 'adminConversation:reopened', { conversationId });
    emit(io, conversation.userId.toString(), 'adminConversation:reopened', { conversationId });

    await createNotification({
      recipientId: conversation.userId,
      title: 'Your support conversation has been reopened',
      message: 'An admin has reopened your conversation.',
      type: 'admin_message',
      relatedId: conversation._id,
    });

    return res.status(200).json({ status: 'success', data: { conversation } });
  } catch (error) {
    console.error('reopenConversation error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/* ============================================================
   DELETE /api/admin/messages/:messageId
   Soft delete — only sender can delete their own message
   ============================================================ */
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    if (!isValidObjectId(messageId)) {
      return res.status(400).json({ error: 'Invalid message ID' });
    }

    const message = await AdminMessage.findById(messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    message.isDeleted = true;
    message.text = '';
    await message.save();

    const io = req.io;
    emit(io, message.conversationId.toString(), 'adminMessage:deleted', { messageId });

    return res.status(200).json({ status: 'success', message: 'Message deleted' });
  } catch (error) {
    console.error('deleteMessage error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/* ============================================================
   GET /api/admin/messages/my-conversation
   For Family / Companion — get or create their support thread
   ============================================================ */
exports.getMyConversation = async (req, res) => {
  try {
    const user = req.user;
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Admins do not have a personal support thread' });
    }

    let conversation = await AdminConversation.findOne({ userId: user._id }).lean();
    if (!conversation) {
      // Return null to signal frontend to show "Start conversation" state
      return res.status(200).json({ status: 'success', data: { conversation: null } });
    }

    return res.status(200).json({ status: 'success', data: { conversation } });
  } catch (error) {
    console.error('getMyConversation error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/* ============================================================
   POST /api/admin/messages/start-conversation
   Admin-only — find or create a conversation with a user,
   return the conversationId immediately.
   Body: { targetUserId, targetUserRole? }
   ============================================================ */
exports.startConversation = async (req, res) => {
  try {
    const { targetUserId, targetUserRole } = req.body;

    if (!targetUserId || !isValidObjectId(targetUserId)) {
      return res.status(400).json({ error: 'targetUserId is required and must be a valid ID' });
    }

    // Look for an existing conversation
    let conversation = await AdminConversation.findOne({ userId: targetUserId });

    if (!conversation) {
      // Resolve role if not provided
      let role = targetUserRole;
      if (!role) {
        const targetUser = await User.findById(targetUserId).select('role').lean();
        if (!targetUser) return res.status(404).json({ error: 'User not found' });
        role = targetUser.role;
      }

      if (!['family', 'companion'].includes(role)) {
        return res.status(400).json({ error: 'targetUserRole must be family or companion' });
      }

      conversation = new AdminConversation({
        userId:   targetUserId,
        userRole: role,
        adminId:  req.user._id,
        subject:  '',
      });
      await conversation.save();
    } else if (!conversation.adminId) {
      // Assign this admin if none assigned yet
      conversation.adminId = req.user._id;
      await conversation.save();
    }

    // Populate user info for the response
    const user = await User.findById(conversation.userId)
      .select('name avatar email phone role createdAt')
      .lean();

    return res.status(200).json({
      status: 'success',
      data: {
        conversationId: conversation._id,
        conversation: { ...conversation.toObject(), user },
      },
    });
  } catch (error) {
    console.error('startConversation error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/* ============================================================
   GET /api/admin/messages/user/messages
   Family / Companion — fetch messages for their own conversation.
   Validates caller is the conversation owner before returning.
   ============================================================ */
exports.getMyMessages = async (req, res) => {
  try {
    const user = req.user;
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Use the admin endpoint instead' });
    }

    // Find the user's own conversation
    const conversation = await AdminConversation.findOne({ userId: user._id }).lean();
    if (!conversation) {
      return res.status(200).json({ status: 'success', data: { messages: [], total: 0 } });
    }

    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await AdminMessage.find({
      conversationId: conversation._id,
      isDeleted: false,
    })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('senderId', 'name avatar role')
      .populate('receiverId', 'name avatar role')
      .lean();

    const total = await AdminMessage.countDocuments({
      conversationId: conversation._id,
      isDeleted: false,
    });

    return res.status(200).json({
      status: 'success',
      data: { messages, total },
    });
  } catch (error) {
    console.error('getMyMessages error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};
