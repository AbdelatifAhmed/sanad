const JobPost = require("../models/jobPost.schema");

const createJobPost = async (req, res) => {
  try {
    const { title, description, serviceType, requiredSkills, budgetPerHour, location } = req.body;

    if (!title || !description || !serviceType || !budgetPerHour || !location) {
      return res.status(400).json({ status: "fail", message: "جميع الحقول الأساسية مطلوبة" });
    }

    if (!location.coordinates || location.coordinates.length !== 2 || !location.city || !location.governorate) {
      return res.status(400).json({ status: "fail", message: "بيانات الموقع الجغرافي [الإحداثيات، المدينة، المحافظة] غير كاملة" });
    }

    const newJob = await JobPost.create({
      familyId: req.user._id, 
      title,
      description,
      serviceType,
      requiredSkills, 
      budgetPerHour,
      location: {
        geo: { type: "Point", coordinates: location.coordinates }, // [longitude, latitude]
        readableAddress: location.readableAddress,
        city: location.city,
        governorate: location.governorate
      }
    });

    return res.status(201).json({
      status: "success",
      message: "تم إنشاء طلب الوظيفة بنجاح",
      data: { jobPost: newJob }
    });
  } catch (error) {
    console.error("Error creating job post:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const getJobPostsForCompanions = async (req, res) => {
  try {
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
        return res.status(400).json({ status: "fail", message: "إحداثيات المرافق الحالية مطلوبة لحساب الأقرب" });
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