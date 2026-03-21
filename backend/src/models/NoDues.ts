import mongoose, { Schema, Document } from 'mongoose';

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum NoDuesStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  IN_PROGRESS = 'in_progress',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export interface IDepartmentApproval {
  department: string;
  status: ApprovalStatus;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  remarks?: string;
}

export interface INoDues extends Document {
  student: mongoose.Types.ObjectId;
  enrollmentNumber: string;
  department: string;
  section: string;
  semester: number;
  status: NoDuesStatus;

  // Clearance fields
  libraryClearance: IDepartmentApproval;
  accountsClearance: IDepartmentApproval;
  hostelClearance: IDepartmentApproval;
  labClearance: IDepartmentApproval;
  assignmentClearance: IDepartmentApproval;

  // Faculty approval
  facultyApproval: {
    status: ApprovalStatus;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    remarks?: string;
  };

  // Admin approval
  adminApproval: {
    status: ApprovalStatus;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    remarks?: string;
  };

  // Super Admin final approval
  superAdminApproval: {
    status: ApprovalStatus;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    remarks?: string;
  };

  remarks?: string;
  attachments: string[];
  certificateId?: string;
  certificateGeneratedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalSubSchema = {
  status: { type: String, enum: Object.values(ApprovalStatus), default: ApprovalStatus.PENDING },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  remarks: { type: String, trim: true },
};

const DepartmentApprovalSchema = {
  department: { type: String, required: true },
  ...ApprovalSubSchema,
};

const NoDuesSchema = new Schema<INoDues>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    enrollmentNumber: { type: String, required: true },
    department: { type: String, required: true },
    section: { type: String, required: true, trim: true },
    semester: { type: Number, required: true },
    status: { type: String, enum: Object.values(NoDuesStatus), default: NoDuesStatus.DRAFT },

    libraryClearance: { type: DepartmentApprovalSchema, default: () => ({ department: 'Library' }) },
    accountsClearance: { type: DepartmentApprovalSchema, default: () => ({ department: 'Accounts' }) },
    hostelClearance: { type: DepartmentApprovalSchema, default: () => ({ department: 'Hostel' }) },
    labClearance: { type: DepartmentApprovalSchema, default: () => ({ department: 'Laboratory' }) },
    assignmentClearance: { type: DepartmentApprovalSchema, default: () => ({ department: 'Assignment' }) },

    facultyApproval: { type: ApprovalSubSchema, default: () => ({}) },
    adminApproval: { type: ApprovalSubSchema, default: () => ({}) },
    superAdminApproval: { type: ApprovalSubSchema, default: () => ({}) },

    remarks: { type: String, trim: true },
    attachments: [{ type: String }],
    certificateId: { type: String },
    certificateGeneratedAt: { type: Date },
  },
  { timestamps: true }
);

NoDuesSchema.index({ student: 1 });
NoDuesSchema.index({ enrollmentNumber: 1 });
NoDuesSchema.index({ status: 1 });
NoDuesSchema.index({ department: 1 });
NoDuesSchema.index({ department: 1, section: 1, status: 1 });

export default mongoose.model<INoDues>('NoDues', NoDuesSchema);
