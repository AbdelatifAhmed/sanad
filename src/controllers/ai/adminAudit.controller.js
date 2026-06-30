const Review = require("../../models/reviews.schema");
const Companion = require("../../models/companion.schema");
const auditAgent = require("../../services/ai/agents/auditAgent");

/**
 * Audit recent reviews for the Angular Admin dashboard.
 * GET /api/ai/admin/analyze-reviews
 */
const analyzeReviews = async (req, res) => {
  try {
    const lang = req.lang || "ar";
    
    // Fetch last 50 reviews and populate family & companion users
    const reviews = await Review.find()
      .populate("familyId", "name email")
      .populate({
        path: "companionId",
        populate: { path: "userId", select: "name email" }
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    if (reviews.length === 0) {
      return res.status(200).json({
        status: "success",
        results: 0,
        data: []
      });
    }

    // Process batch audit using the sub-agent
    const auditedResults = await auditAgent.batchAuditReviews(reviews);

    // Map audit reports back into original reviews data for dashboard convenience
    const payload = reviews.map((rev, index) => {
      const audit = auditedResults[index] || {};
      return {
        ...rev,
        sentimentScore: audit.sentimentScore,
        alertLevel: audit.alertLevel,
        flaggedViolations: audit.flaggedViolations,
        auditSummary: audit.auditSummary
      };
    });

    return res.status(200).json({
      status: "success",
      results: payload.length,
      data: payload
    });

  } catch (error) {
    console.error("Error in analyzeReviews controller:", error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

/**
 * Automate caregiver credentials alignment verification.
 * POST /api/ai/admin/auto-verify-docs
 */
const autoVerifyDocs = async (req, res) => {
  try {
    const lang = req.lang || "ar";
    const { companionId } = req.body;

    if (!companionId) {
      return res.status(400).json({
        status: "fail",
        message: lang === "en" ? "Companion ID is required" : "معرّف المرافق مطلوب"
      });
    }

    // Fetch companion details and documents
    const companion = await Companion.findById(companionId)
      .populate("userId", "name phone email location");

    if (!companion) {
      return res.status(404).json({
        status: "fail",
        message: lang === "en" ? "Companion profile not found" : "الملف الشخصي للمرافق غير موجود"
      });
    }

    // Invoke automated verification match
    const verificationReport = await auditAgent.autoVerifyDocuments(companion);

    // If verification succeeded automatically, update companion status in DB
    if (verificationReport.status === "verified" || verificationReport.status === "rejected") {
      companion.verificationStatus = verificationReport.status;
      await companion.save();
    }

    return res.status(200).json({
      status: "success",
      data: {
        companionId: companion._id,
        verificationStatus: companion.verificationStatus,
        alignmentCheck: verificationReport
      }
    });

  } catch (error) {
    console.error("Error in autoVerifyDocs controller:", error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

module.exports = {
  analyzeReviews,
  autoVerifyDocs
};
