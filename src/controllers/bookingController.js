const Booking = require('../models/booking.schema');
const Companion = require('../models/companion.schema');
const { sendNotification } = require('../services/notificationService');
const bookingService = require("../services/bookingService");
const { getSocketIds } = require("../utils/socketManager");

const createBooking = async (req, res) => {
  try {
    const {
      familyId,
      companionId,
      beneficiaryId,
      hourlyRateAtBooking,
      totalHours,
      schedule,
      notes
    } = req.body;

    // Use authenticated user's ID as familyId if authenticate middleware is used
    const resolvedFamilyId = familyId || (req.user ? req.user._id : null);

    if (!resolvedFamilyId || !companionId || !beneficiaryId || !totalHours) {
      return res.status(400).json({ error: 'Missing required booking fields (familyId/auth, companionId, beneficiaryId, totalHours)' });
    }

    // Resolve hourlyRateAtBooking from companion profile if not explicitly provided
    let rate = hourlyRateAtBooking;
    if (!rate) {
      const companionProfile = await Companion.findOne({ userId: companionId });
      if (!companionProfile) {
        return res.status(404).json({ error: 'Companion profile not found' });
      }
      rate = companionProfile.hourlyRate;
    }

    if (!rate) {
      return res.status(400).json({ error: 'Hourly rate could not be resolved for companion' });
    }

    const totalPrice = totalHours * rate;

    const newBooking = new Booking({
      familyId: resolvedFamilyId,
      companionId,
      beneficiaryId,
      hourlyRateAtBooking: rate,
      totalHours,
      totalPrice,
      schedule,
      notes
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

const getCompanionRequests = async (req, res) => {
  try {
    if (req.user.role !== 'companion') {
      return res.status(403).json({ error: 'Access denied. Only companions can fetch their pending requests.' });
    }

    const pendingBookings = await Booking.find({
      companionId: req.user._id,
      status: 'pending'
    }).populate('familyId', 'name email phone');

    return res.status(200).json({
      status: 'success',
      results: pendingBookings.length,
      data: {
        bookings: pendingBookings
      }
    });
  } catch (error) {
    console.error('Error fetching companion pending requests:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

const respondToBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (req.user.role !== 'companion') {
      return res.status(403).json({ error: 'Access denied. Only companions can respond to bookings.' });
    }

    if (!action || !['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: "Invalid action. Must be either 'accept' or 'decline'." });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (booking.companionId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied. You are not authorized to respond to this booking.' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ error: `Cannot respond to a booking with status '${booking.status}'.` });
    }

    booking.status = action === 'accept' ? 'approved' : 'cancelled';
    const updatedBooking = await booking.save();


    await sendNotification(
    booking.familyId,          
    req.user.id,               
    'your booking request has been updated',         
    `Your booking request for companion ${req.user.name} has been ${action === 'accept' ? 'approved' : 'declined'}.`, 
    'booking'                  
  );

    return res.status(200).json({
      status: 'success',
      message: `Booking request has been successfully ${action === 'accept' ? 'accepted' : 'declined'}.`,
      data: {
        booking: updatedBooking
      }
    });
  } catch (error) {
    console.error('Error responding to booking:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }

};

module.exports = {
    createBooking,
    updateBookingStatus,
    checkIn,
    checkOut,
    getCompanionRequests,
    respondToBooking
};
