const Booking = require("../models/booking.schema");
const Payment = require("../models/payment.schema");
const CompanionDebt = require("../models/companionDebt.schema");
const Companion = require("../models/companion.schema");

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

    if (!['approved', 'active'].includes(booking.status) || booking.paymentStatus !== 'paid') {
        throw new Error("Cannot check-in. Payment must be completed before check-in.");
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

    if (passcode !== undefined && passcode !== null && passcode !== '') {
        const targetPasscode = booking.verificationPasscode;
        if (targetPasscode && passcode.toString() === targetPasscode.toString()) {
            verified = true;
            method = "passcode";
            scheduleItem.checkInPasscode = passcode.toString();
        } else {
            throw new Error("خطأ في التحقق من الحضور: رمز التحقق (Passcode) غير صحيح");
        }
    } else if (lat !== undefined && lng !== undefined) {
        let coordinates = [];
        if (booking.location && booking.location.geo && booking.location.geo.coordinates && booking.location.geo.coordinates.length === 2) {
            coordinates = booking.location.geo.coordinates;
        } else {
            const User = require("../models/user.schema");
            const familyUser = await User.findById(booking.familyId);
            if (familyUser && familyUser.location && familyUser.location.geo && familyUser.location.geo.coordinates && familyUser.location.geo.coordinates.length === 2) {
                coordinates = familyUser.location.geo.coordinates;
            }
        }

        if (coordinates.length === 2) {
            const [bookingLng, bookingLat] = coordinates;
            if (bookingLat && bookingLng) {
                const distance = getDistanceInKm(lat, lng, bookingLat, bookingLng);
                if (distance <= 0.5) { // 500 meters safety limit
                    verified = true;
                    method = "geolocation";
                    scheduleItem.checkInGeo = { lat, lng };
                } else {
                    throw new Error("خطأ في التحقق من الحضور: موقعك الجغرافي بعيد جداً عن موقع الرعاية المعتمد");
                }
            } else {
                throw new Error("خطأ في التحقق من الحضور: إحداثيات موقع الرعاية غير مكتملة في الحجز");
            }
        } else {
            // Lock caregiver's checked-in coordinates as the authorized booking location coordinates
            booking.location = {
                geo: {
                    type: "Point",
                    coordinates: [lng, lat]
                },
                readableAddress: booking.location?.readableAddress || "الموقع المعتمد عند تسجيل الحضور الأول",
                city: booking.location?.city || "",
                governorate: booking.location?.governorate || ""
            };
            verified = true;
            method = "geolocation";
            scheduleItem.checkInGeo = { lat, lng };
        }
    } else {
        throw new Error("خطأ في التحقق من الحضور: يرجى تحديد طريقة التحقق (رمز OTP أو الموقع الجغرافي)");
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

    // Daily payout release logic
    if (booking.paymentStatus === 'paid' && !scheduleItem.payoutReleased) {
        // Calculate session duration in hours
        let shiftDurationHours = 1;
        try {
            const [startH, startM] = scheduleItem.startTime.split(":").map(Number);
            const [endH, endM] = scheduleItem.endTime.split(":").map(Number);
            const totalStart = startH * 60 + startM;
            const totalEnd = endH * 60 + endM;
            shiftDurationHours = Math.max(0, (totalEnd - totalStart) / 60);
        } catch (err) {
            console.error("Failed to parse shift times for payout calculation:", err.message);
        }

        const sessionEarnings = shiftDurationHours * booking.hourlyRateAtBooking;

        scheduleItem.payoutReleased = true;
        scheduleItem.payoutAmount = sessionEarnings;

        // Add session earnings to companion's wallet balance
        const companionProfile = await Companion.findOne({ userId: booking.companionId });
        if (companionProfile) {
            companionProfile.walletBalance = (companionProfile.walletBalance || 0) + sessionEarnings;
            await companionProfile.save({ validateBeforeSave: false });
        }

        // Record companion payout transaction
        const WalletTransaction = require("../models/walletTransaction.schema");
        const payoutTxId = 'payout_' + Math.random().toString(36).substr(2, 9).toUpperCase();
        await WalletTransaction.create({
            userId: booking.companionId,
            bookingId: booking._id,
            amount: sessionEarnings,
            type: "payout",
            status: "completed",
            transactionId: payoutTxId,
            descriptionAr: `مستحقات يومية لحجز الرعاية المنزلية (جلسة ${scheduleItem.startTime})`,
            descriptionEn: `Daily payout for care booking (session ${scheduleItem.startTime})`
        });
    }

    const allCheckedOut = booking.schedule.every(item => item.checkOutTime);
    if (allCheckedOut) {
        booking.status = 'completed';

        // Finalize payout state on completion
        if ((booking.paymentMethod === 'card' || booking.paymentMethod === 'wallet') && booking.paymentStatus === 'paid') {
            const payment = await Payment.findOne({ bookingId: booking._id });
            if (payment && payment.status === 'paid' && !payment.payoutReleased) {
                payment.payoutReleased = true;
                payment.payoutTransactionId = 'payout_final_' + Math.random().toString(36).substr(2, 9).toUpperCase();
                payment.payoutDate = new Date();
                await payment.save();
            }
        }
    }

    await booking.save();
    return { booking, familyId: booking.familyId, status: booking.status };
};

module.exports = {
    checkIn,
    checkOut
};