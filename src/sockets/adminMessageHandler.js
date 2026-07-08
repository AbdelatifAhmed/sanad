/**
 * adminMessageHandler.js
 * Registers Socket.IO event handlers for the Admin Messaging System.
 * Includes real-time presence tracking (isOnline / lastSeen).
 */

const User = require('../models/user.schema');

module.exports = function registerAdminMessageHandlers(io, socket) {
  const userId = socket.userId;

  // ── Mark user as online on connect ────────────────────────────────────────
  (async () => {
    try {
      await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
      // Broadcast to all connected clients
      io.emit('presence:updated', { userId, isOnline: true, lastSeen: new Date() });
    } catch (_) {}
  })();

  // ── Join a specific conversation room ─────────────────────────────────────
  socket.on('adminConversation:join', (conversationId) => {
    if (!conversationId) return;
    socket.join(`adminConv_${conversationId}`);
  });

  // ── Leave a conversation room ─────────────────────────────────────────────
  socket.on('adminConversation:leave', (conversationId) => {
    if (!conversationId) return;
    socket.leave(`adminConv_${conversationId}`);
  });

  // ── Typing indicator ──────────────────────────────────────────────────────
  // Payload: { conversationId, senderRole, senderName }
  socket.on('adminMessage:typing', (payload) => {
    if (!payload?.conversationId) return;
    socket.to(`adminConv_${payload.conversationId}`).emit('adminMessage:typing', {
      conversationId: payload.conversationId,
      senderRole: payload.senderRole || 'unknown',
      senderName: payload.senderName || '',
      userId,
    });
  });

  // ── Stop typing ───────────────────────────────────────────────────────────
  socket.on('adminMessage:stopTyping', (payload) => {
    if (!payload?.conversationId) return;
    socket.to(`adminConv_${payload.conversationId}`).emit('adminMessage:stopTyping', {
      conversationId: payload.conversationId,
      userId,
    });
  });

  // ── Manual presence ping (keep-alive from frontend) ───────────────────────
  socket.on('presence:ping', async () => {
    try {
      const now = new Date();
      await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: now });
      io.emit('presence:updated', { userId, isOnline: true, lastSeen: now });
    } catch (_) {}
  });

  // ── Handle disconnect — mark offline ──────────────────────────────────────
  socket.on('disconnect', async () => {
    try {
      const now = new Date();
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: now });
      io.emit('presence:updated', { userId, isOnline: false, lastSeen: now });
    } catch (_) {}
  });
};
