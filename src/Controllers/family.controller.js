const mongoose = require('mongoose');
const Family = require('../models/family.schema');
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

const getFamilyId = (body, user) =>
  user?.id || user?._id || body.familyId || body.userId || body.familyUserId;

const normalizeInterests = (interests) => {
  if (interests === undefined) return undefined;

  if (!Array.isArray(interests)) {
    throw createError('Beneficiary interests must be an array of strings.', 400);
  }

  return interests
    .filter((interest) => interest !== null && interest !== undefined && `${interest}`.trim() !== '')
    .map((interest) => `${interest}`.trim());
};

const mapBeneficiaryData = (beneficiary) => {
  const data = pick(beneficiary, [
    'name',
    'age',
    'gender',
    'category',
    'conditionDetails',
    'interests'
  ]);

  if (Object.prototype.hasOwnProperty.call(data, 'interests')) {
    data.interests = normalizeInterests(data.interests);
  }

  return data;
};

const updateBeneficiaries = (familyProfile, beneficiaries) => {
  if (!Array.isArray(beneficiaries)) {
    throw createError('Beneficiaries must be provided as an array.', 400);
  }

  for (const beneficiary of beneficiaries) {
    const data = mapBeneficiaryData(beneficiary);

    if (!beneficiary._id) {
      familyProfile.beneficiaries.push(data);
      continue;
    }

    if (!mongoose.Types.ObjectId.isValid(beneficiary._id)) {
      throw createError(`Invalid beneficiary id: ${beneficiary._id}`, 400);
    }

    const existingBeneficiary = familyProfile.beneficiaries.id(beneficiary._id);
    if (!existingBeneficiary) {
      throw createError(`Beneficiary not found: ${beneficiary._id}`, 404);
    }

    Object.assign(existingBeneficiary, data);
  }
};

const buildFamilyProfileResponse = (familyUser, familyProfile) => ({
  familyUser: {
    _id: familyUser._id,
    name: familyUser.name,
    email: familyUser.email,
    phone: familyUser.phone,
    role: familyUser.role
  },
  familyProfile
});

const updateFamilyProfile = async (req, res) => {
  try {
    const familyId = getFamilyId(req.body, req.user);

    if (!familyId) {
      return res.status(400).json({
        success: false,
        message: 'familyId is required until authentication middleware is connected.'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(familyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid familyId.'
      });
    }

    const familyUser = await User.findById(familyId);
    if (!familyUser) {
      return res.status(404).json({
        success: false,
        message: 'Family user not found.'
      });
    }

    if (familyUser.role !== 'family') {
      return res.status(403).json({
        success: false,
        message: 'Only users with role "family" can update this profile.'
      });
    }

    const userUpdates = pick(req.body, ['name', 'email', 'phone']);
    if (Object.keys(userUpdates).length > 0) {
      Object.assign(familyUser, userUpdates);
    }

    let familyProfile = await Family.findOne({ familyId }) || new Family({
      familyId,
      address: { city: '', area: '', fullAddress: '' },
      beneficiaries: []
    });

    if (req.body.address) {
      const addressUpdates = pick(req.body.address, ['city', 'area', 'fullAddress']);
      familyProfile.address = {
        ...(familyProfile.address?.toObject?.() || {}),
        ...addressUpdates
      };
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'beneficiaries')) {
      updateBeneficiaries(familyProfile, req.body.beneficiaries);
    }

    const profileError = familyProfile.validateSync();
    if (profileError) {
      return res.status(400).json({
        success: false,
        message: profileError.message
      });
    }

    const userError = familyUser.validateSync();
    if (userError) {
      return res.status(400).json({
        success: false,
        message: userError.message
      });
    }

    await familyProfile.save();
    await familyUser.save();

    return res.status(200).json({
      success: true,
      message: 'Family profile updated successfully.',
      data: buildFamilyProfileResponse(familyUser, familyProfile)
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update family profile.'
    });
  }
};

module.exports = {
  updateFamilyProfile
};
