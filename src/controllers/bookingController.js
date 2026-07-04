const mongoose = require('mongoose');
const Booking = require('../models/booking.schema');
const Companion = require('../models/companion.schema');
const Payment = require('../models/payment.schema');
const { sendNotification } = require('../services/notificationService');
const bookingService = require("../services/bookingService");
const { getSocketIds } = require("../utils/socketManager");
const Family = require('../models/family.schema');
const User = require('../models/user.schema');
const { hasBookingConflict, hasComprehensiveConflict } = require("../utils/checkConflict");
const messages = require("../utils/messages");
const createBooking = async (req, res) => {
  try {
    const lang = req.lang || "en";
    if (!req.user || req.user.role !== 'family') {
      return res.status(403).json({ error: messages.booking.accessDeniedFamilyOnly[lang] });
    }

    const familyId = req.user._id;
    const {
      companionId,
      beneficiaryId,
      notes,
      taskList,
      totalHours,
      schedule,
      location
    } = req.body;

    if (!companionId || !beneficiaryId || totalHours === undefined || !schedule) {
      return res.status(400).json({ error: messages.booking.missingFields[lang] });
    }

    if (!mongoose.Types.ObjectId.isValid(companionId) || !mongoose.Types.ObjectId.isValid(beneficiaryId)) {
      return res.status(400).json({ error: messages.common.invalidId[lang] });
    }

    if (typeof totalHours !== 'number' || totalHours <= 0) {
      return res.status(400).json({ error: messages.booking.invalidHours[lang] });
    }

    if (!Array.isArray(schedule) || schedule.length === 0) {
      return res.status(400).json({ error: messages.booking.invalidSchedule[lang] });
    }

    const daysMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const extractedWorkingDays = new Set();
    let minDate = new Date(schedule[0].date);
    let maxDate = new Date(schedule[0].date);

    for (const item of schedule) {
      if (!item.date || !item.startTime || !item.endTime) {
        return res.status(400).json({ error: messages.booking.invalidSchedule[lang] });
      }
      
      const itemDate = new Date(item.date);
      extractedWorkingDays.add(daysMap[itemDate.getDay()]);

      if (itemDate < minDate) minDate = itemDate;
      if (itemDate > maxDate) maxDate = itemDate;
    }

    const workingDaysArray = Array.from(extractedWorkingDays);

    const familyProfile = await Family.findOne({ familyId });
    if (!familyProfile) {
      return res.status(404).json({ error: messages.booking.profileNotFound[lang] });
    }

    const beneficiaryExists = familyProfile.beneficiaries.some(
      (b) => b._id.toString() === beneficiaryId.toString()
    );
    if (!beneficiaryExists) {
      return res.status(404).json({ error: messages.booking.beneficiaryNotFound[lang] });
    }

    const companionUser = await User.findById(companionId);
    if (!companionUser || companionUser.role !== 'companion') {
      return res.status(404).json({ error: messages.booking.companionNotFound[lang] });
    }

    const companionProfile = await Companion.findOne({ userId: companionId });
    if (!companionProfile) {
      return res.status(404).json({ error: messages.booking.companionNotFound[lang] });
    }

    if (companionProfile.verificationStatus !== 'verified') {
      return res.status(400).json({ error: messages.booking.companionNotVerified[lang] });
    }

    const rate = companionProfile.hourlyRate;
    if (rate === undefined || rate === null) {
      return res.status(400).json({ error: messages.booking.companionNotFound[lang] });
    }

    // Escrow balance validation check
    const totalCost = totalHours * rate * 1.10; // includes 10% admin fee
    if ((familyProfile.walletBalance || 0) < totalCost) {
      return res.status(400).json({
        error: lang === "en"
          ? "Your current balance is insufficient. Please charge your wallet first before requesting the service."
          : "رصيدك الحالي لا يكفي، برجاء شحن المحفظة أولاً قبل طلب الخدمة"
      });
    }

    const isBusy = await hasComprehensiveConflict(
      companionId,
      schedule
    );

    if (isBusy) {
      return res.status(400).json({ 
        error: messages.booking.conflict[lang] 
      });
    }

    let resolvedSchedule = schedule;
    if (Array.isArray(taskList) && taskList.length > 0) {
      resolvedSchedule = schedule.map(item => {
        const itemTasks = item.tasksList || [];
        if (itemTasks.length === 0) {
          return {
            ...item,
            tasksList: taskList.map(t => {
              if (typeof t === 'string') return { title: t, taskDescription: t, isCompleted: false };
              if (typeof t === 'object' && t !== null) {
                return {
                  title: t.title || t.taskDescription || t.description || '',
                  taskDescription: t.taskDescription || t.description || t.title || '',
                  isCompleted: !!t.isCompleted
                };
              }
              return t;
            })
          };
        }
        return item;
      });
    }

    const newBooking = new Booking({
      familyId,
      companionId,
      beneficiaryId,
      jobPostId: null, 
      hourlyRateAtBooking: rate,
      totalHours,
      totalPrice: 0, 
      startDate: minDate,
      endDate: maxDate,
      workingDays: workingDaysArray, 
      schedule: resolvedSchedule,
      notes,
      status: 'pending',
      location
    });

    const savedBooking = await newBooking.save();
    // Notify companion about new direct booking request
    try {
      await sendNotification(
        companionId,
        familyId,
        lang === 'en' ? 'New Booking Request' : 'طلب حجز جديد',
        lang === 'en'
          ? `You have a new booking request from ${familyProfile.name || 'a family'}.` 
          : `لديك طلب حجز جديد من العائلة.`,
        'booking',
        req.io
      );
    } catch (err) {
      console.error('Failed to send booking notification:', err.message);
    }
    return res.status(201).json({
      message: messages.booking.successCreated[lang],
      booking: savedBooking
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
    if (error.name === 'CastError') return res.status(400).json({ error: `Invalid field: ${error.path}` });
    return res.status(500).json({ error: messages.common.serverError[req.lang || "en"] });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { status } = req.body;
    const bookingId = req.params.id;

    if (!status) {
      return res.status(400).json({ error: messages.booking.statusRequired[lang] });
    }

    const validStatuses = ['pending',"pending_payment", 'approved', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: messages.booking.invalidStatus[lang] });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: messages.review.bookingNotFound[lang] });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'family' && req.user.role !== 'companion') {
      return res.status(403).json({ error: messages.booking.updateStatusRoleLimit[lang] });
    }

    if (req.user.role === 'family') {
      if (booking.familyId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: messages.booking.updateStatusDenied[lang] });
      }
      if (status !== 'cancelled' && status !== 'completed') {
        return res.status(400).json({ error: messages.booking.updateStatusRoleLimit[lang] });
      }
    }

    if (req.user.role === 'companion') {
      if (booking.companionId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: messages.booking.updateStatusDenied[lang] });
      }
      if (!['approved', 'active', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: messages.booking.updateStatusRoleLimit[lang] });
      }
    }

    if (req.user.role !== 'admin') {
      const validTransitions = {
        pending: ['pending_payment', 'approved', 'cancelled'],
        pending_payment: ['approved', 'cancelled'],
        approved: ['active', 'cancelled'],
        active: ['completed', 'cancelled'],
        completed: [],
        cancelled: []
      };
      
      const allowedNext = validTransitions[booking.status] || [];
      if (!allowedNext.includes(status) && booking.status !== status) {
        return res.status(400).json({ error: messages.booking.invalidTransition[lang] });
      }
    }

    if (status === 'approved' && booking.status === 'pending') {
      const isBusyNow = await hasComprehensiveConflict(
        booking.companionId,
        booking.schedule,
        booking._id
      );

      if (isBusyNow) {
        return res.status(400).json({ 
          error: messages.booking.conflict[lang]
        });
      }
    }

    booking.status = status;
    const updatedBooking = await booking.save();

    // Notify relevant parties about status update
    try {
      const otherParty = req.user.role === 'family' ? updatedBooking.companionId : updatedBooking.familyId;
      await sendNotification(
        otherParty,
        req.user._id,
        lang === 'en' ? 'Booking Status Updated' : 'تم تحديث حالة الحجز',
        lang === 'en'
          ? `Booking ${updatedBooking._id} status changed to ${status}.`
          : `تم تغيير حالة الحجز إلى ${status}.`,
        'booking',
        req.io
      );
    } catch (err) {
      console.error('Failed to send booking status notification:', err.message);
    }

    // If booking completed and payment was already made, release payout to companion
    try {
      if (status === 'completed' && updatedBooking.paymentStatus === 'paid') {
        const payment = await Payment.findOne({ bookingId: updatedBooking._id });
        if (payment && payment.status === 'paid' && !payment.payoutReleased) {
          payment.payoutReleased = true;
          payment.payoutTransactionId = 'payout_' + Math.random().toString(36).substr(2, 9).toUpperCase();
          payment.payoutDate = new Date();
          await payment.save();

          if (typeof sendNotification === 'function') {
            await sendNotification(
              updatedBooking.companionId,
              req.user._id,
              lang === 'en' ? 'Payout Released' : 'تم صرف المبلغ',
              lang === 'en'
                ? `Your payout for booking ${updatedBooking._id} has been released.`
                : `تم صرف أجر الحجز ${updatedBooking._id}.`,
              'payment',
              req.io
            );
          }
        }
      }
    } catch (err) {
      console.error('Error releasing payout after completion:', err);
    }

    return res.status(200).json({
      message: messages.booking.statusUpdated[lang],
      booking: updatedBooking
    });

  } catch (error) {
    console.error('Error updating booking status:', error);
    if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
    if (error.name === 'CastError') return res.status(400).json({ error: `Invalid field: ${error.path}` });
    return res.status(500).json({ error: messages.common.serverError[req.lang || "en"] });
  }
};

