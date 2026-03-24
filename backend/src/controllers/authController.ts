import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User, { UserRole } from '../models/User';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../services/auditService';
import {
  generateOTP,
  storeOTP,
  verifyOTP,
  sendOTPEmail,
  sendPasswordResetEmail,
} from '../services/emailService';
import { resetOtpRateLimit } from '../middleware/otpRateLimiter';

const getStudentYearFromSemester = (year?: number, semester?: number): number => {
  if (year && year >= 1 && year <= 4) return year;
  if (!semester) return 1;
  return Math.min(4, Math.max(1, Math.ceil(semester / 2)));
};

const getRequiredFacultyApprovals = (year: number): number => {
  if (year === 1 || year === 2) return config.rules.requiredFacultyApprovals.y1y2;
  if (year === 3) return config.rules.requiredFacultyApprovals.y3;
  return config.rules.requiredFacultyApprovals.y4;
};

const signToken = (id: string, role: string): string => {
  return jwt.sign({ id, role }, config.jwt.secret, {
    expiresIn: config.jwt.expire as any,
  });
};

const signRefreshToken = (id: string): string => {
  return jwt.sign({ id }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpire as any,
  });
};

// POST /api/v1/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      enrollmentNumber,
      department,
      section,
      semester,
      otpToken,
      role: requestedRole,
    } = req.body;

    const normalizedEmail = String(email || '').toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'Email already registered.' });
      return;
    }

    // SECURITY: public self-registration is restricted to students only.
    // Faculty/Admin/HOD accounts must be created by Super Admin/HOD.
    if (requestedRole && requestedRole !== 'student') {
      res.status(403).json({
        success: false,
        message: 'Only student self-registration is allowed. Contact your HOD to create staff accounts.',
      });
      return;
    }

    // Require server-signed OTP verification token (prevents client-side bypass).
    if (!otpToken || typeof otpToken !== 'string') {
      res.status(403).json({
        success: false,
        message: 'Email verification is required. Please verify OTP first.',
      });
      return;
    }

    try {
      const decoded = jwt.verify(otpToken, config.jwt.secret) as any;
      const tokenEmail = String(decoded?.email || '').toLowerCase().trim();
      const purpose = decoded?.purpose;
      if (!tokenEmail || tokenEmail !== normalizedEmail || purpose !== 'register_email') {
        res.status(403).json({ success: false, message: 'Invalid email verification token.' });
        return;
      }
    } catch {
      res.status(403).json({ success: false, message: 'Expired or invalid email verification token.' });
      return;
    }

    // Student: check enrollment uniqueness
    if (enrollmentNumber) {
      const existingEnrollment = await User.findOne({ enrollmentNumber });
      if (existingEnrollment) {
        res.status(409).json({ success: false, message: 'Enrollment number already registered.' });
        return;
      }
    }

    const role = UserRole.STUDENT;

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const emailVerified = true;

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      enrollmentNumber: role === UserRole.STUDENT ? enrollmentNumber : undefined,
      department,
      section,
      semester: semester ? parseInt(semester) : undefined,
      isEmailVerified: emailVerified,
      accessKeyVerified: true,
    });

    const emailSentFlag = true;

    await createAuditLog(user._id as any, 'REGISTER', 'User', user._id as any, `${role} registered: ${email}`);

    res.status(201).json({
      success: true,
      message: emailVerified
        ? 'Registration successful.'
        : emailSentFlag
          ? 'Registration successful. Please check your email for verification.'
          : 'Registration successful. Use the code to verify your account.',
      data: {
        userId: user._id,
        emailSent: emailVerified || emailSentFlag,
        emailVerified,
        role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, accessKey } = req.body;

    const normalizedEmail = String(email || '').toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    // Check account lock
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      const remaining = Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / 60000);
      res.status(423).json({
        success: false,
        message: `Account locked. Try again in ${remaining} minutes.`,
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lock
        user.failedLoginAttempts = 0;
      }
      await user.save();
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'Account is deactivated.' });
      return;
    }

    // Access key verification for faculty/admin
    if (
      (user.role === UserRole.FACULTY || user.role === UserRole.ADMIN) &&
      !user.accessKeyVerified
    ) {
      if (!accessKey) {
        res.status(403).json({
          success: false,
          message: 'Access key required for first login.',
          requiresAccessKey: true,
        });
        return;
      }

      const expectedKey =
        user.role === UserRole.FACULTY
          ? config.accessKeys.faculty
          : config.accessKeys.admin;

      if (accessKey !== expectedKey) {
        res.status(403).json({ success: false, message: 'Invalid access key.' });
        return;
      }

      user.accessKeyVerified = true;
    }

    // Reset failed attempts
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = undefined;

    const token = signToken((user._id as any).toString(), user.role);
    const refreshToken = signRefreshToken((user._id as any).toString());

    user.refreshToken = refreshToken;
    await user.save();

    await createAuditLog(
      user._id as any,
      'LOGIN',
      'User',
      user._id as any,
      `Login from ${req.ip}`,
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          section: user.section,
          subject: user.subject,
          enrollmentNumber: user.enrollmentNumber,
          semester: user.semester,
          isEmailVerified: user.isEmailVerified,
          avatar: user.avatar,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/auth/verify-email
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, code } = req.body;

    let user;
    if (token) {
      user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() },
      }).select('+emailVerificationToken +emailVerificationExpires');
    } else if (code) {
      user = await User.findOne({ offlineVerificationCode: code }).select('+offlineVerificationCode');
    }

    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid or expired verification token/code.' });
      return;
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.offlineVerificationCode = undefined;
    await user.save();

    await createAuditLog(user._id as any, 'EMAIL_VERIFIED', 'User', user._id as any);

    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordResetToken +passwordResetExpires');
    if (!user) {
      res.json({
        success: true,
        message: 'If this email is registered, a reset link has been sent.',
      });
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    await sendPasswordResetEmail(user.email, rawToken);

    res.json({
      success: true,
      message: 'If this email is registered, a reset link has been sent.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/auth/reset-password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400).json({ success: false, message: 'Token and new password are required.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
      return;
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires +password');

    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid or expired reset link.' });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(password, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = undefined;
    await user.save();

    await createAuditLog(user._id as any, 'PASSWORD_RESET', 'User', user._id as any);

    res.json({ success: true, message: 'Password reset successful. Please log in.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/auth/refresh-token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: rToken } = req.body;
    if (!rToken) {
      res.status(400).json({ success: false, message: 'Refresh token required.' });
      return;
    }

    const decoded = jwt.verify(rToken, config.jwt.refreshSecret) as { id: string };
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== rToken) {
      res.status(401).json({ success: false, message: 'Invalid refresh token.' });
      return;
    }

    const newToken = signToken((user._id as any).toString(), user.role);
    const newRefreshToken = signRefreshToken((user._id as any).toString());

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      data: { token: newToken, refreshToken: newRefreshToken },
    });
  } catch (error: any) {
    res.status(401).json({ success: false, message: 'Invalid refresh token.' });
  }
};

