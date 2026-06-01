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
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

reviewSchema.index(
  {
    bookingId: 1,
  },
  {
    unique: true,
  },
);

reviewSchema.index({
  companionId: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Review", reviewSchema);
