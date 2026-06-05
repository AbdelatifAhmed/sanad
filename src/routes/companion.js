const express = require('express');
const router = express.Router();
const { updateCompanionProfile, getCompanionSchedule } = require('../controllers/companionController');
const { authenticate } = require('../middleware/authMiddleware');
const { isCompanion } = require('../middleware/RoleMiddleware');

router.use(authenticate, isCompanion); 
router.put('/profile', updateCompanionProfile);
router.patch('/profile', updateCompanionProfile);
router.get('/me/schedule', getCompanionSchedule);
module.exports = router;
