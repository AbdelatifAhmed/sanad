const Booking = require('../models/booking.schema');

exports.createBooking = async (req, res) => {
  const newBooking = new Booking({
    familyId: req.body.familyId,
    companionId: req.body.companionId,
    beneficiaryId: req.body.beneficiaryId,
    hourlyRateAtBooking: req.body.hourlyRateAtBooking,
    totalHours: req.body.totalHours,
    totalPrice: req.body.totalHours * req.body.hourlyRateAtBooking,
    schedule: req.body.schedule
  });
  const savedBooking = await newBooking.save();
  res.status(201).json(savedBooking);
};

exports.updateBookingStatus = async (req, res) => {
  const updatedBooking = await Booking.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  res.status(200).json(updatedBooking);
};
