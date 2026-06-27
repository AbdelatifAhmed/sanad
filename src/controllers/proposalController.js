const Proposal = require("../models/proposal.schema");
const JobPost = require("../models/jobPost.schema");
const Booking = require("../models/booking.schema"); 
const Companion = require("../models/companion.schema");
const mongoose = require("mongoose");
const { hasBookingConflict } = require("../utils/checkConflict"); 
const messages = require("../utils/messages"); 
const { sendNotification } = require('../services/notificationService');
const { getFirstShiftStartDateTime } = require("../utils/jobExpiryTask");
const sendProposal = async (req, res) => {
 try {
    const lang = req.lang || "en";
    const { jobPostId, proposedRate, coverLetter } = req.body;

    if (!jobPostId || !proposedRate || !coverLetter) {
      return res.status(400).json({ status: "fail", message: messages.proposal.missingFields[lang] });
    }

    const jobPost = await JobPost.findById(jobPostId);
    if (!jobPost) {
      return res.status(404).json({ status: "fail", message: messages.proposal.jobNotFound[lang] });
    }
    if (jobPost.status !== "open") {
      return res.status(400).json({ status: "fail", message: messages.proposal.jobNotOpen[lang] });
    }

    const newStartDate = new Date();
    const newEndDate = new Date();
    newEndDate.setDate(newStartDate.getDate() + (jobPost.schedule.durationInWeeks * 7));
    
    const { workingDays, startTime, endTime } = jobPost.schedule;

    const isBusy = await hasBookingConflict(
      req.user._id, 
      newStartDate,
      newEndDate,
      workingDays,
      startTime,
      endTime
    );

    if (isBusy) {
      return res.status(400).json({
        status: "fail",
        message: messages.proposal.proposalConflict[lang]
      });
    }

    const newProposal = await Proposal.create({
      jobPostId,
      companionId: req.user._id,
      proposedRate,
      coverLetter,
      taskList: jobPost.taskList || []
    });

    // Notify job owner (family) about new proposal
    try {
      await sendNotification(
        jobPost.familyId,
        req.user._id,
        lang === 'en' ? 'New Proposal Submitted' : 'تم تقديم عرض جديد',
        lang === 'en'
          ? `A companion has submitted a proposal for your job post: ${jobPost.title}`
          : `لقد تم تقديم عرض على طلب العمل الخاص بك: ${jobPost.title}`,
        'proposal',
        req.io
      );
    } catch (err) {
      console.error('Failed to send proposal notification:', err.message);
    }

    return res.status(201).json({
      status: "success",
      message: messages.proposal.successSubmitted[lang],
      data: { proposal: newProposal },
    });
  } catch (error) {
    console.error("Error submitting proposal:", error);
    if (error.code === 11000) {
      return res.status(409).json({ status: "fail", message: messages.proposal.duplicateProposal[lang] });
    }
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const getProposalsForJob = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { jobId } = req.params;

    const jobPost = await JobPost.findById(jobId);
    if (!jobPost) {
      return res.status(404).json({ status: "fail", message: messages.proposal.jobNotFound[lang] });
    }

    if (jobPost.familyId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ status: "fail", message: messages.proposal.unauthorizedProposalView[lang] });
    }

    const proposals = await Proposal.find({ jobPostId: jobId })
      .populate({
        path: "companionId", 
        select: "name phone email location avatar",
      })
      .sort({ createdAt: -1 })
      .lean(); 

    const validProposals = proposals.filter(p => p.companionId);

    const updatedProposals = await Promise.all(
      validProposals.map(async (proposal) => {
        try {
          const companionProfile = await Companion.findOne({ userId: proposal.companionId._id })
            .select("rating companionType specialization reviewCount");
          
          proposal.companionId.averageRating = companionProfile ? companionProfile.rating : 4.5;
          proposal.companionId.companionType = companionProfile ? companionProfile.companionType : "general";
          proposal.companionId.specialization = companionProfile ? companionProfile.specialization : "none";
          proposal.companionId.reviewCount = companionProfile ? companionProfile.reviewCount : 0;

          if (proposal.status === "pending") {
            const newStartDate = new Date();
            const newEndDate = new Date();
            newEndDate.setDate(newStartDate.getDate() + (jobPost.schedule.durationInWeeks * 7));
            
            const { workingDays, startTime, endTime } = jobPost.schedule;

            const isBusyNow = await hasBookingConflict(
              proposal.companionId._id,
              newStartDate,
              newEndDate,
              workingDays,
              startTime,
              endTime
            );

            proposal.isConflicting = isBusyNow;
          } else {
            proposal.isConflicting = false;
          }
        } catch (err) {
          console.error(`Error processing companion details for proposal ${proposal._id}:`, err);
          proposal.isConflicting = false;
          if (proposal.companionId) {
            proposal.companionId.averageRating = 4.5;
            proposal.companionId.companionType = "general";
            proposal.companionId.specialization = "none";
            proposal.companionId.reviewCount = 0;
          }
        }
        return proposal;
      })
    );

    return res.status(200).json({
      status: "success",
      results: updatedProposals.length,
      data: { proposals: updatedProposals },
    });
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};





