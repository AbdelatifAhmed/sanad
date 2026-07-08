const express = require('express');
const router = express.Router();
const { sendMessage, getChatHistory, getConversations, markChatAsRead } = require('../controllers/chatController');
const { authenticate } = require('../middleware/authMiddleware');
const { aiShield } = require('../middleware/aiShield');

router.use(authenticate);

router.get('/conversations', getConversations);
router.post('/', aiShield, sendMessage);
router.get('/:bookingId', getChatHistory);
router.patch('/:bookingId/read', markChatAsRead);

module.exports = router;
