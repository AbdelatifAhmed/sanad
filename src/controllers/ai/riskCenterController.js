const User = require("../../models/user.schema");
const SecurityAlert = require("../../models/securityAlert.schema");
const Review = require("../../models/reviews.schema");
const Booking = require("../../models/booking.schema");
const Companion = require("../../models/companion.schema");
const Notification = require("../../models/notification.schema");
const ActivityLog = require("../../models/activityLog.schema");
const mongoose = require("mongoose");

// Helper to calculate risk score
const calculateUserRiskScore = (chatViolationsCount, negativeReviewsCount, complaintsCount) => {
  if (chatViolationsCount === 0 && negativeReviewsCount === 0 && complaintsCount === 0) {
    return { score: 0, level: "Low" };
  }
  
  let score = (chatViolationsCount * 15) + (negativeReviewsCount * 10) + (complaintsCount * 20);
  
  const totalIncidents = chatViolationsCount + negativeReviewsCount + complaintsCount;
  if (totalIncidents > 1) {
    score += 15;
  }
  
  score = Math.min(score, 100);
  
  let level = "Low";
  if (score >= 85) level = "Critical";
  else if (score >= 60) level = "High";
  else if (score >= 30) level = "Medium";
  
  return { score, level };
};

// Helper to get recommended action based on risk level
const getRecommendedAction = (level) => {
  switch (level) {
    case "Critical":
      return "Suspend User";
    case "High":
      return "Warn User";
    case "Medium":
      return "Manual Review";
    default:
      return "No Action Needed";
  }
};

/**
 * GET /api/ai/admin/risk-center/summary
 */
