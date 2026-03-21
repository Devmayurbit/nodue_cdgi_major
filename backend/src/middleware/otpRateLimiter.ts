import rateLimit from 'express-rate-limit';
import { Request } from 'express';

export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
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
