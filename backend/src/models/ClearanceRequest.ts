import mongoose, { Schema, Document } from 'mongoose';

export type ClearanceStatus = 'pending' | 'approved' | 'rejected';

export interface IClearanceRequest extends Document {
  studentId: mongoose.Types.ObjectId;
  facultyApproval: ClearanceStatus;
  hodApproval: ClearanceStatus;
  libraryStatus: ClearanceStatus;
  accountsStatus: ClearanceStatus;
  hostelStatus: ClearanceStatus;
  labStatus: ClearanceStatus;
  assignmentStatus: ClearanceStatus;
  finalStatus: ClearanceStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ClearanceRequestSchema = new Schema<IClearanceRequest>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    facultyApproval: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    hodApproval: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    libraryStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    accountsStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    hostelStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    labStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    assignmentStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    finalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

export default mongoose.model<IClearanceRequest>('ClearanceRequest', ClearanceRequestSchema);
