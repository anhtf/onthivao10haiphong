const prisma = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler');

const myResults = async (req, res, next) => {
  try {
    const results = await prisma.result.findMany({
      where: { studentId: req.user.id },
      include: { exam: { select: { title: true, subject: true } } },
      orderBy: { submittedAt: 'desc' },
    });
    res.json(results);
  } catch (err) {
    next(err);
  }
};

const sessionResult = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        exam: { select: { id: true, title: true, subject: true, timeLimitMinutes: true } },
        studentAnswers: {
          include: {
            question: {
              select: {
                id: true, questionNumber: true, content: true, imageUrl: true,
                optionA: true, optionB: true, optionC: true, optionD: true,
                correctAnswer: true, explanation: true,
              },
            },
          },
          orderBy: { question: { questionNumber: 'asc' } },
        },
        result: true,
      },
    });

    if (!session) throw new AppError('Không tìm thấy phiên thi.', 404);
    if (session.status !== 'SUBMITTED') {
      return res.status(400).json({ message: 'Bài thi chưa được nộp.' });
    }

    // Access control
    if (session.studentId !== req.user.id && req.user.role !== 'ADMIN') {
      throw new AppError('Không có quyền truy cập.', 403);
    }

    res.json(session);
  } catch (err) {
    next(err);
  }
};

const examResults = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [results, total] = await Promise.all([
      prisma.result.findMany({
        where: { examId },
        include: { student: { select: { fullName: true, email: true } } },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.result.count({ where: { examId } }),
    ]);

    res.json({ results, total, page: parseInt(page) });
  } catch (err) {
    next(err);
  }
};

const examAnalytics = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const results = await prisma.result.findMany({ where: { examId } });
    if (results.length === 0) {
      return res.json({ message: 'Chưa có học sinh nào làm bài thi này.', totalSubmissions: 0 });
    }

    const scores = results.map((r) => r.percentage);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    // Score distribution buckets
    const distribution = [0, 0, 0, 0, 0]; // [0-20, 21-40, 41-60, 61-80, 81-100]
    scores.forEach((s) => {
      const idx = Math.min(Math.floor(s / 20), 4);
      distribution[idx]++;
    });

    // Find hardest questions (lowest correct rate)
    const questionStats = await prisma.studentAnswer.groupBy({
      by: ['questionId'],
      where: { session: { examId } },
      _count: { questionId: true },
      _sum: { isCorrect: true },
    });

    const hardestQuestions = await Promise.all(
      questionStats
        .map((stat) => ({
          questionId: stat.questionId,
          total: stat._count.questionId,
          correct: stat._sum.isCorrect || 0,
          correctRate: stat._count.questionId > 0 ? (stat._sum.isCorrect || 0) / stat._count.questionId : 0,
        }))
        .sort((a, b) => a.correctRate - b.correctRate)
        .slice(0, 5)
        .map(async (stat) => {
          const q = await prisma.question.findUnique({
            where: { id: stat.questionId },
            select: { questionNumber: true, content: true },
          });
          return { ...stat, question: q };
        })
    );

    res.json({
      totalSubmissions: results.length,
      averageScore: Math.round(avgScore * 100) / 100,
      maxScore,
      minScore,
      distribution: distribution.map((count, i) => ({
        range: `${i * 20 + (i > 0 ? 1 : 0)}-${(i + 1) * 20}%`,
        count,
      })),
      hardestQuestions,
    });
  } catch (err) {
    next(err);
  }
};

const overviewAnalytics = async (req, res, next) => {
  try {
    const [totalStudents, totalExams, totalSubmissions, recentResults] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.exam.count({ where: { status: 'PUBLISHED' } }),
      prisma.result.count(),
      prisma.result.findMany({
        take: 10,
        orderBy: { submittedAt: 'desc' },
        include: {
          student: { select: { fullName: true } },
          exam: { select: { title: true } },
        },
      }),
    ]);

    let avgPlatformScore = 0;
    if (totalSubmissions > 0) {
      const agg = await prisma.result.aggregate({ _avg: { percentage: true } });
      avgPlatformScore = Math.round((agg._avg.percentage || 0) * 100) / 100;
    }

    res.json({ totalStudents, totalExams, totalSubmissions, avgPlatformScore, recentResults });
  } catch (err) {
    next(err);
  }
};

module.exports = { myResults, sessionResult, examResults, examAnalytics, overviewAnalytics };
