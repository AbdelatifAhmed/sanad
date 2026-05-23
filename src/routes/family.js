const express = require('express');
const router = express.Router();
const { updateFamilyProfile } = require('../controllers/familyController');

router.put('/profile', updateFamilyProfile);

module.exports = router;
