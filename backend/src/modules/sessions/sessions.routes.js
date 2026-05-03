const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requireStudent } = require('../../middleware/roleGuard');
const sessionsController = require('./sessions.controller');

// POST /api/sessions — Student: start an exam session
router.post('/', authenticate, requireStudent, sessionsController.createSession);

// GET /api/sessions/:id — Get session with questions (for student)
router.get('/:id', authenticate, sessionsController.getSession);

// POST /api/sessions/:id/submit — Student: submit all answers
router.post('/:id/submit', authenticate, requireStudent, sessionsController.submitSession);

// PATCH /api/sessions/:id/tab-switch — Student: report tab switch
router.patch('/:id/tab-switch', authenticate, requireStudent, sessionsController.reportTabSwitch);

module.exports = router;
