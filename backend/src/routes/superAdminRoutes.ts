import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User';
import {
  createFaculty,
  createAdmin,
  getAnalytics,
  getAllUsers,
  overrideDecision,
  toggleUserActive,
} from '../controllers/superAdminController';

const router = Router();

router.use(authenticate, authorize(UserRole.SUPERADMIN));

router.post(
  '/create-faculty',
  validate([
    body('name').trim().notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('department').trim().notEmpty(),
    body('section').trim().notEmpty(),
    body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),
    body('subject').trim().notEmpty(),
  ]),
  createFaculty
);

router.post(
  '/create-admin',
  validate([
    body('name').trim().notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
  ]),
  createAdmin
);

router.get('/analytics', getAnalytics);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-active', toggleUserActive);
router.put('/override/:noDuesId', overrideDecision);

export default router;
