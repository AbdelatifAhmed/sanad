const Booking = require("../models/booking.schema");

const getFamilyBookings = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const upcomingBookings = await Booking.find({
      familyId: req.user._id,
      status: { $in: ["approved", "active"] },
      endDate: { $gte: today } 
    })
    .populate("companionId", "name phone email avatar")
    .sort({ startDate: 1 }); 

    const pastBookings = await Booking.find({
      familyId: req.user._id,
      $or: [
        { status: { $in: ["completed", "cancelled"] } },
        { endDate: { $lt: today } } 
      ]
    })
    .populate("companionId", "name phone email avatar")
    .sort({ endDate: -1 }); 

    return res.status(200).json({
      status: "success",
      data: {
        upcoming: upcomingBookings,
        past: pastBookings
      }
    });
  } catch (error) {
    console.error("Error fetching family bookings:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const getCompanionBookings = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingBookings = await Booking.find({
      companionId: req.user._id,
      status: { $in: ["approved", "active"] },
      endDate: { $gte: today }
    })
    .populate("familyId", "name phone avatar")
    .sort({ startDate: 1 });

    const pastBookings = await Booking.find({
      companionId: req.user._id,
      $or: [
        { status: { $in: ["completed", "cancelled"] } },
        { endDate: { $lt: today } }
      ]
    })
    .populate("familyId", "name phone avatar")
    .sort({ endDate: -1 });

    return res.status(200).json({
      status: "success",
      data: {
        upcoming: upcomingBookings,
        past: pastBookings
      }
    });
  } catch (error) {
    console.error("Error fetching companion bookings:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  getFamilyBookings,
  getCompanionBookings
};