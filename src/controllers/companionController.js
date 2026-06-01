const mongoose = require('mongoose');
const Companion = require('../models/companion.schema');
const Booking = require('../models/booking.schema.js'); 
const { generateEmbedding } = require('../services/ai/ragService');

const updateCompanionProfile = async (req, res) => {
  try {
    const { userId, bio, hourlyRate, skills, hobbies, availability } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const updateData = { bio, hourlyRate, skills, hobbies, availability };

    if (bio || skills || hobbies) {
      const bioText = bio || '';
      const skillsText = Array.isArray(skills) ? skills.join(' ') : '';
      const hobbiesText = Array.isArray(hobbies) ? hobbies.join(' ') : '';
      
      const fullText = `${bioText} ${skillsText} ${hobbiesText}`.trim();

      if (fullText) {
        updateData.bioEmbedding = await generateEmbedding(fullText);
      }
    }

    const updatedCompanion = await Companion.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedCompanion) {
      return res.status(404).json({ error: 'Companion profile not found' });
    }

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

module.exports = {
  getCompanionSchedule,
  updateCompanionProfile,
  updateCompanionAvailability,
  getVerifiedCompanions,
  getCompanionById,
  getMyCompanionProfile
};