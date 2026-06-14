const User = require("../../models/user.schema");
const messages = require("../../utils/messages");

const toggleBan = async (req, res) => {
  try {
    const lang = req.lang || "en";
    const { id } = req.params;
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        status: "fail",
        message: messages.admin.banSelf[lang],
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: messages.common.notFound[lang],
      });
    }
    user.isBanned = !user.isBanned;
    await user.save();

    return res.status(200).json({
      status: "success",
      message: messages.admin.banSuccess[lang],
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isBanned: user.isBanned,
        },
      },
    });
  } catch (error) {
    console.error("Error in toggle-ban controller:", error);
    return res.status(500).json({
      status: "error",
      message: messages.common.serverError[req.lang || "en"],
      error: error.message,
    });
  }
};

const parsePagination = (query) => {
  const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 200);
  const page = Math.max(parseInt(query.page) || 1, 1);
  const skip = (page - 1) * limit;
  return { limit, page, skip };
};

const getAllUsers = async (req, res) => {
  try {
    const { limit, page, skip } = parsePagination(req.query);

    const [users, total] = await Promise.all([
      User.find()
        .select("-passwordHash -__v")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      User.countDocuments(),
    ]);

    return res.status(200).json({
      status: "success",
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Error in getAllUsers controller:", error);
    return res.status(500).json({
      status: "error",
      message: messages.common.serverError[req.lang || "en"],
      error: error.message,
    });
  }
};

module.exports = {
  toggleBan,
  getAllUsers,
};
