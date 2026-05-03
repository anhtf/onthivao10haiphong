const prisma = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler');

const listStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      role: 'STUDENT',
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, email: true, fullName: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
    });
    if (!user) throw new AppError('Không tìm thấy người dùng.', 404);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ message: 'Không thể xóa tài khoản của chính mình.' });
    }
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Đã xóa người dùng.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { listStudents, getUser, deleteUser };
