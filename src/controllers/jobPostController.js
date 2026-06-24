const JobPost = require("../models/jobPost.schema");
const Family = require("../models/family.schema");
const messages = require("../utils/messages");
const { sendNotification } = require('../services/notificationService');
const Proposal = require("../models/proposal.schema");

// شكل الداتا المرسلة من الفرونت اند
// {
//   "title": "مطلوب ممرض منزلي لحالة كبار سن",
//   "description": "رعاية جد يعاني من ضغط دم مرتفع ويحتاج لمتابعة مواعيد الأدوية وحقن وريدية",
//   "serviceType": "home_nursing",
//   "requiredSkills": ["65f12a...", "65f12b..."],
//   "budgetPerHour": 60,
//   "schedule": {
//     "workingDays": ["Saturday", "Monday", "Wednesday"],
//     "startTime": "09:00",
//     "endTime": "15:00",
//     "durationInWeeks": 4
//   },
//   "location": {
//     "coordinates": [31.2357, 30.0444],
//     "readableAddress": "ش الطيران، مدينة نصر",
//     "city": "مدينة نصر",
//     "governorate": "القاهرة"
//   }
// }

const createJobPost = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { 
      title, 
      description, 
      serviceType, 
      requiredSkills, 
      budgetPerHour, 
      location,
      schedule,
      beneficiaryId,
      preferredCaregiverGender
    } = req.body;

    if (!title || !description || !serviceType || !budgetPerHour || !location || !schedule || !beneficiaryId) {
      return res.status(400).json({ 
        status: "fail", 
        message: messages.jobPost.missingFields[lang] 
      });
    }

    const { workingDays, startTime, endTime, durationInWeeks } = schedule;
    if (!workingDays || !Array.isArray(workingDays) || workingDays.length === 0 || !startTime || !endTime || !durationInWeeks) {
      return res.status(400).json({ 
        status: "fail", 
        message: messages.jobPost.invalidSchedule[lang] 
      });
    }

    if (!location.coordinates || location.coordinates.length !== 2 || !location.city || !location.governorate) {
      return res.status(400).json({ 
        status: "fail", 
        message: messages.jobPost.invalidLocation[lang] 
      });
    }

    // Validate that beneficiary exists in the family profile
    const familyProfile = await Family.findOne({ familyId: req.user._id });
    if (!familyProfile) {
      return res.status(404).json({ 
        status: "fail", 
        message: messages.booking.profileNotFound[lang] 
      });
    }

    const beneficiaryExists = familyProfile.beneficiaries.some(
      (b) => b._id.toString() === beneficiaryId.toString()
    );
    if (!beneficiaryExists) {
      return res.status(404).json({ 
        status: "fail", 
        message: messages.booking.beneficiaryNotFound[lang] 
      });
    }

    const newJob = await JobPost.create({
      familyId: req.user._id, 
      beneficiaryId,
      title,
      description,
      serviceType,
      requiredSkills, 
      budgetPerHour,
      ...(preferredCaregiverGender ? { preferredCaregiverGender } : {}),
      schedule: {
        workingDays,
        startTime,
        endTime,
        durationInWeeks
      },
      location: {
        geo: { type: "Point", coordinates: location.coordinates }, // [longitude, latitude]
        readableAddress: location.readableAddress,
        city: location.city,
        governorate: location.governorate
      }
    });

    // Notify family (creator) that job post was created
    try {
      await sendNotification(
        req.user._id,
        req.user._id,
        lang === 'en' ? 'Job Post Created' : 'تم إنشاء طلب العمل',
        lang === 'en'
          ? `Your job post "${title}" has been created and is now open for proposals.`
          : `تم إنشاء طلب العمل "${title}" وهو الآن متاح لتلقي العروض.`,
        'jobpost',
        req.io
      );
    } catch (err) {
      console.error('Failed to send job post creation notification:', err.message);
    }

    return res.status(201).json({
      status: "success",
      message: messages.jobPost.successCreated[lang],
      data: { jobPost: newJob }
    });
  } catch (error) {
    console.error("Error creating job post:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const getServiceTypes = async (req, res) => {
  try {
    const serviceTypes = JobPost.schema.path("serviceType").enumValues;
    return res.status(200).json({
      status: "success",
      data: { serviceTypes }
    });
  } catch (error) {
    console.error("Error fetching service types:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const getJobPostsForCompanions = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const {
      serviceType,
      skills,
      governorate,
      city,
      location,
      nearMe,
      coordinates,
      maxDistanceInKm,
      date,
      startDate,
      endDate,
      page,
      limit
    } = queryOrBody(req);
    
    let filter = { status: "open" }; 

    if (serviceType && serviceType !== "all") {
      filter.serviceType = serviceType;
    }

    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      filter.requiredSkills = { $in: skillsArray };
    }

    if (governorate) filter["location.governorate"] = governorate;
    if (city) filter["location.city"] = city;
    
    if (location && location !== "all") {
      filter.$or = [
        { "location.governorate": { $regex: new RegExp(location, "i") } },
        { "location.city": { $regex: new RegExp(location, "i") } }
      ];
    }

    if (nearMe === "true" || nearMe === true) {
      let coords = coordinates;
      
      if (!coords && req.user && req.user.location && req.user.location.geo && req.user.location.geo.coordinates && req.user.location.geo.coordinates.length === 2) {
        coords = req.user.location.geo.coordinates;
      }
      
      if (typeof coords === "string") {
        coords = coords.split(",").map(Number);
      }
      
      if (!coords || coords.length !== 2) {
        return res.status(400).json({ 
          status: "fail", 
          message: messages.jobPost.coordinatesRequired[lang] 
        });
      }
      
      const distanceInMeters = (parseInt(maxDistanceInKm) || 20) * 1000; 
      
      filter["location.geo"] = {
        $near: {
          $geometry: { type: "Point", coordinates: coords.map(Number) },
          $maxDistance: distanceInMeters
        }
      };
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          start.setHours(0, 0, 0, 0);
          filter.createdAt.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = end;
        }
      }
      if (Object.keys(filter.createdAt).length === 0) {
        delete filter.createdAt;
      }
    } else if (date && date !== "all") {
      const now = new Date();
      if (date === "today") {
        const startOfToday = new Date(now.setHours(0, 0, 0, 0));
        filter.createdAt = { $gte: startOfToday };
      } else if (date === "tomorrow") {
        const startOfYesterday = new Date(now.setDate(now.getDate() - 1));
        startOfYesterday.setHours(0, 0, 0, 0);
        filter.createdAt = { $gte: startOfYesterday };
      }
    }

    // Pagination
    let pageNum = parseInt(page) || 1;
    let limitNum = parseInt(limit) || 10;
    if (pageNum < 1) pageNum = 1;
    if (limitNum < 1) limitNum = 10;
    const skip = (pageNum - 1) * limitNum;

    const totalJobs = await JobPost.countDocuments(filter);
    const totalPages = Math.ceil(totalJobs / limitNum) || 1;

    const jobs = await JobPost.find(filter)
      .populate("familyId", "name phone avatar location") 
      .populate("requiredSkills", "nameAr nameEn") 
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const jobsWithApplicants = await Promise.all(
      jobs.map(async (job) => {
        const count = await Proposal.countDocuments({ jobPostId: job._id });
        return {
          ...job.toObject(),
          applicantsCount: count
        };
      })
    );

    return res.status(200).json({
      status: "success",
      data: {
        jobs: jobsWithApplicants,
        pagination: {
          totalJobs,
          totalPages,
          currentPage: pageNum,
          limit: limitNum
        }
      }
    });
  } catch (error) {
    console.error("Error fetching job posts:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const getJobPostById = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { id } = req.params;
    const job = await JobPost.findById(id)
      .populate("familyId", "name phone avatar location")
      .populate("requiredSkills", "nameAr nameEn");
    if (!job) {
      return res.status(404).json({ 
        status: "fail",
        message: messages.jobPost.notFound[lang]
      });
    }

    // Find the beneficiary details from the Family profile
    const familyProfile = await Family.findOne({ familyId: job.familyId._id });
    let beneficiary = null;
    if (familyProfile && familyProfile.beneficiaries) {
      beneficiary = familyProfile.beneficiaries.find(
        (b) => b._id.toString() === job.beneficiaryId.toString()
      );
    }

    const jobObject = job.toObject();
    if (beneficiary) {
      jobObject.beneficiary = {
        name: beneficiary.name,
        age: beneficiary.age,
        gender: beneficiary.gender,
        category: beneficiary.category,
        conditionDetails: beneficiary.conditionDetails,
        interests: beneficiary.interests
      };
    }

    // Calculate distance if coordinates are available
    let approxDistance = null;
    let coords = null;
    
    // Check if coordinates were passed in the query params (e.g. GET /job-posts/:id?coordinates=lon,lat)
    if (req.query.coordinates) {
      if (typeof req.query.coordinates === "string") {
        coords = req.query.coordinates.split(",").map(Number);
      } else if (Array.isArray(req.query.coordinates)) {
        coords = req.query.coordinates.map(Number);
      }
    }
    
    // Fallback to req.user location if not passed in query params
    if ((!coords || coords.length !== 2) && req.user && req.user.location && req.user.location.geo && req.user.location.geo.coordinates && req.user.location.geo.coordinates.length === 2) {
      coords = req.user.location.geo.coordinates;
    }
    
    if (coords && coords.length === 2 && job.location && job.location.geo && job.location.geo.coordinates && job.location.geo.coordinates.length === 2) {
      const [lon1, lat1] = coords;
      const [lon2, lat2] = job.location.geo.coordinates;
      
      const R = 6371; // Radius of the earth in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const d = R * c; // Distance in km
      approxDistance = d.toFixed(1); // e.g. "3.5" or "12.1"
    }

    if (approxDistance !== null) {
      jobObject.approxDistance = approxDistance;
    }

    // Check if the current user is a companion and has already applied to this job post
    let hasApplied = false;
    let appliedProposalStatus = null;
    if (req.user && req.user.role === "companion") {
      const existingProposal = await Proposal.findOne({ jobPostId: id, companionId: req.user._id });
      if (existingProposal) {
        hasApplied = true;
        appliedProposalStatus = existingProposal.status; // "pending" | "accepted" | "rejected"
      }
    }

    jobObject.hasApplied = hasApplied;
    jobObject.appliedProposalStatus = appliedProposalStatus;

    return res.status(200).json({
      status: "success",
      data: { job: jobObject }
    });
  } catch (error) {
    console.error("Error fetching job post by ID:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const deleteJobPost = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { id } = req.params;

    const job = await JobPost.findById(id);
    if (!job) {
      return res.status(404).json({
        status: "fail",
        message: messages.jobPost.notFound[lang]
      });
    }

    // Only creator (familyId) or admin can delete
    if (job.familyId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        status: "fail",
        message: messages.common.forbidden[lang]
      });
    }

    // Perform deletion
    await JobPost.findByIdAndDelete(id);

    // Cascade deletion of proposals
    await Proposal.deleteMany({ jobPostId: id });

    return res.status(200).json({
      status: "success",
      message: messages.jobPost.successDeleted[lang]
    });
  } catch (error) {
    console.error("Error deleting job post:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const queryOrBody = (req) => {
  return req.method === "GET" ? req.query : req.body;
};

module.exports = {
  createJobPost,
  getJobPostsForCompanions,
  getJobPostById,
  getServiceTypes,
  deleteJobPost
};