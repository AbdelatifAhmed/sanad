const express = require("express");
const router = express.Router();
const {
  createJobPost,
  getJobPostsForCompanions,
  getJobPostById,
  getServiceTypes,
  updateJobPost,
  deleteJobPost
} = require("../controllers/jobPostController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/RoleMiddleware");

router.post(
  "/",
  authenticate,
  authorizeRoles("family", "admin"),
  createJobPost,
);

router.patch(
  "/:id",
  authenticate,
  authorizeRoles("family", "admin"),
  updateJobPost,
);

router.get("/service-types", authenticate, getServiceTypes);

router.get("/", authenticate, authorizeRoles("companion", "admin"), getJobPostsForCompanions)
  .put("/", authenticate, authorizeRoles("companion", "admin"), getJobPostsForCompanions);

router.get("/:id", authenticate, getJobPostById);
router.delete("/:id", authenticate, authorizeRoles("family", "admin"), deleteJobPost);

module.exports = router;
