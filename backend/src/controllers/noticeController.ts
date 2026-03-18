import { Response } from 'express';
import Notice, { NoticeStatus } from '../models/Notice';
import { AuthRequest } from '../middleware/auth';
import { UserRole } from '../models/User';
import { createAuditLog } from '../services/auditService';
import User from '../models/User';
import {
  sendNoticeFacultyNotificationEmail,
  sendNoticeStatusEmail,
  sendNoticeSubmissionEmail,
} from '../services/emailService';
import { uploadMulterFile } from '../services/storageService';

// POST /api/v1/notices - Student submits notice
export const submitNotice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { title, description } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const fileAttachment = files?.file?.[0]
      ? (await uploadMulterFile(files.file[0], { folder: 'notice-files', resourceType: 'auto' })).url
      : undefined;
    const audioAttachment = files?.audio?.[0]
      ? (await uploadMulterFile(files.audio[0], { folder: 'notice-audio', resourceType: 'video' })).url
      : undefined;

    const notice = await Notice.create({
      student: user._id,
      title,
      description,
      fileAttachment,
      audioAttachment,
      status: NoticeStatus.SUBMITTED,
    });

    await createAuditLog(user._id as any, 'NOTICE_SUBMIT', 'Notice', notice._id as any);

    void sendNoticeSubmissionEmail(user.email, user.name, title, description);

    if (user.department && user.section) {
      const facultyUsers = await User.find({
        role: UserRole.FACULTY,
        department: user.department,
        section: user.section,
        isActive: true,
      }).select('name email');

      for (const faculty of facultyUsers) {
        void sendNoticeFacultyNotificationEmail(
          faculty.email,
          faculty.name,
          user.name,
          title,
          user.department,
          user.section
        );
      }
    }

    res.status(201).json({ success: true, message: 'Notice submitted.', data: notice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/notices/my
export const getMyNotices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notices = await Notice.find({ student: req.user!._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: notices });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/notices
export const getAllNotices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const filter: any = {};
    const user = req.user!;
    if (status) filter.status = status;

    if (user.role === UserRole.FACULTY) {
      if (!user.department || !user.section) {
        res.status(403).json({ success: false, message: 'Faculty profile must include department and section.' });
        return;
      }

      const studentIds = await User.find({
        role: UserRole.STUDENT,
        department: user.department,
        section: user.section,
      }).distinct('_id');

      filter.student = { $in: studentIds };
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [notices, total] = await Promise.all([
      Notice.find(filter)
        .populate('student', 'name email enrollmentNumber department section')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Notice.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: notices,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/notices/:id
export const getNoticeById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const notice = await Notice.findById(req.params.id).populate('student', 'name email enrollmentNumber department section');
    if (!notice) {
      res.status(404).json({ success: false, message: 'Notice not found.' });
      return;
    }

    const student = notice.student as any;
    if (user.role === UserRole.STUDENT && student?._id?.toString() !== (user._id as any).toString()) {
      res.status(403).json({ success: false, message: 'Not allowed to access this notice.' });
      return;
    }

    if (user.role === UserRole.FACULTY) {
      if (student?.department !== user.department || student?.section !== user.section) {
        res.status(403).json({ success: false, message: 'Faculty can view only notices from their department and section.' });
        return;
      }
    }

    res.json({ success: true, data: notice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/notices/:id/faculty-approve
export const facultyApproveNotice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { status, remarks } = req.body;

    const notice = await Notice.findById(req.params.id).populate('student', 'name email department section');
    if (!notice) {
      res.status(404).json({ success: false, message: 'Not found.' });
      return;
    }

    const student = notice.student as any;
    if (student?.department !== user.department || student?.section !== user.section) {
      res.status(403).json({ success: false, message: 'Faculty can approve only notices from their department and section.' });
      return;
    }

    notice.facultyApproval = {
      status: status === 'approved' ? 'approved' : 'rejected',
      approvedBy: user._id as any,
      approvedAt: new Date(),
      remarks,
    };

    notice.status = status === 'approved' ? NoticeStatus.FACULTY_APPROVED : NoticeStatus.REJECTED;
    await notice.save();

    await createAuditLog(user._id as any, 'NOTICE_FACULTY_REVIEW', 'Notice', notice._id as any);
    if (student?.email) {
      void sendNoticeStatusEmail(student.email, student.name, notice.title, notice.status, remarks);
    }

    res.json({ success: true, message: `Notice ${status}.`, data: notice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/notices/:id/admin-approve
export const adminApproveNotice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { status, remarks } = req.body;

    const notice = await Notice.findById(req.params.id).populate('student', 'name email');
    if (!notice) {
      res.status(404).json({ success: false, message: 'Not found.' });
      return;
    }

    notice.adminApproval = {
      status: status === 'approved' ? 'approved' : 'rejected',
      approvedBy: user._id as any,
      approvedAt: new Date(),
      remarks,
    };

    notice.status = status === 'approved' ? NoticeStatus.ADMIN_APPROVED : NoticeStatus.REJECTED;
    await notice.save();

    await createAuditLog(user._id as any, 'NOTICE_ADMIN_REVIEW', 'Notice', notice._id as any);
    const student = notice.student as any;
    if (student?.email) {
      void sendNoticeStatusEmail(student.email, student.name, notice.title, notice.status, remarks);
    }

    res.json({ success: true, message: `Notice ${status}.`, data: notice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/notices/:id/superadmin-approve
export const superAdminApproveNotice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { status, remarks } = req.body;

    const notice = await Notice.findById(req.params.id).populate('student', 'name email');
    if (!notice) {
      res.status(404).json({ success: false, message: 'Not found.' });
      return;
    }

    notice.superAdminApproval = {
      status: status === 'approved' ? 'approved' : 'rejected',
      approvedBy: user._id as any,
      approvedAt: new Date(),
      remarks,
    };

    notice.status = status === 'approved' ? NoticeStatus.APPROVED : NoticeStatus.REJECTED;
    await notice.save();

    await createAuditLog(user._id as any, 'NOTICE_SUPERADMIN_REVIEW', 'Notice', notice._id as any);
    const student = notice.student as any;
    if (student?.email) {
      void sendNoticeStatusEmail(student.email, student.name, notice.title, notice.status, remarks);
    }

    res.json({ success: true, message: `Notice ${status}.`, data: notice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
