const express = require("express");
const router = express.Router();
const { 
  updateCompanionProfile, 
  getCompanionSchedule, 
  updateCompanionAvailability,
  getVerifiedCompanions,
  getCompanionById,
  getMyCompanionProfile,
  getCompanionDashboardStats
} = require('../controllers/companionController');
const { getCompanionBookings } = require("../controllers/BookingDashboradController");
const { authenticate } = require('../middleware/authMiddleware');
const { isCompanion } = require('../middleware/RoleMiddleware');

// Public/Family accessible routes (Require authentication only)
router.get('/', authenticate, getVerifiedCompanions);

// Specific companion profile route (before wildcard :id to prevent conflict)
router.get('/me', authenticate, isCompanion, getMyCompanionProfile);

// Public/Family accessible wildcard route
router.get('/:id', authenticate, getCompanionById);

// Companion-only routes
router.use(authenticate, isCompanion); 
router.put('/profile', updateCompanionProfile);
router.patch('/profile', updateCompanionProfile);
router.get('/me/schedule', getCompanionSchedule);
router.patch('/me/availability', updateCompanionAvailability);
router.get('/me/bookings', getCompanionBookings);
router.get('/me/dashboard-stats', getCompanionDashboardStats);

module.exports = router;
