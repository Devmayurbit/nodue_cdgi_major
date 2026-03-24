import mongoose, { Document, Schema } from 'mongoose';

export interface IJobLock extends Document {
  name: string;
  lockedUntil: Date;
  lockedBy?: string;
  updatedAt: Date;
  createdAt: Date;
}

const JobLockSchema = new Schema<IJobLock>(
  {
    name: { type: String, required: true, unique: true, index: true },
    lockedUntil: { type: Date, required: true, index: true },
    lockedBy: { type: String, trim: true },
  },
  { timestamps: true }
);

JobLockSchema.index({ name: 1 }, { unique: true });

export default mongoose.model<IJobLock>('JobLock', JobLockSchema);
