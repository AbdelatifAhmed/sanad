const express = require("express");
const router = express.Router();
const {
  createJobPost,
  getJobPostsForCompanions,
} = require("../controllers/jobPostController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.post(
  "/",
  authenticate,
  authorizeRoles("family", "admin"),
  createJobPost,
);

router
  .get("/", authenticate, authorizeRoles("companion", "admin"), getJobPostsForCompanions)
  .post("/", authenticate, authorizeRoles("companion", "admin"), getJobPostsForCompanions);
