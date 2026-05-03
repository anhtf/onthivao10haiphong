const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/roleGuard');
const examsController = require('./exams.controller');

const MAX_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '20');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../../uploads');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (allowedExts) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) cb(null, true);
  else cb(new Error(`Chỉ chấp nhận file ${allowedExts.join(', ')}.`));
};

const uploadPdf = multer({
  storage,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: fileFilter(['.pdf']),
}).single('pdf');

const uploadExcel = multer({
  storage,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: fileFilter(['.xlsx', '.xls']),
}).single('excel');

// GET /api/exams — List exams (public for students: only PUBLISHED; admin sees all)
router.get('/', authenticate, examsController.listExams);

// POST /api/exams — Admin: create exam
router.post('/', authenticate, requireAdmin, examsController.createExam);

// GET /api/exams/:id — Get exam detail
router.get('/:id', authenticate, examsController.getExam);

// PUT /api/exams/:id — Admin: update exam metadata
router.put('/:id', authenticate, requireAdmin, examsController.updateExam);

// DELETE /api/exams/:id — Admin: delete exam
router.delete('/:id', authenticate, requireAdmin, examsController.deleteExam);

// POST /api/exams/:id/upload-answer-key — Admin: upload Excel answer key
router.post('/:id/upload-answer-key', authenticate, requireAdmin, uploadExcel, examsController.uploadAnswerKey);

// PATCH /api/exams/:id/publish — Admin: publish exam
router.patch('/:id/publish', authenticate, requireAdmin, examsController.publishExam);

// PATCH /api/exams/:id/archive — Admin: archive exam
router.patch('/:id/archive', authenticate, requireAdmin, examsController.archiveExam);

module.exports = router;