const checkIn = async (req, res) => {
    try {
        const lang = req.lang || "en";
        const { id } = req.params; // Booking ID
        const { scheduleId, lat, lng, passcode } = req.body;
        const companionId = req.user._id;

        const result = await bookingService.checkIn(id, scheduleId, companionId, { lat, lng, passcode });

        await sendNotification(
            result.familyId,
            companionId,                            
            lang === "en" ? "Companion Arrival" : "حضور المرافق",                        
            lang === "en" ? "The companion has arrived at the care site and started the visit." : "وصل المرافق الآن إلى موقع الرعاية وبدأ الزيارة الحالية.", 
            "booking",                             
            req.io                                 
        );

        if (req.io) {
            const scheduleItem = result.booking.schedule.id(scheduleId);
            req.io.to(`booking_${id}`).emit("check_in", {
                bookingId: id,
                scheduleId,
                checkInTime: scheduleItem ? scheduleItem.checkInTime : new Date()
            });
        }

        return res.status(200).json({
            status: "success",
            message: messages.booking.checkInSuccess[lang],
            data: { booking: result.booking },
        });
    } catch (error) {
        console.error("Error in checkIn controller:", error);
        const lang = req.lang || "en";
        let errMsg = error.message;
        if (errMsg === "Booking not found") errMsg = messages.review.bookingNotFound[lang];
        else if (errMsg === "Not authorized to check-in for this booking") errMsg = messages.booking.notAuthorizedCheckInOut[lang];
        else if (errMsg === "Cannot check-in. Payment must be completed before check-in.") {
            errMsg = lang === "ar" ? "يجب إتمام عملية الدفع قبل تسجيل الحضور." : "Payment must be completed before check-in.";
        }
        else if (errMsg.startsWith("Cannot check-in")) errMsg = messages.booking.bookingCompletedOrCancelled[lang];
        else if (errMsg === "Schedule day not found") errMsg = messages.booking.scheduleNotFound[lang];
        else if (errMsg === "Already checked in for this schedule day") errMsg = messages.booking.checkInConflict[lang];

        return res.status(400).json({ status: "fail", message: errMsg });
    }
};

