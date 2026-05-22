const express = require('express');
const { createBooking, updateBookingStatus } = require('../Controllers/booking.controller');

const router = express.Router();

router.post('/', createBooking);
router.put('/:id/status', updateBookingStatus);

module.exports = router;
