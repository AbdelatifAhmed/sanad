const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/chat/family', authenticate, aiController.handleFamilyChat);
router.post('/chat/companion', authenticate, aiController.handleCompanionChat);

module.exports = router;
