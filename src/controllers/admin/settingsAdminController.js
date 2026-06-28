const Settings = require("../../models/settings.schema");
const messages = require("../../utils/messages");

// GET /api/admin/settings
exports.getSettings = async (req, res) => {
  try {
    // Find settings or create default one if none exists
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    return res.status(200).json({
      status: "success",
      data: { settings }
    });
  } catch (error) {
    console.error("Error in getSettings admin controller:", error);
    return res.status(500).json({
      status: "error",
      message: messages.common.serverError[req.lang || "en"],
      error: error.message
    });
  }
};

// PUT /api/admin/settings
exports.updateSettings = async (req, res) => {
  try {
    const updateData = req.body;

    // Retrieve or create singleton settings document
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    // Merge nested fields if needed (e.g. passwordPolicy)
    if (updateData.passwordPolicy) {
      updateData.passwordPolicy = {
        ...settings.passwordPolicy.toObject(),
        ...updateData.passwordPolicy
      };
    }

    // Update with new values
    const updatedSettings = await Settings.findByIdAndUpdate(
      settings._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      status: "success",
      message: "Platform settings updated successfully.",
      data: { settings: updatedSettings }
    });
  } catch (error) {
    console.error("Error in updateSettings admin controller:", error);
    return res.status(500).json({
      status: "error",
      message: messages.common.serverError[req.lang || "en"],
      error: error.message
    });
  }
};
