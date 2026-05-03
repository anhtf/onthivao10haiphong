const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.';

  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.path} — ${message}`, { stack: err.stack });
  } else {
    logger.warn(`[${req.method}] ${req.path} — ${message}`);
  }

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Custom error factory
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

module.exports = errorHandler;
module.exports.AppError = AppError;