const checkOut = async (req, res) => {
    try {
        const lang = req.lang || "en";
        const { id } = req.params;
        const { scheduleId } = req.body;
        const companionId = req.user._id;

        const result = await bookingService.checkOut(id, scheduleId, companionId);

        await sendNotification(
            result.familyId,
            companionId,
            lang === "en" ? "Companion Departure" : "انصراف المرافق",
            lang === "en" ? "The companion has left the care site. The session ended successfully." : "غادر المرافق موقع الرعاية وانتهت جلسة العمل بنجاح.",
            "booking",
            req.io
        );

        if (req.io) {
            const scheduleItem = result.booking.schedule.id(scheduleId);
            req.io.to(`booking_${id}`).emit("check_out", {
                bookingId: id,
                scheduleId,
                checkOutTime: scheduleItem ? scheduleItem.checkOutTime : new Date(),
                isBookingCompleted: result.status === 'completed'
            });
        }

        return res.status(200).json({
            status: "success",
            message: messages.booking.checkOutSuccess[lang],
            data: { booking: result.booking },
        });
    } catch (error) {
        console.error("Error in checkOut controller:", error);
        const lang = req.lang || "en";
        let errMsg = error.message;
        if (errMsg === "Booking not found") errMsg = messages.review.bookingNotFound[lang];
        else if (errMsg === "Not authorized to check-out for this booking") errMsg = messages.booking.notAuthorizedCheckInOut[lang];
        else if (errMsg === "Schedule day not found") errMsg = messages.booking.scheduleNotFound[lang];
        else if (errMsg === "Must check in first before checking out") errMsg = messages.booking.checkOutBeforeIn[lang];
        else if (errMsg === "Already checked out for this schedule day") errMsg = messages.booking.checkOutConflict[lang];

        return res.status(400).json({ status: "fail", message: errMsg });
    }
};

