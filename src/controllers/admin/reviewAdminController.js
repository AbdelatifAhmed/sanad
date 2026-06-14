const Review = require("../../models/reviews.schema");
const mongoose = require("mongoose");
const messages = require("../../utils/messages");

const parsePagination = (query) => {
  const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 200);
  const page = Math.max(parseInt(query.page) || 1, 1);
  const skip = (page - 1) * limit;
  return { limit, page, skip };
};

const getAllReviews = async (req, res) => {
  try {
    const { companionId, familyId, isVisible } = req.query;
    const { limit, page, skip } = parsePagination(req.query);

    const filter = {};
    if (companionId && mongoose.Types.ObjectId.isValid(companionId)) filter.companionId = companionId;
    if (familyId && mongoose.Types.ObjectId.isValid(familyId)) filter.familyId = familyId;
    if (typeof isVisible !== "undefined") filter.isVisible = isVisible === "true";

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("familyId", "name email avatar")
        .populate({ path: "companionId", populate: { path: "userId", select: "name avatar" } })
        .populate("bookingId", "status")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Review.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: "success",
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Error in admin getAllReviews:", error);
    return res.status(500).json({ status: "error", message: messages.common.serverError[req.lang || "en"], error: error.message });
  }
};

module.exports = {
  getAllReviews,
};
