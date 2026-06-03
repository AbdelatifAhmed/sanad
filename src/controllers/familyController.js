const Family = require('../models/family.schema');

exports.updateFamilyProfile = async (req, res) => {
  try {
    const { familyId, address, beneficiaries } = req.body;

    if (!familyId) {
      return res.status(400).json({ error: 'familyId is required' });
    }

    const updatedFamily = await Family.findOneAndUpdate(
      { familyId },
      { address, beneficiaries },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json(updatedFamily);
  } catch (error) {
    console.error('Error updating family profile:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: `Invalid field: ${error.path}` });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
