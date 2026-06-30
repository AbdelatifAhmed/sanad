const User = require("../../models/user.schema");
const Family = require("../../models/family.schema");
const JobPost = require("../../models/jobPost.schema");
const Booking = require("../../models/booking.schema");
const messages = require("../../utils/messages");

// Helper for parsing page numbers and limits
const parsePagination = (query) => {
  const limit = Math.min(Math.max(parseInt(query.limit) || 10, 1), 100);
  const page = Math.max(parseInt(query.page) || 1, 1);
  const skip = (page - 1) * limit;
  return { limit, page, skip };
};

// GET /api/admin/families
exports.getAllFamilies = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { limit, page, skip } = parsePagination(req.query);
    const { search, status, sortBy = "createdAt", sortOrder = "desc" } = req.query;

    // Build user filter query
    const userQuery = { role: "family" };

    if (status === "suspended") {
      userQuery.isBanned = true;
    } else if (status === "active") {
      userQuery.isBanned = false;
    }

    if (search) {
      userQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    // Determine sort field and order
    const sortParams = {};
    sortParams[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Fetch users meeting filters + global summary stats in parallel
    const [users, total, totalActive, totalSuspended, allFamilyIds] = await Promise.all([
      User.find(userQuery)
        .select("-passwordHash -__v")
        .sort(sortParams)
        .limit(limit)
        .skip(skip)
        .lean(),
      User.countDocuments(userQuery),
      User.countDocuments({ role: "family", isBanned: false }),
      User.countDocuments({ role: "family", isBanned: true }),
      User.find({ role: "family" }).select("_id").lean()
    ]);

    // Compute global stats (elderly + active requests) across ALL families
    const allIds = allFamilyIds.map(u => u._id);
    const [allFamilyProfiles, allActiveRequests] = await Promise.all([
      Family.find({ familyId: { $in: allIds } }).select("beneficiaries").lean(),
      Booking.countDocuments({ familyId: { $in: allIds }, status: { $in: ["approved", "active"] } })
    ]);
    const totalElderly = allFamilyProfiles.reduce((sum, f) => sum + (f.beneficiaries?.length || 0), 0);

    if (users.length === 0) {
      return res.status(200).json({
        status: "success",
        data: { families: [] },
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore: false
        },
        stats: { total: totalActive + totalSuspended, totalActive, totalSuspended, totalElderly, totalActiveRequests: allActiveRequests }
      });
    }

    const userIds = users.map(u => u._id);

    // Fetch matching Family profiles, job posts, and bookings in bulk
    const [familyProfiles, jobPosts, bookings] = await Promise.all([
      Family.find({ familyId: { $in: userIds } }).lean(),
      JobPost.find({ familyId: { $in: userIds } }).select("familyId status").lean(),
      Booking.find({ familyId: { $in: userIds } }).select("familyId status").lean()
    ]);

    // Map profiles and statistics for quick lookup
    const familyMap = new Map(familyProfiles.map(f => [f.familyId.toString(), f]));
    
    // Group requests (job posts) count
    const jobPostCountMap = new Map();
    for (const post of jobPosts) {
      const idStr = post.familyId.toString();
      jobPostCountMap.set(idStr, (jobPostCountMap.get(idStr) || 0) + 1);
    }

    // Group active bookings count
    const activeBookingCountMap = new Map();
    for (const booking of bookings) {
      if (["approved", "active"].includes(booking.status)) {
        const idStr = booking.familyId.toString();
        activeBookingCountMap.set(idStr, (activeBookingCountMap.get(idStr) || 0) + 1);
      }
    }

    // Format output matching list requirements
    const formattedFamilies = users.map(user => {
      const profile = familyMap.get(user._id.toString());
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar || null,
        isBanned: user.isBanned,
        createdAt: user.createdAt,
        city: profile?.address?.city || user.location?.city || "N/A",
        area: profile?.address?.area || user.location?.governorate || "N/A",
        elderlyCount: profile?.beneficiaries?.length || 0,
        activeRequests: jobPostCountMap.get(user._id.toString()) || 0,
        activeBookings: activeBookingCountMap.get(user._id.toString()) || 0
      };
    });

    return res.status(200).json({
      status: "success",
      data: { families: formattedFamilies },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      },
      stats: {
        total: totalActive + totalSuspended,
        totalActive,
        totalSuspended,
        totalElderly,
        totalActiveRequests: allActiveRequests
      }
    });
  } catch (error) {
    console.error("Error in getAllFamilies admin controller:", error);
    return res.status(500).json({
      status: "error",
      message: messages.common.serverError[req.lang || "en"],
      error: error.message
    });
  }
};

