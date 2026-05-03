const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler');

const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role };

  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });

  return { accessToken, refreshToken };
};

const register = async ({ email, password, fullName, userType, dateOfBirth, hometown, schoolName }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const trimmedFullName = fullName.trim();
  const trimmedSchoolName = schoolName ? schoolName.trim() : null;

  const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingEmail) {
    throw new AppError('Email này đã được sử dụng.', 409);
  }

  // Kiểm tra trùng họ tên và trường
  if (trimmedSchoolName) {
    const existingProfile = await prisma.user.findFirst({
      where: {
        fullName: trimmedFullName,
        schoolName: trimmedSchoolName
      }
    });
    if (existingProfile) {
      throw new AppError('Tài khoản với họ tên và trường này đã tồn tại.', 409);
    }
  }

  if (password.length < 6) {
    throw new AppError('Mật khẩu phải có ít nhất 6 ký tự.', 400);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      fullName: trimmedFullName,
      role: 'STUDENT',
      userType: userType || 'STUDENT',
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      hometown: hometown ? hometown.trim() : null,
      schoolName: trimmedSchoolName,
    },
    select: { id: true, email: true, fullName: true, role: true, userType: true, isPro: true, createdAt: true },
  });

  const tokens = generateTokens(user);
  return { user, ...tokens };
};

const login = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    throw new AppError('Email hoặc mật khẩu không đúng.', 401);
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new AppError('Email hoặc mật khẩu không đúng.', 401);
  }

  const publicUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isPro: user.isPro,
    createdAt: user.createdAt,
  };

  const tokens = generateTokens(publicUser);
  return { user: publicUser, ...tokens };
};

const refresh = (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const payload = { id: decoded.id, email: decoded.email, role: decoded.role };
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    });
    return { accessToken };
  } catch {
    throw new AppError('Refresh token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.', 401);
  }
};

const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, fullName: true, role: true, userType: true, isPro: true, createdAt: true },
  });
  if (!user) throw new AppError('Không tìm thấy người dùng.', 404);
  return user;
};

module.exports = { register, login, refresh, getMe };

