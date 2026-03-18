import mongoose, { Schema, Document } from 'mongoose';

export interface IChatLog extends Document {
  user: mongoose.Types.ObjectId;
  messages: Array<{
    role: 'user' | 'bot';
    content: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ChatLogSchema = new Schema<IChatLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    messages: [
      {
        role: { type: String, enum: ['user', 'bot'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

ChatLogSchema.index({ user: 1 });

export default mongoose.model<IChatLog>('ChatLog', ChatLogSchema);
