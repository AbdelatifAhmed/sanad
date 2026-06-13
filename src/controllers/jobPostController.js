const JobPost = require("../models/jobPost.schema");
const Family = require("../models/family.schema");
const messages = require("../utils/messages");

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
      beneficiaryId
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

const getJobPostsForCompanions = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { serviceType, skills, governorate, city, nearMe, coordinates, maxDistanceInKm } = queryOrBody(req);
    
    let filter = { status: "open" }; 

    if (serviceType) {
      filter.serviceType = serviceType;
    }

    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      filter.requiredSkills = { $in: skillsArray };
    }

    if (governorate) filter["location.governorate"] = governorate;
    if (city) filter["location.city"] = city;

    if (nearMe === "true" || nearMe === true) {
      if (!coordinates || coordinates.length !== 2) {
        return res.status(400).json({ 
          status: "fail", 
          message: messages.jobPost.coordinatesRequired[lang] 
        });
      }
      
      const distanceInMeters = (parseInt(maxDistanceInKm) || 20) * 1000; 
      
      filter["location.geo"] = {
        $near: {
          $geometry: { type: "Point", coordinates: coordinates.map(Number) },
          $maxDistance: distanceInMeters
        }
      };
    }

    const jobs = await JobPost.find(filter)
      .populate("familyId", "name phone") 
      .populate("requiredSkills", "nameAr nameEn") 
      .sort({ createdAt: -1 });
    return res.status(200).json({
      status: "success",
      results: jobs.length,
      data: { jobs }
    });
  } catch (error) {
    console.error("Error fetching job posts:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const queryOrBody = (req) => {
  return req.method === "GET" ? req.query : req.body;
};

module.exports = {
  createJobPost,
  getJobPostsForCompanions
};