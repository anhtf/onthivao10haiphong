const authService = require('./auth.service');

const register = async (req, res, next) => {
  try {
    const { email, password, fullName, userType, dateOfBirth, hometown, schoolName } = req.body;
    
    if (!email || !password || !fullName || !schoolName) {
      return res.status(400).json({ message: 'Vui lòng điền các thông tin bắt buộc (Email, Mật khẩu, Họ tên, Trường).' });
    }

    if (userType === 'STUDENT' && (!dateOfBirth || !hometown)) {
      return res.status(400).json({ message: 'Học sinh cần nhập đầy đủ ngày sinh và quê quán.' });
    }

    const result = await authService.register({ 
      email, password, fullName, userType, dateOfBirth, hometown, schoolName 
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' });
    }
    const result = await authService.login({ email, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Thiếu refresh token.' });
    }
    const result = await authService.refresh(refreshToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  // JWT is stateless — client discards tokens
  // Future: add token to a blocklist in Redis
  res.json({ message: 'Đăng xuất thành công.' });
};

module.exports = { register, login, refresh, me, logout };
