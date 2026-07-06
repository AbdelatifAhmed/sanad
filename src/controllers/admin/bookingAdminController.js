const Booking  = require("../../models/booking.schema");
const JobPost  = require("../../models/jobPost.schema");
const Proposal = require("../../models/proposal.schema");
const mongoose = require("mongoose");
const messages = require("../../utils/messages");

// ── GET /api/admin/bookings ────────────────────────────────────────────────
const getAllBookings = async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page,  10) || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit, 10) || 15, 100);
    const skip   = (page - 1) * limit;
    const { status, companionId, familyId } = req.query;

    // ── Build filter ────────────────────────────────────────────────────────
    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    // Scope to a specific caregiver when requested (e.g. from caregiver profile page)
    if (companionId && mongoose.Types.ObjectId.isValid(companionId)) {
      filter.companionId = new mongoose.Types.ObjectId(companionId);
    }

    // Scope to a specific family when requested (e.g. from family profile page)
    if (familyId && mongoose.Types.ObjectId.isValid(familyId)) {
      filter.familyId = new mongoose.Types.ObjectId(familyId);
    }

    const total   = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate("familyId",    "name email phone avatar")
      .populate("companionId", "name email phone avatar")
      .populate("jobPostId",   "title serviceType location budgetPerHour schedule")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // ── Stats — scoped to the same filter so numbers match the result set ───
    const statAgg = await Booking.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    const stats = { total: 0, pending: 0, approved: 0, active: 0, completed: 0, cancelled: 0, pending_payment: 0 };
    statAgg.forEach(s => {
      if (s._id in stats) stats[s._id] = s.count;
      stats.total += s.count;
    });

    return res.status(200).json({
      status: "success",
      results: bookings.length,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      stats,
      data: { bookings }
    });
  } catch (error) {
    console.error("Error in getAllBookings:", error);
    return res.status(500).json({
      status: "error",
      message: messages.common.serverError[req.lang || "en"],
      error: error.message
    });
  }
};

// ── GET /api/admin/bookings/:id ────────────────────────────────────────────
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("familyId",    "name email phone avatar location")
      .populate("companionId", "name email phone avatar")
      .populate({
        path: "jobPostId",
        populate: { path: "familyId", select: "name" }
      })
      .lean();

    if (!booking) {
      return res.status(404).json({ status: "fail", message: "Booking not found" });
    }

    // Optional ownership guard: if the caller passes ?companionId= verify it matches
    const { companionId } = req.query;
    if (companionId && mongoose.Types.ObjectId.isValid(companionId)) {
      const bookingCompanionId = booking.companionId?._id?.toString() ?? booking.companionId?.toString();
      if (bookingCompanionId !== companionId.toString()) {
        return res.status(403).json({
          status: "fail",
          message: "This booking does not belong to the specified caregiver."
        });
      }
    }

    // Proposals linked to the related job post (if any)
    let proposals = [];
    if (booking.jobPostId) {
      proposals = await Proposal.find({ jobPostId: booking.jobPostId._id ?? booking.jobPostId })
        .populate("companionId", "name email phone avatar")
        .lean();
    }

    return res.status(200).json({
      status: "success",
      data: { booking, proposals }
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ── PATCH /api/admin/bookings/:id/status ──────────────────────────────────
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "pending_payment", "approved", "active", "completed", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ status: "fail", message: "Invalid status" });
    }
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).lean();
    if (!booking) return res.status(404).json({ status: "fail", message: "Booking not found" });
    return res.status(200).json({ status: "success", data: { booking } });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = { getAllBookings, getBookingById, updateBookingStatus };
