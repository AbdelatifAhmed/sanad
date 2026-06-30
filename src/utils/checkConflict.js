const Booking = require("../models/booking.schema");

/**
 * Checks conflict based on general date ranges and week schedule.
 */
const hasBookingConflict = async (companionId, newStartDate, newEndDate, newWorkingDays, newStartTime, newEndTime, excludeBookingId = null) => {
  const query = {
    companionId,
    status: { $in: ["approved", "active"] }, 
    startDate: { $lte: newEndDate },
    endDate: { $gte: newStartDate },
    workingDays: { $in: newWorkingDays },
    schedule: {
      $elemMatch: {
        startTime: { $lt: newEndTime },
        endTime: { $gt: newStartTime }
      }
    }
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflictingBooking = await Booking.findOne(query);
  return !!conflictingBooking;
};

/**
 * Perform a high-fidelity conflict check by verifying every single schedule item day-by-day.
 */
const hasComprehensiveConflict = async (companionId, proposedSchedule, excludeBookingId = null) => {
  if (!Array.isArray(proposedSchedule) || proposedSchedule.length === 0) {
    return false;
  }

  for (const item of proposedSchedule) {
    const itemDate = new Date(item.date);
    
    // Set boundaries for the calendar day
    const startOfDay = new Date(itemDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(itemDate);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
      companionId,
      status: { $in: ["approved", "active"] },
      schedule: {
        $elemMatch: {
          date: { $gte: startOfDay, $lte: endOfDay },
          startTime: { $lt: item.endTime },
          endTime: { $gt: item.startTime }
        }
      }
    };

    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const conflictingBooking = await Booking.findOne(query);
    if (conflictingBooking) {
      console.log(`[CONFLICT_FOUND] proposed day ${itemDate.toDateString()} (${item.startTime}-${item.endTime}) conflicts with booking ID: ${conflictingBooking._id}`);
      return true;
    }
  }

  return false;
};

module.exports = { hasBookingConflict, hasComprehensiveConflict };