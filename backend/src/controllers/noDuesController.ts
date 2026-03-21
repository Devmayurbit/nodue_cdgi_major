import { Response } from 'express';
import NoDues, { NoDuesStatus, ApprovalStatus } from '../models/NoDues';
import { AuthRequest } from '../middleware/auth';
import { UserRole } from '../models/User';
import { createAuditLog } from '../services/auditService';
import { generateCertificate } from '../services/certificateService';
import User from '../models/User';
import SubjectApproval from '../models/SubjectApproval';
import { createBulkNotifications, createNotification } from '../services/notificationService';
import { NotificationType } from '../models/Notification';
import { sendNotificationEmail } from '../services/emailService';
import { uploadMulterFile } from '../services/storageService';

const getStudentYear = (year?: number, semester?: number): number => {
  if (year && year >= 1 && year <= 4) return year;
  if (!semester) return 1;
  return Math.min(4, Math.max(1, Math.ceil(semester / 2)));
};

const getRequiredFacultyApprovals = (year: number): number => {
  if (year === 1 || year === 2) return 5;
  if (year === 3) return 4;
  return 3;
};

const allAdminDepartmentsApproved = (noDues: any): boolean => {
  return [
    noDues.libraryClearance?.status,
    noDues.accountsClearance?.status,
    noDues.hostelClearance?.status,
    noDues.labClearance?.status,
  ].every((status) => status === ApprovalStatus.APPROVED);
};

const allLegacyDepartmentsApproved = (noDues: any): boolean => {
  return [
    noDues.libraryClearance?.status,
    noDues.accountsClearance?.status,
    noDues.hostelClearance?.status,
    noDues.labClearance?.status,
    noDues.assignmentClearance?.status,
  ].every((status) => status === ApprovalStatus.APPROVED);
};

const resolveDecision = (value?: string): ApprovalStatus | undefined => {
  if (!value) return undefined;
  if (value === 'approved') return ApprovalStatus.APPROVED;
  if (value === 'rejected') return ApprovalStatus.REJECTED;
  return undefined;
};

const setSubjectApprovalStatus = (approval: any): void => {
  if (
    approval.assignmentStatus === ApprovalStatus.REJECTED ||
    approval.labStatus === ApprovalStatus.REJECTED
  ) {
    approval.status = ApprovalStatus.REJECTED;
    return;
  }

  if (
    approval.assignmentStatus === ApprovalStatus.APPROVED &&
    approval.labStatus === ApprovalStatus.APPROVED
  ) {
    approval.status = ApprovalStatus.APPROVED;
    return;
  }

  approval.status = ApprovalStatus.PENDING;
};

const ensureSubjectApprovals = async (noDues: any): Promise<number> => {
  const faculty = await User.find({
    role: UserRole.FACULTY,
    department: noDues.department,
    section: noDues.section,
    semester: noDues.semester,
    subject: { $exists: true, $ne: '' },
    isActive: true,
  }).select('_id subject');

  const rows = faculty
    .filter((f) => (f.subject || '').trim().length > 0)
    .map((f) => ({
      noDues: noDues._id,
      student: noDues.student,
      faculty: f._id,
      subject: (f.subject || '').trim(),
      assignmentStatus: ApprovalStatus.PENDING,
      labStatus: ApprovalStatus.PENDING,
      status: ApprovalStatus.PENDING,
    }));

  if (rows.length === 0) return 0;

  for (const row of rows) {
    await SubjectApproval.updateOne(
      { noDues: row.noDues, faculty: row.faculty },
      { $setOnInsert: row },
      { upsert: true }
    );
  }

  return rows.length;
};

