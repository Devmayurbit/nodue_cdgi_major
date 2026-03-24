import NoDues, { ApprovalStatus, NoDuesStatus } from '../models/NoDues';
import SubjectApproval from '../models/SubjectApproval';
import Notification, { NotificationType } from '../models/Notification';
import User, { UserRole } from '../models/User';
import JobLock from '../models/JobLock';
import { createBulkNotifications } from './notificationService';
import { config } from '../config';

const hoursToMs = (h: number) => h * 60 * 60 * 1000;

const getSlaThresholdDate = (): Date => {
  const hours = Math.max(1, Number(config.features.slaEscalationHours || 48));
  return new Date(Date.now() - hoursToMs(hours));
};

const getDedupeSinceDate = (): Date => {
  const hours = Math.max(1, Number(config.features.slaEscalationDedupeHours || 24));
  return new Date(Date.now() - hoursToMs(hours));
};

const resolveEscalationRecipients = async (department: string): Promise<string[]> => {
  const dept = (department || '').trim();
  if (!dept) return [];

  const [hodIds, adminIds] = await Promise.all([
    User.find({ role: UserRole.SUPERADMIN, department: dept, isActive: true }).distinct('_id'),
    User.find({ role: UserRole.ADMIN, department: dept, isActive: true }).distinct('_id'),
  ]);

  const merged = new Set<string>([...hodIds, ...adminIds].map((id: any) => String(id)));
  if (merged.size > 0) return Array.from(merged);

  // Fallback: notify root super admin if no department HOD/admin exists.
  const rootIds = await User.find({ role: UserRole.SUPERADMIN, department: 'Administration', isActive: true }).distinct('_id');
  return rootIds.map((id: any) => String(id));
};

const alreadyEscalatedRecently = async (noDuesId: any): Promise<boolean> => {
  const since = getDedupeSinceDate();
  const existing = await Notification.findOne({
    type: NotificationType.SLA_ESCALATION,
    'metadata.noDuesId': String(noDuesId),
    createdAt: { $gte: since },
  }).select('_id');

  return Boolean(existing);
};

export const runSlaEscalationSweep = async (): Promise<{ checked: number; escalated: number }> => {
  const threshold = getSlaThresholdDate();

  // Find No-Dues requests with overdue pending subject approvals.
  const overdueNoDuesIds = (await SubjectApproval.find({
    status: ApprovalStatus.PENDING,
    createdAt: { $lte: threshold },
  }).distinct('noDues')) as any[];

  const overdueNoDuesIdStrings: string[] = overdueNoDuesIds.map((id) => String(id));

  if (overdueNoDuesIdStrings.length === 0) {
    return { checked: 0, escalated: 0 };
  }

  const noduesRows = await NoDues.find({
    _id: { $in: overdueNoDuesIdStrings },
    status: { $in: [NoDuesStatus.SUBMITTED, NoDuesStatus.IN_PROGRESS] },
  })
    .select('_id enrollmentNumber department section semester status createdAt')
    .sort({ createdAt: 1 });

  let escalated = 0;

  for (const nd of noduesRows as any[]) {
    const noDuesId = String(nd._id);
    const department = String(nd.department || '');

    const shouldSkip = await alreadyEscalatedRecently(noDuesId);
    if (shouldSkip) continue;

    const recipients = await resolveEscalationRecipients(department);
    if (recipients.length === 0) continue;

    const message =
      `SLA Escalation: No-Dues (${nd.enrollmentNumber}) has pending faculty approvals for over ` +
      `${config.features.slaEscalationHours} hours. Dept: ${nd.department}, Sec: ${nd.section}, Sem: ${nd.semester}.`;

    await createBulkNotifications(
      recipients,
      message,
      NotificationType.SLA_ESCALATION,
      { noDuesId, department: nd.department, section: nd.section, semester: nd.semester }
    );

    escalated += 1;
  }

  return { checked: noduesRows.length, escalated };
};

export const startSlaEscalationJob = (): void => {
  if (!config.features.slaEscalationEnabled) return;
  const minutes = Math.max(1, Number(config.features.slaEscalationIntervalMinutes || 15));

  const instanceId =
    process.env.RENDER_INSTANCE_ID ||
    process.env.INSTANCE_ID ||
    process.env.HOSTNAME ||
    `local-${Math.random().toString(16).slice(2)}`;

  const lockMinutes = Math.max(
    1,
    Number(process.env.SLA_ESCALATION_LOCK_MINUTES || minutes)
  );

  const acquireLock = async (): Promise<boolean> => {
    const now = new Date();
    const lockedUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
    try {
      const doc = await JobLock.findOneAndUpdate(
        {
          name: 'sla_escalation',
          $or: [{ lockedUntil: { $exists: false } }, { lockedUntil: { $lte: now } }],
        },
        { $set: { lockedUntil, lockedBy: instanceId } },
        { upsert: true, new: true }
      ).select('lockedBy lockedUntil');

      return String((doc as any)?.lockedBy || '') === String(instanceId);
    } catch (error: any) {
      // In case of duplicate key race, just skip this tick.
      if (error?.code === 11000) return false;
      console.error('[SLA] Lock acquire failed:', error?.message || error);
      return false;
    }
  };

  const tick = async () => {
    try {
      const hasLock = await acquireLock();
      if (!hasLock) return;
      const result = await runSlaEscalationSweep();
      if (result.escalated > 0) {
        console.log(`[SLA] Escalated ${result.escalated}/${result.checked} overdue requests`);
      }
    } catch (err) {
      console.error('[SLA] Escalation sweep failed:', err);
    }
  };

  // Run once shortly after startup, then on interval.
  setTimeout(() => void tick(), 10_000);
  setInterval(() => void tick(), minutes * 60 * 1000);
  console.log(
    `[SLA] Escalation job enabled (every ${minutes} min, threshold ${config.features.slaEscalationHours}h, lock ${lockMinutes}m)`
  );
};
