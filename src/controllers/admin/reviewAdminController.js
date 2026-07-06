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
    const { companionId, familyId, isVisible, rating, search } = req.query;
    const { limit, page, skip } = parsePagination(req.query);

    const filter = {};
    if (companionId && mongoose.Types.ObjectId.isValid(companionId)) filter.companionId = companionId;
    if (familyId && mongoose.Types.ObjectId.isValid(familyId)) filter.familyId = familyId;
    if (typeof isVisible !== "undefined" && isVisible !== "all") filter.isVisible = isVisible === "true";
    if (rating) filter.rating = { $gte: parseInt(rating) };

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("familyId", "name email avatar")
        .populate({ path: "companionId", populate: { path: "userId", select: "name avatar" } })
        .populate("bookingId", "status totalPrice startDate endDate")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Review.countDocuments(filter),
    ]);

    // Stats
    const [avgResult, totalVisible, thisMonth] = await Promise.all([
      Review.aggregate([{ $group: { _id: null, avg: { $avg: "$rating" } } }]),
      Review.countDocuments({ isVisible: true }),
      Review.countDocuments({
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      }),
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
      stats: {
        total,
        avgRating: avgResult[0]?.avg ? parseFloat(avgResult[0].avg.toFixed(1)) : 0,
        thisMonth,
        hidden: total - totalVisible,
      },
    });
  } catch (error) {
    console.error("Error in admin getAllReviews:", error);
    return res.status(500).json({ status: "error", message: messages.common.serverError[req.lang || "en"], error: error.message });
  }
};

const toggleReviewVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ status: "fail", message: "Review not found" });
    review.isVisible = !review.isVisible;
    await review.save();
    return res.status(200).json({ status: "success", data: { isVisible: review.isVisible } });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndDelete(id);
    if (!review) return res.status(404).json({ status: "fail", message: "Review not found" });
    return res.status(200).json({ status: "success", message: "Review deleted" });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = { getAllReviews, toggleReviewVisibility, deleteReview };
