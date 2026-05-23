const express = require('express');
const router = express.Router();

const companionAdminRoutes = require('./admin/companionAdmin');

router.use('/admin/companions', companionAdminRoutes);

module.exports = router;