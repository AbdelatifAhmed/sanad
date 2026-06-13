const Family = require('../models/family.schema');
const mongoose = require('mongoose');
const messages = require("../utils/messages");

exports.updateFamilyProfile = async (req, res) => {
  try {
    const lang = req.lang || "en";
    if (!req.user || req.user.role !== 'family') {
      return res.status(403).json({
        error: messages.booking.accessDeniedFamilyOnly[lang]
      });
    }

    const familyId = req.user._id;
    const { address, beneficiaries } = req.body;
    if (address === undefined && beneficiaries === undefined) {
      return res.status(400).json({
        error: messages.family.atLeastOneField[lang]
      });
    }

    if (address !== undefined) {
      if (typeof address !== 'object' || address === null || Array.isArray(address)) {
        return res.status(400).json({
          error: messages.family.invalidAddress[lang]
        });
      }
      
      const { city, area, fullAddress } = address;
      if (city !== undefined && (typeof city !== 'string' || city.trim() === '')) {
        return res.status(400).json({ error: 'City must be a non-empty string.' });
      }
      if (area !== undefined && (typeof area !== 'string' || area.trim() === '')) {
        return res.status(400).json({ error: 'Area must be a non-empty string.' });
      }
      if (fullAddress !== undefined && (typeof fullAddress !== 'string' || fullAddress.trim() === '')) {
        return res.status(400).json({ error: 'Full address must be a non-empty string.' });
      }
    }

    if (beneficiaries !== undefined) {
      if (!Array.isArray(beneficiaries)) {
        return res.status(400).json({
          error: messages.family.invalidBeneficiaries[lang]
        });
      }

      for (const b of beneficiaries) {
        if (typeof b !== 'object' || b === null || Array.isArray(b)) {
          return res.status(400).json({
            error: 'Each beneficiary must be a valid object.'
          });
        }

        if (b._id) {
        
          if (!mongoose.Types.ObjectId.isValid(b._id)) {
            return res.status(400).json({
              error: `Invalid beneficiary ID format: ${b._id}`
            });
          }

          if (b.name !== undefined && (typeof b.name !== 'string' || b.name.trim() === '')) {
            return res.status(400).json({ error: 'Beneficiary name must be a non-empty string.' });
          }
          if (b.age !== undefined && (typeof b.age !== 'number' || b.age < 0)) {
            return res.status(400).json({ error: 'Beneficiary age must be a positive number.' });
          }
          if (b.gender !== undefined && !['male', 'female'].includes(b.gender)) {
            return res.status(400).json({ error: 'Beneficiary gender must be male or female.' });
          }
          if (b.category !== undefined && !['elderly', 'special_needs'].includes(b.category)) {
            return res.status(400).json({ error: 'Beneficiary category must be elderly or special_needs.' });
          }
          if (b.conditionDetails !== undefined && (typeof b.conditionDetails !== 'string' || b.conditionDetails.trim() === '')) {
            return res.status(400).json({ error: 'Beneficiary condition details must be a non-empty string.' });
          }
          if (b.interests !== undefined) {
            if (!Array.isArray(b.interests) || b.interests.some(item => typeof item !== 'string')) {
              return res.status(400).json({ error: 'Beneficiary interests must be an array of strings.' });
            }
          }
        } else {
          const { name, age, gender, category, conditionDetails, interests } = b;
          if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ error: 'New beneficiary name is required.' });
          }
          if (age === undefined || typeof age !== 'number' || age < 0) {
            return res.status(400).json({ error: 'New beneficiary age is required and must be a positive number.' });
          }
          if (!gender || !['male', 'female'].includes(gender)) {
            return res.status(400).json({ error: 'New beneficiary gender is required (male or female).' });
          }
          if (!category || !['elderly', 'special_needs'].includes(category)) {
            return res.status(400).json({ error: 'New beneficiary category is required (elderly or special_needs).' });
          }
          if (!conditionDetails || typeof conditionDetails !== 'string' || conditionDetails.trim() === '') {
            return res.status(400).json({ error: 'New beneficiary condition details are required.' });
          }
          if (interests !== undefined) {
            if (!Array.isArray(interests) || interests.some(item => typeof item !== 'string')) {
              return res.status(400).json({ error: 'New beneficiary interests must be an array of strings.' });
            }
          }
        }
      }
    }

    let familyProfile = await Family.findOne({ familyId });

    if (!familyProfile) {
      if (!address || !address.city || !address.area || !address.fullAddress) {
        return res.status(400).json({
          error: 'Family profile does not exist. You must provide a complete address (city, area, fullAddress) to create a profile.'
        });
      }

      const initialBeneficiaries = [];
      if (beneficiaries) {
        for (const b of beneficiaries) {
          initialBeneficiaries.push({
            name: b.name.trim(),
            age: b.age,
            gender: b.gender,
            category: b.category,
            conditionDetails: b.conditionDetails.trim(),
            interests: b.interests || []
          });
        }
      }

      familyProfile = new Family({
        familyId,
        address: {
          city: address.city.trim(),
          area: address.area.trim(),
          fullAddress: address.fullAddress.trim()
        },
        beneficiaries: initialBeneficiaries
      });
    } else {
      
      if (address !== undefined) {
        if (address.city !== undefined) familyProfile.address.city = address.city.trim();
        if (address.area !== undefined) familyProfile.address.area = address.area.trim();
        if (address.fullAddress !== undefined) familyProfile.address.fullAddress = address.fullAddress.trim();
      }

      if (beneficiaries !== undefined) {
        for (const b of beneficiaries) {
          if (b._id) {
           
            const existingB = familyProfile.beneficiaries.id(b._id);
            if (!existingB) {
              return res.status(404).json({
                error: `Beneficiary with ID ${b._id} not found.`
              });
            }
            if (b.name !== undefined) existingB.name = b.name.trim();
            if (b.age !== undefined) existingB.age = b.age;
            if (b.gender !== undefined) existingB.gender = b.gender;
            if (b.category !== undefined) existingB.category = b.category;
            if (b.conditionDetails !== undefined) existingB.conditionDetails = b.conditionDetails.trim();
            if (b.interests !== undefined) existingB.interests = b.interests;
          } else {
            
            familyProfile.beneficiaries.push({
              name: b.name.trim(),
              age: b.age,
              gender: b.gender,
              category: b.category,
              conditionDetails: b.conditionDetails.trim(),
              interests: b.interests || []
            });
          }
        }
      }
    }

 
    const savedProfile = await familyProfile.save();
    return res.status(200).json({
      message: messages.family.profileSuccess[req.lang || "en"],
      profile: savedProfile
    });

  } catch (error) {
    console.error('Error updating family profile:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: `Invalid field: ${error.path}` });
    }
    return res.status(500).json({ error: messages.common.serverError[req.lang || "en"] });
  }
};
