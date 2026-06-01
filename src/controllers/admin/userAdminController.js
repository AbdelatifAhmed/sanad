const User = require("../../models/user.schema");

// Toggle user ban status
const toggleBan = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent administrators from banning themselves
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        status: "fail",
        message: "You cannot ban or toggle your own account status."
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found."
      });
    }

    // Toggle the ban status
    user.isBanned = !user.isBanned;
    await user.save();

    return res.status(200).json({
      status: "success",
      message: `User account has been successfully ${user.isBanned ? "banned" : "unbanned"}.`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isBanned: user.isBanned
        }
      }
    });
  } catch (error) {
    console.error("Error in toggle-ban controller:", error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while toggling the user ban status.",
      error: error.message
    });
  }
};

module.exports = {
  toggleBan
};
