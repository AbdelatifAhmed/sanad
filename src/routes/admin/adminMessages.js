const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admin/adminMessagesController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/RoleMiddleware');
const uploadMiddleware = require('../../middleware/upload.middleware');

// ── Static routes first (must precede /:id wildcards) ────────────────────────

// User-facing: get own conversation (family / companion)
router.get('/user/my-conversation', authenticate, ctrl.getMyConversation);

// User-facing: get messages for own conversation (family / companion)
router.get('/user/messages', authenticate, ctrl.getMyMessages);

// Shared: send message (admin + family + companion)
router.post('/send', authenticate, ctrl.sendMessage);

// Shared: upload attachment (admin + family + companion)
router.post('/upload', authenticate, uploadMiddleware.single('file'), ctrl.uploadAttachment);

// Shared: mark as read
router.patch('/read', authenticate, ctrl.markAsRead);

// Admin-only: resolve / reopen / close conversation
router.patch('/resolve', authenticate, isAdmin, ctrl.resolveConversation);
router.patch('/reopen',  authenticate, isAdmin, ctrl.reopenConversation);
router.patch('/close',   authenticate, isAdmin, ctrl.closeConversation);

// User-facing: reopen their own resolved conversation
router.patch('/user/reopen', authenticate, ctrl.reopenConversation);

// Admin-only: start or retrieve a conversation with any user
router.post('/start-conversation', authenticate, isAdmin, ctrl.startConversation);

// ── Admin-only: list all conversations ───────────────────────────────────────
router.get('/', authenticate, isAdmin, ctrl.getConversations);

// ── Admin-only: delete a specific message (soft) ─────────────────────────────
router.delete('/:messageId', authenticate, isAdmin, ctrl.deleteMessage);

// ── Admin-only: full chat history for a conversation ─────────────────────────
// Keep this last — wildcard param must not shadow the static routes above
router.get('/:conversationId', authenticate, isAdmin, ctrl.getChatHistory);

module.exports = router;
