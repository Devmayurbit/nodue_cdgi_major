import mongoose, { Schema, Document } from 'mongoose';

export interface ICertificate extends Document {
  noDues: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  certificateId: string;
  enrollmentNumber: string;
  studentName: string;
  department: string;
  semester: number;
  approvalDate: Date;
  qrCode: string;
  pdfPath: string;
  isValid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    noDues: { type: Schema.Types.ObjectId, ref: 'NoDues', required: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    certificateId: { type: String, required: true, unique: true },
    enrollmentNumber: { type: String, required: true },
    studentName: { type: String, required: true },
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    approvalDate: { type: Date, required: true, default: Date.now },
    qrCode: { type: String, required: true },
    pdfPath: { type: String, required: true },
    isValid: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CertificateSchema.index({ certificateId: 1 });
CertificateSchema.index({ student: 1 });
CertificateSchema.index({ enrollmentNumber: 1 });

export default mongoose.model<ICertificate>('Certificate', CertificateSchema);
