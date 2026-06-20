const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/upload.controller");
const uploadMiddleware = require("../middleware/upload.middleware");
// Assuming there is an auth middleware, we should protect these routes
// const { authenticate } = require("../middleware/auth.middleware");

// Route: Upload User Avatar
// Use authenticate middleware here when integrating with actual auth system
// e.g., router.post("/avatar", authenticate, uploadMiddleware.single("avatar"), uploadController.uploadUserAvatar);
router.post(
  "/avatar",
  // add auth middleware here
  (req, res, next) => {
    // Mock user for testing if no auth middleware is provided yet
    if (!req.user) req.user = { id: req.body.userId || "mock_user_id" }; 
    next();
  },
  uploadMiddleware.single("avatar"),
  uploadController.uploadUserAvatar
);

// Route: Upload Companion Documents
// e.g., router.post("/companion/documents", authenticate, uploadMiddleware.fields([...]), uploadController.uploadCompanionDocuments);
router.post(
  "/companion/documents",
  // add auth middleware here
  (req, res, next) => {
    // Mock user for testing if no auth middleware is provided yet
    if (!req.user) req.user = { id: req.body.userId || "mock_user_id" }; 
    next();
  },
  uploadMiddleware.fields([
    { name: "nationalIdCard", maxCount: 1 },
    { name: "criminalRecord", maxCount: 1 },
    { name: "syndicateCard", maxCount: 1 },
    { name: "medicalCertificates", maxCount: 5 }, // Allow up to 5 certificates
  ]),
  uploadController.uploadCompanionDocuments
);

module.exports = router;
