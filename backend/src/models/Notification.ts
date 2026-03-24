import mongoose, { Document, Schema } from 'mongoose';

export enum NotificationType {
  NODUES_SUBMITTED = 'nodues_submitted',
  FACULTY_REVIEW_DONE = 'faculty_review_done',
  ADMIN_VERIFICATION_DONE = 'admin_verification_done',
  HOD_FINAL_READY = 'hod_final_ready',
  CERTIFICATE_GENERATED = 'certificate_generated',
  NODUES_REJECTED = 'nodues_rejected',
  SLA_ESCALATION = 'sla_escalation',
  GENERAL = 'general',
}

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  message: string;
  type: NotificationType;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
      default: NotificationType.GENERAL,
    },
    isRead: { type: Boolean, default: false, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
