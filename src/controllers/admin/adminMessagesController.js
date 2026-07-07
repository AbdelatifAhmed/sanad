const mongoose = require('mongoose');
const cloudinary = require('../../config/cloudinary.config');
const streamifier = require('streamifier');
const AdminConversation = require('../../models/adminConversation.schema');
const AdminMessage = require('../../models/adminMessage.schema');
const User = require('../../models/user.schema');
const Notification = require('../../models/notification.schema');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ── Status ordering for sort ──────────────────────────────────────────────────
const STATUS_PRIORITY = {
  reopened:          0,
  open:              1,
  waiting_for_admin: 2,
  waiting_for_user:  3,
  resolved:          4,
  closed:            5,
};

// ── Helper: emit socket event safely ─────────────────────────────────────────
const emit = (io, roomOrId, event, data) => {
  if (io) io.to(roomOrId.toString()).emit(event, data);
};

// ── Helper: create in-conversation system event message ─────────────────────
const createSystemMessage = async ({ conversationId, text, adminId, userId }) => {
  try {
    const msg = new AdminMessage({
      conversationId,
      senderId:     adminId || userId,
      senderRole:   'admin',
      receiverId:   userId || adminId,
      receiverRole: adminId ? 'family' : 'admin',
      messageType:  'system',
      text,
    });
    await msg.save();
    return msg;
  } catch (_) { return null; }
};

// ── Helper: create notification ──────────────────────────────────────────────
const createNotification = async ({ recipientId, title, message, type, relatedId }) => {
  try {
    const n = new Notification({ recipientId, title, message, type, relatedId });
    await n.save();
    return n;
  } catch (_) {}
};

/* ============================================================
   GET /api/admin/messages
   Query: filter=all|families|caregivers|unread|resolved|open|
          waiting_for_admin|waiting_for_user|closed
   ============================================================ */
