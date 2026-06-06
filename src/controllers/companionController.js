const mongoose = require('mongoose');
const Companion = require('../models/companion.schema');
const Booking = require('../models/booking.schema.js'); 
const { generateEmbedding } = require('../services/ai/ragService');
const User = require('../models/user.schema');




const updateCompanionProfile = async (req, res) => {
  try {
   
    if (!req.user || req.user.role !== 'companion') {
      return res.status(403).json({ error: 'Access denied. Only authenticated companion accounts can perform this action.' });
    }

    const userId = req.user._id;
    const { bio, hourlyRate, skills, hobbies, availability } = req.body;

  
    const existingCompanion = await Companion.findOne({ userId });

   
    if (!existingCompanion) {

      if (bio === undefined || typeof bio !== 'string' || bio.trim() === '') {
        return res.status(400).json({ error: 'Bio is required to initialize a companion profile.' });
      }
      if (hourlyRate === undefined || typeof hourlyRate !== 'number' || hourlyRate < 0) {
        return res.status(400).json({ error: 'Hourly rate is required to initialize a companion profile and must be a positive number.' });
      }
    } else {
 
      if (bio !== undefined && (typeof bio !== 'string' || bio.trim() === '')) {
        return res.status(400).json({ error: 'Bio must be a non-empty string.' });
      }
      if (hourlyRate !== undefined && (typeof hourlyRate !== 'number' || hourlyRate < 0)) {
        return res.status(400).json({ error: 'Hourly rate must be a positive number.' });
      }
    }

    if (skills !== undefined) {
      if (!Array.isArray(skills) || skills.some(s => typeof s !== 'string')) {
        return res.status(400).json({ error: 'Skills must be an array of strings.' });
      }
    }

    if (hobbies !== undefined) {
      if (!Array.isArray(hobbies) || hobbies.some(h => typeof h !== 'string')) {
        return res.status(400).json({ error: 'Hobbies must be an array of strings.' });
      }
    }

    if (availability !== undefined) {
      if (!Array.isArray(availability)) {
        return res.status(400).json({ error: 'Availability must be an array.' });
      }
      const validDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      for (const slotObj of availability) {
        if (typeof slotObj !== 'object' || slotObj === null || Array.isArray(slotObj)) {
          return res.status(400).json({ error: 'Each availability entry must be a valid object.' });
        }
        if (!slotObj.day || !validDays.includes(slotObj.day)) {
          return res.status(400).json({ error: `Availability day must be one of: ${validDays.join(', ')}.` });
        }
        if (!slotObj.slots || !Array.isArray(slotObj.slots) || slotObj.slots.some(s => typeof s !== 'string')) {
          return res.status(400).json({ error: 'Availability slots must be an array of strings.' });
        }
      }
    }

    const setUpdate = {};
    if (bio !== undefined) setUpdate.bio = bio;
    if (hourlyRate !== undefined) setUpdate.hourlyRate = hourlyRate;
    if (skills !== undefined) setUpdate.skills = skills;
    if (hobbies !== undefined) setUpdate.hobbies = hobbies;
    if (availability !== undefined) setUpdate.availability = availability;

    if (bio !== undefined || skills !== undefined || hobbies !== undefined) {
      const bioText = bio || (existingCompanion ? existingCompanion.bio : '');
      const skillsText = Array.isArray(skills) ? skills.join(' ') : (existingCompanion && Array.isArray(existingCompanion.skills) ? existingCompanion.skills.join(' ') : '');
      const hobbiesText = Array.isArray(hobbies) ? hobbies.join(' ') : (existingCompanion && Array.isArray(existingCompanion.hobbies) ? existingCompanion.hobbies.join(' ') : '');
      
      const fullText = `${bioText} ${skillsText} ${hobbiesText}`.trim();

      if (fullText) {
        try {
          setUpdate.bioEmbedding = await generateEmbedding(fullText);
        } catch (embeddingError) {
          console.error('Failed to generate embedding:', embeddingError);
        }
      }
    }

   
    const updatedCompanion = await Companion.findOneAndUpdate(
      { userId },
      {
        $set: setUpdate,
        $setOnInsert: {
          companionType: 'general',
          specialization: 'none',
          verificationStatus: 'pending',
          documents: {
            nationalIdUrl: 'placeholder_national_id.jpg',
            criminalRecordUrl: 'placeholder_criminal_record.jpg'
          }
        }
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json(updatedCompanion);
  } catch (error) {
    console.error('Error updating companion profile:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: `Invalid field: ${error.path}` });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getCompanionSchedule = async (req, res) => {
  try {
    const lang = req.headers['accept-language'] || 'ar';

    const companionProfile = await Companion.findOne({ userId: req.user.id });
    
    if (!companionProfile) {
      return res.status(404).json({
        status: 'fail',
        message: lang === 'en' ? 'Companion profile not found.' : 'لم يتم العثور على ملف تعريف المرافق الخاص بك.'
      });
    }

    const confirmedBookings = await Booking.find({
      companionId: companionProfile._id,
      status: { $in: ['accepted', 'confirmed'] } 
    })
    .populate({
      path: 'familyId',
      select: 'name phoneNumber email' 
    })
    .sort({ startDate: 1 }); 

    return res.status(200).json({
      status: 'success',
      results: confirmedBookings.length,
      data: {
        schedule: confirmedBookings
      }
    });

  } catch (error) {
    console.error('Error fetching companion schedule:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

const updateCompanionAvailability = async (req, res) => {
  try {
    const { availability } = req.body;
    const lang = req.headers['accept-language'] || 'ar';

    if (!availability) {
      return res.status(400).json({
        status: 'fail',
        message: lang === 'en' ? 'Availability data is required.' : 'بيانات التواجد والمواعيد مطلوبة.'
      });
    }

    const updatedCompanion = await Companion.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { availability } }, 
      { new: true, runValidators: true }
    );

    if (!updatedCompanion) {
      return res.status(404).json({
        status: 'fail',
        message: lang === 'en' ? 'Companion profile not found.' : 'لم يتم العثور على ملف تعريف المرافق الخاص بك.'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: lang === 'en' ? 'Availability schedule updated successfully.' : 'تم تحديث جدول مواعيد تواجدك بنجاح.',
      data: {
        availability: updatedCompanion.availability
      }
    });

  } catch (error) {
    console.error('Error updating companion availability:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ status: 'fail', error: error.message });
    }
    
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const getVerifiedCompanions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await Companion.countDocuments({ verificationStatus: 'verified' });
    const companions = await Companion.find({ verificationStatus: 'verified' })
      .populate('userId', 'name email phone')
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      status: 'success',
      results: companions.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: {
        companions
      }
    });
  } catch (error) {
    console.error('Error fetching verified companions:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

const getCompanionById = async (req, res) => {
  try {
    const { id } = req.params;
    const lang = req.headers['accept-language'] || 'ar';

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: lang === 'en' ? 'Invalid companion ID format.' : 'صيغة معرّف المرافق غير صالحة.'
      });
    }

    const companion = await Companion.findById(id).populate('userId', 'name email phone');

    if (!companion) {
      return res.status(404).json({
        status: 'fail',
        message: lang === 'en' ? 'Companion profile not found.' : 'لم يتم العثور على ملف تعريف المرافق.'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        companion
      }
    });
  } catch (error) {
    console.error('Error fetching companion by ID:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

const getMyCompanionProfile = async (req, res) => {
  try {
    const lang = req.headers['accept-language'] || 'ar';

    if (req.user.role !== 'companion') {
      return res.status(403).json({
        status: 'fail',
        message: lang === 'en' ? 'Access denied. Only companions can view this profile.' : 'عذراً، هذا الحساب لا يملك صلاحيات أو ملف تعريف مرافق.'
      });
    }

    const companion = await Companion.findOne({ userId: req.user.id }).populate('userId', 'name email phone');

    if (!companion) {
      return res.status(404).json({
        status: 'fail',
        message: lang === 'en' ? 'Companion profile not found.' : 'لم يتم العثور على ملف تعريف المرافق الخاص بك.'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        companion
      }
    });
  } catch (error) {
    console.error('Error fetching personal companion profile:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};


const updateMyLocation = async (req, res) => {
  try {
    const { coordinates, readableAddress, city, governorate } = req.body;

    if (!coordinates || coordinates.length !== 2) {
      return res.status(400).json({ error: "Coordinates must be an array of [longitude, latitude]" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          location: {
            geo: { type: "Point", coordinates },
            readableAddress,
            city,
            governorate
          }
        }
      },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    return res.status(200).json({ status: "success", data: { user: updatedUser } });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getCompanionSchedule,
  updateCompanionProfile,
  updateCompanionAvailability,
  getVerifiedCompanions,
  getCompanionById,
  getMyCompanionProfile,
  updateMyLocation
};