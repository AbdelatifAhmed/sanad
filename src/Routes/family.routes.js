const express = require('express');
const { updateFamilyProfile } = require('../Controllers/family.controller.js');

const router = express.Router();

router.put('/profile', updateFamilyProfile);

module.exports = router;
