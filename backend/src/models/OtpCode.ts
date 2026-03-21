import mongoose, { Document, Schema } from 'mongoose';

export interface IOtpCode extends Document {
  email: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OtpCodeSchema = new Schema<IOtpCode>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

OtpCodeSchema.index({ email: 1 }, { unique: true });
OtpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IOtpCode>('OtpCode', OtpCodeSchema);
