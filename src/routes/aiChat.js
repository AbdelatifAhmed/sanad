const express = require('express');
const router = express.Router();
const { sendMessage } = require('../controllers/aiChatController');

router.post('/chat/message', sendMessage);

module.exports = router;
