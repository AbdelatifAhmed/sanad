const Companion = require('../../models/Companion');


const getPendingCompanions = async (req, res) => {
  try {
    const pendingCompanions = await Companion.find({ verificationStatus: 'pending' })
      .populate('userId', 'name email phone');

    return res.status(200).json({
      status: 'success',
      results: pendingCompanions.length,
      data: {
        pendingCompanions
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Error happened while fetching pending companions',
      error: error.message
    });
  }
};


const verifyCompanion = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid status. Please provide either "verified" or "rejected".'
      });
    }

    const updatedCompanion = await Companion.findByIdAndUpdate(
      id,
      { verificationStatus: status },
      { new: true, runValidators: true }
    ).populate('userId', 'name email');

    if (!updatedCompanion) {
      return res.status(404).json({
        status: 'fail',
        message: 'Companion profile not found'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: `Companion profile updated to ${status === 'verified' ? 'verified' : 'rejected'}`,
      data: {
        companion: updatedCompanion
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Error happened while processing the verification request',
      error: error.message
    });
  }
};

module.exports = {
  getPendingCompanions,
  verifyCompanion
};