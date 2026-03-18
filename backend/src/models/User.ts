import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
  STUDENT = 'student',
  FACULTY = 'faculty',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  enrollmentNumber?: string;
  department?: string;
  section?: string;
  subject?: string;
  semester?: number;
  phone?: string;
  avatar?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  offlineVerificationCode?: string;
  accessKeyVerified: boolean;
  isActive: boolean;
  failedLoginAttempts: number;
  accountLockedUntil?: Date;
  refreshToken?: string;
  deviceTokens: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(UserRole), required: true, default: UserRole.STUDENT },
    enrollmentNumber: { type: String, sparse: true, trim: true },
    department: { type: String, trim: true },
    section: { type: String, trim: true },
    subject: { type: String, trim: true },
    semester: { type: Number, min: 1, max: 8 },
    phone: { type: String, trim: true },
    avatar: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    offlineVerificationCode: { type: String, select: false },
    accessKeyVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    failedLoginAttempts: { type: Number, default: 0 },
    accountLockedUntil: { type: Date },
    refreshToken: { type: String, select: false },
    deviceTokens: [{ type: String }],
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });
UserSchema.index({ enrollmentNumber: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ department: 1 });
UserSchema.index({ department: 1, section: 1, role: 1 });
UserSchema.index({ role: 1, subject: 1 });

export default mongoose.model<IUser>('User', UserSchema);
