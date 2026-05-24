const Booking = require("../models/booking.schema");
const Notification = require("../models/notification.schema");

const checkIn = async (bookingId, scheduleId, companionId) => {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
        throw new Error("Booking not found");
    }

    if (booking.companionId.toString() !== companionId.toString()) {
        throw new Error("Not authorized to check-in for this booking");
    }

    const schedule = booking.schedule.id(scheduleId);

    if (!schedule) {
        throw new Error("Schedule not found");
    }

    if (schedule.checkInTime) {
        throw new Error("Already checked in");
    }

    schedule.checkInTime = new Date();

    if (booking.status === 'approved') {
        booking.status = 'active';
    }

    await booking.save();
    return { booking, familyId: booking.familyId };
};

const checkOut = async (bookingId, scheduleId, companionId) => {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
        throw new Error("Booking not found");
    }

    if (booking.companionId.toString() !== companionId.toString()) {
        throw new Error("Not authorized");
    }

    const schedule = booking.schedule.id(scheduleId);

    if (!schedule) {
        throw new Error("Schedule not found");
    }

    if (!schedule.checkInTime) {
        throw new Error("Must check in first");
    }

    if (schedule.checkOutTime) {
        throw new Error("Already checked out");
    }

    schedule.checkOutTime = new Date();
    await booking.save();
    return { booking, familyId: booking.familyId };
};

const createNotification = async (familyId, message, type = 'tracking') => {
    const notification = await Notification.create({
        recipientId: familyId,
        title: "Companion Update",
        message: message,
        type: type,
        isRead: false
    });
    return notification;
};

module.exports = {
    checkIn,
    checkOut,
    createNotification
};