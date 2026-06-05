const express = require('express');
const router = express.Router();
const { sendMessage, getChatHistory } = require('../controllers/chatController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.post('/', sendMessage);
router.get('/:bookingId', getChatHistory);

module.exports = router;