// GET /api/admin/families/:id
exports.getFamilyDetails = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { id } = req.params;

    const user = await User.findById(id).select("-passwordHash -__v").lean();
    if (!user || user.role !== "family") {
      return res.status(404).json({
        status: "fail",
        message: messages.common.notFound[lang]
      });
    }

    // Fetch profiles, job posts, and bookings
    const [profile, jobPosts, bookings] = await Promise.all([
      Family.findOne({ familyId: id }).lean(),
      JobPost.find({ familyId: id }).sort({ createdAt: -1 }).lean(),
      Booking.find({ familyId: id })
        .populate("companionId", "name phone email avatar rating")
        .sort({ createdAt: -1 })
        .lean()
    ]);

    // Calculate stats
    const totalRequests = jobPosts.length;
    const activeRequests = jobPosts.filter(j => j.status === "open").length + 
                           bookings.filter(b => ["pending", "approved", "active"].includes(b.status)).length;
    const completedRequests = bookings.filter(b => b.status === "completed").length;
    const totalElderly = profile?.beneficiaries?.length || 0;

    // Unique caregivers list
    const caregiversMap = new Map();
    for (const b of bookings) {
      if (b.companionId && !caregiversMap.has(b.companionId._id.toString())) {
        caregiversMap.set(b.companionId._id.toString(), {
          _id: b.companionId._id,
          name: b.companionId.name,
          phone: b.companionId.phone,
          email: b.companionId.email,
          avatar: b.companionId.avatar || null,
          rating: b.companionId.rating || 5,
          status: b.status,
          startDate: b.startDate,
          endDate: b.endDate
        });
      }
    }
    const assignedCaregivers = Array.from(caregiversMap.values());

    return res.status(200).json({
      status: "success",
      data: {
        family: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar || null,
          isBanned: user.isBanned,
          createdAt: user.createdAt,
          location: user.location || null
        },
        profile: profile ? {
          address: profile.address,
          beneficiaries: profile.beneficiaries || []
        } : null,
        requests: jobPosts,
        bookings: bookings,
        assignedCaregivers,
        stats: {
          totalRequests,
          activeRequests,
          completedRequests,
          totalElderly
        }
      }
    });
  } catch (error) {
    console.error("Error in getFamilyDetails admin controller:", error);
    return res.status(500).json({
      status: "error",
      message: messages.common.serverError[req.lang || "en"],
      error: error.message
    });
  }
};

// PATCH /api/admin/families/:id/toggle-ban
exports.toggleBanFamily = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { id } = req.params;

    // Check that admin is not banning themselves
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        status: "fail",
        message: messages.admin.banSelf[lang]
      });
    }

    const user = await User.findById(id);
    if (!user || user.role !== "family") {
      return res.status(404).json({
        status: "fail",
        message: messages.common.notFound[lang]
      });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    return res.status(200).json({
      status: "success",
      message: messages.admin.banSuccess[lang],
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          isBanned: user.isBanned
        }
      }
    });
  } catch (error) {
    console.error("Error in toggleBanFamily admin controller:", error);
    return res.status(500).json({
      status: "error",
      message: messages.common.serverError[req.lang || "en"],
      error: error.message
    });
  }
};
