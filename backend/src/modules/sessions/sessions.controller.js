const prisma = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler');
const { getQuestionType, calculatePoints } = require('../../utils/examFormat');

/**
 * Fisher-Yates shuffle
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const createSession = async (req, res, next) => {
  try {
    const { examId } = req.body;
    if (!examId) return res.status(400).json({ message: 'examId là bắt buộc.' });

    // Check exam exists and is published
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: { select: { id: true } } },
    });
    if (!exam) throw new AppError('Không tìm thấy đề thi.', 404);
    if (exam.status !== 'PUBLISHED') throw new AppError('Đề thi này chưa được công bố.', 403);
    if (exam.expiresAt && new Date() > new Date(exam.expiresAt)) {
      throw new AppError('Đề thi này đã hết hạn.', 403);
    }
    if (exam.questions.length === 0) throw new AppError('Đề thi chưa có câu hỏi.', 400);

    // Check for existing in-progress session
    const existing = await prisma.examSession.findFirst({
      where: { studentId: req.user.id, examId, status: 'IN_PROGRESS' },
    });
    if (existing) {
      return res.json({ message: 'Bạn đang có bài thi chưa nộp.', sessionId: existing.id, resuming: true });
    }

    // Create session with randomized question order
    const questionIds = shuffle(exam.questions.map((q) => q.id));

    const session = await prisma.examSession.create({
      data: {
        student: { connect: { id: req.user.id } },
        exam: { connect: { id: examId } },
        questionOrder: questionIds,
        totalQuestions: questionIds.length,
        status: 'IN_PROGRESS',
      },
    });

    res.status(201).json({ sessionId: session.id, resuming: false });
  } catch (err) {
    next(err);
  }
};

const getSession = async (req, res, next) => {
  try {
    const session = await prisma.examSession.findUnique({
      where: { id: req.params.id },
      include: {
        exam: { select: { id: true, title: true, subject: true, timeLimitMinutes: true } },
        studentAnswers: { select: { questionId: true, selectedAnswer: true } },
      },
    });

    if (!session) throw new AppError('Không tìm thấy phiên thi.', 404);

    // Only the owner or admin can access
    if (session.studentId !== req.user.id && req.user.role !== 'ADMIN') {
      throw new AppError('Không có quyền truy cập.', 403);
    }

    // Fetch questions in randomized order (hide correct answers if in progress)
    const questions = await prisma.question.findMany({
      where: { id: { in: session.questionOrder } },
      select: {
        id: true, questionNumber: true, content: true, imageUrl: true,
        optionA: true, optionB: true, optionC: true, optionD: true, explanation: true,
        // Include correct answer only if session is submitted
        ...(session.status === 'SUBMITTED' && { correctAnswer: true }),
      },
    });

    // Sort by randomized order
    const orderedMap = new Map(questions.map((q) => [q.id, q]));
    const orderedQuestions = session.questionOrder.map((id) => orderedMap.get(id)).filter(Boolean);

    const answersMap = Object.fromEntries(
      session.studentAnswers.map((a) => [a.questionId, a.selectedAnswer])
    );

    res.json({
      session: {
        id: session.id,
        status: session.status,
        startedAt: session.startedAt,
        submittedAt: session.submittedAt,
        timeLimitMinutes: session.exam.timeLimitMinutes,
        score: session.score,
        totalQuestions: session.totalQuestions,
        tabSwitchCount: session.tabSwitchCount,
        exam: session.exam,
      },
      questions: orderedQuestions,
      answers: answersMap,
    });
  } catch (err) {
    next(err);
  }
};

const submitSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { answers } = req.body; // { questionId: selectedAnswer, ... }

    const session = await prisma.examSession.findUnique({
      where: { id },
      include: { exam: { select: { timeLimitMinutes: true } } },
    });

    if (!session) throw new AppError('Không tìm thấy phiên thi.', 404);
    if (session.studentId !== req.user.id) throw new AppError('Không có quyền truy cập.', 403);
    if (session.status !== 'IN_PROGRESS') {
      return res.status(400).json({ message: 'Bài thi đã được nộp.' });
    }

    // Check time limit (server-side validation)
    const now = new Date();
    const elapsed = (now - new Date(session.startedAt)) / 1000;
    const limitSeconds = session.exam.timeLimitMinutes * 60;
    const timeTaken = Math.min(elapsed, limitSeconds);

    // Fetch questions with correct answers
    const questions = await prisma.question.findMany({
      where: { id: { in: session.questionOrder } },
      select: { id: true, correctAnswer: true, questionNumber: true },
    });

    // Grade answers
    let totalScore = 0;
    
    const studentAnswers = questions.map((q) => {
      const selected = answers?.[q.id] || null;
      const type = getQuestionType(q.questionNumber);
      const points = calculatePoints(type, q.correctAnswer, selected);
      const isCorrect = points > 0;
      
      totalScore += points;
      
      return { sessionId: id, questionId: q.id, selectedAnswer: selected, isCorrect };
    });

    // percentage is just relative to 10 points
    const percentage = (totalScore / 10) * 100;

    // Save in transaction
    await prisma.$transaction(async (tx) => {
      // Delete old answers if any (re-submit scenario)
      await tx.studentAnswer.deleteMany({ where: { sessionId: id } });

      await tx.studentAnswer.createMany({ data: studentAnswers });

      await tx.examSession.update({
        where: { id },
        data: {
          status: 'SUBMITTED',
          submittedAt: now,
          timeTakenSeconds: Math.round(timeTaken),
          score: totalScore,
        },
      });

      await tx.result.upsert({
        where: { sessionId: id },
        create: {
          session: { connect: { id } },
          student: { connect: { id: session.studentId } },
          exam: { connect: { id: session.examId } },
          score: totalScore,
          totalQuestions: questions.length,
          percentage,
          timeTakenSeconds: Math.round(timeTaken),
          submittedAt: now,
        },
        update: {
          score: totalScore,
          percentage,
          timeTakenSeconds: Math.round(timeTaken),
          submittedAt: now,
        },
      });
    });

    res.json({ message: 'Nộp bài thành công.', score: totalScore, totalQuestions: questions.length, percentage });
  } catch (err) {
    next(err);
  }
};

const reportTabSwitch = async (req, res, next) => {
  try {
    await prisma.examSession.update({
      where: { id: req.params.id },
      data: { tabSwitchCount: { increment: 1 } },
    });
    res.json({ message: 'Đã ghi nhận.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createSession, getSession, submitSession, reportTabSwitch };
