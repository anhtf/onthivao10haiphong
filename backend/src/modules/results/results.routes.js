const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/roleGuard');
const resultsController = require('./results.controller');

// GET /api/results/my — Student: get own results
router.get('/my', authenticate, resultsController.myResults);

// GET /api/results/session/:sessionId — Get detailed result for a session
router.get('/session/:sessionId', authenticate, resultsController.sessionResult);

// GET /api/results/exam/:examId — Admin: all results for an exam
router.get('/exam/:examId', authenticate, requireAdmin, resultsController.examResults);

// GET /api/results/analytics/:examId — Admin: analytics for an exam
router.get('/analytics/:examId', authenticate, requireAdmin, resultsController.examAnalytics);

// GET /api/results/analytics/overview — Admin: overall platform analytics
router.get('/analytics/overview', authenticate, requireAdmin, resultsController.overviewAnalytics);

module.exports = router;
