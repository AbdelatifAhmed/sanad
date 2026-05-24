const Companion = require('../models/companion.schema');

exports.updateCompanionProfile = async (req, res) => {
  try {
    const { userId, bio, hourlyRate, skills, hobbies, availability } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const updatedCompanion = await Companion.findOneAndUpdate(
      { userId },
      { bio, hourlyRate, skills, hobbies, availability },
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
