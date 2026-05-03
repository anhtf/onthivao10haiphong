const prisma = require('../../config/database');
const cache = require('../../utils/cache');
const { AppError } = require('../../middleware/errorHandler');

const listQuestions = async (req, res, next) => {
  try {
    const { examId } = req.query;
    if (!examId) return res.status(400).json({ message: 'examId là bắt buộc.' });

    const isAdmin = req.user.role === 'ADMIN';
    const questions = await prisma.question.findMany({
      where: { examId },
      orderBy: { questionNumber: 'asc' },
      // Students don't see the correct answer during listing
      select: isAdmin ? undefined : {
        id: true, examId: true, questionNumber: true, content: true, imageUrl: true,
        optionA: true, optionB: true, optionC: true, optionD: true,
        // correctAnswer is intentionally excluded for students
      },
    });
    res.json(questions);
  } catch (err) {
    next(err);
  }
};

const createQuestion = async (req, res, next) => {
  try {
    const { examId, questionNumber, content, imageUrl, optionA, optionB, optionC, optionD, correctAnswer, explanation } = req.body;
    if (!examId || (!content && !imageUrl)) {
      return res.status(400).json({ message: 'Thiếu nội dung câu hỏi (chữ hoặc ảnh).' });
    }

    const question = await prisma.question.create({
      data: {
        exam: { connect: { id: examId } },
        questionNumber: parseInt(questionNumber),
        content, imageUrl, optionA, optionB, optionC, optionD,
        correctAnswer: correctAnswer || null,
        explanation: explanation || null,
      },
    });

    // Sync totalQuestions
    const count = await prisma.question.count({ where: { examId } });
    await prisma.exam.update({ where: { id: examId }, data: { totalQuestions: count } });
    cache.delByPrefix(`exam:${examId}`);

    res.status(201).json(question);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Số câu hỏi này đã tồn tại trong đề thi.' });
    }
    next(err);
  }
};

const bulkSaveQuestions = async (req, res, next) => {
  try {
    const { examId, questions } = req.body;
    if (!examId || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ.' });
    }

    // Upsert all questions
    const results = await Promise.all(
      questions.map((q) =>
        prisma.question.upsert({
          where: { examId_questionNumber: { examId, questionNumber: q.questionNumber } },
          create: {
            exam: { connect: { id: examId } },
            questionNumber: q.questionNumber,
            content: q.content,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctAnswer: q.correctAnswer || null,
            explanation: q.explanation || null,
          },
          update: {
            content: q.content,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctAnswer: q.correctAnswer || null,
            explanation: q.explanation || null,
          },
        })
      )
    );

    const count = await prisma.question.count({ where: { examId } });
    await prisma.exam.update({ where: { id: examId }, data: { totalQuestions: count } });
    cache.delByPrefix(`exam:${examId}`);

    res.json({ message: `Đã lưu ${results.length} câu hỏi.`, count: results.length });
  } catch (err) {
    next(err);
  }
};

const getQuestion = async (req, res, next) => {
  try {
    const question = await prisma.question.findUnique({ where: { id: req.params.id } });
    if (!question) throw new AppError('Không tìm thấy câu hỏi.', 404);
    res.json(question);
  } catch (err) {
    next(err);
  }
};

const updateQuestion = async (req, res, next) => {
  try {
    const { content, imageUrl, optionA, optionB, optionC, optionD, correctAnswer, explanation, questionNumber } = req.body;
    const question = await prisma.question.update({
      where: { id: req.params.id },
      data: { content, imageUrl, optionA, optionB, optionC, optionD, correctAnswer, explanation, ...(questionNumber && { questionNumber: parseInt(questionNumber) }) },
    });
    cache.delByPrefix(`exam:${question.examId}`);
    res.json(question);
  } catch (err) {
    next(err);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const q = await prisma.question.findUnique({ where: { id: req.params.id } });
    if (!q) throw new AppError('Không tìm thấy câu hỏi.', 404);
    await prisma.question.delete({ where: { id: req.params.id } });
    const count = await prisma.question.count({ where: { examId: q.examId } });
    await prisma.exam.update({ where: { id: q.examId }, data: { totalQuestions: count } });
    cache.delByPrefix(`exam:${q.examId}`);
    res.json({ message: 'Đã xóa câu hỏi.' });
  } catch (err) {
    next(err);
  }
};

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('Không tìm thấy file ảnh.', 400);
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl, message: 'Tải ảnh lên thành công.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { listQuestions, createQuestion, bulkSaveQuestions, getQuestion, updateQuestion, deleteQuestion, uploadImage };
