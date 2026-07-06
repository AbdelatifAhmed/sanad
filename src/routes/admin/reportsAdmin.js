const express = require('express');
const router  = express.Router();
const { getReports } = require('../../controllers/admin/reportsController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin }      = require('../../middleware/RoleMiddleware');

router.use(authenticate, isAdmin);

// GET /api/admin/reports
router.get('/', getReports);

module.exports = router;
