import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { config } from '../config';
import OtpCode from '../models/OtpCode';

const createTransporter = () =>
  nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: false,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
    tls: { rejectUnauthorized: false },
  });

export const sendVerificationEmail = async (
  email: string,
  token: string
): Promise<boolean> => {
  try {
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;
    const transporter = createTransporter();
    await transporter.sendMail({
      from: config.email.from,
      to: email,
      subject: 'CDGI No-Dues - Verify Your Email',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#1e40af;">CDGI No-Dues Management System</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">
            Verify Email
          </a>
          <p>Or copy this link: ${verificationUrl}</p>
          <p style="color:#666;font-size:12px;">This link expires in 24 hours.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
};

export const sendNotificationEmail = async (
  email: string,
  subject: string,
  html: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: config.email.from,
      to: email,
      subject,
      html,
    });
    return true;
  } catch {
    return false;
  }
};

export const sendPasswordResetEmail = async (email: string, token: string): Promise<boolean> => {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
  return sendNotificationEmail(
    email,
    'CDGI No-Dues - Reset Your Password',
    `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#1e40af;">CDGI No-Dues Management System</h2>
        <p>We received a request to reset your password.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">
          Reset Password
        </a>
        <p>If the button does not work, use this link:</p>
        <p>${resetUrl}</p>
        <p style="color:#666;font-size:12px;">This link expires in 1 hour. If you did not request a password reset, ignore this email.</p>
      </div>
    `
  );
};

export const sendNoticeSubmissionEmail = async (
  email: string,
  studentName: string,
  title: string,
  description: string
): Promise<boolean> => {
  return sendNotificationEmail(
    email,
    'CDGI No-Dues - Notice Submitted',
    `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#1e40af;">Notice Submitted Successfully</h2>
        <p>Hello ${studentName},</p>
        <p>Your notice form has been submitted successfully and sent for review.</p>
        <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;padding:16px;margin:16px 0;">
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Description:</strong> ${description}</p>
          <p><strong>Status:</strong> Submitted</p>
        </div>
        <p>You will receive another email when the review status changes.</p>
      </div>
    `
  );
};

export const sendNoticeFacultyNotificationEmail = async (
  email: string,
  facultyName: string,
  studentName: string,
  title: string,
  department?: string,
  section?: string
): Promise<boolean> => {
  return sendNotificationEmail(
    email,
    'CDGI No-Dues - New Notice Requires Review',
    `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#1e40af;">New Notice for Faculty Review</h2>
        <p>Hello ${facultyName},</p>
        <p>A student has submitted a new notice that requires faculty review.</p>
        <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;padding:16px;margin:16px 0;">
          <p><strong>Student:</strong> ${studentName}</p>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Department:</strong> ${department || '-'}</p>
          <p><strong>Section:</strong> ${section || '-'}</p>
        </div>
        <p>Please log in to the CDGI No-Dues portal to review it.</p>
      </div>
    `
  );
};

export const sendNoticeStatusEmail = async (
  email: string,
  studentName: string,
  title: string,
  status: string,
  remarks?: string
): Promise<boolean> => {
  return sendNotificationEmail(
    email,
    `CDGI No-Dues - Notice ${status}`,
    `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#1e40af;">Notice Status Updated</h2>
        <p>Hello ${studentName},</p>
        <p>Your notice has been updated.</p>
        <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;padding:16px;margin:16px 0;">
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Status:</strong> ${status}</p>
          <p><strong>Remarks:</strong> ${remarks || 'No remarks provided.'}</p>
        </div>
      </div>
    `
  );
};

export const sendCertificateGeneratedEmail = async (
  email: string,
  studentName: string,
  certificateId: string
): Promise<boolean> => {
  const certificatesUrl = `${config.frontendUrl}/certificates`;
  return sendNotificationEmail(
    email,
    'CDGI No-Dues - Certificate Generated',
    `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#1e40af;">No-Dues Certificate Generated</h2>
        <p>Hello ${studentName},</p>
        <p>Your no-dues certificate has been generated after HOD final approval.</p>
        <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;padding:16px;margin:16px 0;">
          <p><strong>Certificate ID:</strong> ${certificateId}</p>
        </div>
        <a href="${certificatesUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">
          Open Certificates
        </a>
      </div>
    `
  );
};

export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const generateOfflineCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const storeOTP = async (email: string, otp: string): Promise<void> => {
  const normalizedEmail = email.toLowerCase().trim();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await OtpCode.findOneAndUpdate(
    { email: normalizedEmail },
    { email: normalizedEmail, code: otp, expiresAt },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

export const verifyOTP = async (email: string, otp: string): Promise<boolean> => {
  const normalizedEmail = email.toLowerCase().trim();
  const record = await OtpCode.findOne({ email: normalizedEmail });

  if (!record) return false;
  if (record.expiresAt.getTime() < Date.now()) {
    await OtpCode.deleteOne({ _id: record._id });
    return false;
  }
  if (record.code !== otp) return false;

  await OtpCode.deleteOne({ _id: record._id });
  return true;
};

export const sendOTPEmail = async (email: string, otp: string): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: config.email.from,
      to: email,
      subject: 'CDGI No-Dues - Email Verification OTP',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#1e40af;">CDGI No-Dues Management System</h2>
          <p>Your One-Time Password (OTP) for email verification:</p>
          <div style="background:#f0f4ff;border:2px solid #2563eb;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
            <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1e40af;">${otp}</span>
          </div>
          <p style="color:#666;">This OTP is valid for <strong>5 minutes</strong>. Do not share it with anyone.</p>
          <p style="color:#999;font-size:12px;margin-top:20px;">If you did not request this, please ignore.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('OTP email send failed:', error);
    return false;
  }
};
