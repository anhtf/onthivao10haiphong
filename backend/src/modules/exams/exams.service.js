const prisma = require('../../config/database');
const cache = require('../../utils/cache');
const { AppError } = require('../../middleware/errorHandler');

const listExams = async ({ page = 1, limit = 20, subject, isAdmin }) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {
    ...(!isAdmin && { status: 'PUBLISHED' }),
    ...(subject && { subject }),
  };

  const [exams, total] = await Promise.all([
    prisma.exam.findMany({
      where,
      include: { creator: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.exam.count({ where }),
  ]);

  return { exams, total, page: parseInt(page), limit: parseInt(limit) };
};

const createExam = async (data) => {
  // Extract createdBy to use relation connect
  const { createdBy, ...rest } = data;
  const exam = await prisma.exam.create({
    data: {
      ...rest,
      creator: { connect: { id: createdBy } },
    },
  });
  cache.delByPrefix('exam:');
  return exam;
};

const getExam = async (id, isAdmin = false) => {
  const cacheKey = `exam:${id}:${isAdmin}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { questionNumber: 'asc' } },
      creator: { select: { fullName: true } },
    },
  });

  if (!exam) throw new AppError('Không tìm thấy đề thi.', 404);
  if (!isAdmin && exam.status !== 'PUBLISHED') {
    throw new AppError('Đề thi này không có sẵn.', 403);
  }

  cache.set(cacheKey, exam, 120);
  return exam;
};

const updateExam = async (id, data) => {
  const exam = await prisma.exam.update({ where: { id }, data });
  cache.delByPrefix(`exam:${id}`);
  return exam;
};

const deleteExam = async (id) => {
  // Xóa cascade thủ công trong transaction để tránh lỗi FK constraint RESTRICT
  await prisma.$transaction(async (tx) => {
    // 1. Lấy tất cả session IDs của exam này
    const sessions = await tx.examSession.findMany({
      where: { examId: id },
      select: { id: true },
    });
    const sessionIds = sessions.map((s) => s.id);

    // 2. Xóa results liên quan đến các session
    await tx.result.deleteMany({ where: { examId: id } });

    // 3. Xóa student_answers trong các session
    if (sessionIds.length > 0) {
      await tx.studentAnswer.deleteMany({ where: { sessionId: { in: sessionIds } } });
    }

    // 4. Xóa exam_sessions
    await tx.examSession.deleteMany({ where: { examId: id } });

    // 5. Xóa questions (cascade từ Question → StudentAnswer đã được handle bởi schema onDelete: Cascade)
    await tx.question.deleteMany({ where: { examId: id } });

    // 6. Xóa exam
    await tx.exam.delete({ where: { id } });
  });

  cache.delByPrefix(`exam:${id}`);
};

const applyAnswerKey = async (examId, answers) => {
  // answers = Map<questionNumber, correctAnswer>
  const questions = await prisma.question.findMany({ where: { examId } });
  let updated = 0;

  for (const question of questions) {
    const ans = answers.get(question.questionNumber);
    if (ans) {
      await prisma.question.update({
        where: { id: question.id },
        data: { correctAnswer: ans },
      });
      updated++;
    }
  }

  cache.delByPrefix(`exam:${examId}`);
  return { updated };
};

const setStatus = async (id, status) => {
  if (status === 'PUBLISHED') {
    const questions = await prisma.question.findMany({ where: { examId: id } });

    // Update totalQuestions
    await prisma.exam.update({
      where: { id },
      data: { totalQuestions: questions.length, status },
    });
  } else {
    await prisma.exam.update({ where: { id }, data: { status } });
  }

  cache.delByPrefix(`exam:${id}`);
  return prisma.exam.findUnique({ where: { id } });
};

module.exports = { listExams, createExam, getExam, updateExam, deleteExam, applyAnswerKey, setStatus };