// GET /api/v1/auth/me
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        section: user.section,
        subject: user.subject,
        enrollmentNumber: user.enrollmentNumber,
        semester: user.semester,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/auth/profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, semester, section, currentPassword, newPassword } = req.body;
    const user = req.user!;

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (semester) user.semester = semester;
    if (section && (user.role === UserRole.STUDENT || user.role === UserRole.FACULTY)) {
      user.section = section;
    }

    // Password change
    if (currentPassword && newPassword) {
      const fullUser = await User.findById(user._id).select('+password');
      if (!fullUser) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }
      const isMatch = await bcrypt.compare(currentPassword, fullUser.password);
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        return;
      }
      if (newPassword.length < 8) {
        res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
        return;
      }
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    await createAuditLog(user._id as any, 'PROFILE_UPDATE', 'User', user._id as any);

    res.json({
      success: true,
      message: currentPassword && newPassword ? 'Profile and password updated.' : 'Profile updated.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        section: user.section,
        subject: user.subject,
        enrollmentNumber: user.enrollmentNumber,
        semester: user.semester,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/auth/logout
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    await User.findByIdAndUpdate(user._id, { refreshToken: undefined });

    await createAuditLog(user._id as any, 'LOGOUT', 'User', user._id as any);

    res.json({ success: true, message: 'Logged out.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/auth/send-otp  (no auth needed - called during registration)
export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required.' });
      return;
    }

    const otp = generateOTP();
    await storeOTP(email, otp);

    const sent = await sendOTPEmail(email, otp);

    if (!sent && config.nodeEnv === 'development') {
      // Dev-only fallback: return OTP in response when SMTP fails.
      // DO NOT return OTP in production.
      resetOtpRateLimit(req);
      res.json({
        success: true,
        message: 'OTP generated. Email delivery is temporarily unavailable.',
        devOtp: otp,
      });
      return;
    }

    if (!sent) {
      const misconfigured = !config.email.user || !config.email.pass;
      res.status(503).json({
        success: false,
        message: misconfigured
          ? 'OTP email service is not configured. Please contact the administrator.'
          : 'Failed to send OTP. Please try again in a moment.',
      });
      return;
    }

    resetOtpRateLimit(req);
    res.json({ success: true, message: 'OTP sent to your email.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/auth/verify-otp  (no auth needed - called during registration)
export const verifyOtpEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'Email and OTP are required.' });
      return;
    }

    const valid = await verifyOTP(email, otp);
    if (!valid) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const otpToken = jwt.sign({ email: normalizedEmail, purpose: 'register_email' }, config.jwt.secret, {
      expiresIn: '10m',
    });

    res.json({ success: true, message: 'OTP verified successfully.', otpToken });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/auth/faculty-summary  (auth required - used by student dashboard)
export const getFacultySummaryForMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    if (user.role !== UserRole.STUDENT) {
      res.status(403).json({ success: false, message: 'Only students can access this resource.' });
      return;
    }

    if (!user.department || !user.section || !user.semester) {
      res.status(400).json({
        success: false,
        message: 'Profile incomplete. Department, section, and semester are required.',
      });
      return;
    }

    const year = getStudentYearFromSemester((user as any).year, user.semester);
    const requiredApprovals = getRequiredFacultyApprovals(year);

    const faculty = await User.find({
      role: UserRole.FACULTY,
      department: user.department,
      section: user.section,
      semester: user.semester,
      subject: { $exists: true, $ne: '' },
      isActive: true,
    })
      .select('_id name email subject')
      .sort({ subject: 1, name: 1 });

    const subjectCounts = new Map<string, number>();
    for (const f of faculty as any[]) {
      const subject = (f.subject || '').trim() || 'Unknown';
      subjectCounts.set(subject, (subjectCounts.get(subject) || 0) + 1);
    }

    res.json({
      success: true,
      data: {
        facultyCount: faculty.length,
        requiredApprovals,
        subjects: Array.from(subjectCounts.entries())
          .map(([subject, count]) => ({ subject, count }))
          .sort((a, b) => a.subject.localeCompare(b.subject)),
        faculty: faculty.map((f: any) => ({
          id: f._id,
          name: f.name,
          email: f.email,
          subject: f.subject,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