const generateScheduleDates = (workingDays, startTime, endTime, durationInWeeks, tasksFromJob, baseStartDate) => {
  const schedule = [];
  const start = new Date(baseStartDate || new Date()); 
  
  const daysMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
  const targetDayNumbers = workingDays.map(day => daysMap[day]);

  const totalDaysToScan = durationInWeeks * 7;
  
  const formattedTasks = tasksFromJob && tasksFromJob.length > 0 
    ? tasksFromJob.map(task => ({ title: task, taskDescription: task, isCompleted: false }))
    : [{ title: "رعاية الحالة العامة ومتابعة المواعيد", taskDescription: "رعاية الحالة العامة ومتابعة المواعيد", isCompleted: false }];

  for (let i = 0; i < totalDaysToScan; i++) {
    const currentCheckDate = new Date(start);
    currentCheckDate.setDate(start.getDate() + i);
    
    if (targetDayNumbers.includes(currentCheckDate.getDay())) {
      schedule.push({
        date: currentCheckDate,
        startTime,
        endTime,
        tasksList: formattedTasks 
      });
    }
  }
  return schedule;
};

const updateProposalStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const lang = req.lang || "en";
    const { proposalId } = req.params;
    const { status } = req.body; 

    if (!["accepted", "rejected"].includes(status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ status: "fail", message: messages.proposal.invalidAction[lang] });
    }

    const proposal = await Proposal.findById(proposalId).session(session);
    if (!proposal) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ status: "fail", message: messages.common.notFound[lang] });
    }

    const jobPost = await JobPost.findById(proposal.jobPostId).session(session);
    if (!jobPost) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ status: "fail", message: messages.proposal.jobNotFound[lang] });
    }

    if (jobPost.familyId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ status: "fail", message: messages.proposal.unauthorizedProposalView[lang] });
    }

    if (proposal.status !== "pending") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ status: "fail", message: messages.proposal.proposalProcessed[lang] });
    }

    if (status === "rejected") {
      proposal.status = "rejected";
      await proposal.save({ session });
      await session.commitTransaction();
      session.endSession();

      // Notify companion about rejection
      try {
        await sendNotification(
          proposal.companionId,
          req.user._id,
          lang === 'en' ? 'Proposal Rejected' : 'تم رفض العرض',
          lang === 'en'
            ? `Your proposal for job ${jobPost.title} has been rejected.`
            : `تم رفض عرضك على طلب العمل ${jobPost.title}.`,
          'proposal',
          req.io
        );
      } catch (err) {
        console.error('Failed to notify proposal rejection:', err.message);
      }
      return res.status(200).json({ status: "success", message: messages.proposal.proposalRejected[lang] });
    }

    if (status === "accepted") {
      if (jobPost.status !== "open") {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ status: "fail", message: messages.proposal.jobNotOpen[lang] });
      }

      // Enforce 6-Hour Safety Margin Rule
      const firstShiftStart = getFirstShiftStartDateTime(
        jobPost.startDate || jobPost.createdAt,
        jobPost.schedule.workingDays,
        jobPost.schedule.startTime
      );
      const now = new Date();
      const diffHours = (firstShiftStart.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (diffHours < 6) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          status: "fail",
          message: lang === "en"
            ? "Safety rule check failed: The shift starts in less than 6 hours."
            : "فشل التحقق من قاعدة السلامة: تبدأ المناوبة خلال أقل من 6 ساعات."
        });
      }

      const { workingDays, startTime, endTime, durationInWeeks } = jobPost.schedule;
      
      const tasksFromJob = jobPost.taskList || proposal.taskList || []; 

      // Use jobPost.startDate for generatedSchedule
      const generatedSchedule = generateScheduleDates(workingDays, startTime, endTime, durationInWeeks, tasksFromJob, jobPost.startDate);

      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      const hoursPerDay = (endHour + endMin/60) - (startHour + startMin/60);
      const totalHours = hoursPerDay * generatedSchedule.length;

      const startDate = new Date(jobPost.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + (durationInWeeks * 7));

      const [newBooking] = await Booking.create([{
        familyId: jobPost.familyId,
        companionId: proposal.companionId,
        jobPostId: jobPost._id,
        beneficiaryId: jobPost.beneficiaryId, 
        status: "pending_payment",
        hourlyRateAtBooking: proposal.proposedRate,
        totalHours: Math.round(totalHours),
        totalPrice: 0, 
        startDate,
        endDate,
        workingDays,
        schedule: generatedSchedule,
        notes: jobPost.description,
        paymentStatus: "unpaid",
      }]);

      proposal.status = "accepted";
      await proposal.save({ session });

      jobPost.status = "assigned";
      await jobPost.save({ session });

      // Reject all other pending proposals and notify those companions
      await Proposal.updateMany(
        { jobPostId: jobPost._id, _id: { $ne: proposal._id }, status: "pending" },
        { status: "rejected" },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      try {
        const rejected = await Proposal.find({ jobPostId: jobPost._id, status: 'rejected' }).lean();
        for (const p of rejected) {
          try {
            await sendNotification(
              p.companionId,
              req.user._id,
              lang === 'en' ? 'Proposal Rejected' : 'تم رفض العرض',
              lang === 'en'
                ? `Your proposal for job ${jobPost.title} was not selected.`
                : `عرضك على طلب العمل ${jobPost.title} لم يتم اختياره.`,
              'proposal',
              req.io
            );
          } catch (err) {
            console.error('Failed to notify rejected proposal companion:', err.message);
          }
        }
      } catch (err) {
        console.error('Failed to process rejected proposals notifications:', err.message);
      }

      // Notify accepted companion about acceptance and new booking
      try {
        await sendNotification(
          proposal.companionId,
          req.user._id,
          lang === 'en' ? 'Proposal Accepted' : 'تم قبول العرض',
          lang === 'en'
            ? `Your proposal for job ${jobPost.title} has been accepted. A booking was created.`
            : `تم قبول عرضك على طلب العمل ${jobPost.title} وتم إنشاء حجز.`,
          'proposal',
          req.io
        );
      } catch (err) {
        console.error('Failed to notify accepted companion:', err.message);
      }

      return res.status(200).json({
        status: "success",
        message: messages.proposal.proposalAccepted[lang],
        data: { proposal, booking: newBooking }
      });
    }

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error updating proposal status:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const getMyProposals = async (req, res) => {
  try {
    const lang = req.lang || "en";
    
    if (req.user.role !== "companion") {
      return res.status(403).json({ status: "fail", message: messages.common.forbidden[lang] });
    }

    const { status } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 6;
    const skip = (page - 1) * limit;

    const query = { companionId: req.user._id };
    if (status && ["pending", "accepted", "rejected"].includes(status)) {
      query.status = status;
    }

    // Get total counts for filters/stats cards
    const totalCount = await Proposal.countDocuments({ companionId: req.user._id });
    const pendingCount = await Proposal.countDocuments({ companionId: req.user._id, status: "pending" });
    const acceptedCount = await Proposal.countDocuments({ companionId: req.user._id, status: "accepted" });
    const rejectedCount = await Proposal.countDocuments({ companionId: req.user._id, status: "rejected" });

    const totalFiltered = await Proposal.countDocuments(query);
    const proposals = await Proposal.find(query)
      .populate({
        path: "jobPostId",
        populate: {
          path: "familyId",
          select: "name email phone avatar"
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      status: "success",
      data: {
        proposals,
        pagination: {
          total: totalFiltered,
          page,
          limit,
          pages: Math.ceil(totalFiltered / limit)
        },
        stats: {
          total: totalCount,
          pending: pendingCount,
          accepted: acceptedCount,
          rejected: rejectedCount
        }
      }
    });

  } catch (error) {
    console.error("Error fetching companion proposals:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  sendProposal,
  getProposalsForJob,
  updateProposalStatus,
  getMyProposals
};