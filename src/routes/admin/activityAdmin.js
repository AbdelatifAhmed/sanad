const express = require('express');
const router  = express.Router();
const { getActivityFeed } = require('../../controllers/admin/activityController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin }      = require('../../middleware/RoleMiddleware');

router.use(authenticate, isAdmin);

// GET /api/admin/activity
router.get('/', getActivityFeed);

module.exports = router;
