const mongoose = require('mongoose');
const Companion = require('../models/companion.schema');
const Booking = require('../models/booking.schema.js'); 
const { generateEmbedding } = require('../services/ai/ragService');
const User = require('../models/user.schema');
const Skill = require('../models/skills.schema');
const messages = require("../utils/messages");




const updateCompanionProfile = async (req, res) => {
  try {
    const lang = req.lang || "en";
    if (!req.user || req.user.role !== 'companion') {
      return res.status(403).json({ error: messages.common.forbidden[lang] });
    }

    const userId = req.user._id;
    const { bio, hourlyRate, skills, hobbies, availability, companionType, specialization } = req.body;

    const existingCompanion = await Companion.findOne({ userId });

    // Validate only if fields are being updated or on initial profile creation
    if (!existingCompanion) {
      if (bio === undefined || typeof bio !== 'string' || bio.trim() === '') {
        return res.status(400).json({ error: messages.companion.bioRequired[lang] });
      }
      if (hourlyRate === undefined || typeof hourlyRate !== 'number' || hourlyRate < 0) {
        return res.status(400).json({ error: messages.companion.hourlyRateRequired[lang] });
      }
    } else {
      if (bio !== undefined && (typeof bio !== 'string' || bio.trim() === '')) {
        return res.status(400).json({ error: messages.companion.bioRequired[lang] });
      }
      if (hourlyRate !== undefined && (typeof hourlyRate !== 'number' || hourlyRate < 0)) {
        return res.status(400).json({ error: messages.companion.hourlyRateRequired[lang] });
      }
    }

    if (skills !== undefined) {
      if (!Array.isArray(skills) || skills.some(s => typeof s !== 'string')) {
        return res.status(400).json({ error: messages.companion.skillsArray[lang] });
      }
    }

    if (hobbies !== undefined) {
      if (!Array.isArray(hobbies) || hobbies.some(h => typeof h !== 'string')) {
        return res.status(400).json({ error: messages.companion.hobbiesArray[lang] });
      }
    }

    if (availability !== undefined) {
      if (!Array.isArray(availability)) {
        return res.status(400).json({ error: messages.companion.invalidAvailability[lang] });
      }
      const validDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      for (const slotObj of availability) {
        if (typeof slotObj !== 'object' || slotObj === null || Array.isArray(slotObj)) {
          return res.status(400).json({ error: messages.companion.invalidAvailability[lang] });
        }
        if (!slotObj.day || !validDays.includes(slotObj.day)) {
          return res.status(400).json({ error: messages.companion.invalidAvailability[lang] });
        }
        if (!slotObj.slots || !Array.isArray(slotObj.slots) || slotObj.slots.some(s => typeof s !== 'string')) {
          return res.status(400).json({ error: messages.companion.invalidAvailability[lang] });
        }
      }
    }

    // Update User model fields if provided
    const userUpdate = {};
    if (req.body.name !== undefined) userUpdate.name = req.body.name.trim();
    if (req.body.phone !== undefined) userUpdate.phone = req.body.phone.trim();
    if (req.body.location !== undefined) {
      const { coordinates, readableAddress, city, governorate } = req.body.location;
      userUpdate.location = {
        geo: coordinates ? { type: "Point", coordinates } : undefined,
        readableAddress,
        city,
        governorate
      };
    }

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(userId, { $set: userUpdate }, { runValidators: true });
    }

    // Prepare updates for Companion model
    const setUpdate = {};
    if (bio !== undefined) setUpdate.bio = bio;
    if (hourlyRate !== undefined) setUpdate.hourlyRate = hourlyRate;
    if (companionType !== undefined) setUpdate.companionType = companionType;
    if (specialization !== undefined) setUpdate.specialization = specialization;
    
    if (skills !== undefined) {
      const skillDocs = await Promise.all(skills.map(async (skillName) => {
        let skill = await Skill.findOne({ $or: [{ nameEn: skillName }, { nameAr: skillName }] });
        if (!skill) {
          skill = await Skill.create({ nameEn: skillName, nameAr: skillName, category: 'general_care' });
        }
        return skill._id;
      }));
      setUpdate.skills = skillDocs;
    }

    if (hobbies !== undefined) setUpdate.hobbies = hobbies;
    if (availability !== undefined) setUpdate.availability = availability;

    // Handle Bio Embedding generation
    if (bio !== undefined || skills !== undefined || hobbies !== undefined || specialization !== undefined) {
      const bioText = bio !== undefined ? bio : (existingCompanion ? existingCompanion.bio : '');
      const specializationText = specialization !== undefined ? specialization : (existingCompanion ? existingCompanion.specialization : '');
      let skillsText = '';
      if (Array.isArray(skills)) {
        skillsText = skills.join(' ');
      } else if (existingCompanion && existingCompanion.skills && existingCompanion.skills.length > 0) {
        // Fetch skill names from DB
        const skillDocs = await Skill.find({ _id: { $in: existingCompanion.skills } });
        skillsText = skillDocs.map(s => lang === 'ar' ? s.nameAr : s.nameEn).join(' ');
      }
      const hobbiesText = Array.isArray(hobbies) ? hobbies.join(' ') : (existingCompanion && Array.isArray(existingCompanion.hobbies) ? existingCompanion.hobbies.join(' ') : '');
      
      const fullText = `${specializationText} ${bioText} ${skillsText} ${hobbiesText}`.trim();

      if (fullText) {
        try {
          setUpdate.bioEmbedding = await generateEmbedding(fullText);
        } catch (embeddingError) {
          console.error('Failed to generate embedding:', embeddingError);
        }
      }
    }

    let updatedCompanion;
    if (existingCompanion) {
      // Update existing profile (only validates fields that are set)
      updatedCompanion = await Companion.findOneAndUpdate(
        { userId },
        { $set: setUpdate },
        { new: true, runValidators: true }
      );
    } else {
      // Create new profile with necessary default documents structure matching schema
      const newCompanionData = {
        userId,
        companionType: companionType || 'general',
        specialization: specialization || 'none',
        bio,
        hourlyRate,
        skills: setUpdate.skills || [],
        hobbies: hobbies || [],
        availability: availability || [],
        documents: {
          nationalIdCard: {
            url: 'placeholder_national_id.jpg',
            public_id: 'placeholder_national_id'
          },
          criminalRecord: {
            url: 'placeholder_criminal_record.jpg',
            public_id: 'placeholder_criminal_record'
          },
          Certificates: []
        }
      };

      if (setUpdate.bioEmbedding) {
        newCompanionData.bioEmbedding = setUpdate.bioEmbedding;
      }

      updatedCompanion = await Companion.create(newCompanionData);
    }

    // Return fully populated companion profile matching the frontend expectations
    const populatedCompanion = await Companion.findById(updatedCompanion._id)
      .populate('userId', 'name email phone location avatar')
      .populate('skills', 'nameAr nameEn category');

    return res.status(200).json(populatedCompanion);
  } catch (error) {
    console.error('Error updating companion profile:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: `Invalid field: ${error.path}` });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getCompanionSchedule = async (req, res) => {
  try {
    const lang = req.lang || "en";

    const companionProfile = await Companion.findOne({ userId: req.user.id });
    
    if (!companionProfile) {
      return res.status(404).json({
        status: 'fail',
        message: messages.companion.profileNotFound[lang]
      });
    }

    const confirmedBookings = await Booking.find({
      companionId: req.user.id,
      status: { $in: ['pending', 'pending_payment', 'approved', 'active', 'completed'] } 
    })
    .populate({
      path: 'familyId',
      select: 'name phone email avatar' 
    })
    .populate({
      path: 'jobPostId',
      select: 'title location'
    })
    .sort({ startDate: 1 }); 

    // Fetch associated Family profiles to resolve beneficiary names
    const familyIds = confirmedBookings.map(b => b.familyId?._id).filter(Boolean);
    const Family = require('../models/family.schema');
    const familyProfiles = await Family.find({ familyId: { $in: familyIds } });

    // Map beneficiaryId to beneficiary details
    const beneficiaryMap = {};
    familyProfiles.forEach(fam => {
      if (fam.beneficiaries) {
        fam.beneficiaries.forEach(ben => {
          beneficiaryMap[ben._id.toString()] = {
            name: ben.name,
            age: ben.age,
            gender: ben.gender
          };
        });
      }
    });

    const enrichedBookings = confirmedBookings.map(b => {
      const bObj = b.toObject();
      if (b.beneficiaryId && beneficiaryMap[b.beneficiaryId.toString()]) {
        bObj.beneficiary = beneficiaryMap[b.beneficiaryId.toString()];
      } else {
        bObj.beneficiary = { name: "Beneficiary" };
      }
      return bObj;
    });

    return res.status(200).json({
      status: 'success',
      results: enrichedBookings.length,
      data: {
        schedule: enrichedBookings
      }
    });

  } catch (error) {
    console.error('Error fetching companion schedule:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

const updateCompanionAvailability = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { availability } = req.body;

    if (!availability) {
      return res.status(400).json({
        status: 'fail',
        message: messages.companion.invalidAvailability[lang]
      });
    }

    const updatedCompanion = await Companion.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { availability } }, 
      { new: true, runValidators: true }
    );

    if (!updatedCompanion) {
      return res.status(404).json({
        status: 'fail',
        message: messages.companion.profileNotFound[lang]
      });
    }

    return res.status(200).json({
      status: 'success',
      message: messages.companion.availabilitySuccess[lang],
      data: {
        availability: updatedCompanion.availability
      }
    });

  } catch (error) {
    console.error('Error updating companion availability:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ status: 'fail', error: error.message });
    }
    
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

const getVerifiedCompanions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 20) || 20;
    const skip = (page - 1) * limit;

    const query = { verificationStatus: 'verified' };

    // Duration filter (totalWorkHours)
    if (req.query.duration) {
      const minHours = parseInt(req.query.duration, 10);
      if (!isNaN(minHours)) {
        query.totalWorkHours = { $gte: minHours };
      }
    }

    // Specialization filter
    if (req.query.specialization) {
      query.specialization = req.query.specialization;
    }

    // CompanionType filter
    if (req.query.companionType) {
      query.companionType = req.query.companionType;
    }

    // Hourly Rate filter
    if (req.query.rate) {
      if (req.query.rate === "0-100") {
        query.hourlyRate = { $lt: 100 };
      } else if (req.query.rate === "100-150") {
        query.hourlyRate = { $gte: 100, $lte: 150 };
      } else if (req.query.rate === "150+") {
        query.hourlyRate = { $gte: 150 };
      }
    }

    // Rating filter
    if (req.query.rating) {
      const minRating = parseFloat(req.query.rating);
      if (!isNaN(minRating)) {
        query.rating = { $gte: minRating };
      }
    }

    // Gender filter
    if (req.query.gender) {
      const matchingUsersByGender = await User.find({ gender: req.query.gender }).select('_id');
      const userIdsByGender = matchingUsersByGender.map(u => u._id);
      
      if (query.userId) {
        // Intersect if already exists
        const existingIds = query.userId.$in.map(id => id.toString());
        const newIds = userIdsByGender.filter(id => existingIds.includes(id.toString()));
        query.userId = { $in: newIds };
      } else {
        query.userId = { $in: userIdsByGender };
      }
    }

    // Search filter (name, bio)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      
      const matchingUsers = await User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      }).select('_id');
      
      const userIds = matchingUsers.map(u => u._id);
      
      if (query.userId) {
         // Intersect
         const existingIds = query.userId.$in.map(id => id.toString());
         const newIds = userIds.filter(id => existingIds.includes(id.toString()));
         // OR with bio
         query.$or = [
           { userId: { $in: newIds } },
           { bio: searchRegex, userId: query.userId }
         ];
         delete query.userId;
      } else {
         query.$or = [
           { userId: { $in: userIds } },
           { bio: searchRegex }
         ];
      }
    }

    const total = await Companion.countDocuments(query);
    const companions = await Companion.find(query)
      .populate('userId', 'name email phone avatar location')
      .populate('skills', 'nameAr nameEn category')
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      status: 'success',
      results: companions.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: {
        companions
      }
    });
  } catch (error) {
    console.error('Error fetching verified companions:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

const getCompanionById = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: messages.common.invalidId[lang]
      });
    }

    // First try finding by the Companion document's own _id
    let companion = await Companion.findById(id)
      .populate('userId', 'name email phone avatar location')
      .populate('skills', 'nameAr nameEn category');

    // If not found, the caller may have passed the User's _id
    // (e.g. when navigating from proposals where companionId is a User ref)
    if (!companion) {
      companion = await Companion.findOne({ userId: id })
        .populate('userId', 'name email phone avatar location')
        .populate('skills', 'nameAr nameEn category');
    }

    if (!companion) {
      return res.status(404).json({
        status: 'fail',
        message: messages.companion.profileNotFound[lang]
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        companion
      }
    });
  } catch (error) {
    console.error('Error fetching companion by ID:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

const getMyCompanionProfile = async (req, res) => {
  try {
    const lang = req.lang || "en";

    if (req.user.role !== 'companion') {
      return res.status(403).json({
        status: 'fail',
        message: messages.common.forbidden[lang]
      });
    }

    const companion = await Companion.findOne({ userId: req.user.id })
      .populate('userId', 'name email phone location avatar')
      .populate('skills', 'nameAr nameEn category');

    if (!companion) {
      return res.status(404).json({
        status: 'fail',
        message: messages.companion.profileNotFound[lang]
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        companion
      }
    });
  } catch (error) {
    console.error('Error fetching personal companion profile:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

const updateMyLocation = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { coordinates, readableAddress, city, governorate } = req.body;

    if (!coordinates || coordinates.length !== 2) {
      return res.status(400).json({ error: messages.jobPost.coordinatesRequired[lang] });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          location: {
            geo: { type: "Point", coordinates },
            readableAddress,
            city,
            governorate
          }
        }
      },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    return res.status(200).json({ status: "success", data: { user: updatedUser } });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getCompanionDashboardStats = async (req, res) => {
  try {
    const lang = req.lang || "en";

    if (!req.user || req.user.role !== "companion") {
      return res.status(403).json({
        status: "fail",
        message:
          lang === "en"
            ? "Access denied. Only companions can view dashboard stats."
            : "عذراً، هذا الحساب لا يملك صلاحيات للوصول إلى إحصائيات لوحة التحكم.",
      });
    }

    const companion = await Companion.findOne({ userId: req.user._id });
    if (!companion) {
      return res.status(404).json({
        status: "fail",
        message:
          lang === "en"
            ? "Companion profile not found."
            : "لم يتم العثور على ملف تعريف المرافق الخاص بك.",
      });
    }

    // 1. Total Requests & Growth
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(today.getDate() - 60);

    const [totalRequests, requestsThisMonth, requestsLastMonth] =
      await Promise.all([
        Booking.countDocuments({ companionId: req.user._id }),
        Booking.countDocuments({
          companionId: req.user._id,
          createdAt: { $gte: thirtyDaysAgo },
        }),
        Booking.countDocuments({
          companionId: req.user._id,
          createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
        }),
      ]);

    let growthPercentage = 0;
    if (requestsLastMonth === 0) {
      growthPercentage = requestsThisMonth > 0 ? 100 : 0;
    } else {
      growthPercentage = Math.round(
        ((requestsThisMonth - requestsLastMonth) / requestsLastMonth) * 100,
      );
    }

    // 2. Active Bookings
    const activeBookingsCount = await Booking.countDocuments({
      companionId: req.user._id,
      status: { $in: ["approved", "active"] },
    });

    // 3. Upcoming Visits count & Next visit label
    const activeBookings = await Booking.find({
      companionId: req.user._id,
      status: { $in: ["approved", "active"] },
    });

    let upcomingVisitsCount = 0;
    let nextSlotDateTime = null;
    let minDiff = Infinity;

    for (const booking of activeBookings) {
      if (booking.schedule && Array.isArray(booking.schedule)) {
        for (const slot of booking.schedule) {
          if (!slot.date || !slot.startTime) continue;

          const slotDate = new Date(slot.date);
          const [hours, minutes] = slot.startTime.split(":").map(Number);
          const slotDateTime = new Date(
            slotDate.getFullYear(),
            slotDate.getMonth(),
            slotDate.getDate(),
            hours || 0,
            minutes || 0,
            0,
            0,
          );

          const diff = slotDateTime - today;
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

    let nextVisitLabel =
      lang === "en" ? "No upcoming visits" : "لا توجد زيارات قادمة";
    if (nextSlotDateTime) {
      const diffMinutes = Math.floor(minDiff / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);

      if (diffMinutes < 60) {
        nextVisitLabel =
          lang === "en"
            ? `Next in ${diffMinutes}m`
            : `التالي خلال ${diffMinutes} د`;
      } else if (diffHours < 24) {
        nextVisitLabel =
          lang === "en"
            ? `Next in ${diffHours}h`
            : `التالي خلال ${diffHours} س`;
      } else if (diffHours < 48) {
        const timeString = nextSlotDateTime.toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          numberingSystem: "latn",
        });
        nextVisitLabel =
          lang === "en" ? `Tomorrow, ${timeString}` : `غداً، ${timeString}`;
      } else {
        const dateString = nextSlotDateTime.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
          month: "short",
          day: "numeric",
          numberingSystem: "latn",
        });
        const timeString = nextSlotDateTime.toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          numberingSystem: "latn",
        });
        nextVisitLabel =
          lang === "en"
            ? `${dateString}, ${timeString}`
            : `${dateString}، ${timeString}`;
      }
    }

    // 4. Rating
    const rating = companion.rating || 5;

    // 5. Profile Completion
    let completion = 0;
    const missingFields = [];

    if (companion.bio && companion.bio.trim() !== "") {
      completion += 20;
    } else {
      missingFields.push("bio");
    }

    if (companion.hourlyRate && companion.hourlyRate > 0) {
      completion += 20;
    } else {
      missingFields.push("hourlyRate");
    }

    if (companion.skills && companion.skills.length > 0) {
      completion += 20;
    } else {
      missingFields.push("skills");
    }

    if (
      companion.availability &&
      companion.availability.some((a) => a.slots && a.slots.length > 0)
    ) {
      completion += 20;
    } else {
      missingFields.push("availability");
    }

    // Documents (last 20%)
    const docs = companion.documents || {};
    if (companion.companionType === "specialized") {
      let docPoints = 0;
      if (
        docs.nationalIdUrl &&
        docs.nationalIdUrl !== "placeholder_national_id.jpg"
      )
        docPoints += 20 / 3;
      else missingFields.push("documents.nationalIdUrl");

      if (
        docs.criminalRecordUrl &&
        docs.criminalRecordUrl !== "placeholder_criminal_record.jpg"
      )
        docPoints += 20 / 3;
      else missingFields.push("documents.criminalRecordUrl");

      if (docs.syndicateCardUrl) docPoints += 20 / 3;
      else missingFields.push("documents.syndicateCardUrl");

      completion += docPoints;
    } else {
      let docPoints = 0;
      if (
        docs.nationalIdUrl &&
        docs.nationalIdUrl !== "placeholder_national_id.jpg"
      )
        docPoints += 10;
      else missingFields.push("documents.nationalIdUrl");

      if (
        docs.criminalRecordUrl &&
        docs.criminalRecordUrl !== "placeholder_criminal_record.jpg"
      )
        docPoints += 10;
      else missingFields.push("documents.criminalRecordUrl");

      completion += docPoints;
    }

    completion = Math.round(completion);

    // Translateable keys (frontend will map them through next-intl)
    let completionMessageKey = "profileCompletionDefault";

    if (completion === 100) {
      completionMessageKey = "profileCompletionComplete";
    } else if (
      companion.companionType === "specialized" &&
      !docs.syndicateCardUrl
    ) {
      completionMessageKey = "profileCompletionSpecializedCertificates";
    } else if (
      !docs.nationalIdUrl ||
      docs.nationalIdUrl === "placeholder_national_id.jpg" ||
      !docs.criminalRecordUrl ||
      docs.criminalRecordUrl === "placeholder_criminal_record.jpg"
    ) {
      completionMessageKey = "profileCompletionIdentificationDocuments";
    } else {
      completionMessageKey = "profileCompletionDefault";
    }

    // Backward compatible raw message (in case frontend doesn't support keys yet)
    let completionMessage =
      lang === "en"
        ? "Complete your profile details to start receiving bookings."
        : "أكمل تفاصيل ملفك الشخصي لتلقي الحجوزات.";
    if (completion === 100) {
      completionMessage =
        lang === "en"
          ? "Your profile is fully complete and ready!"
          : "ملفك الشخصي مكتمل وجاهز!";
    } else if (
      companion.companionType === "specialized" &&
      !docs.syndicateCardUrl
    ) {
      completionMessage =
        lang === "en"
          ? "Finish setting up your specialized care certificates."
          : "أكمل إعداد شهادات الرعاية المتخصصة الخاصة بك.";
    } else if (
      !docs.nationalIdUrl ||
      docs.nationalIdUrl === "placeholder_national_id.jpg" ||
      !docs.criminalRecordUrl ||
      docs.criminalRecordUrl === "placeholder_criminal_record.jpg"
    ) {
      completionMessage =
        lang === "en"
          ? "Finish uploading your required identification documents."
          : "أكمل رفع مستندات الهوية المطلوبة.";
    }

    return res.status(200).json({
      status: "success",
      data: {
        totalRequests: {
          count: totalRequests,
          growthPercentage:
            growthPercentage >= 0
              ? `+${growthPercentage}%`
              : `${growthPercentage}%`,
        },
        activeBookings: {
          count: activeBookingsCount,
          statusLabel:
            activeBookingsCount > 0
              ? lang === "en"
                ? "Active"
                : "نشط"
              : lang === "en"
                ? "Inactive"
                : "غير نشط",
        },
        upcomingVisits: {
          count: upcomingVisitsCount,
          nextVisitLabel,
        },
        averageRating: {
          rating,
          stars: Math.round(rating),
        },
        profileCompletion: {
          percentage: completion,
          // key used by frontend i18n under companionDashboard
          messageKey: completionMessageKey,
          // raw text fallback (legacy)
          message: completionMessage,
          missingFields,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching companion dashboard stats:", error);
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

module.exports = {
  getCompanionSchedule,
  updateCompanionProfile,
  updateCompanionAvailability,
  getVerifiedCompanions,
  getCompanionById,
  getMyCompanionProfile,
  updateMyLocation,
  getCompanionDashboardStats,
};