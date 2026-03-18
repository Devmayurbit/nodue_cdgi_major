import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User';
import {
  createManualNotification,
  getMyNotifications,
  getNotificationsByUserId,
  markNotificationRead,
  markAllMyNotificationsRead,
} from '../controllers/notificationController';

const router = Router();

router.use(authenticate);

router.post('/create', authorize(UserRole.ADMIN, UserRole.SUPERADMIN), createManualNotification);
router.get('/my', getMyNotifications);
router.get('/user/:id', getNotificationsByUserId);
router.put('/read/:id', markNotificationRead);
router.put('/read-all', markAllMyNotificationsRead);

export default router;
