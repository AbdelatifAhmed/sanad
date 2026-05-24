const express = require('express');
const router = express.Router();
const { updateCompanionProfile } = require('../controllers/companionController');

router.put('/profile', updateCompanionProfile);

module.exports = router;
