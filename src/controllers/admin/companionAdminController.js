const Companion = require("../../models/companion.schema");
const AppError = require("../../utiles/AppError");
const catchAsync = AppError.catchAsync;

const getPendingCompanions = catchAsync(async (req, res, next) => {
  const pendingCompanions = await Companion.find({
    verificationStatus: "pending",
  }).populate("userId", "name email phone");

  return res.status(200).json({
    status: "success",
    results: pendingCompanions.length,
    data: {
      pendingCompanions,
    },
  });
});

const verifyCompanion = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["verified", "rejected"].includes(status)) {
    throw new AppError(
      'Invalid status. Please provide either "verified" or "rejected".',
      400,
    );
  }

  const updatedCompanion = await Companion.findByIdAndUpdate(
    id,
    { verificationStatus: status },
    { new: true, runValidators: true },
  ).populate("userId", "name email");

  if (!updatedCompanion) {
    throw new AppError("Companion profile not found", 404);
  }

  return res.status(200).json({
    status: "success",
    message: `Companion profile updated to ${status === "verified" ? "verified" : "rejected"}`,
    data: {
      companion: updatedCompanion,
    },
  });
});

module.exports = {
  getPendingCompanions,
  verifyCompanion,
};
