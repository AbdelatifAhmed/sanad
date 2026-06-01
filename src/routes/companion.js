const express = require('express');
const router = express.Router();
const { updateCompanionProfile, getCompanionSchedule } = require('../controllers/companionController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate); 
router.put('/profile', updateCompanionProfile);
router.get('/me/schedule', getCompanionSchedule);
module.exports = router;
