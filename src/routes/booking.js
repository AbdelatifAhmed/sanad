const express = require('express');
const router = express.Router();
const { createBooking, updateBookingStatus, getCompanionRequests, respondToBooking } = require('../controllers/bookingController');
const { authenticate } = require('../middleware/authMiddleware');
const { isFamily } = require('../middleware/RoleMiddleware');

router.post('/', authenticate, isFamily, createBooking);
router.get('/companion/requests', authenticate, getCompanionRequests);
router.put('/:id/respond', authenticate, respondToBooking);
router.put('/:id/status', authenticate, updateBookingStatus);
router.patch('/:id/status', authenticate, updateBookingStatus);

module.exports = router;
