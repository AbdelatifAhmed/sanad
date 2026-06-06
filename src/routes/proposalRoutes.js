const express = require("express");
const router = express.Router();
const { sendProposal, getProposalsForJob } = require("../controllers/proposalController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
router.post("/", authenticate, authorizeRoles("companion"), sendProposal);

router.get("/job/:jobId", authenticate, authorizeRoles("family", "admin"), getProposalsForJob);

module.exports = router;