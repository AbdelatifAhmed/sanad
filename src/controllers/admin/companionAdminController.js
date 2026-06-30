const Companion = require("../../models/companion.schema");
const User = require("../../models/user.schema");
const Notification = require("../../models/notification.schema");
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

const getCompanions = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query = {};
    
    // Status filter
    if (status && status !== 'all') {
      query.verificationStatus = status;
    }
    
    // Search filter (name, email, phone)
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const matchingUsers = await User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex }
        ]
      }).select('_id');
      
      query.userId = { $in: matchingUsers.map(u => u._id) };
    }
    
    // Pagination parameters
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    // Sorting
    let sortQuery = {};
    if (sortBy === 'experience') {
      sortQuery = { totalWorkHours: sortOrder === 'asc' ? 1 : -1 };
    } else if (sortBy === 'status') {
      sortQuery = { verificationStatus: sortOrder === 'asc' ? 1 : -1 };
    } else {
      // Default: registration date (createdAt)
      sortQuery = { createdAt: sortOrder === 'asc' ? 1 : -1 };
    }
    
    const total = await Companion.countDocuments(query);
    
    const companions = await Companion.find(query)
      .populate('userId', 'name email phone avatar location createdAt')
      .populate('skills', 'nameAr nameEn category')
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNum);
      
    return res.status(200).json({
      status: 'success',
      results: companions.length,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      },
      data: {
        companions
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Server Error',
      error: error.message
    });
  }
};

const verifyCompanion = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { id } = req.params;
    const { status, rejectionReason, message } = req.body; 

    if (!['verified', 'rejected', 'under_review'].includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: messages.admin.invalidVerifyStatus ? messages.admin.invalidVerifyStatus[lang] : 'Invalid status'
      });
    }

    const updates = { verificationStatus: status };
    if (status === 'rejected') {
      updates.rejectionReason = rejectionReason || '';
      updates.requestMoreInfoMessage = '';
    } else if (status === 'under_review') {
      updates.requestMoreInfoMessage = message || '';
      updates.rejectionReason = '';
    } else {
      updates.rejectionReason = '';
      updates.requestMoreInfoMessage = '';
    }

    const updatedCompanion = await Companion.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('userId', 'name email');

    if (!updatedCompanion) {
      return res.status(404).json({
        status: 'fail',
        message: messages.companion.profileNotFound ? messages.companion.profileNotFound[lang] : 'Companion profile not found'
      });
    }

    // Create Notification for the caregiver
    try {
      const recipientId = updatedCompanion.userId._id || updatedCompanion.userId;
      const title = status === 'verified'
        ? 'Account Verified!'
        : (status === 'rejected' ? 'Application Rejected' : 'Additional Information Requested');
      
      const notificationMsg = status === 'verified'
        ? 'Congratulations! Your caregiver profile has been verified and is now active for bookings.'
        : (status === 'rejected'
          ? `Your application was rejected. Reason: ${rejectionReason || 'No reason specified'}`
          : `Admin requested more information: ${message || 'Please review your uploaded documents.'}`);

      await Notification.create({
        recipientId,
        senderId: req.user ? req.user._id : null,
        title,
        message: notificationMsg,
        type: 'system_alert'
      });
    } catch (notifError) {
      console.error('Failed to create caregiver notification:', notifError.message);
    }

    return res.status(200).json({
      status: 'success',
      message: messages.admin.verifyCompanionSuccess ? messages.admin.verifyCompanionSuccess[lang] : 'Verification status updated successfully',
      data: {
        companion: updatedCompanion
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: messages.common.serverError ? messages.common.serverError[req.lang || "en"] : 'Internal Server Error',
      error: error.message
    });
  }
};

module.exports = {
  getPendingCompanions,
  getCompanions,
  verifyCompanion
};
