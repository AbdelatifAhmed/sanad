const mongoose = require('mongoose');
const Booking = require('../models/booking.schema');
const Companion = require('../models/companion.schema');
const Family = require('../models/family.schema');
const User = require('../models/user.schema');

const createBooking = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'family') {
      return res.status(403).json({ error: 'Access denied. Only family accounts can create bookings.' });
    }

    const familyId = req.user._id;
    const {
      companionId,
      beneficiaryId,
      notes,
      taskList,
      totalHours,
      schedule
    } = req.body;

    if (!companionId || !beneficiaryId || totalHours === undefined || !schedule) {
      return res.status(400).json({ error: 'Missing required booking fields.' });
    }

    if (!mongoose.Types.ObjectId.isValid(companionId)) {
      return res.status(400).json({ error: 'Invalid companion ID.' });
    }

    if (!mongoose.Types.ObjectId.isValid(beneficiaryId)) {
      return res.status(400).json({ error: 'Invalid beneficiary ID.' });
    }

    if (typeof totalHours !== 'number' || totalHours <= 0) {
      return res.status(400).json({ error: 'Total hours must be a number greater than 0.' });
    }

    if (!Array.isArray(schedule) || schedule.length === 0) {
      return res.status(400).json({ error: 'Schedule must be a non-empty array.' });
    }

    for (const item of schedule) {
      if (!item.date || !item.startTime || !item.endTime) {
        return res.status(400).json({ error: 'Every schedule item must contain date, startTime, and endTime.' });
      }
    }

    const familyProfile = await Family.findOne({ familyId });
    if (!familyProfile) {
      return res.status(404).json({ error: 'Family profile not found.' });
    }

    const beneficiaryExists = familyProfile.beneficiaries.some(
      (b) => b._id.toString() === beneficiaryId.toString()
    );
    if (!beneficiaryExists) {
      return res.status(404).json({ error: 'Beneficiary not found inside your family profile.' });
    }

    const companionUser = await User.findById(companionId);
    if (!companionUser || companionUser.role !== 'companion') {
      return res.status(404).json({ error: 'Companion user not found.' });
    }

    const companionProfile = await Companion.findOne({ userId: companionId });
    if (!companionProfile) {
      return res.status(404).json({ error: 'Companion profile not found.' });
    }

    if (companionProfile.verificationStatus !== 'verified') {
      return res.status(400).json({ error: 'Companion is not verified.' });
    }

    const rate = companionProfile.hourlyRate;
    if (rate === undefined || rate === null) {
      return res.status(400).json({ error: 'Hourly rate could not be resolved from companion profile.' });
    }

    let resolvedSchedule = schedule;
    if (Array.isArray(taskList) && taskList.length > 0) {
      resolvedSchedule = schedule.map(item => {
        const itemTasks = item.tasksList || [];
        if (itemTasks.length === 0) {
          return {
            ...item,
            tasksList: taskList.map(t => {
              if (typeof t === 'string') {
                return { taskDescription: t, isCompleted: false };
              } else if (typeof t === 'object' && t !== null) {
                return {
                  taskDescription: t.taskDescription || t.description || '',
                  isCompleted: !!t.isCompleted
                };
              }
              return t;
            })
          };
        }
        return item;
      });
    }

    const newBooking = new Booking({
      familyId,
      companionId,
      beneficiaryId,
      hourlyRateAtBooking: rate,
      totalHours,
      schedule: resolvedSchedule,
      notes,
      status: 'pending'
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

    const validStatuses = ['pending', 'approved', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid booking status.' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'family' && req.user.role !== 'companion') {
      return res.status(403).json({ error: 'Access denied. Invalid role.' });
    }

    if (req.user.role === 'family') {
      if (booking.familyId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Access denied. You can only update status for your own bookings.' });
      }
      if (status !== 'cancelled') {
        return res.status(400).json({ error: 'Family accounts can only cancel bookings.' });
      }
    }

    if (req.user.role === 'companion') {
      if (booking.companionId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Access denied. You can only update status for bookings assigned to you.' });
      }
      if (status !== 'approved' && status !== 'cancelled') {
        return res.status(400).json({ error: 'Companions can only approve or reject bookings.' });
      }
    }

    if (req.user.role !== 'admin') {
      const validTransitions = {
        pending: ['approved', 'cancelled'],
        approved: ['active', 'cancelled'],
        active: ['completed', 'cancelled'],
        completed: [],
        cancelled: []
      };
      const allowedNext = validTransitions[booking.status] || [];
      if (!allowedNext.includes(status) && booking.status !== status) {
        return res.status(400).json({ error: `Cannot transition booking status from ${booking.status} to ${status}.` });
      }
    }

    booking.status = status;
    const updatedBooking = await booking.save();
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
