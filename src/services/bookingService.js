const Booking = require("../models/booking.schema");
const Payment = require("../models/payment.schema");
const CompanionDebt = require("../models/companionDebt.schema");

function getDistanceInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    return d;
}

const checkIn = async (bookingId, scheduleId, companionId, verification = {}) => {
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

    const { lat, lng, passcode } = verification;
    let verified = false;
    let method = "";

    // 1. Verify Passcode
    if (passcode) {
        const targetPasscode = booking.verificationPasscode;
        if (targetPasscode && passcode.toString() === targetPasscode.toString()) {
            verified = true;
            method = "passcode";
            scheduleItem.checkInPasscode = passcode.toString();
        }
    }

    // 2. Verify Geolocation (within 500m / 0.5km)
    if (!verified && lat !== undefined && lng !== undefined) {
        if (booking.location && booking.location.geo && booking.location.geo.coordinates) {
            const [bookingLng, bookingLat] = booking.location.geo.coordinates;
            if (bookingLat && bookingLng) {
                const distance = getDistanceInKm(lat, lng, bookingLat, bookingLng);
                if (distance <= 0.5) { // 500 meters safety limit
                    verified = true;
                    method = "geolocation";
                    scheduleItem.checkInGeo = { lat, lng };
                }
            }
        }
    }

    if (!verified) {
        throw new Error("خطأ في التحقق من الحضور: الرمز المدخل غير صحيح أو موقعك الجغرافي بعيد جداً عن موقع الرعاية");
    }

    scheduleItem.checkInTime = new Date();
    scheduleItem.checkInMethod = method;

    if (booking.status === 'approved' || booking.status === 'pending' || booking.status === 'pending_payment') {
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
        const uncompletedTasks = scheduleItem.tasksList.filter(task => !task.isCompleted);
        if (uncompletedTasks.length > 0) {
            throw new Error("Cannot check-out. All tasks in the checklist must be completed first.");
        }
    }

    const allCheckedOut = booking.schedule.every(item => item.checkOutTime);
    if (allCheckedOut) {
        booking.status = 'completed';

        // Release payout for card or wallet payments
        if ((booking.paymentMethod === 'card' || booking.paymentMethod === 'wallet') && booking.paymentStatus === 'paid') {
            const payment = await Payment.findOne({ bookingId: booking._id });
            if (payment && payment.status === 'paid' && !payment.payoutReleased) {
                payment.payoutReleased = true;
                payment.payoutTransactionId = 'payout_' + Math.random().toString(36).substr(2, 9).toUpperCase();
                payment.payoutDate = new Date();
                await payment.save();
            }
        }
        // Handle cash payments and record admin fee platform debt
        else if (booking.paymentMethod === 'cash') {
            let payment = await Payment.findOne({ bookingId: booking._id });
            const basePrice = booking.totalHours * booking.hourlyRateAtBooking;
            const adminFee = booking.adminFee || (basePrice * 0.10);

            if (!payment) {
                const transactionId = "txn_" + Math.random().toString(36).substr(2, 9).toUpperCase();
                payment = new Payment({
                    bookingId: booking._id,
                    familyId: booking.familyId,
                    companionId: booking.companionId,
                    amount: basePrice,
                    adminFee: adminFee,
                    totalAmount: basePrice + adminFee,
                    paymentMethod: 'cash',
                    status: 'paid',
                    transactionId,
                });
            } else {
                payment.status = 'paid';
            }

            booking.paymentStatus = 'paid';

            if (!payment.debtRecorded) {
                let companionDebt = await CompanionDebt.findOne({ companionId: booking.companionId });
                if (!companionDebt) {
                    companionDebt = new CompanionDebt({
                        companionId: booking.companionId,
                        totalDebt: 0,
                        debtHistory: [],
                    });
                }
                companionDebt.totalDebt += adminFee;
                companionDebt.debtHistory.push({
                    bookingId: booking._id,
                    paymentId: payment._id,
                    amount: adminFee,
                    reason: "cash_payment_admin_fee",
                    recordedAt: new Date(),
                });
                await companionDebt.save();
                payment.debtRecorded = true;
            }
            await payment.save();
        }
    }

    await booking.save();
    return { booking, familyId: booking.familyId, status: booking.status };
};

module.exports = {
    checkIn,
    checkOut
};