const express = require('express');
const router = express.Router();
const { sendMessage, getChatHistory, getConversations, markChatAsRead } = require('../controllers/chatController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/conversations', getConversations);
router.post('/', sendMessage);
router.get('/:bookingId', getChatHistory);
router.patch('/:bookingId/read', markChatAsRead);

module.exports = router;
