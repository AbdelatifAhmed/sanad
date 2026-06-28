const Review = require("../models/reviews.schema.js");
const Booking = require("../models/booking.schema");
const Companion = require("../models/companion.schema");
const mongoose = require("mongoose");
const messages = require("../utils/messages");
const { generateEmbedding } = require("../services/ai/ragService");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const parsePagination = (query) => {
  const limit = Math.min(Math.max(parseInt(query.limit) || 10, 1), 50);
  const page = Math.max(parseInt(query.page) || 1, 1);
  const skip = (page - 1) * limit;
  return { limit, page, skip };
};

const createReview = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { bookingId, rating, comment } = req.body;
    const familyId = req.user._id;

    if (!bookingId || rating === undefined) {
      return res
        .status(400)
        .json({ error: messages.review.requiredFields[lang] });
    }

    if (!isValidObjectId(bookingId)) {
      return res.status(400).json({ error: messages.common.invalidId[lang] });
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res
        .status(400)
        .json({ error: messages.review.invalidRating[lang] });
    }

    const booking = await Booking.findById(bookingId).lean();
    if (!booking) {
      return res.status(404).json({ error: messages.review.bookingNotFound[lang] });
    }

    if (booking.familyId.toString() !== familyId.toString()) {
      return res.status(403).json({
        error: messages.review.unauthorizedReview[lang],
      });
    }

    if (booking.status !== "completed") {
      return res
        .status(400)
        .json({ error: messages.review.bookingNotCompleted[lang] });
    }

    const companionProfile = await Companion.findOne({
      userId: booking.companionId,
    }).lean();
    if (!companionProfile) {
      return res
        .status(404)
        .json({ error: messages.review.companionNotFound[lang] });
    }

    let sentimentEmbedding = null;
    if (comment && comment.trim()) {
      try {
        sentimentEmbedding = await generateEmbedding(comment.trim());
      } catch (err) {
        console.error("Error generating sentiment embedding for review:", err.message);
      }
    }

    const newReview = await Review.create({
      bookingId,
      familyId,
      companionId: companionProfile._id,
      rating: ratingNum,
      comment: comment?.trim() || "",
      ...(sentimentEmbedding && { sentiment_embedding: sentimentEmbedding })
    });

    const populatedReview = await Review.findById(newReview._id)
      .populate("familyId", "name email avatar")
      .populate("companionId", "bio hourlyRate")
      .lean();

    return res.status(201).json({
      message: messages.review.successCreated[lang],
      review: populatedReview,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ error: messages.review.duplicateReview[req.lang || "en"] });
    }
    return res.status(500).json({ error: messages.common.serverError[req.lang || "en"] });
  }
};

const getCompanionReviews = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: messages.common.invalidId[lang] });
    }

    const companion = await Companion.findOne({ userId: id }).lean();
    if (!companion) {
      return res.status(404).json({ error: messages.companion.profileNotFound[lang] });
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
      averageRating: companion.rating,
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
    return res.status(500).json({ error: messages.common.serverError[req.lang || "en"] });
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
    return res.status(500).json({ error: messages.common.serverError[req.lang || "en"] });
  }
};

const deleteReview = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { id } = req.params;
    const familyId = req.user._id;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: messages.common.invalidId[lang] });
    }

    const review = await Review.findOneAndDelete({ _id: id, familyId });

    if (!review) {
      return res
        .status(404)
        .json({ error: messages.common.notFound[lang] });
    }

    return res.status(200).json({ message: messages.review.successDeleted[lang] });
  } catch (error) {
    console.error("Error deleting review:", error);
    return res.status(500).json({ error: messages.common.serverError[req.lang || "en"] });
  }
};

module.exports = {
  createReview,
  getCompanionReviews,
  getMyReviews,
  deleteReview,
};
