import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/cdgi_nodues',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-dev-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    expire: process.env.JWT_EXPIRE || '1d',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  },

  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || process.env.EMAIL_USER || '',
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@cdgi.edu.in',
  },

  features: {
    // Emergency fallback: allow OTP response when SMTP fails in production.
    // Keep false in normal production usage.
    allowOtpFallbackInProduction: process.env.ALLOW_OTP_FALLBACK_IN_PRODUCTION === 'true',
  },

  accessKeys: {
    faculty: process.env.FACULTY_ACCESS_KEY || 'CDGI-FACULTY-2026',
    admin: process.env.ADMIN_ACCESS_KEY || 'CDGI-ADMIN-2026',
    superadmin: process.env.SUPERADMIN_ROOT_KEY || 'CDGI-HOD-ROOT',
  },

  superAdmin: {
    name: process.env.SUPERADMIN_NAME || 'HOD Super Admin',
    email: process.env.SUPERADMIN_EMAIL || 'hod@cdgi.edu.in',
    password: process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@2026',
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  frontendUrls: (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean),
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  storage: {
    provider: process.env.FILE_STORAGE_PROVIDER || 'local',
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      apiKey: process.env.CLOUDINARY_API_KEY || '',
      apiSecret: process.env.CLOUDINARY_API_SECRET || '',
      folder: process.env.CLOUDINARY_FOLDER || 'campusdues',
    },
  },
};

export const validateConfig = (): void => {
  if (config.nodeEnv !== 'production') {
    return;
  }

  const missing: string[] = [];

  if (!process.env.MONGODB_URI && !process.env.MONGO_URL) missing.push('MONGODB_URI');
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
  if (!process.env.JWT_REFRESH_SECRET) missing.push('JWT_REFRESH_SECRET');

  if (config.storage.provider === 'cloudinary') {
    if (!config.storage.cloudinary.cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
    if (!config.storage.cloudinary.apiKey) missing.push('CLOUDINARY_API_KEY');
    if (!config.storage.cloudinary.apiSecret) missing.push('CLOUDINARY_API_SECRET');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
};
