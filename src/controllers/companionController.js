const Companion = require('../models/companion.schema');
const { generateEmbedding } = require('../services/ai/ragService');

const Booking = require('../models/booking.schema.js'); 
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

module.exports = {
  getCompanionSchedule,
  updateCompanionProfile
};