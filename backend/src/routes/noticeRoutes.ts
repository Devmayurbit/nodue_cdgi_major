import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User';
import { upload } from '../middleware/upload';
import {
  submitNotice,
  getMyNotices,
  getAllNotices,
  getNoticeById,
  facultyApproveNotice,
  adminApproveNotice,
  superAdminApproveNotice,
} from '../controllers/noticeController';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize(UserRole.STUDENT),
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
  ]),
  submitNotice
);

router.get('/my', authenticate, authorize(UserRole.STUDENT), getMyNotices);
router.get('/', authenticate, authorize(UserRole.FACULTY, UserRole.ADMIN, UserRole.SUPERADMIN), getAllNotices);
router.get('/:id', authenticate, getNoticeById);

router.put('/:id/faculty-approve', authenticate, authorize(UserRole.FACULTY), facultyApproveNotice);
router.put('/:id/admin-approve', authenticate, authorize(UserRole.ADMIN, UserRole.SUPERADMIN), adminApproveNotice);
router.put('/:id/superadmin-approve', authenticate, authorize(UserRole.SUPERADMIN), superAdminApproveNotice);

export default router;
