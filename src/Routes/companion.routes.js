const express = require('express');
const { updateCompanionProfile } = require('../Controllers/companion.controller');

const router = express.Router();

router.put('/profile', updateCompanionProfile);

module.exports = router;
