import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User';
import {
  getStats,
  getStudents,
  toggleStudentActive,
  getDepartments,
  createDepartment,
  updateDepartment,
  getAuditLogs,
  getVerificationCodes,
  getAnalytics,
} from '../controllers/adminController';

const router = Router();

router.use(authenticate, authorize(UserRole.ADMIN, UserRole.SUPERADMIN));

router.get('/stats', getStats);
router.get('/analytics', getAnalytics);
router.get('/students', getStudents);
router.put('/students/:id/toggle-active', toggleStudentActive);
router.get('/departments', getDepartments);
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);
router.get('/audit-logs', getAuditLogs);
router.get('/verification-codes', getVerificationCodes);

export default router;
