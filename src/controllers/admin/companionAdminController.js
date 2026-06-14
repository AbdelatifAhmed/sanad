const Companion = require("../../models/companion.schema");
const messages = require("../../utils/messages");

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
      message: messages.common.serverError[req.lang || "en"],
      error: error.message
    });
  }
};

const verifyCompanion = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { id } = req.params;
    const { status } = req.body; 

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: messages.admin.invalidVerifyStatus[lang]
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
        message: messages.companion.profileNotFound[lang]
      });
    }

    return res.status(200).json({
      status: 'success',
      message: messages.admin.verifyCompanionSuccess[lang],
      data: {
        companion: updatedCompanion
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: messages.common.serverError[req.lang || "en"],
      error: error.message
    });
  }
};

module.exports = {
  getPendingCompanions,
  verifyCompanion
};
