const Review = require("../models/reviews.schema.js");
const Booking = require("../models/booking.schema");
const Companion = require("../models/companion.schema");
const mongoose = require("mongoose");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const parsePagination = (query) => {
  const limit = Math.min(Math.max(parseInt(query.limit) || 10, 1), 50);
  const page = Math.max(parseInt(query.page) || 1, 1);
  const skip = (page - 1) * limit;
  return { limit, page, skip };
};

const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const familyId = req.user._id;

    if (!bookingId || rating === undefined) {
      return res
        .status(400)
        .json({ error: "bookingId and rating are required" });
    }

    if (!isValidObjectId(bookingId)) {
      return res.status(400).json({ error: "Invalid bookingId" });
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res
        .status(400)
        .json({ error: "Rating must be an integer between 1 and 5" });
    }

    const booking = await Booking.findById(bookingId).lean();
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.familyId.toString() !== familyId.toString()) {
      return res.status(403).json({
        error: "Access denied. You can only review your own bookings",
      });
    }

    if (booking.status !== "completed") {
      return res
        .status(400)
        .json({ error: "You can only review completed bookings" });
    }

    const companionProfile = await Companion.findOne({
      userId: booking.companionId,
    }).lean();
    if (!companionProfile) {
      return res
        .status(404)
        .json({ error: "Companion profile not found for this booking" });
    }

    const newReview = await Review.create({
      bookingId,
      familyId,
      companionId: companionProfile._id,
      rating: ratingNum,
      comment: comment?.trim() || "",
    });

    const populatedReview = await Review.findById(newReview._id)
      .populate("familyId", "name email avatar")
      .populate("companionId", "bio hourlyRate")
      .lean();

    return res.status(201).json({
      message: "Review created successfully",
      review: populatedReview,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ error: "A review already exists for this booking" });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getCompanionReviews = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid companion ID" });
    }

    const companion = await Companion.findOne({ userId: id }).lean();
    if (!companion) {
      return res.status(404).json({ error: "Companion not found" });
    }

    const { limit, page, skip } = parsePagination(req.query);

    const [reviews, total] = await Promise.all([
      Review.find({ companionId: companion._id, isVisible: true })
        .populate("familyId", "name avatar")
        .populate("bookingId", "_id")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Review.countDocuments({ companionId: companion._id, isVisible: true }),
    ]);

    return res.status(200).json({
      companionId: id,
      companionProfileId: companion._id,
      averageRating: companion.averageRating,
      totalReviews: companion.reviewCount,
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
    console.error("Error fetching companion reviews:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getMyReviews = async (req, res) => {
  try {
    const familyId = req.user._id;
    const { limit, page, skip } = parsePagination(req.query);

    const [reviews, total] = await Promise.all([
      Review.find({ familyId })
        .populate({
          path: "companionId",
          select: "bio",
          populate: { path: "userId", select: "name avatar" },
        })
        .populate("bookingId", "_id status")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Review.countDocuments({ familyId }),
    ]);

    return res.status(200).json({
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
    console.error("Error fetching family reviews:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const familyId = req.user._id;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid review ID" });
    }

    const review = await Review.findOneAndDelete({ _id: id, familyId });

    if (!review) {
      return res
        .status(404)
        .json({ error: "Review not found or access denied" });
    }

    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createReview,
  getCompanionReviews,
  getMyReviews,
  deleteReview,
};
