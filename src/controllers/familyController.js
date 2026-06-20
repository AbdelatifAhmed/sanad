const Family = require('../models/family.schema');
const mongoose = require('mongoose');
const messages = require("../utils/messages");
const Booking = require('../models/booking.schema');

exports.updateFamilyProfile = async (req, res) => {
  try {
    const lang = req.lang || "en";
    if (!req.user || req.user.role !== 'family') {
      return res.status(403).json({
        error: messages.booking.accessDeniedFamilyOnly[lang]
      });
    }

    const familyId = req.user._id;
    const { address, beneficiaries } = req.body;
    if (address === undefined && beneficiaries === undefined) {
      return res.status(400).json({
        error: messages.family.atLeastOneField[lang]
      });
    }

    if (address !== undefined) {
      if (typeof address !== 'object' || address === null || Array.isArray(address)) {
        return res.status(400).json({
          error: messages.family.invalidAddress[lang]
        });
      }
      
      const { city, area, fullAddress } = address;
      if (city !== undefined && (typeof city !== 'string' || city.trim() === '')) {
        return res.status(400).json({ error: 'City must be a non-empty string.' });
      }
      if (area !== undefined && (typeof area !== 'string' || area.trim() === '')) {
        return res.status(400).json({ error: 'Area must be a non-empty string.' });
      }
      if (fullAddress !== undefined && (typeof fullAddress !== 'string' || fullAddress.trim() === '')) {
        return res.status(400).json({ error: 'Full address must be a non-empty string.' });
      }
    }

    if (beneficiaries !== undefined) {
      if (!Array.isArray(beneficiaries)) {
        return res.status(400).json({
          error: messages.family.invalidBeneficiaries[lang]
        });
      }

      for (const b of beneficiaries) {
        if (typeof b !== 'object' || b === null || Array.isArray(b)) {
          return res.status(400).json({
            error: 'Each beneficiary must be a valid object.'
          });
        }

        if (b._id) {
        
          if (!mongoose.Types.ObjectId.isValid(b._id)) {
            return res.status(400).json({
              error: `Invalid beneficiary ID format: ${b._id}`
            });
          }

          if (b.name !== undefined && (typeof b.name !== 'string' || b.name.trim() === '')) {
            return res.status(400).json({ error: 'Beneficiary name must be a non-empty string.' });
          }
          if (b.age !== undefined && (typeof b.age !== 'number' || b.age < 0)) {
            return res.status(400).json({ error: 'Beneficiary age must be a positive number.' });
          }
          if (b.gender !== undefined && !['male', 'female'].includes(b.gender)) {
            return res.status(400).json({ error: 'Beneficiary gender must be male or female.' });
          }
          if (b.category !== undefined && !['elderly', 'special_needs'].includes(b.category)) {
            return res.status(400).json({ error: 'Beneficiary category must be elderly or special_needs.' });
          }
          if (b.conditionDetails !== undefined && (typeof b.conditionDetails !== 'string' || b.conditionDetails.trim() === '')) {
            return res.status(400).json({ error: 'Beneficiary condition details must be a non-empty string.' });
          }
          if (b.interests !== undefined) {
            if (!Array.isArray(b.interests) || b.interests.some(item => typeof item !== 'string')) {
              return res.status(400).json({ error: 'Beneficiary interests must be an array of strings.' });
            }
          }
        } else {
          const { name, age, gender, category, conditionDetails, interests } = b;
          if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ error: 'New beneficiary name is required.' });
          }
          if (age === undefined || typeof age !== 'number' || age < 0) {
            return res.status(400).json({ error: 'New beneficiary age is required and must be a positive number.' });
          }
          if (!gender || !['male', 'female'].includes(gender)) {
            return res.status(400).json({ error: 'New beneficiary gender is required (male or female).' });
          }
          if (!category || !['elderly', 'special_needs'].includes(category)) {
            return res.status(400).json({ error: 'New beneficiary category is required (elderly or special_needs).' });
          }
          if (!conditionDetails || typeof conditionDetails !== 'string' || conditionDetails.trim() === '') {
            return res.status(400).json({ error: 'New beneficiary condition details are required.' });
          }
          if (interests !== undefined) {
            if (!Array.isArray(interests) || interests.some(item => typeof item !== 'string')) {
              return res.status(400).json({ error: 'New beneficiary interests must be an array of strings.' });
            }
          }
        }
      }
    }

    let familyProfile = await Family.findOne({ familyId });

    if (!familyProfile) {
      if (!address || !address.city || !address.area || !address.fullAddress) {
        return res.status(400).json({
          error: 'Family profile does not exist. You must provide a complete address (city, area, fullAddress) to create a profile.'
        });
      }

      const initialBeneficiaries = [];
      if (beneficiaries) {
        for (const b of beneficiaries) {
          initialBeneficiaries.push({
            name: b.name.trim(),
            age: b.age,
            gender: b.gender,
            category: b.category,
            conditionDetails: b.conditionDetails.trim(),
            interests: b.interests || []
          });
        }
      }

      familyProfile = new Family({
        familyId,
        address: {
          city: address.city.trim(),
          area: address.area.trim(),
          fullAddress: address.fullAddress.trim()
        },
        beneficiaries: initialBeneficiaries
      });
    } else {
      
      if (address !== undefined) {
        if (address.city !== undefined) familyProfile.address.city = address.city.trim();
        if (address.area !== undefined) familyProfile.address.area = address.area.trim();
        if (address.fullAddress !== undefined) familyProfile.address.fullAddress = address.fullAddress.trim();
      }

      if (beneficiaries !== undefined) {
        for (const b of beneficiaries) {
          if (b._id) {
           
            const existingB = familyProfile.beneficiaries.id(b._id);
            if (!existingB) {
              return res.status(404).json({
                error: `Beneficiary with ID ${b._id} not found.`
              });
            }
            if (b.isDeleted === true) {
              familyProfile.beneficiaries.pull(b._id);
            } else {
              if (b.name !== undefined) existingB.name = b.name.trim();
              if (b.age !== undefined) existingB.age = b.age;
              if (b.gender !== undefined) existingB.gender = b.gender;
              if (b.category !== undefined) existingB.category = b.category;
              if (b.conditionDetails !== undefined) existingB.conditionDetails = b.conditionDetails.trim();
              if (b.interests !== undefined) existingB.interests = b.interests;
            }
          } else {
            
            familyProfile.beneficiaries.push({
              name: b.name.trim(),
              age: b.age,
              gender: b.gender,
              category: b.category,
              conditionDetails: b.conditionDetails.trim(),
              interests: b.interests || []
            });
          }
        }
      }
    }

 
    const savedProfile = await familyProfile.save();
    return res.status(200).json({
      message: messages.family.profileSuccess[req.lang || "en"],
      profile: savedProfile
    });

  } catch (error) {
    console.error('Error updating family profile:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: `Invalid field: ${error.path}` });
    }
    return res.status(500).json({ error: messages.common.serverError[req.lang || "en"] });
  }
};

