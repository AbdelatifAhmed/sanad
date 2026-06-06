const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const reviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: ObjectId,
      ref: "Booking",
      required: true,
    },
    familyId: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    companionId: {
      type: ObjectId,
      ref: "Companion",
      required: true,
    },
    rating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating must be at most 5"],
      required: true,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Comment must not exceed 1000 characters"],
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

reviewSchema.index({ bookingId: 1, familyId: 1 }, { unique: true });

reviewSchema.index({ companionId: 1, isVisible: 1, createdAt: -1 });

reviewSchema.index({ familyId: 1, createdAt: -1 });

reviewSchema.statics.getAverageRating = async function (companionId) {
  const result = await this.aggregate([
    {
      $match: {
        companionId: new mongoose.Types.ObjectId(companionId),
        isVisible: true,
      },
    },
    {
      $group: {
        _id: "$companionId",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (result.length === 0) return { averageRating: null, totalReviews: 0 };

  return {
    averageRating: Number(result[0].averageRating.toFixed(1)),
    totalReviews: result[0].totalReviews,
  };
};

module.exports = mongoose.model("Review", reviewSchema);
