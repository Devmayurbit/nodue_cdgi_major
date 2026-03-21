import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import { config, validateConfig } from './config';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/authRoutes';
import noDuesRoutes from './routes/noDuesRoutes';
import noticeRoutes from './routes/noticeRoutes';
import adminRoutes from './routes/adminRoutes';
import superAdminRoutes from './routes/superAdminRoutes';
import certificateRoutes from './routes/certificateRoutes';
import chatRoutes from './routes/chatRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { chatbotReply } from './controllers/chatbotController';

const app = express();
const isDevelopment = config.nodeEnv === 'development';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
const certsDir = path.join(uploadsDir, 'certificates');
[uploadsDir, certsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (config.frontendUrls.includes(origin)) {
        callback(null, true);
        return;
      }

      // Do not throw for unmatched origins; just disable CORS headers for that request.
      callback(null, false);
    },
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => isDevelopment || req.path.startsWith('/v1/auth/'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Auth endpoint stricter rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skip: () => isDevelopment,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts.' },
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  skip: () => isDevelopment,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many registration attempts. Please try again later.' },
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  skip: () => isDevelopment,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many OTP requests. Please wait a few minutes and try again.' },
});

app.use('/api/v1/auth/login', loginLimiter);
app.use('/api/v1/auth/register', registerLimiter);
app.use('/api/v1/auth/send-otp', otpLimiter);
app.use('/api/v1/auth/verify-otp', otpLimiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Static files (for uploaded files)
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/nodues', noDuesRoutes);
app.use('/api/v1/notices', noticeRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/superadmin', superAdminRoutes);
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Simple FAQ chatbot alias required by UI integrations
app.post('/api/chatbot', chatbotReply);

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, message: 'CDGI No-Dues API is running', timestamp: new Date().toISOString() });
});

// API 404 fallback
app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  validateConfig();
  await connectDB();
  app.listen(config.port, () => {
    console.log(`🚀 CDGI No-Dues Server running on port ${config.port} [${config.nodeEnv}]`);
  });
};

startServer();

export default app;
