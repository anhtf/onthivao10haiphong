const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/roleGuard');
const multer = require('multer');
const path = require('path');
const questionsController = require('./questions.controller');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../../uploads')),
  filename: (req, file, cb) => cb(null, `question-${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`),
});
const uploadImage = multer({ storage }).single('image');

// GET /api/questions?examId=xxx — Get all questions for an exam
router.get('/', authenticate, questionsController.listQuestions);

// POST /api/questions — Admin: create a single question
router.post('/', authenticate, requireAdmin, questionsController.createQuestion);

// POST /api/questions/bulk — Admin: save bulk parsed questions
router.post('/bulk', authenticate, requireAdmin, questionsController.bulkSaveQuestions);

// POST /api/questions/upload-image — Admin: upload cropped question image
router.post('/upload-image', authenticate, requireAdmin, uploadImage, questionsController.uploadImage);

// GET /api/questions/:id — Get a question
router.get('/:id', authenticate, questionsController.getQuestion);

// PUT /api/questions/:id — Admin: update a question
router.put('/:id', authenticate, requireAdmin, questionsController.updateQuestion);

// DELETE /api/questions/:id — Admin: delete a question
router.delete('/:id', authenticate, requireAdmin, questionsController.deleteQuestion);

module.exports = router;
