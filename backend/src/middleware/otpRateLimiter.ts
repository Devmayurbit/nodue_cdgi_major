import rateLimit from 'express-rate-limit';
import { Request } from 'express';

const localIps = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

const isLocalRequest = (req: Request): boolean => {
  const hostHeader = req.headers.host || '';
  const host = hostHeader.split(':')[0].toLowerCase();
  const requestIp = req.ip || '';

  return host === 'localhost' || host === '127.0.0.1' || localIps.has(requestIp);
};

export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  skip: (req) => isLocalRequest(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many OTP requests. Please wait and try again.' },
});

export const resetOtpRateLimit = (req: Request): void => {
  const limiter = otpLimiter as any;
  if (typeof limiter.resetKey === 'function') {
    limiter.resetKey(req.ip);
  }
};
