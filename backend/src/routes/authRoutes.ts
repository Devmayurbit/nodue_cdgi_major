import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  register,
  login,
  verifyEmail,
  forgotPassword,
  refreshToken,
  getMe,
  resetPassword,
  updateProfile,
  logout,
  sendOtp,
  verifyOtpEndpoint,
} from '../controllers/authController';

const router = Router();

router.post(
  '/register',
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').optional().isIn(['student', 'faculty', 'admin', 'superadmin']).withMessage('Invalid role'),
    body('department')
      .custom((value, { req }) => {
        const role = req.body.role || 'student';
        if (role === 'superadmin') return true;
        return typeof value === 'string' && value.trim().length > 0;
      })
      .withMessage('Department is required for student/faculty/admin registration'),
    body('section')
      .custom((value, { req }) => {
        const role = req.body.role || 'student';
        if (role !== 'student' && role !== 'faculty') return true;
        return typeof value === 'string' && value.trim().length > 0;
      })
      .withMessage('Section is required for student/faculty registration'),
    body('subject')
      .custom((value, { req }) => {
        const role = req.body.role || 'student';
        if (role !== 'faculty') return true;
        return typeof value === 'string' && value.trim().length > 0;
      })
      .withMessage('Subject is required for faculty registration'),
    body('semester')
      .custom((value, { req }) => {
        const role = req.body.role || 'student';
        if (role !== 'student' && role !== 'faculty') return true;
        const n = Number(value);
        return Number.isInteger(n) && n >= 1 && n <= 8;
      })
      .withMessage('Semester is required (1-8) for student/faculty registration'),
    body('enrollmentNumber')
      .custom((value, { req }) => {
        const role = req.body.role || 'student';
        if (role !== 'student') return true;
        return typeof value === 'string' && value.trim().length > 0;
      })
      .withMessage('Enrollment number is required for student registration'),
  ]),
  register
);

router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  login
);

router.post('/verify-email', verifyEmail);
router.post('/forgot-password', validate([body('email').isEmail().withMessage('Valid email required')]), forgotPassword);
router.post('/reset-password', validate([
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
]), resetPassword);
router.post('/send-otp', validate([body('email').isEmail().withMessage('Valid email required')]), sendOtp);
router.post('/verify-otp', validate([body('email').isEmail(), body('otp').isLength({ min: 6, max: 6 })]), verifyOtpEndpoint);
router.post('/refresh-token', refreshToken);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.post('/logout', authenticate, logout);

export default router;
