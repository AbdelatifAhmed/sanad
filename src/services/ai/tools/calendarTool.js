const Booking = require("../../../models/booking.schema");
const Companion = require("../../../models/companion.schema");

const ACTIVE_STATUSES = ["pending", "pending_payment", "approved", "active"];

const formatBooking = (booking) => ({
  _id: booking._id,
  status: booking.status,
  paymentStatus: booking.paymentStatus,
  startDate: booking.startDate,
  endDate: booking.endDate,
  workingDays: booking.workingDays,
  totalHours: booking.totalHours,
  totalPrice: booking.totalPrice,
  hourlyRateAtBooking: booking.hourlyRateAtBooking,
  location: booking.location,
  schedule: booking.schedule,
  family: booking.familyId && {
    _id: booking.familyId._id,
    name: booking.familyId.name,
    phone: booking.familyId.phone,
  },
  companion: booking.companionId && {
    _id: booking.companionId._id,
    name: booking.companionId.name,
    phone: booking.companionId.phone,
  },
});

const getUpcomingFamilyBookings = async (familyUserId, limit = 8) => {
  const bookings = await Booking.find({
    familyId: familyUserId,
    status: { $in: ACTIVE_STATUSES },
  })
    .populate({ path: "companionId", select: "name phone avatar gender" })
    .sort({ startDate: 1 })
    .limit(limit)
    .lean();

  return bookings.map(formatBooking);
};

const getCompanionActiveBookings = async (companionUserId, limit = 20) => {
  const bookings = await Booking.find({
    companionId: companionUserId,
    status: { $in: ACTIVE_STATUSES },
  })
    .populate({ path: "familyId", select: "name phone avatar" })
    .sort({ startDate: 1 })
    .limit(limit)
    .lean();

  return bookings.map(formatBooking);
};

const parseTime = (value) => {
  if (!value) return null;
  const [hours, minutes] = String(value).split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const intervalsOverlap = (aStart, aEnd, bStart, bEnd) => {
  const startA = parseTime(aStart);
  const endA = parseTime(aEnd);
  const startB = parseTime(bStart);
  const endB = parseTime(bEnd);

  if ([startA, endA, startB, endB].some((value) => value === null)) return false;
  return startA < endB && startB < endA;
};

const auditCompanionScheduleConflict = async (companionUserId, proposal = {}) => {
  const activeBookings = await getCompanionActiveBookings(companionUserId);

  if (!proposal.date && !proposal.day && !proposal.startTime && !proposal.endTime) {
    return {
      hasConflict: false,
      activeBookings,
      messageAr: "لم أجد تفاصيل كافية عن الطلب الجديد، لكن هذه هي مواعيدك النشطة الحالية.",
      messageEn: "I do not have enough details about the new request, but these are your active bookings.",
    };
  }

  const proposalDate = proposal.date ? new Date(proposal.date) : null;
  const proposalDay = proposal.day || (proposalDate && proposalDate.toLocaleDateString("en-US", { weekday: "long" }));

  for (const booking of activeBookings) {
    for (const slot of booking.schedule || []) {
      const slotDate = slot.date ? new Date(slot.date) : null;
      const sameDate = proposalDate && slotDate && slotDate.toDateString() === proposalDate.toDateString();
      const sameDay = proposalDay && booking.workingDays?.includes(proposalDay);
      const sameTime = intervalsOverlap(proposal.startTime, proposal.endTime, slot.startTime, slot.endTime);

      if ((sameDate || sameDay) && sameTime) {
        return {
          hasConflict: true,
          conflict: { booking, slot },
          activeBookings,
          messageAr: `يوجد تعارض مع موعد حجز آخر يوم ${proposalDay || ""} الساعة ${slot.startTime}.`,
          messageEn: `There is a conflict with another booking on ${proposalDay || "that day"} at ${slot.startTime}.`,
        };
      }
    }
  }

  return {
    hasConflict: false,
    activeBookings,
    messageAr: "نعم، هذا الطلب مناسب لجدول أعمالك.",
    messageEn: "Yes, this request fits your schedule.",
  };
};

const getCompanionProfile = async (userId) => {
  return Companion.findOne({ userId }).lean();
};

module.exports = {
  getUpcomingFamilyBookings,
  getCompanionActiveBookings,
  auditCompanionScheduleConflict,
  getCompanionProfile,
};
