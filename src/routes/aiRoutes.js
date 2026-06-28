const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const familySearchController = require('../controllers/ai/familySearch.controller');
const carePlanController = require('../controllers/ai/carePlan.controller');
const adminAuditController = require('../controllers/ai/adminAudit.controller');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/session/family', authenticate, aiController.handleFamilyChat);
router.post('/session/companion', authenticate, aiController.handleCompanionChat);
router.post('/search/companions', authenticate, aiController.smartSearch);
router.post('/family/browse-search', authenticate, familySearchController.browseSearch);
router.post('/family/generate-care-plan', authenticate, carePlanController.generateCarePlan);
router.get('/admin/analyze-reviews', authenticate, adminAuditController.analyzeReviews);
router.post('/admin/auto-verify-docs', authenticate, adminAuditController.autoVerifyDocs);
router.delete('/session', authenticate, aiController.clearChatSession);
module.exports = router;
