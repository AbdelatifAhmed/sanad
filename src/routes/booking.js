const express = require('express');
const router = express.Router();
const { createBooking, updateBookingStatus, getCompanionRequests, respondToBooking } = require('../controllers/bookingController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/', authenticate, createBooking);
router.get('/companion/requests', authenticate, getCompanionRequests);
router.put('/:id/respond', authenticate, respondToBooking);
router.put('/:id/status', authenticate, updateBookingStatus);

module.exports = router;
