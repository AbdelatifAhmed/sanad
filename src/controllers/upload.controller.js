const User = require("../models/user.schema");
const Companion = require("../models/companion.schema");
const { uploadToCloudinary, deleteFromCloudinary } = require("../config/cloudinary.config");

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
 */
exports.uploadCompanionDocuments = async (req, res) => {
  try {
    const userId = req.user?.id; // Assuming auth middleware sets req.user
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
    const handleUpload = async (fileBuffer, fieldName, isArray = false) => {
      const result = await uploadToCloudinary(fileBuffer, "sanad/documents");
      const docData = { url: result.secure_url, public_id: result.public_id };
      
      if (isArray) {
        if (!updates.documents[fieldName]) updates.documents[fieldName] = [];
        updates.documents[fieldName].push(docData);
      } else {
        // Delete old document if it exists to replace it
        if (updates.documents[fieldName] && updates.documents[fieldName].public_id) {
          await deleteFromCloudinary(updates.documents[fieldName].public_id);
        }
        updates.documents[fieldName] = docData;
      }
    };

    // 1. National ID Card
    if (files.nationalIdCard && files.nationalIdCard[0]) {
      uploadPromises.push(handleUpload(files.nationalIdCard[0].buffer, "nationalIdCard"));
    }

    // 2. Criminal Record
    if (files.criminalRecord && files.criminalRecord[0]) {
      uploadPromises.push(handleUpload(files.criminalRecord[0].buffer, "criminalRecord"));
    }

    // 3. Syndicate Card
    if (files.syndicateCard && files.syndicateCard[0]) {
      uploadPromises.push(handleUpload(files.syndicateCard[0].buffer, "syndicateCard"));
    }

    // 4. Medical Certificates (Array)
    if (files.medicalCertificates && files.medicalCertificates.length > 0) {
      for (const file of files.medicalCertificates) {
        uploadPromises.push(handleUpload(file.buffer, "medicalCertificates", true));
      }
    }

    // Execute all uploads concurrently
    await Promise.all(uploadPromises);

    // Update companion document with atomic operator
    await Companion.updateOne(
      { _id: companion._id },
      { $set: { documents: updates.documents } }
    );

    res.status(200).json({
      message: "Documents uploaded successfully",
      documents: updates.documents,
    });
  } catch (error) {
    console.error("Upload Companion Documents Error:", error);
    res.status(500).json({ message: "Internal server error during upload" });
  }
};
