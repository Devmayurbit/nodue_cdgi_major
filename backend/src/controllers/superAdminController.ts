import { Response } from 'express';
import bcrypt from 'bcryptjs';
import User, { UserRole } from '../models/User';
import NoDues from '../models/NoDues';
import Notice from '../models/Notice';
import Certificate from '../models/Certificate';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../services/auditService';
import { ApprovalStatus } from '../models/NoDues';

// POST /api/v1/superadmin/create-faculty
export const createFaculty = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, department, section, subject, semester } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ success: false, message: 'Email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const faculty = await User.create({
      name,
      email,
      password: hashedPassword,
      role: UserRole.FACULTY,
      department,
      section,
      subject,
      semester,
      isEmailVerified: true,
      accessKeyVerified: false,
    });

    await createAuditLog(req.user!._id as any, 'CREATE_FACULTY', 'User', faculty._id as any, `Faculty created: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Faculty account created.',
      data: { id: faculty._id, name: faculty.name, email: faculty.email, department, section, semester, subject },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/superadmin/create-admin
export const createAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, department } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ success: false, message: 'Email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: UserRole.ADMIN,
      department,
      isEmailVerified: true,
      accessKeyVerified: false,
    });

    await createAuditLog(req.user!._id as any, 'CREATE_ADMIN', 'User', admin._id as any, `Admin created: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Admin account created.',
      data: { id: admin._id, name: admin.name, email: admin.email, department },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/superadmin/create-hod
export const createHod = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, department } = req.body;

    // SECURITY: only the root college Super Admin should be able to create HOD accounts.
    // We treat the seeded/root Super Admin as the one in department "Administration".
    const requesterDept = (req.user?.department || '').trim().toLowerCase();
    if (requesterDept !== 'administration') {
      res.status(403).json({
        success: false,
        message: 'Only the root Super Admin can create HOD accounts.',
      });
      return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ success: false, message: 'Email already exists.' });
      return;
    }

    if (!department || typeof department !== 'string' || !department.trim()) {
      res.status(400).json({ success: false, message: 'Department is required.' });
      return;
    }

    // Enforce one HOD per department
    const existingDeptHod = await User.findOne({ role: UserRole.SUPERADMIN, department: department.trim() });
    if (existingDeptHod) {
      res.status(409).json({
        success: false,
        message: `HOD already exists for department: ${department}.`,
      });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const hod = await User.create({
      name,
      email,
      password: hashedPassword,
      role: UserRole.SUPERADMIN,
      department: department.trim(),
      isEmailVerified: true,
      accessKeyVerified: true,
      isActive: true,
    });

    await createAuditLog(req.user!._id as any, 'CREATE_HOD', 'User', hod._id as any, `HOD created: ${email}`);

    res.status(201).json({
      success: true,
      message: 'HOD account created.',
      data: { id: hod._id, name: hod.name, email: hod.email, department: hod.department },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/superadmin/analytics
export const getAnalytics = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalStudents,
      totalFaculty,
      totalAdmins,
      totalNoDues,
      pendingNoDues,
      approvedNoDues,
      rejectedNoDues,
      totalNotices,
      totalCertificates,
      recentNoDues,
      departmentBreakdown,
    ] = await Promise.all([
      User.countDocuments({ role: UserRole.STUDENT }),
      User.countDocuments({ role: UserRole.FACULTY }),
      User.countDocuments({ role: UserRole.ADMIN }),
      NoDues.countDocuments(),
      NoDues.countDocuments({ status: 'submitted' }),
      NoDues.countDocuments({ status: 'approved' }),
      NoDues.countDocuments({ status: 'rejected' }),
      Notice.countDocuments(),
      Certificate.countDocuments(),
      NoDues.find().sort({ createdAt: -1 }).limit(10).populate('student', 'name enrollmentNumber'),
      NoDues.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        users: { totalStudents, totalFaculty, totalAdmins },
        noDues: { total: totalNoDues, pending: pendingNoDues, approved: approvedNoDues, rejected: rejectedNoDues },
        totalNotices,
        totalCertificates,
        recentNoDues,
        departmentBreakdown,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/superadmin/users
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, page = '1', limit = '20', search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const filter: any = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/superadmin/users/:id/toggle-active
export const toggleUserActive = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }
    if (targetUser.role === UserRole.SUPERADMIN) {
      res.status(403).json({ success: false, message: 'Cannot modify super admin accounts.' });
      return;
    }

    targetUser.isActive = !targetUser.isActive;
    await targetUser.save();

    await createAuditLog(
      req.user!._id as any,
      'TOGGLE_USER_ACTIVE',
      'User',
      targetUser._id as any,
      `User ${targetUser.isActive ? 'activated' : 'deactivated'}: ${targetUser.email}`
    );

    res.json({
      success: true,
      message: `User ${targetUser.isActive ? 'activated' : 'deactivated'} successfully.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/superadmin/override/:noDuesId
export const overrideDecision = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, remarks } = req.body;
    const noDues = await NoDues.findById(req.params.noDuesId);
    if (!noDues) {
      res.status(404).json({ success: false, message: 'Not found.' });
      return;
    }

    noDues.status = status;
    noDues.superAdminApproval = {
      status: status === 'approved' ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
      approvedBy: req.user!._id as any,
      approvedAt: new Date(),
      remarks: `OVERRIDE: ${remarks || ''}`,
    };

    await noDues.save();
    await createAuditLog(req.user!._id as any, 'OVERRIDE_DECISION', 'NoDues', noDues._id as any, `Override to ${status}`);

    res.json({ success: true, message: 'Decision overridden.', data: noDues });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
