const examsService = require('./exams.service');
const { parseAnswerKey } = require('../../utils/excel.parser');
const fs = require('fs');

const listExams = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, subject } = req.query;
    const isAdmin = req.user.role === 'ADMIN';
    const result = await examsService.listExams({ page, limit, subject, isAdmin });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const createExam = async (req, res, next) => {
  try {
    const { title, subject, description, timeLimitMinutes } = req.body;
    if (!title || !timeLimitMinutes) {
      return res.status(400).json({ message: 'Tiêu đề và thời gian làm bài là bắt buộc.' });
    }
    const exam = await examsService.createExam({
      title, subject, description,
      timeLimitMinutes: parseInt(timeLimitMinutes),
      createdBy: req.user.id,
    });
    res.status(201).json(exam);
  } catch (err) {
    next(err);
  }
};

const getExam = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    const exam = await examsService.getExam(req.params.id, isAdmin);
    res.json(exam);
  } catch (err) {
    next(err);
  }
};

const updateExam = async (req, res, next) => {
  try {
    const { title, subject, description, timeLimitMinutes } = req.body;
    const exam = await examsService.updateExam(req.params.id, {
      title, subject, description,
      ...(timeLimitMinutes && { timeLimitMinutes: parseInt(timeLimitMinutes) }),
    });
    res.json(exam);
  } catch (err) {
    next(err);
  }
};

const deleteExam = async (req, res, next) => {
  try {
    await examsService.deleteExam(req.params.id);
    res.json({ message: 'Đã xóa đề thi.' });
  } catch (err) {
    next(err);
  }
};

// uploadPdf method removed as part of image cropping migration

const uploadAnswerKey = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn file Excel.' });
    }

    const buffer = fs.readFileSync(req.file.path);
    const { answers, errors } = parseAnswerKey(buffer);

    if (errors.length > 0 && answers.size === 0) {
      return res.status(400).json({ message: 'File Excel không hợp lệ.', errors });
    }

    // Apply answers to existing questions
    const result = await examsService.applyAnswerKey(req.params.id, answers);

    res.json({
      message: `Đã cập nhật đáp án cho ${result.updated} câu hỏi.`,
      updated: result.updated,
      warnings: errors,
    });
  } catch (err) {
    next(err);
  }
};

const publishExam = async (req, res, next) => {
  try {
    const exam = await examsService.setStatus(req.params.id, 'PUBLISHED');
    res.json({ message: 'Đã công bố đề thi.', exam });
  } catch (err) {
    next(err);
  }
};

const archiveExam = async (req, res, next) => {
  try {
    const exam = await examsService.setStatus(req.params.id, 'ARCHIVED');
    res.json({ message: 'Đã lưu trữ đề thi.', exam });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listExams, createExam, getExam, updateExam, deleteExam,
  uploadAnswerKey, publishExam, archiveExam,
};
