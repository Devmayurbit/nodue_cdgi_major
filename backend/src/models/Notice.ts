import mongoose, { Schema, Document } from 'mongoose';

export enum NoticeStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  FACULTY_APPROVED = 'faculty_approved',
  ADMIN_APPROVED = 'admin_approved',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface INotice extends Document {
  student: mongoose.Types.ObjectId;
  title: string;
  description: string;
  fileAttachment?: string;
  audioAttachment?: string;
  status: NoticeStatus;

  facultyApproval: {
    status: string;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    remarks?: string;
  };
  adminApproval: {
    status: string;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    remarks?: string;
  };
  superAdminApproval: {
    status: string;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    remarks?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const ApprovalSub = {
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  remarks: { type: String, trim: true },
};

const NoticeSchema = new Schema<INotice>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    fileAttachment: { type: String },
    audioAttachment: { type: String },
    status: { type: String, enum: Object.values(NoticeStatus), default: NoticeStatus.DRAFT },

    facultyApproval: { type: ApprovalSub, default: () => ({}) },
    adminApproval: { type: ApprovalSub, default: () => ({}) },
    superAdminApproval: { type: ApprovalSub, default: () => ({}) },
  },
  { timestamps: true }
);

NoticeSchema.index({ student: 1 });
NoticeSchema.index({ status: 1 });

export default mongoose.model<INotice>('Notice', NoticeSchema);
