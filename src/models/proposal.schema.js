const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const proposalSchema = new mongoose.Schema(
  {
    jobPostId: {
      type: ObjectId,
      ref: "JobPost",
      required: true,
    },
    companionId: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    proposedRate: {
      type: Number,
      required: [true, "يرجى تحديد سعر الساعة الخاص بعرضك"],
    },
    coverLetter: {
      type: String,
      required: [true, "يرجى كتابة رسالة تشرح فيها سبب ملائمتك للطلب"],
      trim: true,
      maxlength: [1500, "الرسالة يجب ألا تتجاوز 1500 حرف"],
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    taskList: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true },
);

proposalSchema.index({ jobPostId: 1, companionId: 1 }, { unique: true });

module.exports = mongoose.model("Proposal", proposalSchema);
