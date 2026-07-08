const Booking = require("../models/booking.schema");
const Companion = require("../models/companion.schema");

class CompanionScheduleService {
  /**
   * Fetch a companion's enriched schedule.
   * @param {String} companionId 
   * @returns {Array} Enriched bookings
   */
  static async getSchedule(companionId) {
    const confirmedBookings = await Booking.find({
      companionId,
      status: { $in: ["pending", "pending_payment", "approved", "active", "completed"] }
    })
      .populate({ path: "familyId", select: "name phone email avatar beneficiaries" })
      .populate({ path: "jobPostId", select: "title location" })
      .sort({ startDate: 1 });

    const enrichedBookings = confirmedBookings.map((b) => {
      const bObj = b.toObject();
      const family = b.familyId;
      
      if (family && family.beneficiaries && b.beneficiaryId) {
        const beneficiary = family.beneficiaries.find(
          (ben) => ben._id.toString() === b.beneficiaryId.toString()
        );
        bObj.beneficiary = beneficiary
          ? { name: beneficiary.name, age: beneficiary.age, gender: beneficiary.gender }
          : { name: "Beneficiary" };
      } else {
        bObj.beneficiary = { name: "Beneficiary" };
      }
      return bObj;
    });

    return enrichedBookings;
  }

  /**
   * Check for schedule conflicts before approving a new booking.
   * @param {String} companionId 
   * @param {Array} requestedScheduleSlots 
   * @returns {Object} { hasConflict: Boolean, conflictingBooking: Object }
   */
  static async checkConflicts(companionId, requestedScheduleSlots) {
    if (!requestedScheduleSlots || requestedScheduleSlots.length === 0) {
      return { hasConflict: false, conflictingBooking: null };
    }

    const activeBookings = await Booking.find({
      companionId,
      status: { $in: ["approved", "active"] },
    });

    for (const booking of activeBookings) {
      if (!booking.schedule || !Array.isArray(booking.schedule)) continue;

      for (const bookedSlot of booking.schedule) {
        if (!bookedSlot.date || !bookedSlot.startTime || !bookedSlot.endTime) continue;

        for (const reqSlot of requestedScheduleSlots) {
          if (!reqSlot.date || !reqSlot.startTime || !reqSlot.endTime) continue;

          // Simple date check
          const bookedDate = new Date(bookedSlot.date).toISOString().split('T')[0];
          const reqDate = new Date(reqSlot.date).toISOString().split('T')[0];

          if (bookedDate === reqDate) {
            // Check time overlap
            const bookedStart = this._timeToMinutes(bookedSlot.startTime);
            const bookedEnd = this._timeToMinutes(bookedSlot.endTime);
            const reqStart = this._timeToMinutes(reqSlot.startTime);
            const reqEnd = this._timeToMinutes(reqSlot.endTime);

            // If (StartA < EndB) and (EndA > StartB), they overlap
            if (reqStart < bookedEnd && reqEnd > bookedStart) {
              return { hasConflict: true, conflictingBooking: booking };
            }
          }
        }
      }
    }

    return { hasConflict: false, conflictingBooking: null };
  }

  /**
   * Helper to convert HH:MM to minutes
   */
  static _timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return (hours * 60) + (minutes || 0);
  }
}

module.exports = CompanionScheduleService;
