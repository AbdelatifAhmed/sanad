const Review = require("../models/reviews.schema");
const Booking = require("../models/booking.schema");
const User = require("../models/user.schema");

const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const familyId = req.user._id;

    if (!bookingId || !rating) {
      return res.status(400).json({
        error: "bookingId and rating are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: "Rating must be between 1 and 5",
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        error: "Booking not found",
      });
    }

    if (booking.familyId.toString() !== familyId.toString()) {
      return res.status(403).json({
        error: "Access denied. You can only review your own bookings",
      });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({
        error: "Can only review completed bookings",
      });
    }

    const existingReview = await Review.findOne({
      bookingId,
    });

    if (existingReview) {
      return res.status(400).json({
        error: "Review already exists for this booking",
      });
    }

    const newReview = new Review({
      bookingId,
      familyId,
      companionId: booking.companionId,
      rating,
      comment: comment || "",
    });

    const savedReview = await newReview.save();

    const populatedReview = await Review.findById(savedReview._id)
      .populate("familyId", "name")
      .populate("companionId", "name");

    return res.status(201).json({
      message: "Review created successfully",
      review: populatedReview,
    });
  } catch (error) {
    console.error("Error creating review:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        error: "Review already exists for this booking",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: error.message,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        error: `Invalid field: ${error.path}`,
      });
    }

    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

const getCompanionReviews = async (req, res) => {
  try {
    const { id } = req.params;

    const companion = await User.findById(id).select("role").lean();

    if (!companion) {
      return res.status(404).json({
        error: "Companion not found",
      });
    }

    if (companion.role !== "companion") {
      return res.status(400).json({
        error: "User is not a companion",
      });
    }

    const reviews = await Review.find({
      companionId: id,
    })
      .populate("familyId", "name email")
      .populate("bookingId", "_id")
      .sort({ createdAt: -1 })
      .lean();

    const averageRating =
      reviews.length > 0
        ? Number(
            (
              reviews.reduce((sum, review) => sum + review.rating, 0) /
              reviews.length
            ).toFixed(1),
          )
        : null;

    return res.status(200).json({
      companionId: id,
      totalReviews: reviews.length,
      averageRating,
      reviews,
    });
  } catch (error) {
    console.error("Error fetching companion reviews:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        error: "Invalid companion ID",
      });
    }

    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

module.exports = {
  createReview,
  getCompanionReviews,
};
