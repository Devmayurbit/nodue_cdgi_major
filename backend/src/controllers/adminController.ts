import { Response } from 'express';
import User, { UserRole } from '../models/User';
import Department from '../models/Department';
import NoDues from '../models/NoDues';
import Notice from '../models/Notice';
import AuditLog from '../models/AuditLog';
import Certificate from '../models/Certificate';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../services/auditService';

// GET /api/v1/admin/analytics
export const getAnalytics = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalStudents,
      totalNoDues,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      certificatesGenerated,
      requestsPerDepartment,
      monthlyStats,
    ] = await Promise.all([
      User.countDocuments({ role: UserRole.STUDENT }),
      NoDues.countDocuments(),
      NoDues.countDocuments({ status: { $in: ['submitted', 'in_progress'] } }),
      NoDues.countDocuments({ status: 'approved' }),
      NoDues.countDocuments({ status: 'rejected' }),
      Certificate.countDocuments(),
      NoDues.aggregate([
        { $group: { _id: '$department', total: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      NoDues.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            total: { $sum: 1 },
            approved: {
              $sum: {
                $cond: [{ $eq: ['$status', 'approved'] }, 1, 0],
              },
            },
            rejected: {
              $sum: {
                $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0],
              },
            },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const approvalRate = totalNoDues > 0 ? Math.round((approvedRequests / totalNoDues) * 100) : 0;

    const monthly = monthlyStats.map((item) => ({
      label: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      total: item.total,
      approved: item.approved,
      rejected: item.rejected,
    }));

    res.json({
      success: true,
      data: {
        totals: {
          totalStudents,
          totalNoDues,
          pendingRequests,
          approvedRequests,
          rejectedRequests,
          certificatesGenerated,
          approvalRate,
        },
        requestsPerDepartment,
        monthly,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/admin/stats
export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [students, faculty, noDuesTotal, noDuesPending, noDuesApproved, notices, certificates] =
      await Promise.all([
        User.countDocuments({ role: UserRole.STUDENT }),
        User.countDocuments({ role: UserRole.FACULTY }),
        NoDues.countDocuments(),
        NoDues.countDocuments({ status: 'submitted' }),
        NoDues.countDocuments({ status: 'approved' }),
        Notice.countDocuments(),
        Certificate.countDocuments(),
      ]);

    res.json({
      success: true,
      data: { students, faculty, noDuesTotal, noDuesPending, noDuesApproved, notices, certificates },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/admin/students
export const getStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', department, search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const filter: any = { role: UserRole.STUDENT };

    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { enrollmentNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const [students, total] = await Promise.all([
      User.find(filter)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: students,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/admin/students/:id/toggle-active
export const toggleStudentActive = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== UserRole.STUDENT) {
      res.status(404).json({ success: false, message: 'Student not found.' });
      return;
    }

    student.isActive = !student.isActive;
    await student.save();

    await createAuditLog(
      req.user!._id as any,
      student.isActive ? 'STUDENT_ACTIVATED' : 'STUDENT_DEACTIVATED',
      'User',
      student._id as any
    );

    res.json({ success: true, message: `Student ${student.isActive ? 'activated' : 'deactivated'}.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/admin/departments
export const getDepartments = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json({ success: true, data: departments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/admin/departments
export const createDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, code, description, headName, headEmail } = req.body;
    const dept = await Department.create({ name, code, description, headName, headEmail });

    await createAuditLog(req.user!._id as any, 'DEPT_CREATE', 'Department', dept._id as any);

    res.status(201).json({ success: true, data: dept });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/admin/departments/:id
export const updateDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!dept) {
      res.status(404).json({ success: false, message: 'Department not found.' });
      return;
    }

    await createAuditLog(req.user!._id as any, 'DEPT_UPDATE', 'Department', dept._id as any);

    res.json({ success: true, data: dept });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/admin/audit-logs
export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '50', action } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const filter: any = {};
    if (action) filter.action = action;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/admin/verification-codes
export const getVerificationCodes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find({
      isEmailVerified: false,
      offlineVerificationCode: { $exists: true, $ne: null },
    }).select('+offlineVerificationCode');

    const data = users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      enrollmentNumber: u.enrollmentNumber,
      code: u.offlineVerificationCode,
    }));

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
