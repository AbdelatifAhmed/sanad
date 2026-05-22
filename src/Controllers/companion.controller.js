const mongoose = require('mongoose');
const Companion = require('../models/companion.schema');
const User = require('../models/user.schema');

const pick = (source, fields) =>
  Object.fromEntries(
    fields
      .filter((field) => Object.prototype.hasOwnProperty.call(source, field))
      .map((field) => [field, source[field]])
  );

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getCompanionUserId = (body, user) =>
  user?.id || user?._id || body.userId || body.companionId || body.companionUserId;

const normalizeStringArray = (value, fieldName) => {
  if (!Array.isArray(value)) {
    throw createError(`${fieldName} must be an array of strings.`, 400);
  }

  return value
    .filter((item) => item !== null && item !== undefined && `${item}`.trim() !== '')
    .map((item) => `${item}`.trim());
};

const normalizeAvailability = (availability) => {
  if (!Array.isArray(availability)) {
    throw createError('Availability must be an array.', 400);
  }

  return availability.map((entry) => {
    if (!entry || typeof entry !== 'object') {
      throw createError('Each availability entry must be an object.', 400);
    }

    const day = entry.day ? `${entry.day}`.trim() : '';
    if (!day) {
      throw createError('Availability day is required.', 400);
    }

    return {
      day,
      slots: normalizeStringArray(entry.slots || [], 'Availability slots')
    };
  });
};

const buildCompanionProfileResponse = (companionUser, companionProfile) => ({
  companionUser: {
    _id: companionUser._id,
    name: companionUser.name,
    email: companionUser.email,
    phone: companionUser.phone,
    role: companionUser.role
  },
  companionProfile
});

const updateCompanionProfile = async (req, res) => {
  try {
    const userId = getCompanionUserId(req.body, req.user);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required until authentication middleware is connected.'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId.'
      });
    }

    const companionUser = await User.findById(userId);
    if (!companionUser) {
      return res.status(404).json({
        success: false,
        message: 'Companion user not found.'
      });
    }

    if (companionUser.role !== 'companion') {
      return res.status(403).json({
        success: false,
        message: 'Only users with role "companion" can update this profile.'
      });
    }

    const companionProfile = await Companion.findOne({ userId });
    if (!companionProfile) {
      return res.status(404).json({
        success: false,
        message: 'Companion profile not found.'
      });
    }

    Object.assign(companionProfile, pick(req.body, ['bio', 'hourlyRate']));

    if (Object.prototype.hasOwnProperty.call(req.body, 'skills')) {
      companionProfile.skills = normalizeStringArray(req.body.skills, 'Skills');
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'hobbies')) {
      companionProfile.hobbies = normalizeStringArray(req.body.hobbies, 'Hobbies');
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'availability')) {
      companionProfile.availability = normalizeAvailability(req.body.availability);
    }

    const profileError = companionProfile.validateSync();
    if (profileError) {
      return res.status(400).json({
        success: false,
        message: profileError.message
      });
    }

    await companionProfile.save();

    return res.status(200).json({
      success: true,
      message: 'Companion profile updated successfully.',
      data: buildCompanionProfileResponse(companionUser, companionProfile)
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update companion profile.'
    });
  }
};

module.exports = {
  updateCompanionProfile
};
