const express = require('express');
const router = express.Router();
const { updateFamilyProfile } = require('../controllers/familyController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);
router.put('/profile', updateFamilyProfile);

module.exports = router;
