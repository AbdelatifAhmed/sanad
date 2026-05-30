const Booking = require('../models/booking.schema');

const createBooking = async (req, res) => {
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

const updateBookingStatus = async (req, res) => {
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

const bookingService = require("../services/bookingService");
const { getSocketIds } = require("../utils/socketManager");

const checkIn = async (req, res) => {
    try {
        const { id } = req.params;
        const { scheduleId } = req.body;
        const companionId = req.user._id;

        const result = await bookingService.checkIn(id, scheduleId, companionId);

        const familySocketIds = getSocketIds(result.familyId);
        const io = req.io;

        const message = "The companion has arrived at the location.";

        const notification = await bookingService.createNotification(
            result.familyId,
            message
        );

        if (familySocketIds.length > 0 && io) {
            familySocketIds.forEach(socketId => {
                io.to(socketId).emit("notification", notification);
            });
        }

        res.status(200).json({
            message: "Check-in successful",
            data: result.booking,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const checkOut = async (req, res) => {
    try {
        const { id } = req.params;
        const { scheduleId } = req.body;
        const companionId = req.user._id;

        const result = await bookingService.checkOut(id, scheduleId, companionId);

        const familySocketIds = getSocketIds(result.familyId);
        const io = req.io;

        const message = "The companion has left the location.";
        const notification = await bookingService.createNotification(
            result.familyId,
            message
        );

        if (familySocketIds.length > 0 && io) {
            familySocketIds.forEach(socketId => {
                io.to(socketId).emit("notification", notification);
            });
        }

        res.status(200).json({
            message: "Check-out successful",
            data: result.booking,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createBooking,
    updateBookingStatus,
    checkIn,
    checkOut
};
