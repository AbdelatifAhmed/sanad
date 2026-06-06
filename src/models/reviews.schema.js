const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const Companion = require("./companion.schema");

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
  { timestamps: true }
);

reviewSchema.index({ bookingId: 1, familyId: 1 }, { unique: true });
reviewSchema.index({ companionId: 1, isVisible: 1, createdAt: -1 });

reviewSchema.statics.updateCompanionRating = async function (companionProfileId) {
  const stats = await this.aggregate([
    {
      $match: {
        companionId: new mongoose.Types.ObjectId(companionProfileId),
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

  if (stats.length > 0) {
    await Companion.findByIdAndUpdate(companionProfileId, {
      averageRating: Number(stats[0].averageRating.toFixed(1)),
      reviewCount: stats[0].totalReviews,
    });
  } else {
    await Companion.findByIdAndUpdate(companionProfileId, {
      averageRating: 5.0,
      reviewCount: 0,
    });
  }
};

reviewSchema.post("save", async function () {
  await this.constructor.updateCompanionRating(this.companionId);
});

reviewSchema.post(/^findOneAndDelete/, async function (doc) {
  if (doc) {
    await doc.constructor.updateCompanionRating(doc.companionId);
  }
});

module.exports = mongoose.model("Review", reviewSchema);