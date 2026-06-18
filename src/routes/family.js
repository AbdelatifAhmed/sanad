const express = require('express');
const router = express.Router();
const { updateFamilyProfile, getFamilyDashboardStats, getFamilyProfile, getFamilyJobPosts } = require('../controllers/familyController');
const { authenticate } = require('../middleware/authMiddleware');
const { isFamily } = require('../middleware/RoleMiddleware');
const {getFamilyBookings} = require("../controllers/bookingDashboradController.js");

router.use(authenticate, isFamily);
router.put('/profile', updateFamilyProfile);
router.patch('/profile', updateFamilyProfile);
router.get('/profile', getFamilyProfile);
router.get('/bookings', getFamilyBookings);
router.get('/me/dashboard-stats', getFamilyDashboardStats);
router.get('/my-job-posts', getFamilyJobPosts);

module.exports = router;
