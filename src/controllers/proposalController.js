const Proposal = require("../models/proposal.schema");
const JobPost = require("../models/jobPost.schema");
const Booking = require("../models/booking.schema"); 
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

    const newProposal = await Proposal.create({
      jobPostId,
      companionId: req.user._id, 
      proposedRate,
      coverLetter,
    });

    return res.status(201).json({
      status: "success",
      data: { proposal: newProposal },
    });
  } catch (error) {
    console.error("Error submitting proposal:", error);
    
    if (error.code === 11000) {
      return res.status(409).json({ 
        status: "fail", 
        message: "لقد قمت بتقديم عرض على هذا الطلب بالفعل سابقاً" 
      });
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
        select: "name phone email location",
      })
      // ملحوظة: لو عندك جدول لبروفايل المرافق المهني (CompanionProfile)، يمكنك عمل populate متداخل له هنا لجلب المهارات الثابتة والـ Bio
      /*
      .populate({
         path: "companionProfile", 
         populate: { path: "skills", select: "nameAr nameEn" }
      })
      */
      .sort({ createdAt: -1 }); 

    return res.status(200).json({
      status: "success",
      results: proposals.length,
      data: { proposals },
    });
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
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
      return res.status(404).json({ status: "fail", message: "الطلب الأصلي المتعلق بهذا العرض غير موجود" });
    }

    if (jobPost.familyId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ status: "fail", message: "غير مسموح لك بالتحكم في هذا العرض" });
    }

    if (proposal.status !== "pending") {
      return res.status(400).json({ status: "fail", message: "تمت معالجة هذا العرض مسبقاً بالفعل" });
    }

    
    if (status === "rejected") {
      proposal.status = "rejected";
      await proposal.save();

      return res.status(200).json({
        status: "success",
        message: "تم رفض العرض بنجاح",
        data: { proposal }
      });
    }

    
    if (status === "accepted") {

      if (jobPost.status !== "open") {
        return res.status(400).json({ status: "fail", message: "هذا الطلب تم إغلاقه أو تعيين مرافق آخر له بالفعل" });
      }

      proposal.status = "accepted";
      await proposal.save();

      jobPost.status = "filled";
      await jobPost.save();

      await Proposal.updateMany(
        { jobPostId: jobPost._id, _id: { $ne: proposal._id }, status: "pending" },
        { status: "rejected" }
      );

      const newBooking = await Booking.create({
        familyId: jobPost.familyId,
        companionId: proposal.companionId,
        jobPostId: jobPost._id,    
        ratePerHour: proposal.proposedRate,
        status: "confirmed",         
      });

      return res.status(200).json({
        status: "success",
        message: "تم قبول العرض، وإغلاق الطلب، وإنشاء الحجز الفعلي بنجاح!",
        data: {
          proposal,
          booking: newBooking
        }
      });
    }

  } catch (error) {
    console.error("Error updating proposal status:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  updateProposalStatus
};

module.exports = {
  sendProposal,
  getProposalsForJob,
  updateProposalStatus
};