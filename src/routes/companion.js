const express = require('express');
const router = express.Router();
const { updateCompanionProfile, getCompanionSchedule , updateCompanionAvailability} = require('../controllers/companionController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate); 
router.put('/profile', updateCompanionProfile);
router.get('/me/schedule', getCompanionSchedule);
router.patch('/me/availability', updateCompanionAvailability);
module.exports = router;
