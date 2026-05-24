const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/session/family', authenticate, aiController.handleFamilyChat);
router.post('/session/companion', authenticate, aiController.handleCompanionChat);
router.post('/search/companions', authenticate, aiController.smartSearch);
module.exports = router;
