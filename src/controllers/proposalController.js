const Proposal = require("../models/proposal.schema");
const JobPost = require("../models/jobPost.schema");
const Booking = require("../models/booking.schema"); 
const { hasBookingConflict } = require("../utils/checkConflict"); 
const sendProposal = async (req, res) => {
 try {
    const { jobPostId, proposedRate, coverLetter } = req.body;

    if (!jobPostId || !proposedRate || !coverLetter) {
      return res.status(400).json({ status: "fail", message: "جميع حقول العرض مطلوبة" });
    }

    const jobPost = await JobPost.findById(jobPostId);
    if (!jobPost) {
      return res.status(404).json({ status: "fail", message: "هذا الطلب غير موجود" });
    }
    if (jobPost.status !== "open") {
      return res.status(400).json({ status: "fail", message: "عذراً، هذا الطلب لم يعد يستقبل عروضاً" });
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
        message: "عذراً، لا يمكنك التقديم على هذا الطلب لوجود تعارض مع مواعيد حجوزاتك المؤكدة الحالية."
      });
    }

    const newProposal = await Proposal.create({
      jobPostId,
      companionId: req.user._id,
      proposedRate,
      coverLetter,
    });

    return res.status(201).json({
      status: "success",
      message: "تم تقديم عرضك بنجاح لعدم وجود أي تعارض في مواعيدك!",
      data: { proposal: newProposal },
    });
  } catch (error) {
    console.error("Error submitting proposal:", error);
    if (error.code === 11000) {
      return res.status(409).json({ status: "fail", message: "لقد قمت بتقديم عرض على هذا الطلب بالفعل سابقاً" });
    }
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const getProposalsForJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const jobPost = await JobPost.findById(jobId);
    if (!jobPost) {
      return res.status(404).json({ status: "fail", message: "هذا الطلب غير موجود" });
    }

    if (jobPost.familyId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ status: "fail", message: "غير مسموح لك بالاطلاع على عروض هذا الطلب" });
    }

    const proposals = await Proposal.find({ jobPostId: jobId })
      .populate({
        path: "companionId", 
        select: "name phone email location avatar averageRating", 
      })
      .sort({ createdAt: -1 })
      .lean(); 

    
    const updatedProposals = await Promise.all(
      proposals.map(async (proposal) => {
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






const generateScheduleDates = (workingDays, startTime, endTime, durationInWeeks, tasksFromJob) => {
  const schedule = [];
  const start = new Date(); 
  
  const daysMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
  const targetDayNumbers = workingDays.map(day => daysMap[day]);

  const totalDaysToScan = durationInWeeks * 7;
  
  لهف 
  const formattedTasks = tasksFromJob && tasksFromJob.length > 0 
    ? tasksFromJob.map(task => ({ taskDescription: task, isCompleted: false }))
    : [{ taskDescription: "رعاية الحالة العامة ومتابعة المواعيد", isCompleted: false }];

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
  try {
    const { proposalId } = req.params;
    const { status } = req.body; 

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ status: "fail", message: "الحالة المرسلة غير صالحة" });
    }

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({ status: "fail", message: "هذا العرض غير موجود" });
    }

    const jobPost = await JobPost.findById(proposal.jobPostId);
    if (!jobPost) {
      return res.status(404).json({ status: "fail", message: "الطلب الأصلي غير موجود" });
    }

    if (jobPost.familyId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ status: "fail", message: "غير مسموح لك بالتحكم في هذا العرض" });
    }

    if (proposal.status !== "pending") {
      return res.status(400).json({ status: "fail", message: "تمت معالجة هذا العرض مسبقاً" });
    }

    if (status === "rejected") {
      proposal.status = "rejected";
      await proposal.save();
      return res.status(200).json({ status: "success", message: "تم رفض العرض بنجاح" });
    }

    if (status === "accepted") {
      if (jobPost.status !== "open") {
        return res.status(400).json({ status: "fail", message: "هذا الطلب تم إغلاقه بالفعل" });
      }

      const { workingDays, startTime, endTime, durationInWeeks } = jobPost.schedule;
      
      const tasksFromJob = jobPost.tasksList || req.body.tasksList; 

      const generatedSchedule = generateScheduleDates(workingDays, startTime, endTime, durationInWeeks, tasksFromJob);

      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      const hoursPerDay = (endHour + endMin/60) - (startHour + startMin/60);
      const totalHours = hoursPerDay * generatedSchedule.length;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + (durationInWeeks * 7));

      const newBooking = await Booking.create({
        familyId: jobPost.familyId,
        companionId: proposal.companionId,
        jobPostId: jobPost._id,
        beneficiaryId: jobPost.beneficiaryId || req.body.beneficiaryId || jobPost.familyId, 
        status: "approved",
        hourlyRateAtBooking: proposal.proposedRate,
        totalHours: Math.round(totalHours),
        totalPrice: 0, 
        startDate,
        endDate,
        workingDays,
        schedule: generatedSchedule,
        notes: jobPost.description
      });

      proposal.status = "accepted";
      await proposal.save();

      jobPost.status = "filled";
      await jobPost.save();

      await Proposal.updateMany(
        { jobPostId: jobPost._id, _id: { $ne: proposal._id }, status: "pending" },
        { status: "rejected" }
      );

      return res.status(200).json({
        status: "success",
        message: "تم قبول العرض بنجاح وتحويله لحجز رسمي ديناميكي بالكامل!",
        data: { proposal, booking: newBooking }
      });
    }

  } catch (error) {
    console.error("Error updating proposal status:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};


module.exports = {
  sendProposal,
  getProposalsForJob,
  updateProposalStatus
};