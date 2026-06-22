const express = require("express");
const router = express.Router();
const {
  createJobPost,
  getJobPostsForCompanions,
  getJobPostById,
  getServiceTypes
} = require("../controllers/jobPostController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/RoleMiddleware");

router.post(
  "/",
  authenticate,
  authorizeRoles("family", "admin"),
  createJobPost,
);

router.get("/service-types", authenticate, getServiceTypes);

router.get("/", authenticate, authorizeRoles("companion", "admin"), getJobPostsForCompanions)
  .put("/", authenticate, authorizeRoles("companion", "admin"), getJobPostsForCompanions);

router.get("/:id", authenticate, getJobPostById);
module.exports = router;
