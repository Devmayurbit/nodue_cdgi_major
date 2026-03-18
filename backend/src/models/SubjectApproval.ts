import mongoose, { Document, Schema } from 'mongoose';
import { ApprovalStatus } from './NoDues';

export interface ISubjectApproval extends Document {
  noDues: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  faculty: mongoose.Types.ObjectId;
  subject: string;
  assignmentStatus: ApprovalStatus;
  labStatus: ApprovalStatus;
  status: ApprovalStatus;
  remarks?: string;
  actionedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectApprovalSchema = new Schema<ISubjectApproval>(
  {
    noDues: { type: Schema.Types.ObjectId, ref: 'NoDues', required: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    faculty: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true, trim: true },
    assignmentStatus: {
      type: String,
      enum: Object.values(ApprovalStatus),
      default: ApprovalStatus.PENDING,
    },
    labStatus: {
      type: String,
      enum: Object.values(ApprovalStatus),
      default: ApprovalStatus.PENDING,
    },
    status: {
      type: String,
      enum: Object.values(ApprovalStatus),
      default: ApprovalStatus.PENDING,
    },
    remarks: { type: String, trim: true },
    actionedAt: { type: Date },
  },
  { timestamps: true }
);

SubjectApprovalSchema.index({ noDues: 1 });
SubjectApprovalSchema.index({ student: 1, status: 1 });
SubjectApprovalSchema.index({ faculty: 1, status: 1 });
SubjectApprovalSchema.index({ noDues: 1, faculty: 1 }, { unique: true });

export default mongoose.model<ISubjectApproval>('SubjectApproval', SubjectApprovalSchema);
