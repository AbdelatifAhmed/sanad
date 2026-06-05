const Companion = require('../models/companion.schema');
const { generateEmbedding } = require('../services/ai/ragService');

const Booking = require('../models/booking.schema.js'); 
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

module.exports = {
  getCompanionSchedule,
  updateCompanionProfile
};