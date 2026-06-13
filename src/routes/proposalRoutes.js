const express = require("express");
const router = express.Router();
const { sendProposal, getProposalsForJob, updateProposalStatus } = require("../controllers/proposalController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/RoleMiddleware");
router.post("/", authenticate, authorizeRoles("companion"), sendProposal);

router.patch("/:proposalId/status", authenticate, authorizeRoles("family", "admin"), updateProposalStatus);

router.get("/job/:jobId", authenticate, authorizeRoles("family", "admin"), getProposalsForJob);

module.exports = router;