const getSubjectApprovalSummary = async (noDuesId: any, requiredApprovals: number): Promise<{
  hasApprovals: boolean;
  anyRejected: boolean;
  allCompleted: boolean;
  totalApprovals: number;
  approvedCount: number;
  requiredApprovals: number;
}> => {
  const approvals = await SubjectApproval.find({ noDues: noDuesId });
  if (approvals.length === 0) {
    return {
      hasApprovals: false,
      anyRejected: false,
      allCompleted: false,
      totalApprovals: 0,
      approvedCount: 0,
      requiredApprovals,
    };
  }

  const anyRejected = approvals.some(
    (a) =>
      a.status === ApprovalStatus.REJECTED ||
      a.assignmentStatus === ApprovalStatus.REJECTED ||
      a.labStatus === ApprovalStatus.REJECTED
  );

  const approvedCount = approvals.filter(
    (a) =>
      a.assignmentStatus === ApprovalStatus.APPROVED &&
      a.labStatus === ApprovalStatus.APPROVED &&
      a.status === ApprovalStatus.APPROVED
  ).length;

  const allCompleted = approvedCount >= requiredApprovals;

  return {
    hasApprovals: true,
    anyRejected,
    allCompleted,
    totalApprovals: approvals.length,
    approvedCount,
    requiredApprovals,
  };
};

const attachSubjectApprovals = async (rows: any[]): Promise<any[]> => {
  if (rows.length === 0) return rows;

  const ids = rows.map((r) => r._id);
  const approvals = await SubjectApproval.find({ noDues: { $in: ids } })
    .populate('faculty', 'name email subject section department semester')
    .sort({ subject: 1 });

  const grouped = new Map<string, any[]>();
  for (const approval of approvals) {
    const key = (approval.noDues as any).toString();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(approval);
  }

  return rows.map((row) => {
    const plain = row.toObject ? row.toObject() : row;
    plain.subjectApprovals = grouped.get((row._id as any).toString()) || [];
    return plain;
  });
};

const syncLegacyFacultyClearances = (noDues: any, summary: { anyRejected: boolean; allCompleted: boolean }, userId: any, remarks?: string): void => {
  if (summary.anyRejected) {
    noDues.facultyApproval = {
      status: ApprovalStatus.REJECTED,
      approvedBy: userId,
      approvedAt: new Date(),
      remarks: remarks || 'Rejected in subject-wise faculty approvals.',
    };
    noDues.assignmentClearance = {
      department: 'Assignment',
      status: ApprovalStatus.REJECTED,
      approvedBy: userId,
      approvedAt: new Date(),
      remarks: remarks || 'Rejected in subject-wise faculty approvals.',
    };
    noDues.labClearance = {
      department: 'Lab',
      status: ApprovalStatus.REJECTED,
      approvedBy: userId,
      approvedAt: new Date(),
      remarks: remarks || 'Rejected in subject-wise faculty approvals.',
    };
    return;
  }

  if (summary.allCompleted) {
    noDues.facultyApproval = {
      status: ApprovalStatus.APPROVED,
      approvedBy: userId,
      approvedAt: new Date(),
      remarks: 'All subject-wise faculty approvals completed.',
    };
    noDues.assignmentClearance = {
      department: 'Assignment',
      status: ApprovalStatus.APPROVED,
      approvedBy: userId,
      approvedAt: new Date(),
      remarks: 'All subject-wise assignment approvals completed.',
    };
    noDues.labClearance = {
      department: 'Lab',
      status: ApprovalStatus.APPROVED,
      approvedBy: userId,
      approvedAt: new Date(),
      remarks: 'All subject-wise lab approvals completed.',
    };
    return;
  }

  noDues.facultyApproval = {
    status: ApprovalStatus.PENDING,
    remarks: 'Pending subject-wise faculty approvals.',
  };
  noDues.assignmentClearance = {
    department: 'Assignment',
    status: ApprovalStatus.PENDING,
    remarks: 'Pending subject-wise assignment approvals.',
  };
  noDues.labClearance = {
    department: 'Lab',
    status: ApprovalStatus.PENDING,
    remarks: 'Pending subject-wise lab approvals.',
  };
};

const finalizeIfEligible = async (noDues: any, approverId: any): Promise<void> => {
  if (!allLegacyDepartmentsApproved(noDues)) return;

  noDues.status = NoDuesStatus.APPROVED;
  if (!noDues.superAdminApproval || noDues.superAdminApproval.status !== ApprovalStatus.APPROVED) {
    noDues.superAdminApproval = {
      status: ApprovalStatus.APPROVED,
      approvedBy: approverId,
      approvedAt: new Date(),
      remarks: 'Auto-finalized after all department clearances were approved.',
    };
  }

  if (!noDues.certificateId) {
    const student = await User.findById(noDues.student);
    if (student) {
      const cert = await generateCertificate(noDues, student);
      noDues.certificateId = cert.certificateId;
      noDues.certificateGeneratedAt = new Date();
    }
  }
};

