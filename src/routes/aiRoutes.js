const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const smartSearchController = require('../controllers/ai/smartSearchController');
const carePlanController = require('../controllers/ai/carePlan.controller');
const adminAuditController = require('../controllers/ai/adminAudit.controller');
const riskCenterController = require('../controllers/ai/riskCenterController');
const { handleChatMessage } = require('../controllers/ai/chatController');
const { authenticate } = require('../middleware/authMiddleware');
const { aiShield } = require('../middleware/aiShield');

router.post('/session/family', authenticate, aiController.handleFamilyChat);
router.post('/session/companion', authenticate, aiController.handleCompanionChat);
router.post('/chat/message', authenticate, aiShield, handleChatMessage);
router.post('/search/companions', authenticate, aiController.smartSearch);
router.post('/family/browse-search', authenticate, aiShield, smartSearchController.browseSearch);
router.post('/family/generate-care-plan', authenticate, carePlanController.generateCarePlan);
router.get('/admin/analyze-reviews', authenticate, adminAuditController.analyzeReviews);
router.post('/admin/auto-verify-docs', authenticate, adminAuditController.autoVerifyDocs);
router.post('/admin/monitor-fraud', authenticate, adminAuditController.monitorFraud);

// Central AI Risk Center Routes
router.get('/admin/risk-center/summary', authenticate, riskCenterController.getSummary);
router.get('/admin/risk-center/alerts', authenticate, riskCenterController.getAlerts);
router.get('/admin/risk-center/users', authenticate, riskCenterController.getUsers);
router.get('/admin/risk-center/investigate/:userId', authenticate, riskCenterController.getInvestigationReport);
router.post('/admin/risk-center/action', authenticate, riskCenterController.executeAction);
router.get('/sessions', authenticate, aiController.listSessions);
router.get('/sessions/:id', authenticate, aiController.getSessionDetails);
router.delete('/sessions/:id', authenticate, aiController.deleteSession);
router.delete('/session', authenticate, aiController.clearChatSession);
module.exports = router;
