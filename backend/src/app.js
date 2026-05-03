require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./modules/auth/auth.routes');
const examsRoutes = require('./modules/exams/exams.routes');
const questionsRoutes = require('./modules/questions/questions.routes');
const sessionsRoutes = require('./modules/sessions/sessions.routes');
const resultsRoutes = require('./modules/results/results.routes');
const usersRoutes = require('./modules/users/users.routes');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static files (uploaded PDFs, Excel)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/results', resultsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Không tìm thấy endpoint.' });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
