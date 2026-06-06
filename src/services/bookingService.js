const Booking = require("../models/booking.schema");

const checkIn = async (bookingId, scheduleId, companionId) => {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
        throw new Error("Booking not found");
    }

    if (booking.companionId.toString() !== companionId.toString()) {
        throw new Error("Not authorized to check-in for this booking");
    }

    if (['cancelled', 'completed'].includes(booking.status)) {
        throw new Error(`Cannot check-in. Booking is already ${booking.status}`);
    }

    const scheduleItem = booking.schedule.id(scheduleId);

    if (!scheduleItem) {
        throw new Error("Schedule day not found");
    }

    if (scheduleItem.checkInTime) {
        throw new Error("Already checked in for this schedule day");
    }

    scheduleItem.checkInTime = new Date();

    if (booking.status === 'approved' || booking.status === 'pending') {
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
        throw new Error("Not authorized to check-out for this booking");
    }

    const scheduleItem = booking.schedule.id(scheduleId);

    if (!scheduleItem) {
        throw new Error("Schedule day not found");
    }

    if (!scheduleItem.checkInTime) {
        throw new Error("Must check in first before checking out");
    }

    if (scheduleItem.checkOutTime) {
        throw new Error("Already checked out for this schedule day");
    }

    scheduleItem.checkOutTime = new Date();

    
    if (scheduleItem.tasksList && scheduleItem.tasksList.length > 0) {
        scheduleItem.tasksList.forEach(task => {
            if (task.isCompleted === undefined) {
                task.isCompleted = false;
            }
        });
    }

    const allCheckedOut = booking.schedule.every(item => item.checkOutTime);
    if (allCheckedOut) {
        booking.status = 'completed';
    }

    await booking.save();
    return { booking, familyId: booking.familyId };
};

module.exports = {
    checkIn,
    checkOut
};