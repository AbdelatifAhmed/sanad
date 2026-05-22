const mongoose = require('mongoose');
const Booking = require('../models/booking.schema');
const Family = require('../models/family.schema');
const Companion = require('../models/companion.schema');
const User = require('../models/user.schema');

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const ALLOWED_COMPANION_BOOKING_STATUSES = ['approved', 'cancelled'];

const getFamilyUserId = (body, user) =>
  user?.id || user?._id || body.familyId || body.userId || body.familyUserId;

const parseTimeToMinutes = (value, fieldName) => {
  if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) {
    throw createError(`${fieldName} must be in HH:MM format.`, 400);
  }

  const [hours, minutes] = value.split(':').map(Number);
  if (hours > 23 || minutes > 59) {
    throw createError(`${fieldName} must be a valid time.`, 400);
  }

  return (hours * 60) + minutes;
};

const normalizeTasksList = (tasksList) => {
  if (!Array.isArray(tasksList) || tasksList.length === 0) {
    throw createError('Each schedule entry must include a non-empty tasksList.', 400);
  }

  return tasksList.map((task) => {
    const taskDescription = typeof task?.taskDescription === 'string'
      ? task.taskDescription.trim()
      : '';

    if (!taskDescription) {
      throw createError('Each task must include taskDescription.', 400);
    }

    return {
      taskDescription,
      isCompleted: Boolean(task.isCompleted)
    };
  });
};

const normalizeSchedule = (schedule) => {
  if (!Array.isArray(schedule) || schedule.length === 0) {
    throw createError('Schedule must be a non-empty array.', 400);
  }

  let totalMinutes = 0;

  const normalizedSchedule = schedule.map((entry) => {
    if (!entry || typeof entry !== 'object') {
      throw createError('Each schedule entry must be an object.', 400);
    }

    const date = new Date(entry.date);
    if (Number.isNaN(date.getTime())) {
      throw createError('Each schedule entry must include a valid date.', 400);
    }

    const startMinutes = parseTimeToMinutes(entry.startTime, 'startTime');
    const endMinutes = parseTimeToMinutes(entry.endTime, 'endTime');

    if (endMinutes <= startMinutes) {
      throw createError('endTime must be later than startTime.', 400);
    }

    totalMinutes += endMinutes - startMinutes;

    return {
      date,
      startTime: entry.startTime,
      endTime: entry.endTime,
      tasksList: normalizeTasksList(entry.tasksList)
    };
  });

  return {
    schedule: normalizedSchedule,
    totalHours: totalMinutes / 60
  };
};

const buildBookingResponse = (booking) => ({
  _id: booking._id,
  familyId: booking.familyId,
  companionId: booking.companionId,
  beneficiaryId: booking.beneficiaryId,
  status: booking.status,
  hourlyRateAtBooking: booking.hourlyRateAtBooking,
  totalHours: booking.totalHours,
  totalPrice: booking.totalPrice,
  schedule: booking.schedule,
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt
});

const getCompanionUserId = (body, user) =>
  user?.id || user?._id || body.companionId || body.userId || body.companionUserId;

const createBooking = async (req, res) => {
  try {
    const familyId = getFamilyUserId(req.body, req.user);
    const { companionId, beneficiaryId } = req.body;

    if (!familyId) {
      return res.status(400).json({
        success: false,
        message: 'familyId is required until authentication middleware is connected.'
      });
    }

    for (const [field, value] of [['familyId', familyId], ['companionId', companionId], ['beneficiaryId', beneficiaryId]]) {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${field}.`
        });
      }
    }

    const familyUser = await User.findById(familyId);
    if (!familyUser || familyUser.role !== 'family') {
      return res.status(404).json({
        success: false,
        message: 'Family user not found.'
      });
    }

    const companionUser = await User.findById(companionId);
    if (!companionUser || companionUser.role !== 'companion') {
      return res.status(404).json({
        success: false,
        message: 'Companion user not found.'
      });
    }

    const familyProfile = await Family.findOne({ familyId });
    if (!familyProfile) {
      return res.status(404).json({
        success: false,
        message: 'Family profile not found.'
      });
    }

    const beneficiary = familyProfile.beneficiaries.id(beneficiaryId);
    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiary not found for this family.'
      });
    }

    const companionProfile = await Companion.findOne({ userId: companionId });
    if (!companionProfile) {
      return res.status(404).json({
        success: false,
        message: 'Companion profile not found.'
      });
    }

    const { schedule, totalHours } = normalizeSchedule(req.body.schedule);

    const booking = new Booking({
      familyId,
      companionId,
      beneficiaryId,
      hourlyRateAtBooking: companionProfile.hourlyRate,
      totalHours,
      totalPrice: totalHours * companionProfile.hourlyRate,
      schedule
    });

    const bookingError = booking.validateSync();
    if (bookingError) {
      return res.status(400).json({
        success: false,
        message: bookingError.message
      });
    }

    await booking.save();

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully.',
      data: buildBookingResponse(booking)
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to create booking.'
    });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const companionId = getCompanionUserId(req.body, req.user);
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking id.'
      });
    }

    if (!companionId) {
      return res.status(400).json({
        success: false,
        message: 'companionId is required until authentication middleware is connected.'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(companionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid companionId.'
      });
    }

    if (!ALLOWED_COMPANION_BOOKING_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either approved or cancelled.'
      });
    }

    const companionUser = await User.findById(companionId);
    if (!companionUser || companionUser.role !== 'companion') {
      return res.status(404).json({
        success: false,
        message: 'Companion user not found.'
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    if (booking.companionId.toString() !== companionId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'This companion is not allowed to update this booking.'
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending bookings can be approved or cancelled.'
      });
    }

    booking.status = status;

    const bookingError = booking.validateSync();
    if (bookingError) {
      return res.status(400).json({
        success: false,
        message: bookingError.message
      });
    }

    await booking.save();

    return res.status(200).json({
      success: true,
      message: `Booking ${status} successfully.`,
      data: buildBookingResponse(booking)
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update booking status.'
    });
  }
};

module.exports = {
  createBooking,
  updateBookingStatus
};
