const express = require('express');
const router = express.Router();
const { updateFamilyProfile } = require('../controllers/familyController');
const { authenticate } = require('../middleware/authMiddleware');
const { isFamily } = require('../middleware/RoleMiddleware');

router.use(authenticate, isFamily);
router.put('/profile', updateFamilyProfile);
router.patch('/profile', updateFamilyProfile);

module.exports = router;
