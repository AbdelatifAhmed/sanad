/**
 * adminMessageHandler.js
 * Registers Socket.IO event handlers for the Admin Messaging System.
 * Reuses the existing socket infrastructure — no new server or namespace.
 */

module.exports = function registerAdminMessageHandlers(io, socket) {
  const userId = socket.userId;

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
    // Broadcast to the conversation room except sender
    socket.to(`adminConv_${payload.conversationId}`).emit('adminMessage:typing', {
      conversationId: payload.conversationId,
      senderRole: payload.senderRole || 'unknown',
      senderName: payload.senderName || '',
      userId,
    });
    // Also emit to admin's personal room if user is typing
    socket.to(payload.adminId || '').emit('adminMessage:typing', {
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

  // ── Online presence: user comes online ───────────────────────────────────
  // The base server already joins each user to their personal room (userId).
  // Here we broadcast online status to conversations they participate in.
  socket.on('adminPresence:online', () => {
    socket.broadcast.emit('adminPresence:userOnline', { userId });
  });
};