const getSummary = async (req, res) => {
  try {
    const [totalAlertsCount, totalReviewsCount, totalComplaintsBookings] = await Promise.all([
      SecurityAlert.countDocuments(),
      Review.countDocuments(),
      Booking.find({ "complaints.0": { $exists: true } }).lean(),
    ]);

    const totalComplaintsCount = totalComplaintsBookings.reduce((acc, b) => acc + (b.complaints?.length || 0), 0);
    const totalScanned = totalAlertsCount + totalReviewsCount + totalComplaintsCount;

    // Active/Pending Alerts
    const [pendingAlerts, pendingReviews] = await Promise.all([
      SecurityAlert.countDocuments({ status: "pending_review" }),
      Review.countDocuments({ isVisible: true, rating: { $lte: 2 } }), // Negative visible reviews needing action
    ]);

    const activeAlerts = pendingAlerts + pendingReviews + totalComplaintsCount;

    // Calculate high-risk users count (risk score >= 60)
    // To do this efficiently, we fetch violations count grouped by user
    const [chatViolationsGroup, negativeReviewsGroup, complaintsBookings] = await Promise.all([
      SecurityAlert.aggregate([
        { $group: { _id: "$userId", count: { $sum: 1 } } }
      ]),
      Review.find({ rating: { $lte: 2 } })
        .populate({ path: "companionId", select: "userId" })
        .lean(),
      Booking.find({ "complaints.0": { $exists: true } }).lean()
    ]);

    // Map counts to user IDs
    const userRiskData = {};

    chatViolationsGroup.forEach(group => {
      const uid = group._id?.toString();
      if (uid) {
        userRiskData[uid] = { chat: group.count, reviews: 0, complaints: 0 };
      }
    });

    negativeReviewsGroup.forEach(rev => {
      const uid = rev.companionId?.userId?.toString();
      if (uid) {
        if (!userRiskData[uid]) userRiskData[uid] = { chat: 0, reviews: 0, complaints: 0 };
        userRiskData[uid].reviews += 1;
      }
    });

    complaintsBookings.forEach(booking => {
      const companionUid = booking.companionId?.toString();
      const familyUid = booking.familyId?.toString();

      if (companionUid) {
        if (!userRiskData[companionUid]) userRiskData[companionUid] = { chat: 0, reviews: 0, complaints: 0 };
        userRiskData[companionUid].complaints += (booking.complaints?.length || 0);
      }
      // Note: Complaints are typically filed against companions, but we can also log under families if needed.
    });

    let highRiskUsersCount = 0;
    Object.keys(userRiskData).forEach(uid => {
      const data = userRiskData[uid];
      const { score } = calculateUserRiskScore(data.chat, data.reviews, data.complaints);
      if (score >= 60) {
        highRiskUsersCount++;
      }
    });

    // Positive review ratio
    const positiveReviewsCount = await Review.countDocuments({ rating: { $gte: 4 } });
    const positiveReviewRatio = totalReviewsCount > 0 
      ? Math.round((positiveReviewsCount / totalReviewsCount) * 100)
      : 100;

    return res.status(200).json({
      status: "success",
      data: {
        totalScanned,
        activeAlerts,
        highRiskUsersCount,
        positiveReviewRatio,
        systemStatus: "active",
        lastScanTime: new Date()
      }
    });
  } catch (error) {
    console.error("Error in getSummary:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * GET /api/ai/admin/risk-center/alerts
 */
const getAlerts = async (req, res) => {
  try {
    const [securityAlerts, negativeReviews, bookingsWithComplaints] = await Promise.all([
      SecurityAlert.find().populate("userId", "name role").sort({ createdAt: -1 }).limit(10).lean(),
      Review.find({ rating: { $lte: 2 } }).populate("familyId", "name").populate({
        path: "companionId",
        populate: { path: "userId", select: "name" }
      }).sort({ createdAt: -1 }).limit(10).lean(),
      Booking.find({ "complaints.0": { $exists: true } }).populate("familyId", "name").populate("companionId", "name").sort({ updatedAt: -1 }).limit(10).lean()
    ]);

    const alerts = [];

    // Map security alerts (chats)
    securityAlerts.forEach(alert => {
      alerts.push({
        id: alert._id.toString(),
        type: alert.violationType === "phone_number_sharing" ? "phone_leak" : alert.violationType === "external_payment_attempt" ? "external_payment" : "fraud",
        title: alert.violationType ? `🚨 Chat Policy: ${alert.violationType.replace(/_/g, " ")}` : "🚨 Chat Policy Violation",
        description: `${alert.userId?.name || "User"} (${alert.userId?.role || "user"}): "${alert.messageText}"`,
        timestamp: alert.createdAt,
        priority: alert.violationType === "phone_number_sharing" ? "high" : "critical",
        relatedPage: "security",
        relatedId: alert.userId?._id?.toString()
      });
    });

    // Map negative reviews
    negativeReviews.forEach(rev => {
      alerts.push({
        id: rev._id.toString(),
        type: "suspicious",
        title: `⭐ Low Rating Review (${rev.rating} Stars)`,
        description: `Review for companion ${rev.companionId?.userId?.name || "Caregiver"}: "${rev.comment}"`,
        timestamp: rev.createdAt,
        priority: rev.rating === 1 ? "high" : "medium",
        relatedPage: "reviews",
        relatedId: rev.companionId?.userId?._id?.toString()
      });
    });

    // Map booking complaints
    bookingsWithComplaints.forEach(b => {
      b.complaints.forEach((comp, idx) => {
        const ai = comp.aiAnalysis || {};
        alerts.push({
          id: `${b._id}-comp-${idx}`,
          type: "critical_complaint",
          title: `⚠ Booking Complaint: ${comp.title}`,
          description: `Filed against companion ${b.companionId?.name || "Caregiver"}: "${comp.description}"`,
          timestamp: comp.createdAt,
          priority: ai.urgencyLevel === "Critical" ? "critical" : ai.urgencyLevel === "High" ? "high" : "medium",
          relatedPage: "security",
          relatedId: b.companionId?._id?.toString()
        });
      });
    });

    // Sort by newest first
    alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.status(200).json({
      status: "success",
      data: alerts.slice(0, 15)
    });
  } catch (error) {
    console.error("Error in getAlerts:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * GET /api/ai/admin/risk-center/users
 */
const getUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

    // Fetch alerts, negative reviews, and complaints
    const [allUsers, securityAlerts, negativeReviews, bookingsWithComplaints] = await Promise.all([
      User.find({ role: { $ne: "admin" } }).select("name role isBanned avatar createdAt").lean(),
      SecurityAlert.find().select("userId createdAt").lean(),
      Review.find({ rating: { $lte: 2 } }).populate({ path: "companionId", select: "userId" }).lean(),
      Booking.find({ "complaints.0": { $exists: true } }).select("companionId familyId complaints").lean()
    ]);

    const usersMap = {};

    allUsers.forEach(u => {
      usersMap[u._id.toString()] = {
        user: u,
        chatViolations: 0,
        negativeReviews: 0,
        complaints: 0,
        lastIncidentDate: null
      };
    });

    // Count chat violations
    securityAlerts.forEach(alert => {
      const uid = alert.userId?.toString();
      if (usersMap[uid]) {
        usersMap[uid].chatViolations++;
        const date = new Date(alert.createdAt);
        if (!usersMap[uid].lastIncidentDate || date > usersMap[uid].lastIncidentDate) {
          usersMap[uid].lastIncidentDate = date;
        }
      }
    });

    // Count negative reviews (only caregivers/companions receive reviews)
    negativeReviews.forEach(rev => {
      const uid = rev.companionId?.userId?.toString();
      if (uid && usersMap[uid]) {
        usersMap[uid].negativeReviews++;
        const date = new Date(rev.createdAt);
        if (!usersMap[uid].lastIncidentDate || date > usersMap[uid].lastIncidentDate) {
          usersMap[uid].lastIncidentDate = date;
        }
      }
    });

    // Count complaints
    bookingsWithComplaints.forEach(b => {
      const companionUid = b.companionId?.toString();
      if (companionUid && usersMap[companionUid]) {
        usersMap[companionUid].complaints += b.complaints.length;
        b.complaints.forEach(comp => {
          const date = new Date(comp.createdAt);
          if (!usersMap[companionUid].lastIncidentDate || date > usersMap[companionUid].lastIncidentDate) {
            usersMap[companionUid].lastIncidentDate = date;
          }
        });
      }
    });

    // Convert map to array and calculate risk scores
    let riskUsers = Object.values(usersMap)
      .map(entry => {
        const { score, level } = calculateUserRiskScore(
          entry.chatViolations,
          entry.negativeReviews,
          entry.complaints
        );
        return {
          ...entry,
          riskScore: score,
          riskLevel: level,
          aiRecommendation: getRecommendedAction(level)
        };
      })
      .filter(entry => entry.riskScore > 0) // only include users with risk elements
      .sort((a, b) => b.riskScore - a.riskScore); // highest risk first

    // Pagination
    const total = riskUsers.length;
    const paginatedUsers = riskUsers.slice(skip, skip + limit);

    return res.status(200).json({
      status: "success",
      data: {
        users: paginatedUsers,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error("Error in getUsers:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * GET /api/ai/admin/risk-center/investigate/:userId
 */
const getInvestigationReport = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("name role isBanned avatar createdAt").lean();
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    // Fetch all user incidents
    const [securityAlerts, negativeReviews, bookingsWithComplaints] = await Promise.all([
      SecurityAlert.find({ userId }).sort({ createdAt: -1 }).lean(),
      Review.find({ rating: { $lte: 2 } }).populate({
        path: "companionId",
        match: { userId: userId }
      }).sort({ createdAt: -1 }).lean(),
      Booking.find({
        $or: [
          { companionId: userId },
          { familyId: userId }
        ],
        "complaints.0": { $exists: true }
      }).populate("familyId", "name").populate("companionId", "name").sort({ updatedAt: -1 }).lean()
    ]);

    // Filter reviews belonging to this user
    const filteredReviews = negativeReviews.filter(rev => rev.companionId !== null);

    // Build timeline and evidence arrays
    const timeline = [];
    const chatEvidence = [];
    const reviewEvidence = [];
    const complaintEvidence = [];

    // 1. Process Chat Violations
    securityAlerts.forEach(alert => {
      const date = alert.createdAt;
      const typeLabel = alert.violationType ? alert.violationType.replace(/_/g, " ") : "Policy Violation";
      
      timeline.push({
        date,
        type: "Chat Violation",
        label: `Chat Violation: ${typeLabel}`,
        description: `Flagged message: "${alert.messageText}" due to: ${alert.reason}`
      });

      chatEvidence.push({
        date,
        source: "Chat Monitoring",
        aiExplanation: alert.reason || "Policy violation detected.",
        confidence: 90
      });
    });

    // 2. Process Negative Reviews
    filteredReviews.forEach(rev => {
      const date = rev.createdAt;
      
      timeline.push({
        date,
        type: "Negative Review",
        label: `Negative Review (${rev.rating} Stars)`,
        description: `Review left by user: "${rev.comment}"`
      });

      reviewEvidence.push({
        date,
        source: "Review Moderation",
        aiExplanation: rev.auditSummary || `Negative review with rating ${rev.rating} Stars. comment: "${rev.comment}"`,
        confidence: 85
      });
    });

    // 3. Process Booking Complaints
    bookingsWithComplaints.forEach(b => {
      b.complaints.forEach(comp => {
        const date = comp.createdAt;
        const ai = comp.aiAnalysis || {};

        timeline.push({
          date,
          type: "Booking Complaint",
          label: `Booking Complaint: ${comp.title}`,
          description: `Complaint submitted: "${comp.description}"`
        });

        complaintEvidence.push({
          date,
          source: "Booking Complaint",
          aiExplanation: ai.aiSummary || `Complaint: "${comp.description}"`,
          confidence: ai.aiConfidence || 75
        });
      });
    });

    // Sort timeline chronologically
    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate risk metrics
    const chatViolationsCount = chatEvidence.length;
    const negativeReviewsCount = reviewEvidence.length;
    const complaintsCount = complaintEvidence.length;

    const { score, level } = calculateUserRiskScore(
      chatViolationsCount,
      negativeReviewsCount,
      complaintsCount
    );

    // AI Correlation Engine logic
    let correlationInsight = "";
    let correlationConfidence = 80;
    
    if (complaintsCount > 1 || negativeReviewsCount > 1 || chatViolationsCount > 0) {
      correlationInsight = "Guardian AI detected repeated policy violations across multiple platform activities. Risk is increasing.";
      correlationConfidence = 95;
    } else {
      correlationInsight = "Guardian AI analyzed user activity. Policy violations are isolated, but attention is recommended.";
      correlationConfidence = 70;
    }

    const recommendedAction = getRecommendedAction(level);

    return res.status(200).json({
      status: "success",
      data: {
        userOverview: {
          name: user.name,
          role: user.role,
          isBanned: user.isBanned,
          riskScore: score,
          riskLevel: level,
          totalViolations: chatViolationsCount + negativeReviewsCount + complaintsCount,
          totalComplaints: complaintsCount,
          negativeReviews: negativeReviewsCount,
          chatViolations: chatViolationsCount,
        },
        behaviorTimeline: timeline,
        evidence: {
          chatEvidence,
          reviewEvidence,
          complaintEvidence
        },
        aiCorrelation: {
          insight: correlationInsight,
          confidence: correlationConfidence,
          recommendedAction
        },
        recommendation: {
          riskScore: score,
          confidence: correlationConfidence,
          summary: `Guardian AI evaluated this user as ${level} risk with a score of ${score}/100.`,
          recommendedAction
        }
      }
    });
  } catch (error) {
    console.error("Error in getInvestigationReport:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * POST /api/ai/admin/risk-center/action
 */
const executeAction = async (req, res) => {
  try {
    const { userId, action, reason } = req.body;
    const adminId = req.user._id;
    const adminName = req.user.name || "Admin";

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    if (action === "warn") {
      const title = "Account Warning | تنبيه رسمي";
      const message = reason || "You have received a warning due to inappropriate platform behavior violating our terms of service.";
      const type = "system_alert";
      
      const newNotification = await Notification.create({
        recipientId: userId,
        senderId: adminId,
        title,
        message,
        type,
        isRead: false,
      });

      // Deliver via Socket.IO
      if (global.io) {
        global.io.to(userId.toString()).emit("new_notification", newNotification);
      }

      // Log to Activity History
      await ActivityLog.create({
        category: "moderation",
        type: "admin_warned_user",
        title: "User Warned",
        description: `Admin warned ${user.role} user ${user.name} for inappropriate platform behavior.`,
        actorName: adminName,
        actorRole: "admin",
        relatedId: userId,
        relatedModel: "User",
        icon: "warning",
        iconBg: "bg-amber-100",
        iconColor: "text-amber-700",
        badgeLabel: "Warning",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      });

    } else if (action === "suspend") {
      user.isBanned = true;
      await user.save();

      // Log to Activity History
      await ActivityLog.create({
        category: "moderation",
        type: "admin_suspended_user",
        title: "User Suspended",
        description: `Admin suspended ${user.role} user ${user.name}.`,
        actorName: adminName,
        actorRole: "admin",
        relatedId: userId,
        relatedModel: "User",
        icon: "block",
        iconBg: "bg-red-100",
        iconColor: "text-red-700",
        badgeLabel: "Suspension",
        badgeClass: "bg-red-50 text-red-700 border-red-200",
      });

    } else if (action === "ignore") {
      // Log to Activity History
      await ActivityLog.create({
        category: "moderation",
        type: "admin_ignored_recommendation",
        title: "AI Recommendation Ignored",
        description: `Admin ignored AI recommendation for ${user.role} user ${user.name}.`,
        actorName: adminName,
        actorRole: "admin",
        relatedId: userId,
        relatedModel: "User",
        icon: "visibility_off",
        iconBg: "bg-gray-100",
        iconColor: "text-gray-700",
        badgeLabel: "Ignored",
        badgeClass: "bg-gray-50 text-gray-700 border-gray-200",
      });
    }

    return res.status(200).json({
      status: "success",
      message: `Action ${action} executed successfully.`
    });
  } catch (error) {
    console.error("Error in executeAction:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  getSummary,
  getAlerts,
  getUsers,
  getInvestigationReport,
  executeAction
};
