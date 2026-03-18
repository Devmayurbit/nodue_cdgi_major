import mongoose, { Schema, Document } from 'mongoose';

export interface IDeviceToken extends Document {
  user: mongoose.Types.ObjectId;
  token: string;
  platform: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceTokenSchema = new Schema<IDeviceToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true },
    platform: { type: String, default: 'web' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

DeviceTokenSchema.index({ user: 1 });
DeviceTokenSchema.index({ token: 1 });

export default mongoose.model<IDeviceToken>('DeviceToken', DeviceTokenSchema);