const notifyAdmins = async (message: string, metadata: Record<string, any>): Promise<void> => {
  const admins = await User.find({ role: UserRole.ADMIN, isActive: true }).select('_id email');
  const adminIds = admins.map((a) => a._id);
  await createBulkNotifications(adminIds, message, NotificationType.FACULTY_REVIEW_DONE, metadata);
  for (const admin of admins) {
    void sendNotificationEmail(admin.email, 'CDGI No-Dues - Admin Action Required', `<p>${message}</p>`);
  }
};

const notifyHODs = async (message: string, metadata: Record<string, any>): Promise<void> => {
  const hods = await User.find({ role: UserRole.SUPERADMIN, isActive: true }).select('_id email');
  const hodIds = hods.map((h) => h._id);
  await createBulkNotifications(hodIds, message, NotificationType.HOD_FINAL_READY, metadata);
  for (const hod of hods) {
    void sendNotificationEmail(hod.email, 'CDGI No-Dues - Final Approval Required', `<p>${message}</p>`);
  }
};

// POST /api/v1/nodues - Student submits No-Dues form
export const submitNoDues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    if (user.role !== UserRole.STUDENT) {
      res.status(403).json({ success: false, message: 'Only students can submit No-Dues.' });
      return;
    }

    // Check for existing active request
    const existing = await NoDues.findOne({
      student: user._id,
      status: { $nin: [NoDuesStatus.REJECTED, NoDuesStatus.CANCELLED] },
    });
    if (existing) {
      res.status(409).json({ success: false, message: 'You already have an active No-Dues request.' });
      return;
    }

    const { remarks } = req.body;

    if (!user.section || !user.department || !user.enrollmentNumber) {
      res.status(400).json({
        success: false,
        message: 'Student profile is incomplete. Enrollment number, department, section, and semester are required.',
      });
      return;
    }

    if (!user.semester) {
      res.status(400).json({
        success: false,
        message: 'Student semester is required before submitting No-Dues.',
      });
      return;
    }

    const totalRequests = await NoDues.countDocuments({
      student: user._id,
      status: { $ne: NoDuesStatus.CANCELLED },
    });

    const semesterRequests = await NoDues.countDocuments({
      student: user._id,
      semester: user.semester,
      status: { $ne: NoDuesStatus.CANCELLED },
    });

    if (totalRequests >= 16 || semesterRequests >= 2) {
      res.status(400).json({ success: false, message: 'Max requests reached' });
      return;
    }

    const studentYear = getStudentYear((user as any).year, user.semester);
    const requiredApprovals = getRequiredFacultyApprovals(studentYear);

    const availableFacultyCount = await User.countDocuments({
      role: UserRole.FACULTY,
      department: user.department,
      section: user.section,
      semester: user.semester,
      subject: { $exists: true, $ne: '' },
      isActive: true,
    });

    if (availableFacultyCount < requiredApprovals) {
      res.status(400).json({
        success: false,
        message: `At least ${requiredApprovals} active faculty (same department, section, semester) are required before submission.`,
      });
      return;
    }

    const attachments = req.files
      ? await Promise.all(
          (req.files as Express.Multer.File[]).map(async (f) => {
            const stored = await uploadMulterFile(f, { folder: 'nodues-attachments', resourceType: 'auto' });
            return stored.url;
          })
        )
      : [];

    const noDues = await NoDues.create({
      student: user._id,
      enrollmentNumber: user.enrollmentNumber,
      department: user.department,
      section: user.section,
      semester: user.semester,
      status: NoDuesStatus.SUBMITTED,
      remarks,
      attachments,
    });

    await ensureSubjectApprovals(noDues);

    user.totalRequests = totalRequests + 1;
    const semesterKey = String(user.semester);
    const currentSemesterCount = Number((user.semesterRequests as any)?.get?.(semesterKey) || 0);
    (user.semesterRequests as any).set(semesterKey, currentSemesterCount + 1);
    await user.save();

    const subjectApprovals = await SubjectApproval.find({ noDues: noDues._id }).populate('faculty', 'email');
    const facultyIds = subjectApprovals.map((sa) => sa.faculty as any).map((f) => f._id);

    await createBulkNotifications(
      facultyIds,
      `New No-Dues request submitted by ${user.name} (${user.enrollmentNumber}).`,
      NotificationType.NODUES_SUBMITTED,
      { noDuesId: noDues._id, studentId: user._id }
    );

    for (const approval of subjectApprovals as any[]) {
      const facultyEmail = approval.faculty?.email;
      if (facultyEmail) {
        void sendNotificationEmail(
          facultyEmail,
          'CDGI No-Dues - New Student Request',
          `<p>A new No-Dues request from ${user.name} (${user.enrollmentNumber}) is awaiting your review.</p>`
        );
      }
    }

    await createAuditLog(user._id as any, 'NODUES_SUBMIT', 'NoDues', noDues._id as any, `No-Dues submitted by ${user.email}`);

    const withApprovals = await attachSubjectApprovals([noDues]);
    res.status(201).json({ success: true, message: 'No-Dues form submitted.', data: withApprovals[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/nodues/my - Student gets their No-Dues
export const getMyNoDues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const noDues = await NoDues.find({ student: req.user!._id }).sort({ createdAt: -1 });
    const withApprovals = await attachSubjectApprovals(noDues);
    res.json({ success: true, data: withApprovals });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/nodues - Get all No-Dues (faculty/admin/superadmin)
export const getAllNoDues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, department, page = '1', limit = '20', section, search } = req.query;
    const filter: any = {};
    const user = req.user!;

    if (status) filter.status = status;
    if (department) filter.department = department;
    if (section) filter.section = section;

    if (search) {
      const regex = new RegExp(String(search), 'i');
      const studentIds = await User.find({
        role: UserRole.STUDENT,
        $or: [
          { name: regex },
          { enrollmentNumber: regex },
          { email: regex },
        ],
      }).distinct('_id');

      filter.$or = [
        { enrollmentNumber: regex },
        { student: { $in: studentIds } },
      ];
    }

    if (user.role === UserRole.FACULTY) {
      if (!user.department || !user.section || !user.semester || !user.subject) {
        res.status(403).json({
          success: false,
          message: 'Faculty profile must include department, section, semester, and subject.',
        });
        return;
      }

      const facultyApprovals = await SubjectApproval.find({ faculty: user._id }).select('noDues');
      const noDuesIds = facultyApprovals.map((item) => item.noDues);
      filter._id = { $in: noDuesIds };
      filter.department = user.department;
      filter.section = user.section;
      filter.semester = user.semester;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [noDues, total] = await Promise.all([
      NoDues.find(filter)
        .populate('student', 'name email enrollmentNumber department section')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      NoDues.countDocuments(filter),
    ]);

    const withApprovals = await attachSubjectApprovals(noDues);

    res.json({
      success: true,
      data: withApprovals,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/nodues/:id
export const getNoDuesById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const noDues = await NoDues.findById(req.params.id).populate('student', 'name email enrollmentNumber department section semester');
    if (!noDues) {
      res.status(404).json({ success: false, message: 'No-Dues request not found.' });
      return;
    }

    if (user.role === UserRole.STUDENT && (noDues.student as any).toString() !== (user._id as any).toString()) {
      res.status(403).json({ success: false, message: 'Not allowed to access this request.' });
      return;
    }

    if (user.role === UserRole.FACULTY) {
      const hasScope = await SubjectApproval.exists({ noDues: noDues._id, faculty: user._id });
      if (!hasScope) {
        res.status(403).json({ success: false, message: 'Faculty can view only mapped subject requests.' });
        return;
      }
    }

    const withApprovals = await attachSubjectApprovals([noDues]);
    res.json({ success: true, data: withApprovals[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/nodues/:id/faculty-approve
export const facultyApprove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { status, assignmentStatus, labStatus, approvalType, remarks } = req.body;

    if (!user.department || !user.section || !user.semester || !user.subject) {
      res.status(403).json({
        success: false,
        message: 'Faculty profile must include department, section, semester, and subject.',
      });
      return;
    }

    const noDues = await NoDues.findById(req.params.id);
    if (!noDues) {
      res.status(404).json({ success: false, message: 'Not found.' });
      return;
    }

    if (
      noDues.department !== user.department ||
      noDues.section !== user.section ||
      noDues.semester !== user.semester
    ) {
      res.status(403).json({
        success: false,
        message: 'Faculty can only review students from the same department, section, and semester.',
      });
      return;
    }

    await ensureSubjectApprovals(noDues);

    const subjectApproval = await SubjectApproval.findOne({
      noDues: noDues._id,
      faculty: user._id,
    });

    if (!subjectApproval) {
      res.status(403).json({
        success: false,
        message: 'No subject approval mapping found for this request.',
      });
      return;
    }

    const normalizedStatus = resolveDecision(status);
    const normalizedAssignment = resolveDecision(assignmentStatus);
    const normalizedLab = resolveDecision(labStatus);

    if (normalizedStatus === ApprovalStatus.REJECTED) {
      subjectApproval.assignmentStatus = ApprovalStatus.REJECTED;
      subjectApproval.labStatus = ApprovalStatus.REJECTED;
    } else if (normalizedStatus === ApprovalStatus.APPROVED && !approvalType && !normalizedAssignment && !normalizedLab) {
      subjectApproval.assignmentStatus = ApprovalStatus.APPROVED;
      subjectApproval.labStatus = ApprovalStatus.APPROVED;
    }

    if (approvalType === 'assignment') {
      const value = normalizedAssignment || normalizedStatus;
      if (!value) {
        res.status(400).json({ success: false, message: 'Assignment decision is required.' });
        return;
      }
      subjectApproval.assignmentStatus = value;
    }

    if (approvalType === 'lab') {
      const value = normalizedLab || normalizedStatus;
      if (!value) {
        res.status(400).json({ success: false, message: 'Lab decision is required.' });
        return;
      }
      subjectApproval.labStatus = value;
    }

    if (!approvalType && normalizedAssignment) {
      subjectApproval.assignmentStatus = normalizedAssignment;
    }
    if (!approvalType && normalizedLab) {
      subjectApproval.labStatus = normalizedLab;
    }

    if (
      !normalizedStatus &&
      !normalizedAssignment &&
      !normalizedLab &&
      approvalType !== 'assignment' &&
      approvalType !== 'lab'
    ) {
      res.status(400).json({
        success: false,
        message: 'Provide status or assignment/lab status for subject approval.',
      });
      return;
    }

    subjectApproval.remarks = remarks;
    subjectApproval.actionedAt = new Date();
    setSubjectApprovalStatus(subjectApproval);
    await subjectApproval.save();

    const student = await User.findById(noDues.student).select('year semester');
    const requiredApprovals = getRequiredFacultyApprovals(getStudentYear((student as any)?.year, noDues.semester));
    const summary = await getSubjectApprovalSummary(noDues._id, requiredApprovals);
    syncLegacyFacultyClearances(noDues, summary, user._id, remarks);

    if (summary.anyRejected) {
      noDues.status = NoDuesStatus.REJECTED;
      const student = await User.findById(noDues.student).select('_id email name');
      if (student) {
        await createNotification(
          student._id,
          'Your No-Dues request was rejected during faculty review.',
          NotificationType.NODUES_REJECTED,
          { noDuesId: noDues._id }
        );
        void sendNotificationEmail(
          student.email,
          'CDGI No-Dues - Request Rejected',
          '<p>Your No-Dues request was rejected during faculty review. Please check remarks in dashboard.</p>'
        );
      }
    } else if (summary.allCompleted) {
      noDues.status = NoDuesStatus.IN_PROGRESS;
      await notifyAdmins(
        `No-Dues request ${noDues.enrollmentNumber} is ready for admin verification.`,
        { noDuesId: noDues._id, enrollmentNumber: noDues.enrollmentNumber }
      );
    } else {
      noDues.status = NoDuesStatus.IN_PROGRESS;
    }

    await noDues.save();
    await createAuditLog(
      user._id as any,
      'NODUES_FACULTY_REVIEW',
      'NoDues',
      noDues._id as any,
      `Faculty subject approval updated for ${user.subject}`
    );

    const withApprovals = await attachSubjectApprovals([noDues]);
    res.json({ success: true, message: 'Faculty subject approval updated.', data: withApprovals[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/nodues/:id/department-approve
export const departmentApprove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { department, status, remarks } = req.body;

    if (!department || !status) {
      res.status(400).json({ success: false, message: 'Department and status are required.' });
      return;
    }

    if (user.role === UserRole.FACULTY) {
      if (department !== 'Lab' && department !== 'Assignment') {
        res.status(403).json({ success: false, message: 'Faculty can only act on Lab or Assignment.' });
        return;
      }

      req.body = {
        status,
        remarks,
        approvalType: department === 'Lab' ? 'lab' : 'assignment',
      };
      await facultyApprove(req, res);
      return;
    }

    const noDues = await NoDues.findById(req.params.id);
    if (!noDues) {
      res.status(404).json({ success: false, message: 'Not found.' });
      return;
    }

    const student = await User.findById(noDues.student).select('year semester');
    const requiredApprovals = getRequiredFacultyApprovals(getStudentYear((student as any)?.year, noDues.semester));
    const subjectSummary = await getSubjectApprovalSummary(noDues._id, requiredApprovals);
    if (!subjectSummary.hasApprovals || !subjectSummary.allCompleted) {
      res.status(400).json({
        success: false,
        message: `Admin verification can start only after subject-wise approvals are completed with minimum ${requiredApprovals} faculty approvals.`,
      });
      return;
    }

    const fieldMap: Record<string, string> = {
      Library: 'libraryClearance',
      Accounts: 'accountsClearance',
      Hostel: 'hostelClearance',
      Lab: 'labClearance',
      Laboratory: 'labClearance',
    };

    const field = fieldMap[department];
    if (!field) {
      res.status(400).json({ success: false, message: 'Invalid department.' });
      return;
    }

    (noDues as any)[field] = {
      department,
      status: status === 'approved' ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
      approvedBy: user._id,
      approvedAt: new Date(),
      remarks,
    };

    if (status === 'rejected') {
      noDues.status = NoDuesStatus.REJECTED;
      noDues.adminApproval = {
        status: ApprovalStatus.REJECTED,
        approvedBy: user._id,
        approvedAt: new Date(),
        remarks: remarks || `${department} rejected in admin verification.`,
      };

      const student = await User.findById(noDues.student).select('_id email');
      if (student) {
        await createNotification(
          student._id,
          `Your No-Dues request was rejected during ${department} verification.`,
          NotificationType.NODUES_REJECTED,
          { noDuesId: noDues._id }
        );
        void sendNotificationEmail(
          student.email,
          'CDGI No-Dues - Request Rejected',
          `<p>Your No-Dues request was rejected during ${department} verification.</p>`
        );
      }
    } else {
      const adminDone = allAdminDepartmentsApproved(noDues);
      noDues.adminApproval = {
        status: adminDone ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
        approvedBy: adminDone ? user._id : undefined,
        approvedAt: adminDone ? new Date() : undefined,
        remarks: adminDone
          ? 'All admin verifications completed.'
          : 'Admin verification in progress.',
      };

      if (noDues.status !== NoDuesStatus.REJECTED) {
        noDues.status = NoDuesStatus.IN_PROGRESS;
      }

      if (adminDone) {
        await notifyHODs(
          `No-Dues request ${noDues.enrollmentNumber} is ready for HOD final approval.`,
          { noDuesId: noDues._id, enrollmentNumber: noDues.enrollmentNumber }
        );
      }
    }

    await noDues.save();
    await createAuditLog(user._id as any, 'NODUES_DEPT_REVIEW', 'NoDues', noDues._id as any, `${department} ${status}`);

    const withApprovals = await attachSubjectApprovals([noDues]);
    res.json({ success: true, message: `${department} ${status}.`, data: withApprovals[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/nodues/:id/admin-approve
export const adminApprove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { status, remarks, department } = req.body;

    const noDues = await NoDues.findById(req.params.id);
    if (!noDues) {
      res.status(404).json({ success: false, message: 'Not found.' });
      return;
    }

    const student = await User.findById(noDues.student).select('year semester');
    const requiredApprovals = getRequiredFacultyApprovals(getStudentYear((student as any)?.year, noDues.semester));
    const summary = await getSubjectApprovalSummary(noDues._id, requiredApprovals);
    if (!summary.hasApprovals || !summary.allCompleted) {
      res.status(400).json({
        success: false,
        message: `Admin verification can start only after subject-wise approvals are completed with minimum ${requiredApprovals} faculty approvals.`,
      });
      return;
    }

    const statusValue = resolveDecision(status);
    if (!statusValue) {
      res.status(400).json({ success: false, message: 'Invalid status. Use approved or rejected.' });
      return;
    }

    const setAdminDepartment = (targetDepartment: string, decision: ApprovalStatus): void => {
      const fieldMap: Record<string, string> = {
        Library: 'libraryClearance',
        Accounts: 'accountsClearance',
        Hostel: 'hostelClearance',
        Lab: 'labClearance',
      };

      const field = fieldMap[targetDepartment];
      if (!field) return;
      (noDues as any)[field] = {
        department: targetDepartment,
        status: decision,
        approvedBy: user._id,
        approvedAt: new Date(),
        remarks,
      };
    };

    if (department) {
      setAdminDepartment(department, statusValue);
    } else if (statusValue === ApprovalStatus.APPROVED) {
      setAdminDepartment('Library', ApprovalStatus.APPROVED);
      setAdminDepartment('Accounts', ApprovalStatus.APPROVED);
      setAdminDepartment('Hostel', ApprovalStatus.APPROVED);
      setAdminDepartment('Lab', ApprovalStatus.APPROVED);
    }

    noDues.adminApproval = {
      status: statusValue,
      approvedBy: user._id as any,
      approvedAt: new Date(),
      remarks,
    };

    if (statusValue === ApprovalStatus.REJECTED) {
      noDues.status = NoDuesStatus.REJECTED;
      const student = await User.findById(noDues.student).select('_id email');
      if (student) {
        await createNotification(
          student._id,
          'Your No-Dues request was rejected by admin verification.',
          NotificationType.NODUES_REJECTED,
          { noDuesId: noDues._id }
        );
        void sendNotificationEmail(
          student.email,
          'CDGI No-Dues - Request Rejected',
          '<p>Your No-Dues request was rejected by admin verification. Please check dashboard remarks.</p>'
        );
      }
    } else {
      const adminDone = allAdminDepartmentsApproved(noDues);
      noDues.adminApproval.status = adminDone ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING;
      noDues.status = noDues.status === NoDuesStatus.REJECTED ? NoDuesStatus.REJECTED : NoDuesStatus.IN_PROGRESS;

      if (adminDone) {
        await notifyHODs(
          `No-Dues request ${noDues.enrollmentNumber} is ready for HOD final approval.`,
          { noDuesId: noDues._id, enrollmentNumber: noDues.enrollmentNumber }
        );
      }
    }

    await noDues.save();
    await createAuditLog(user._id as any, 'NODUES_ADMIN_REVIEW', 'NoDues', noDues._id as any, `Admin ${status}`);

    const withApprovals = await attachSubjectApprovals([noDues]);
    res.json({ success: true, message: `Admin ${status}.`, data: withApprovals[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/nodues/:id/superadmin-approve - Final approval + certificate generation
export const superAdminApprove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { status, remarks } = req.body;

    const noDues = await NoDues.findById(req.params.id);
    if (!noDues) {
      res.status(404).json({ success: false, message: 'Not found.' });
      return;
    }

    noDues.superAdminApproval = {
      status: status === 'approved' ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
      approvedBy: user._id as any,
      approvedAt: new Date(),
      remarks,
    };

    if (status === 'approved') {
      const student = await User.findById(noDues.student).select('year semester');
      const requiredApprovals = getRequiredFacultyApprovals(getStudentYear((student as any)?.year, noDues.semester));
      const summary = await getSubjectApprovalSummary(noDues._id, requiredApprovals);
      if (!summary.hasApprovals || !summary.allCompleted) {
        res.status(400).json({
          success: false,
          message: `Cannot grant HOD approval before subject-wise faculty approvals are complete with minimum ${requiredApprovals} faculty approvals.`,
        });
        return;
      }

      if (!allAdminDepartmentsApproved(noDues)) {
        res.status(400).json({
          success: false,
          message: 'Cannot grant HOD final approval until admin verification (Library, Accounts, Hostel, Lab) is complete.',
        });
        return;
      }

      noDues.status = NoDuesStatus.APPROVED;

      // Generate certificate only once
      if (!noDues.certificateId) {
        const student = await User.findById(noDues.student);
        if (student) {
          const cert = await generateCertificate(noDues, student);
          noDues.certificateId = cert.certificateId;
          noDues.certificateGeneratedAt = new Date();

          await createNotification(
            student._id,
            `Certificate generated successfully (ID: ${cert.certificateId}).`,
            NotificationType.CERTIFICATE_GENERATED,
            { noDuesId: noDues._id, certificateId: cert.certificateId }
          );
        }
      }
    } else {
      noDues.status = NoDuesStatus.REJECTED;

      const student = await User.findById(noDues.student).select('_id email');
      if (student) {
        await createNotification(
          student._id,
          'Your No-Dues request was rejected at HOD final approval.',
          NotificationType.NODUES_REJECTED,
          { noDuesId: noDues._id }
        );
        void sendNotificationEmail(
          student.email,
          'CDGI No-Dues - Final Decision',
          '<p>Your No-Dues request was rejected by HOD. Please contact your department for details.</p>'
        );
      }
    }

    await noDues.save();
    await createAuditLog(user._id as any, 'NODUES_SUPERADMIN_REVIEW', 'NoDues', noDues._id as any, `SuperAdmin ${status}`);

    const withApprovals = await attachSubjectApprovals([noDues]);
    res.json({ success: true, message: `HOD ${status}.`, data: withApprovals[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/nodues/:id/cancel - Student cancellation for pending request only
export const cancelNoDues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const noDues = await NoDues.findById(req.params.id);
    if (!noDues) {
      res.status(404).json({ success: false, message: 'No-Dues request not found.' });
      return;
    }

    if ((noDues.student as any).toString() !== (user._id as any).toString()) {
      res.status(403).json({ success: false, message: 'Not allowed to cancel this request.' });
      return;
    }

    // Pending means submitted and no approvals started yet.
    const approvalsStarted =
      noDues.facultyApproval?.status !== ApprovalStatus.PENDING ||
      noDues.adminApproval?.status !== ApprovalStatus.PENDING ||
      noDues.superAdminApproval?.status !== ApprovalStatus.PENDING;

    if (noDues.status !== NoDuesStatus.SUBMITTED || approvalsStarted) {
      res.status(400).json({
        success: false,
        message: 'Cancellation is allowed only while request is pending.',
      });
      return;
    }

    noDues.status = NoDuesStatus.CANCELLED;
    await noDues.save();

    const semesterKey = String(noDues.semester);
    const currentSemesterCount = Number((user.semesterRequests as any)?.get?.(semesterKey) || 0);
    if (currentSemesterCount > 0) {
      (user.semesterRequests as any).set(semesterKey, currentSemesterCount - 1);
    }
    if ((user.totalRequests || 0) > 0) {
      user.totalRequests = (user.totalRequests || 0) - 1;
    }
    await user.save();

    await createAuditLog(user._id as any, 'NODUES_CANCEL', 'NoDues', noDues._id as any, 'No-Dues request cancelled by student.');
    res.json({ success: true, message: 'No-Dues request cancelled successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
