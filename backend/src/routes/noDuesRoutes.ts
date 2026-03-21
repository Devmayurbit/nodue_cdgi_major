import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User';
import { upload } from '../middleware/upload';
import {
  submitNoDues,
  getMyNoDues,
  getAllNoDues,
  getNoDuesById,
  facultyApprove,
  departmentApprove,
  adminApprove,
  superAdminApprove,
  cancelNoDues,
} from '../controllers/noDuesController';

const router = Router();

// Student
router.post('/', authenticate, authorize(UserRole.STUDENT), upload.array('attachments', 5), submitNoDues);
router.get('/my', authenticate, authorize(UserRole.STUDENT), getMyNoDues);
router.put('/:id/cancel', authenticate, authorize(UserRole.STUDENT), cancelNoDues);

// All authorized roles can view
router.get('/', authenticate, authorize(UserRole.FACULTY, UserRole.ADMIN, UserRole.SUPERADMIN), getAllNoDues);
router.get('/:id', authenticate, getNoDuesById);

// Approval endpoints
router.put('/:id/faculty-approve', authenticate, authorize(UserRole.FACULTY), facultyApprove);
router.put(
  '/:id/department-approve',
  authenticate,
  authorize(UserRole.FACULTY, UserRole.ADMIN, UserRole.SUPERADMIN),
  departmentApprove
);
router.put('/:id/admin-approve', authenticate, authorize(UserRole.ADMIN, UserRole.SUPERADMIN), adminApprove);
router.put('/:id/superadmin-approve', authenticate, authorize(UserRole.SUPERADMIN), superAdminApprove);

export default router;
