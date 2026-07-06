const User = require("../models/user.schema");
const Companion = require("../models/companion.schema");
const { uploadToCloudinary, deleteFromCloudinary } = require("../config/cloudinary.config");
const { sendNotification } = require("../services/notificationService");

/**
 * Upload User Avatar
 * Updates the user's avatar and deletes the old one from Cloudinary if it exists.
 */
exports.uploadUserAvatar = async (req, res) => {
  try {
    const userId = req.user?.id; // Assuming auth middleware sets req.user
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    if (!req.file) {
      return res.status(400).json({ message: "No image provided" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, "sanad/avatars");

    // If user already has an avatar with a public_id, delete it to save space
    if (user.avatar && user.avatar.public_id) {
      await deleteFromCloudinary(user.avatar.public_id);
    }

    // Update the database
    const newAvatar = {
      url: result.secure_url,
      public_id: result.public_id,
    };

    user.avatar = newAvatar;
    await user.save();

    res.status(200).json({
      message: "Avatar updated successfully",
      avatar: newAvatar,
    });
  } catch (error) {
    console.error("Upload Avatar Error:", error);
    res.status(500).json({ message: "Internal server error during upload" });
  }
};

/**
 * Upload Companion Documents
 * Handles uploading National ID, Criminal Record, Medical Certificates, and Syndicate Card.
 *
 * Status transition:
 *   If the companion is currently "under_review" (admin requested more documents)
 *   and documents are uploaded, automatically transition back to "pending" so the
 *   caregiver re-enters the admin approval queue.
 *   Notifications are sent to:
 *     - The caregiver: documents received, application back in queue.
 *     - All admin users: caregiver resubmitted, awaiting review.
 */
exports.uploadCompanionDocuments = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Fetch the companion profile associated with the user
    const companion = await Companion.findOne({ userId });
    if (!companion) {
      return res.status(404).json({ message: "Companion profile not found" });
    }

    const files = req.files;
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ message: "No documents provided" });
    }

    const uploadPromises = [];
    const updates = { documents: { ...companion.documents?.toObject() } };

    // Helper to push upload promise
    const handleUpload = async (fileBuffer, fieldName, isArray = false, certName = null) => {
      const result = await uploadToCloudinary(fileBuffer, "sanad/documents");
      const docData = { url: result.secure_url, public_id: result.public_id };
      if (certName) docData.name = certName;

      if (isArray) {
        if (!updates.documents[fieldName]) updates.documents[fieldName] = [];
        updates.documents[fieldName].push(docData);
      } else {
        // Delete old document from Cloudinary if it exists
        if (updates.documents[fieldName]?.public_id) {
          await deleteFromCloudinary(updates.documents[fieldName].public_id);
        }
        updates.documents[fieldName] = docData;
      }
    };

    // 1. National ID Card
    if (files.nationalIdCard?.[0]) {
      uploadPromises.push(handleUpload(files.nationalIdCard[0].buffer, "nationalIdCard"));
    }

    // 2. Criminal Record
    if (files.criminalRecord?.[0]) {
      uploadPromises.push(handleUpload(files.criminalRecord[0].buffer, "criminalRecord"));
    }

    // 3. Syndicate Card
    if (files.syndicateCard?.[0]) {
      uploadPromises.push(handleUpload(files.syndicateCard[0].buffer, "syndicateCard"));
    }

    // 4. Certificates (Array)
    if (files.Certificates?.length > 0) {
      let certNames = req.body.certificateName;
      if (!Array.isArray(certNames)) certNames = certNames ? [certNames] : [];
      for (let i = 0; i < files.Certificates.length; i++) {
        const certName = certNames[i] || `Certificate ${i + 1}`;
        uploadPromises.push(handleUpload(files.Certificates[i].buffer, "Certificates", true, certName));
      }
    }

    // Execute all uploads concurrently
    await Promise.all(uploadPromises);

    // ── Build the update payload ───────────────────────────────────────────
    const dbUpdate = { $set: { documents: updates.documents } };

    // ── Status transition: under_review → pending ─────────────────────────
    const wasUnderReview = companion.verificationStatus === "under_review";
    if (wasUnderReview) {
      dbUpdate.$set.verificationStatus    = "pending";
      dbUpdate.$set.requestMoreInfoMessage = "";   // clear the admin request message
    }

    await Companion.updateOne({ _id: companion._id }, dbUpdate);

    // ── Notifications & activity on resubmission ──────────────────────────
    if (wasUnderReview) {
      const io = req.io || global.io || null;

      // Fetch caregiver's user record for their name
      const caregiverUser = await User.findById(userId).select("name");
      const caregiverName = caregiverUser?.name || "The caregiver";

      // 1. Notify the caregiver: documents received
      try {
        await sendNotification(
          userId,
          null,
          "Documents Received ✅",
          "Your documents have been received successfully. Your application is back in the review queue and will be assessed shortly.",
          "system_alert",
          io
        );
      } catch (err) {
        console.error("Failed to notify caregiver on resubmission:", err.message);
      }

      // 2. Notify all admin users: caregiver resubmitted
      try {
        const adminUsers = await User.find({ role: "admin" }).select("_id");
        await Promise.all(
          adminUsers.map((admin) =>
            sendNotification(
              admin._id,
              userId,
              "Caregiver Resubmitted Documents 📋",
              `${caregiverName} has resubmitted the requested documents and is awaiting your review.`,
              "system_alert",
              io
            ).catch((err) =>
              console.error(`Failed to notify admin ${admin._id}:`, err.message)
            )
          )
        );
      } catch (err) {
        console.error("Failed to notify admins on resubmission:", err.message);
      }
    }

    // Return updated documents
    const updatedCompanion = await Companion.findById(companion._id).select("documents verificationStatus");

    return res.status(200).json({
      message: wasUnderReview
        ? "Documents uploaded successfully. Your application status has been updated to Pending for admin review."
        : "Documents uploaded successfully",
      statusChanged: wasUnderReview,
      verificationStatus: updatedCompanion.verificationStatus,
      documents: updatedCompanion.documents,
    });
  } catch (error) {
    console.error("Upload Companion Documents Error:", error);
    res.status(500).json({ message: "Internal server error during upload" });
  }
};

/**
 * Upload Public File (e.g., during Registration)
 * Handles uploading a single file and returns { url, public_id } without needing auth.
 */
exports.uploadPublicFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    // Upload to Cloudinary under a public/temp folder
    const result = await uploadToCloudinary(req.file.buffer, "sanad/public_documents");

    res.status(200).json({
      message: "File uploaded successfully",
      file: {
        url: result.secure_url,
        public_id: result.public_id,
      },
    });
  } catch (error) {
    console.error("Public Upload Error:", error);
    res.status(500).json({ message: "Internal server error during public upload" });
  }
};