const getCompanionRequests = async (req, res) => {
  try {
    const lang = req.lang || "en";
    if (req.user.role !== 'companion') {
      return res.status(403).json({ error: messages.booking.updateStatusRoleLimit[lang] });
    }

    const pendingBookings = await Booking.find({
      companionId: req.user._id,
      status: 'pending'
    })
    .populate('familyId', 'name email phone avatar') 
    .sort({ createdAt: -1 }); 

    return res.status(200).json({
      status: 'success',
      results: pendingBookings.length,
      data: {
        bookings: pendingBookings
      }
    });
  } catch (error) {
    console.error('Error fetching companion pending requests:', error);
    return res.status(500).json({ error: messages.common.serverError[req.lang || "en"], message: error.message });
  }
};

const respondToBooking = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { id } = req.params;
    const { action } = req.body;

    if (req.user.role !== 'companion') {
      return res.status(403).json({ error: messages.booking.updateStatusRoleLimit[lang] });
    }

    if (!action || !['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: messages.proposal.invalidAction[lang] });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: messages.review.bookingNotFound[lang] });
    }

    if (booking.companionId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: messages.booking.updateStatusDenied[lang] });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ error: messages.proposal.proposalProcessed[lang] });
    }

    if (action === 'accept') {
      const isBusyNow = await hasComprehensiveConflict(
        booking.companionId,
        booking.schedule,
        booking._id
      );

      if (isBusyNow) {
        return res.status(400).json({ 
          error: messages.booking.conflict[lang]
        });
      }
    }

    booking.status = action === 'accept' ? 'pending_payment' : 'cancelled';
    const updatedBooking = await booking.save();
   
    if (typeof sendNotification === 'function') {
      await sendNotification(
        booking.familyId,
        req.user._id,
        messages.booking.bookingUpdatedNotification[lang],
        messages.booking.bookingNotificationText[lang] + ` (${action === 'accept' ? 'Accepted (Pending Payment)' : 'Declined'})`,
        'booking',
        req.io,
      );
    }

    return res.status(200).json({
      status: 'success',
      message: `Booking request has been successfully ${action === 'accept' ? 'accepted' : 'declined'}.`,
      data: {
        booking: updatedBooking
      }
    });
  } catch (error) {
    console.error('Error responding to booking:', error);
    return res.status(500).json({ error: messages.common.serverError[req.lang || "en"], message: error.message });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { id, scheduleId, taskId } = req.params;
    const { isCompleted } = req.body;
    const companionId = req.user._id;

    if (isCompleted === undefined) {
      return res.status(400).json({ error: messages.booking.taskStatusRequired[lang] });
    }

    if (req.user.role !== 'companion') {
      return res.status(403).json({ error: messages.booking.updateStatusRoleLimit[lang] });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: messages.review.bookingNotFound[lang] });
    }

    if (booking.companionId.toString() !== companionId.toString()) {
      return res.status(403).json({ error: messages.booking.updateStatusDenied[lang] });
    }

    const updatedBooking = await Booking.findOneAndUpdate(
      { 
        _id: id,
        "schedule._id": scheduleId 
      },
      {
        $set: { "schedule.$[sched].tasksList.$[task].isCompleted": isCompleted }
      },
      {
        arrayFilters: [
          { "sched._id": scheduleId },
          { "task._id": taskId }
        ],
        new: true
      }
    );

    if (!updatedBooking) {
      return res.status(404).json({ error: messages.booking.bookingOrScheduleNotFound[lang] });
    }

    // Emit real-time WebSocket event
    if (req.io) {
      const roomName = `booking_${id}`;
      req.io.to(roomName).emit('task_updated', {
        bookingId: id,
        scheduleId,
        taskId,
        isCompleted
      });
      console.log(`Socket broadcast: task_updated to room ${roomName} for task ${taskId}`);
    }

    return res.status(200).json({
      status: "success",
      message: messages.booking.taskStatusUpdated[lang],
      data: { booking: updatedBooking }
    });

  } catch (error) {
    console.error("Error updating task status:", error);
    return res.status(500).json({ error: messages.common.serverError[req.lang || "en"], message: error.message });
  }
};

