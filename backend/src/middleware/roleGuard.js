const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Chỉ quản trị viên mới có quyền thực hiện thao tác này.' });
  }
  next();
};

const requireStudent = (req, res, next) => {
  if (req.user?.role !== 'STUDENT') {
    return res.status(403).json({ message: 'Chức năng này chỉ dành cho học sinh.' });
  }
  next();
};

module.exports = { requireAdmin, requireStudent };
