import AuditLog from '../models/AuditLog';
import mongoose from 'mongoose';

export const createAuditLog = async (
  userId: mongoose.Types.ObjectId | string,
  action: string,
  entity: string,
  entityId?: mongoose.Types.ObjectId | string,
  details?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      entity,
      entityId,
      details,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Audit log creation failed:', error);
  }
};