exports.getConversations = async (req, res) => {
  try {
    const { filter = 'all', search = '', page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    switch (filter) {
      case 'families':          query.userRole = 'family';              break;
      case 'caregivers':        query.userRole = 'companion';           break;
      case 'unread':            query.unreadByAdmin = { $gt: 0 };       break;
      case 'resolved':          query.status = 'resolved';              break;
      case 'open':              query.status = 'open';                  break;
      case 'waiting_for_admin': query.status = 'waiting_for_admin';     break;
      case 'waiting_for_user':  query.status = 'waiting_for_user';      break;
      case 'closed':            query.status = 'closed';                break;
    }

    let conversations = await AdminConversation.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const userIds = conversations.map((c) => c.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('name avatar email phone role createdAt isBanned isOnline lastSeen')
      .lean();
    const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

    let result = conversations.map((c) => ({
      ...c,
      user: userMap[c.userId?.toString()] || null,
    }));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.user?.name?.toLowerCase().includes(q) ||
          c.subject?.toLowerCase().includes(q) ||
          c.lastMessage?.toLowerCase().includes(q)
      );
    }

    // Sort by priority: reopened > open > waiting_for_admin > waiting_for_user > resolved > closed
    result.sort((a, b) => {
      const pa = a.reopenedAt && a.status === 'open' ? STATUS_PRIORITY.reopened : (STATUS_PRIORITY[a.status] ?? 99);
      const pb = b.reopenedAt && b.status === 'open' ? STATUS_PRIORITY.reopened : (STATUS_PRIORITY[b.status] ?? 99);
      if (pa !== pb) return pa - pb;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    const total = await AdminConversation.countDocuments(query);
    return res.status(200).json({ status: 'success', data: { conversations: result, total } });
  } catch (error) {
    console.error('getConversations error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/* ============================================================
   GET /api/admin/messages/:conversationId
   ============================================================ */
exports.getChatHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;
    if (!isValidObjectId(conversationId))
      return res.status(400).json({ error: 'Invalid conversation ID' });

    const conversation = await AdminConversation.findById(conversationId).lean();
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await AdminMessage.find({ conversationId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('senderId', 'name avatar role')
      .populate('receiverId', 'name avatar role')
      .lean();

    const total = await AdminMessage.countDocuments({ conversationId });

    const user = await User.findById(conversation.userId)
      .select('name avatar email phone role createdAt isOnline lastSeen')
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
   Auto-reopens resolved/closed conversations when user sends
   ============================================================ */
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, userId, text, messageType = 'text', subject } = req.body;
    const sender = req.user;

    if (!text || !text.trim())
      return res.status(400).json({ error: 'Message text is required' });

    let conversation;

    if (conversationId) {
      if (!isValidObjectId(conversationId))
        return res.status(400).json({ error: 'Invalid conversation ID' });
      conversation = await AdminConversation.findById(conversationId);
      if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    } else {
      if (sender.role === 'admin') {
        if (!userId || !isValidObjectId(userId))
          return res.status(400).json({ error: 'userId required when admin starts conversation' });
        const targetUser = await User.findById(userId).select('role').lean();
        if (!targetUser) return res.status(404).json({ error: 'User not found' });
        conversation = await AdminConversation.findOne({ userId }) ||
          new AdminConversation({ userId, userRole: targetUser.role, subject: subject || '' });
      } else {
        conversation = await AdminConversation.findOne({ userId: sender._id });
        if (!conversation) {
          conversation = new AdminConversation({
            userId: sender._id, userRole: sender.role, subject: subject || '',
          });
        }
      }
      await conversation.save();
    }

    // ── Auto-reopen if user sends into resolved/closed conversation ──────────
    let autoReopened = false;
    if (sender.role !== 'admin' && ['resolved', 'closed'].includes(conversation.status)) {
      conversation.status = 'open';
      conversation.reopenedAt = new Date();
      conversation.reopenCount = (conversation.reopenCount || 0) + 1;
      autoReopened = true;
    }

    let receiverId, receiverRole;
    if (sender.role === 'admin') {
      receiverId = conversation.userId;
      receiverRole = conversation.userRole;
      conversation.status = 'waiting_for_user';
    } else {
      const adminUser = conversation.adminId
        ? await User.findById(conversation.adminId).select('_id role').lean()
        : await User.findOne({ role: 'admin' }).select('_id role').lean();
      receiverId = adminUser._id;
      receiverRole = 'admin';
      if (!conversation.adminId) conversation.adminId = adminUser._id;
      if (!autoReopened) conversation.status = 'waiting_for_admin';
    }

    const message = new AdminMessage({
      conversationId: conversation._id,
      senderId: sender._id, senderRole: sender.role,
      receiverId, receiverRole, messageType,
      text: text.trim(),
    });
    await message.save();

    conversation.lastMessage = text.trim().substring(0, 100);
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

    // Emit status change
    emit(io, conversation._id.toString(), 'adminConversation:statusChanged', {
      conversationId: conversation._id, status: conversation.status,
    });

    if (autoReopened) {
      const roleLabel = sender.role === 'family' ? 'family' : 'caregiver';
      const sysMsg = await createSystemMessage({
        conversationId: conversation._id,
        text: `Conversation reopened automatically by ${roleLabel}.`,
        adminId: receiverId,
        userId: sender._id,
      });
      if (sysMsg) emit(io, conversation._id.toString(), 'adminMessage:new', sysMsg);
      emit(io, receiverId.toString(), 'adminConversation:reopened', {
        conversationId: conversation._id, autoReopened: true,
      });
      await createNotification({
        recipientId: receiverId,
        title: `Support conversation reopened by ${roleLabel}`,
        message: text.trim().substring(0, 100),
        type: 'support', relatedId: conversation._id,
      });
    } else if (sender.role === 'admin') {
      await createNotification({
        recipientId: receiverId,
        title: 'Admin replied to your message',
        message: text.trim().substring(0, 100),
        type: 'admin_message', relatedId: conversation._id,
      });
      emit(io, receiverId.toString(), 'notification:new', {
        type: 'admin_message', conversationId: conversation._id,
      });
    } else {
      await createNotification({
        recipientId: receiverId,
        title: `New support message from ${sender.name || sender.role}`,
        message: text.trim().substring(0, 100),
        type: 'support', relatedId: conversation._id,
      });
      emit(io, receiverId.toString(), 'notification:new', {
        type: 'support', conversationId: conversation._id,
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
   ============================================================ */
exports.uploadAttachment = async (req, res) => {
  try {
    const { conversationId, messageType = 'document' } = req.body;
    const sender = req.user;

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (!conversationId || !isValidObjectId(conversationId))
      return res.status(400).json({ error: 'Invalid conversation ID' });

    const conversation = await AdminConversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const isParticipant = sender.role === 'admin' ||
      conversation.userId.toString() === sender._id.toString();
    if (!isParticipant) return res.status(403).json({ error: 'Access denied' });

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'sanad/admin_messages', resource_type: 'auto' },
        (error, result) => { if (error) reject(error); else resolve(result); }
      );
      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

    let receiverId, receiverRole;
    if (sender.role === 'admin') {
      receiverId = conversation.userId; receiverRole = conversation.userRole;
    } else {
      const adminUser = conversation.adminId
        ? await User.findById(conversation.adminId).select('_id role').lean()
        : await User.findOne({ role: 'admin' }).select('_id role').lean();
      receiverId = adminUser._id; receiverRole = 'admin';
    }

    const attachmentType = uploadResult.resource_type === 'image' ? 'image' :
      req.file.mimetype === 'application/pdf' ? 'pdf' : 'document';

    const message = new AdminMessage({
      conversationId: conversation._id,
      senderId: sender._id, senderRole: sender.role,
      receiverId, receiverRole,
      messageType: attachmentType,
      text: req.file.originalname || 'Attachment',
      attachment: {
        url: uploadResult.secure_url, publicId: uploadResult.public_id,
        fileName: req.file.originalname, fileSize: req.file.size,
        mimeType: req.file.mimetype, attachmentType,
      },
    });
    await message.save();

    conversation.lastMessage = `[${attachmentType}] ${req.file.originalname}`;
    conversation.lastMessageTime = new Date();
    conversation.lastMessageSenderId = sender._id;
    if (sender.role === 'admin') {
      conversation.unreadByUser = (conversation.unreadByUser || 0) + 1;
      conversation.status = 'waiting_for_user';
    } else {
      conversation.unreadByAdmin = (conversation.unreadByAdmin || 0) + 1;
      conversation.status = 'waiting_for_admin';
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
   ============================================================ */
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.body;
    if (!conversationId || !isValidObjectId(conversationId))
      return res.status(400).json({ error: 'Invalid conversation ID' });

    const conversation = await AdminConversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const reader = req.user;
    if (reader.role === 'admin') {
      await AdminMessage.updateMany(
        { conversationId, receiverId: reader._id, isRead: false },
        { $set: { isRead: true } }
      );
      conversation.unreadByAdmin = 0;
    } else {
      if (conversation.userId.toString() !== reader._id.toString())
        return res.status(403).json({ error: 'Access denied' });
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
   ============================================================ */
exports.resolveConversation = async (req, res) => {
  try {
    const { conversationId } = req.body;
    if (!conversationId || !isValidObjectId(conversationId))
      return res.status(400).json({ error: 'Invalid conversation ID' });

    const conversation = await AdminConversation.findByIdAndUpdate(
      conversationId,
      { status: 'resolved', resolvedAt: new Date() },
      { new: true }
    );
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    // System event message
    const adminId = req.user._id;
    const sysMsg = await createSystemMessage({
      conversationId, text: 'Issue resolved by admin.', adminId, userId: conversation.userId,
    });

    const io = req.io;
    if (sysMsg) emit(io, conversation._id.toString(), 'adminMessage:new', sysMsg);
    emit(io, conversation._id.toString(), 'adminConversation:resolved', { conversationId });
    emit(io, conversation.userId.toString(), 'adminConversation:resolved', { conversationId });
    emit(io, conversation._id.toString(), 'adminConversation:statusChanged', {
      conversationId, status: 'resolved',
    });

    await createNotification({
      recipientId: conversation.userId,
      title: 'Your support conversation has been resolved',
      message: 'An admin has marked your conversation as resolved.',
      type: 'admin_message', relatedId: conversation._id,
    });

    return res.status(200).json({ status: 'success', data: { conversation } });
  } catch (error) {
    console.error('resolveConversation error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/* ============================================================
   PATCH /api/admin/messages/reopen
   Can be called by admin OR by user (family/companion)
   ============================================================ */
exports.reopenConversation = async (req, res) => {
  try {
    const { conversationId } = req.body;
    if (!conversationId || !isValidObjectId(conversationId))
      return res.status(400).json({ error: 'Invalid conversation ID' });

    const conversation = await AdminConversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    // Authorization: admin can reopen any; user can only reopen their own
    const caller = req.user;
    if (caller.role !== 'admin' && conversation.userId.toString() !== caller._id.toString())
      return res.status(403).json({ error: 'Access denied' });

    conversation.status = 'open';
    conversation.reopenedAt = new Date();
    conversation.reopenCount = (conversation.reopenCount || 0) + 1;
    await conversation.save();

    const roleLabel = caller.role === 'admin' ? 'admin'
      : caller.role === 'family' ? 'family' : 'caregiver';

    const sysMsg = await createSystemMessage({
      conversationId,
      text: `Conversation reopened by ${roleLabel}.`,
      adminId: conversation.adminId || (await User.findOne({ role: 'admin' }).select('_id').lean())?._id,
      userId: conversation.userId,
    });

    const io = req.io;
    if (sysMsg) emit(io, conversation._id.toString(), 'adminMessage:new', sysMsg);
    emit(io, conversation._id.toString(), 'adminConversation:reopened', { conversationId, reopenedBy: roleLabel });
    emit(io, conversation.userId.toString(), 'adminConversation:reopened', { conversationId, reopenedBy: roleLabel });
    emit(io, conversation._id.toString(), 'adminConversation:statusChanged', {
      conversationId, status: 'open', reopenedAt: conversation.reopenedAt,
    });

    // Notify admin when user reopens
    if (caller.role !== 'admin' && conversation.adminId) {
      emit(io, conversation.adminId.toString(), 'adminConversation:reopened', {
        conversationId, reopenedBy: roleLabel,
      });
      await createNotification({
        recipientId: conversation.adminId,
        title: `Support conversation reopened by ${roleLabel}`,
        message: 'The user has reopened a previously resolved conversation.',
        type: 'support', relatedId: conversation._id,
      });
    } else if (caller.role === 'admin') {
      await createNotification({
        recipientId: conversation.userId,
        title: 'Your support conversation has been reopened',
        message: 'An admin has reopened your conversation.',
        type: 'admin_message', relatedId: conversation._id,
      });
    }

    return res.status(200).json({ status: 'success', data: { conversation } });
  } catch (error) {
    console.error('reopenConversation error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/* ============================================================
   PATCH /api/admin/messages/close
   Admin-only — permanently closes a conversation
   ============================================================ */
exports.closeConversation = async (req, res) => {
  try {
    const { conversationId } = req.body;
    if (!conversationId || !isValidObjectId(conversationId))
      return res.status(400).json({ error: 'Invalid conversation ID' });

    const conversation = await AdminConversation.findByIdAndUpdate(
      conversationId,
      { status: 'closed', closedAt: new Date() },
      { new: true }
    );
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const sysMsg = await createSystemMessage({
      conversationId,
      text: 'Conversation closed by admin.',
      adminId: req.user._id,
      userId: conversation.userId,
    });

    const io = req.io;
    if (sysMsg) emit(io, conversation._id.toString(), 'adminMessage:new', sysMsg);
    emit(io, conversation._id.toString(), 'adminConversation:statusChanged', {
      conversationId, status: 'closed',
    });
    emit(io, conversation.userId.toString(), 'adminConversation:statusChanged', {
      conversationId, status: 'closed',
    });

    return res.status(200).json({ status: 'success', data: { conversation } });
  } catch (error) {
    console.error('closeConversation error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/* ============================================================
   DELETE /api/admin/messages/:messageId
   ============================================================ */
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    if (!isValidObjectId(messageId))
      return res.status(400).json({ error: 'Invalid message ID' });

    const message = await AdminMessage.findById(messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    if (message.senderId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'You can only delete your own messages' });

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
   GET /api/admin/messages/user/my-conversation
   ============================================================ */
exports.getMyConversation = async (req, res) => {
  try {
    const user = req.user;
    if (user.role === 'admin')
      return res.status(403).json({ error: 'Admins do not have a personal support thread' });

    const conversation = await AdminConversation.findOne({ userId: user._id }).lean();
    return res.status(200).json({ status: 'success', data: { conversation: conversation || null } });
  } catch (error) {
    console.error('getMyConversation error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/* ============================================================
   GET /api/admin/messages/user/messages
   ============================================================ */
exports.getMyMessages = async (req, res) => {
  try {
    const user = req.user;
    if (user.role === 'admin')
      return res.status(403).json({ error: 'Use the admin endpoint instead' });

    const conversation = await AdminConversation.findOne({ userId: user._id }).lean();
    if (!conversation)
      return res.status(200).json({ status: 'success', data: { messages: [], total: 0 } });

    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await AdminMessage.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('senderId', 'name avatar role')
      .populate('receiverId', 'name avatar role')
      .lean();

    const total = await AdminMessage.countDocuments({ conversationId: conversation._id });
    return res.status(200).json({ status: 'success', data: { messages, total } });
  } catch (error) {
    console.error('getMyMessages error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/* ============================================================
   POST /api/admin/messages/start-conversation
   ============================================================ */
exports.startConversation = async (req, res) => {
  try {
    const { targetUserId, targetUserRole } = req.body;
    if (!targetUserId || !isValidObjectId(targetUserId))
      return res.status(400).json({ error: 'targetUserId is required and must be a valid ID' });

    let conversation = await AdminConversation.findOne({ userId: targetUserId });
    if (!conversation) {
      let role = targetUserRole;
      if (!role) {
        const targetUser = await User.findById(targetUserId).select('role').lean();
        if (!targetUser) return res.status(404).json({ error: 'User not found' });
        role = targetUser.role;
      }
      if (!['family', 'companion'].includes(role))
        return res.status(400).json({ error: 'targetUserRole must be family or companion' });

      conversation = new AdminConversation({
        userId: targetUserId, userRole: role, adminId: req.user._id, subject: '',
      });
      await conversation.save();
    } else if (!conversation.adminId) {
      conversation.adminId = req.user._id;
      await conversation.save();
    }

    const user = await User.findById(conversation.userId)
      .select('name avatar email phone role createdAt isOnline lastSeen')
      .lean();

    return res.status(200).json({
      status: 'success',
      data: { conversationId: conversation._id, conversation: { ...conversation.toObject(), user } },
    });
  } catch (error) {
    console.error('startConversation error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};
