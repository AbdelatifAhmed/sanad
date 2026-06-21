const Booking = require("../models/booking.schema");


const hasBookingConflict = async (companionId, newStartDate, newEndDate, newWorkingDays, newStartTime, newEndTime) => {
  
  const conflictingBooking = await Booking.findOne({
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
  });

  return !!conflictingBooking;
};

module.exports = { hasBookingConflict };