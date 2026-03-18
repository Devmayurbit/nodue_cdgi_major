import Notification, { NotificationType } from '../models/Notification';

export const createNotification = async (
  userId: any,
  message: string,
  type: NotificationType,
  metadata?: Record<string, any>
): Promise<void> => {
  await Notification.create({ user: userId, message, type, metadata });
};

export const createBulkNotifications = async (
  userIds: any[],
  message: string,
  type: NotificationType,
  metadata?: Record<string, any>
): Promise<void> => {
  if (!userIds.length) return;
  await Notification.insertMany(
    userIds.map((userId) => ({ user: userId, message, type, metadata })),
    { ordered: false }
  );
};
