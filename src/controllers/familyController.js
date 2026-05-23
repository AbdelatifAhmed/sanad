const Family = require('../models/family.schema');

exports.updateFamilyProfile = async (req, res) => {
  const updatedFamily = await Family.findOneAndUpdate(
    { familyId: req.body.familyId },
    { address: req.body.address, beneficiaries: req.body.beneficiaries },
    { new: true, upsert: true }
  );
  res.status(200).json(updatedFamily);
};
