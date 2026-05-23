const Companion = require('../models/companion.schema');

exports.updateCompanionProfile = async (req, res) => {
  const updatedCompanion = await Companion.findOneAndUpdate(
    { userId: req.body.userId },
    {
      bio: req.body.bio,
      hourlyRate: req.body.hourlyRate,
      skills: req.body.skills,
      hobbies: req.body.hobbies,
      availability: req.body.availability,
      companionType: req.body.companionType,
      specialization: req.body.specialization,
      documents: req.body.documents
    },
    { new: true, upsert: true }
  );
  res.status(200).json(updatedCompanion);
};
