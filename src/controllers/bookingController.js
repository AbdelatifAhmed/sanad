const Booking = require('../models/booking.schema');

exports.createBooking = async (req, res) => {
  try {
    const {
      familyId,
      companionId,
      beneficiaryId,
      hourlyRateAtBooking,
      totalHours,
      schedule
    } = req.body;

    if (!familyId || !companionId || !beneficiaryId || !hourlyRateAtBooking || !totalHours) {
      return res.status(400).json({ error: 'Missing required booking fields' });
    }

    const totalPrice = totalHours * hourlyRateAtBooking;

    const newBooking = new Booking({
      familyId,
      companionId,
      beneficiaryId,
      hourlyRateAtBooking,
      totalHours,
      totalPrice,
      schedule
    });

    const savedBooking = await newBooking.save();
    return res.status(201).json(savedBooking);
  } catch (error) {
    console.error('Error creating booking:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: `Invalid field: ${error.path}` });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    return res.status(200).json(updatedBooking);
  } catch (error) {
    console.error('Error updating booking status:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: `Invalid field: ${error.path}` });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