const getBookingById = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: messages.common.invalidId[lang] });
    }

    const booking = await Booking.findById(id)
      .populate("companionId", "name phone email avatar role location")
      .populate("familyId", "name phone email avatar role location");

    if (!booking) {
      return res.status(404).json({ error: messages.review.bookingNotFound[lang] });
    }

    // Security: Only allow the family, companion, or admin to access this booking
    const userId = req.user._id.toString();
    const isAuthorized = 
      req.user.role === 'admin' || 
      booking.familyId._id.toString() === userId || 
      booking.companionId._id.toString() === userId;

    if (!isAuthorized) {
      return res.status(403).json({ error: messages.common.forbidden[lang] });
    }

    // Fetch family profile to get beneficiary details
    let beneficiary = null;
    try {
      const familyProfile = await Family.findOne({ familyId: booking.familyId._id });
      if (familyProfile && familyProfile.beneficiaries) {
        beneficiary = familyProfile.beneficiaries.find(
          (b) => b._id.toString() === booking.beneficiaryId.toString()
        );
      }
    } catch (err) {
      console.error("Failed to fetch beneficiary details:", err);
    }

    return res.status(200).json({
      status: "success",
      data: {
        ...booking.toObject(),
        beneficiary
      }
    });
  } catch (error) {
    console.error("Error fetching booking details:", error);
    return res.status(500).json({ error: messages.common.serverError[req.lang || "en"], message: error.message });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { status } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.user.role === 'family') {
      query.familyId = req.user._id;
    } else if (req.user.role === 'companion') {
      query.companionId = req.user._id;
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: messages.common.forbidden[lang] });
    }

    if (status) {
      const validStatuses = ['pending', 'pending_payment', 'approved', 'active', 'completed', 'cancelled'];
      if (validStatuses.includes(status)) {
        query.status = status;
      }
    }

    const bookings = await Booking.find(query)
      .populate("companionId", "name phone email avatar role")
      .populate("familyId", "name phone email avatar role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Booking.countDocuments(query);

    return res.status(200).json({
      status: "success",
      results: bookings.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        bookings
      }
    });
  } catch (error) {
    console.error("Error fetching my bookings:", error);
    return res.status(500).json({ error: messages.common.serverError[req.lang || "en"], message: error.message });
  }
};

const fileComplaint = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { id } = req.params;
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({
        status: "error",
        message: lang === "ar" ? "تفاصيل الشكوى مطلوبة" : "Description is required"
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        status: "error",
        message: lang === "ar" ? "لم يتم العثور على هذا الحجز" : "Booking not found"
      });
    }

    // Verify authorized user (only family of this booking can file complaints)
    if (req.user.role !== "admin" && booking.familyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: "error",
        message: messages.common.forbidden[lang]
      });
    }

    booking.complaints = booking.complaints || [];
    booking.complaints.push({ description });
    await booking.save();

    return res.status(200).json({
      status: "success",
      message: lang === "ar" ? "تم تسجيل الشكوى بنجاح" : "Complaint registered successfully"
    });
  } catch (error) {
    console.error("Error filing complaint:", error);
    return res.status(500).json({
      status: "error",
      message: messages.common.serverError[req.lang || "en"]
    });
  }
};

module.exports = {
    createBooking,
    updateBookingStatus,
    checkIn,
    checkOut,
    getCompanionRequests,
    respondToBooking,
    updateTaskStatus,
    getBookingById,
    getMyBookings,
    fileComplaint
};
