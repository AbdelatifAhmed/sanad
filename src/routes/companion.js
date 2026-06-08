const express = require("express");
const router = express.Router();
const { 
  updateCompanionProfile, 
  getCompanionSchedule, 
  updateCompanionAvailability,
  getVerifiedCompanions,
  getCompanionById,
  getMyCompanionProfile
} = require('../controllers/companionController');
const { authenticate } = require('../middleware/authMiddleware');
const { isCompanion } = require('../middleware/RoleMiddleware');

router.use(authenticate, isCompanion); 
router.put('/profile', updateCompanionProfile);
router.patch('/profile', updateCompanionProfile);
router.get('/me/schedule', getCompanionSchedule);
router.patch('/me/availability', updateCompanionAvailability);
router.get('/', getVerifiedCompanions);
router.get('/me', getMyCompanionProfile);
router.get('/:id', getCompanionById);
module.exports = router;
