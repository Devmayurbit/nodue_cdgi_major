import { Response } from 'express';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import { UserRole } from '../models/User';

export const createManualNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, message, type = 'general', metadata } = req.body;
    if (!userId || !message) {
      res.status(400).json({ success: false, message: 'userId and message are required.' });
      return;
    }

    const notification = await Notification.create({
      user: userId,
      message,
      type,
      metadata,
    });

    res.status(201).json({ success: true, data: notification });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const [items, total, unread] = await Promise.all([
      Notification.find({ user: user._id })
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Notification.countDocuments({ user: user._id }),
      Notification.countDocuments({ user: user._id, isRead: false }),
    ]);

    res.json({
      success: true,
      data: items,
      unread,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNotificationsByUserId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requester = req.user!;
    const { id } = req.params;

    if (
      requester.role !== UserRole.ADMIN &&
      requester.role !== UserRole.SUPERADMIN &&
      id !== (requester._id as any).toString()
    ) {
      res.status(403).json({ success: false, message: 'Not authorized.' });
      return;
    }

    const notifications = await Notification.find({ user: id }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markNotificationRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found.' });
      return;
    }

    if ((notification.user as any).toString() !== (user._id as any).toString()) {
      res.status(403).json({ success: false, message: 'Not authorized.' });
      return;
    }

    notification.isRead = true;
    await notification.save();
    res.json({ success: true, data: notification });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllMyNotificationsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    await Notification.updateMany({ user: user._id, isRead: false }, { $set: { isRead: true } });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
