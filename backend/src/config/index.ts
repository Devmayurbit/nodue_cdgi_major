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
    timeoutMs: parseInt(process.env.EMAIL_TIMEOUT_MS || '10000', 10),
    retries: parseInt(process.env.EMAIL_RETRIES || '2', 10),
    retryDelayMs: parseInt(process.env.EMAIL_RETRY_DELAY_MS || '300', 10),
  },

  features: {
    // Emergency fallback: allow OTP response when SMTP fails in production.
    // For maximum security on the live college domain, this is disabled
    // by default; set ALLOW_OTP_FALLBACK_IN_PRODUCTION="true" only when
    // email is completely unavailable and you explicitly accept the risk.
    allowOtpFallbackInProduction: process.env.ALLOW_OTP_FALLBACK_IN_PRODUCTION === 'true',

    // SLA escalation for pending approvals
    slaEscalationEnabled:
      process.env.SLA_ESCALATION_ENABLED
        ? process.env.SLA_ESCALATION_ENABLED === 'true'
        : process.env.NODE_ENV === 'production',
    slaEscalationHours: parseInt(process.env.SLA_ESCALATION_HOURS || '48', 10),
    slaEscalationIntervalMinutes: parseInt(process.env.SLA_ESCALATION_INTERVAL_MINUTES || '15', 10),
    slaEscalationDedupeHours: parseInt(process.env.SLA_ESCALATION_DEDUPE_HOURS || '24', 10),
  },

  rules: {
    requiredFacultyApprovals: {
      y1y2: parseInt(process.env.REQUIRED_FACULTY_APPROVALS_Y1Y2 || '5', 10),
      y3: parseInt(process.env.REQUIRED_FACULTY_APPROVALS_Y3 || '4', 10),
      y4: parseInt(process.env.REQUIRED_FACULTY_APPROVALS_Y4 || '3', 10),
    },
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

  // Frontend URL is used in password reset links, certificate links, etc.
  if (!process.env.FRONTEND_URL) missing.push('FRONTEND_URL');

  // Email is required in production for OTP + password reset flows.
  // Support either SMTP_* or EMAIL_* env vars.
  if (!config.email.user) missing.push('SMTP_USER (or EMAIL_USER)');
  if (!config.email.pass) missing.push('SMTP_PASS (or EMAIL_PASS)');
  if (!config.email.from) missing.push('EMAIL_FROM');

  // Access keys are secrets; do not allow default/fallback values in production.
  if (!process.env.FACULTY_ACCESS_KEY) missing.push('FACULTY_ACCESS_KEY');
  if (!process.env.ADMIN_ACCESS_KEY) missing.push('ADMIN_ACCESS_KEY');
  if (!process.env.SUPERADMIN_ROOT_KEY) missing.push('SUPERADMIN_ROOT_KEY');

  // Seed/root superadmin credentials must be set in production to avoid default credentials.
  if (!process.env.SUPERADMIN_EMAIL) missing.push('SUPERADMIN_EMAIL');
  if (!process.env.SUPERADMIN_PASSWORD) missing.push('SUPERADMIN_PASSWORD');

  if (config.storage.provider === 'cloudinary') {
    if (!config.storage.cloudinary.cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
    if (!config.storage.cloudinary.apiKey) missing.push('CLOUDINARY_API_KEY');
    if (!config.storage.cloudinary.apiSecret) missing.push('CLOUDINARY_API_SECRET');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
};
