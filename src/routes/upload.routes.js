const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/upload.controller");
const uploadMiddleware = require("../middleware/upload.middleware");
const { authenticate } = require("../middleware/authMiddleware");

// Route: Upload User Avatar
router.post(
  "/avatar",
  authenticate,
  uploadMiddleware.single("avatar"),
  uploadController.uploadUserAvatar
);

// Route: Upload Companion Documents
router.post(
  "/companion/documents",
  authenticate,
  uploadMiddleware.fields([
    { name: "nationalIdCard", maxCount: 1 },
    { name: "criminalRecord", maxCount: 1 },
    { name: "syndicateCard", maxCount: 1 },
    { name: "Certificates", maxCount: 5 }, // Allow up to 5 certificates
  ]),
  uploadController.uploadCompanionDocuments
);

// Route: Upload Public File (Unauthenticated, used for Registration)
router.post(
  "/public",
  uploadMiddleware.single("file"),
  uploadController.uploadPublicFile
);

module.exports = router;