exports.getFamilyDashboardStats = async (req, res) => {
  try {
    const lang = req.headers["accept-language"] || "en";

    if (!req.user || req.user.role !== "family") {
      return res.status(403).json({
        status: "fail",
        message: lang === "en"
          ? "Access denied. Only families can view dashboard stats."
          : "عذراً، هذا الحساب لا يملك صلاحيات للوصول إلى إحصائيات لوحة التحكم.",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch only active/pending bookings for this family
    const bookings = await Booking.find({ 
      familyId: req.user._id,
      status: { $in: ["pending", "approved", "active"] }
    })
      .populate("companionId", "name phone email avatar")
      .populate("jobPostId", "title serviceType")
      .sort({ createdAt: -1 });

    // 1. Calculate Active Requests Count (all queried bookings are active/pending requests)
    const activeRequestsCount = bookings.length;

    // 2. Calculate Upcoming Visits Count and find the closest next visit slot
    let upcomingVisitsCount = 0;
    let nextSlotDateTime = null;
    let minDiff = Infinity;
    const now = new Date();

    const activeBookings = bookings.filter(b => ["approved", "active"].includes(b.status));

    for (const booking of activeBookings) {
      if (booking.schedule && Array.isArray(booking.schedule)) {
        for (const slot of booking.schedule) {
          if (!slot.date || !slot.startTime) continue;

          // Combine slot date and start time efficiently
          const slotDateTime = new Date(slot.date);
          const [hours, minutes] = slot.startTime.split(":").map(Number);
          slotDateTime.setHours(hours || 0, minutes || 0, 0, 0);

          const diff = slotDateTime - now;
          if (diff >= 0) {
            upcomingVisitsCount++;
            if (diff < minDiff) {
              minDiff = diff;
              nextSlotDateTime = slotDateTime;
            }
          }
        }
      }
    }

    // Helper to format the next visit label
    let nextVisitLabel = lang === "en" ? "No upcoming visits" : "لا توجد زيارات قادمة";
    if (nextSlotDateTime) {
      const diffMinutes = Math.floor(minDiff / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);

      if (diffMinutes < 60) {
        nextVisitLabel = lang === "en" ? `Next in ${diffMinutes}m` : `التالي خلال ${diffMinutes} د`;
      } else if (diffHours < 24) {
        nextVisitLabel = lang === "en" ? `Next in ${diffHours}h` : `التالي خلال ${diffHours} س`;
      } else if (diffHours < 48) {
        const timeString = nextSlotDateTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        nextVisitLabel = lang === "en" ? `Tomorrow, ${timeString}` : `غداً، ${timeString}`;
      } else {
        const dateString = nextSlotDateTime.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const timeString = nextSlotDateTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        nextVisitLabel = lang === "en" ? `${dateString}, ${timeString}` : `${dateString}، ${timeString}`;
      }
    }

    // 3. Current Caregivers formatting (bookings are already filtered by status)
    const currentCaregivers = bookings.slice(0, 3).map(b => {
      const isPending = b.status === "pending";
      const name = b.jobPostId?.title || b.companionId?.name || "Companion Care Session";
      const avatar = b.companionId?.avatar || "/avatar_2.jpg";
      const role = b.companionId ? "RN" : "";
      
      const subtext = isPending 
        ? `Requested for ${new Date(b.startDate).toLocaleDateString("en-US", { weekday: "long" })}`
        : "Elderly Care Specialist";

      let scheduleText = "";
      if (!isPending && b.schedule && b.schedule.length > 0) {
        const nextSlot = b.schedule.find(s => new Date(s.date) >= today);
        if (nextSlot) {
          const timeString = nextSlot.startTime;
          const dateString = new Date(nextSlot.date).toLocaleDateString("en-US", { weekday: "long" });
          
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          
          const slotDateOnly = new Date(nextSlot.date);
          slotDateOnly.setHours(0, 0, 0, 0);
          
          const isTomorrow = slotDateOnly.getTime() === tomorrow.getTime();
          const dayLabel = isTomorrow ? "Tomorrow" : dateString;
          scheduleText = `Scheduled for ${dayLabel}, ${timeString}`;
        } else {
          const formattedStart = new Date(b.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          scheduleText = `Scheduled starting ${formattedStart}`;
        }
      }

      return {
        id: b._id,
        name,
        avatar,
        role,
        subtext,
        status: b.status,
        scheduleText,
        companionId: b.companionId?._id || null,
      };
    });

    return res.status(200).json({
      status: "success",
      data: {
        user: {
          name: req.user.name,
          avatar: req.user.avatar || null
        },
        activeRequests: {
          count: activeRequestsCount,
        },
        upcomingVisits: {
          count: upcomingVisitsCount,
          nextVisitLabel,
        },
        currentCaregivers,
      },
    });
  } catch (error) {
    console.error("Error fetching family dashboard stats:", error);
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

exports.getFamilyProfile = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'family') {
      return res.status(403).json({ status: 'fail', message: 'Access denied.' });
    }
    const familyProfile = await Family.findOne({ familyId: req.user._id });
    if (!familyProfile) {
      return res.status(200).json({ status: 'success', data: { profile: null, beneficiaries: [] } });
    }
    return res.status(200).json({
      status: 'success',
      data: {
        profile: familyProfile,
        beneficiaries: familyProfile.beneficiaries || [],
      },
    });
  } catch (error) {
    console.error('Error fetching family profile:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getFamilyJobPosts = async (req, res) => {
  try {
    const JobPost = require('../models/jobPost.schema');
    if (!req.user || req.user.role !== 'family') {
      return res.status(403).json({ status: 'fail', message: 'Access denied.' });
    }
    const jobs = await JobPost.find({ familyId: req.user._id })
      .populate('requiredSkills', 'nameAr nameEn')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: 'success',
      results: jobs.length,
      data: { jobPosts: jobs },
    });
  } catch (error) {
    console.error('Error fetching family job posts:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};
