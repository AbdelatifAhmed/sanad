const Booking = require("../../models/booking.schema");

const getAllBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await Booking.countDocuments();
    const bookings = await Booking.find()
      .populate("familyId", "name email phone")
      .populate("companionId", "name email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      status: "success",
      results: bookings.length,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      data: {
        bookings
      }
    });
  } catch (error) {
    console.error("Error in getAllBookings admin controller:", error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching bookings.",
      error: error.message
    });
  }
};

module.exports = {
  getAllBookings
};
