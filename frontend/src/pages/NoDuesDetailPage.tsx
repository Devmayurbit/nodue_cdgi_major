import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import api from '../lib/api';
import StatusBadge from '../components/StatusBadge';
import ApprovalTimeline from '../components/ApprovalTimeline';

const NoDuesDetailPage: React.FC = () => {
  const [, params] = useRoute('/nodues/:id');
  const id = params?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['noDuesDetail', id],
    queryFn: () => api.get(`/nodues/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  const nd = data;

  if (isLoading) {
    return <div className="skeleton h-56 rounded-2xl" />;
  }

  if (!nd) {
    return (
      <div className="glass-card p-10 text-center">
        <h2 className="text-xl font-bold mb-2">Application Not Found</h2>
        <Link href="/nodues/my" className="btn-primary inline-block">Back to My Applications</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Application #{nd._id.slice(-6).toUpperCase()}</h1>
            <p className="text-[var(--color-text-secondary)] text-sm">Submitted on {new Date(nd.createdAt).toLocaleDateString()}</p>
          </div>
          <StatusBadge status={nd.status} />
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="font-semibold mb-4">Approval Timeline</h2>
        <ApprovalTimeline
          steps={[
            { label: 'Faculty', status: nd.facultyApproval?.status || 'pending' },
            { label: 'Library', status: nd.libraryClearance?.status || 'pending' },
            { label: 'Accounts', status: nd.accountsClearance?.status || 'pending' },
            { label: 'Hostel', status: nd.hostelClearance?.status || 'pending' },
            { label: 'Lab', status: nd.labClearance?.status || 'pending' },
            { label: 'Assignment', status: nd.assignmentClearance?.status || 'pending' },
            { label: 'Admin Final', status: nd.adminApproval?.status || 'pending' },
            { label: 'HOD Final', status: nd.superAdminApproval?.status || 'pending' },
          ]}
        />
      </div>

      {Array.isArray(nd.subjectApprovals) && nd.subjectApprovals.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="font-semibold mb-4">Subject-wise Faculty Approvals</h2>
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
                  <th className="py-2 px-2 sm:px-3">Faculty</th>
                  <th className="py-2 px-2 sm:px-3">Subject</th>
                  <th className="py-2 px-2 sm:px-3">Dept / Sec / Sem</th>
                  <th className="py-2 px-2 sm:px-3">Assignment</th>
                  <th className="py-2 px-2 sm:px-3">Lab</th>
                  <th className="py-2 px-2 sm:px-3">Overall</th>
                  <th className="py-2 px-2 sm:px-3">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {nd.subjectApprovals.map((sa: any) => {
                  const faculty = sa.faculty || {};
                  const statusChip = (value: string | undefined) => (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        value === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : value === 'rejected'
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {value || 'pending'}
                    </span>
                  );

                  return (
                    <tr key={sa._id} className="border-t border-[var(--color-border)]">
                      <td className="py-2.5 px-2 sm:px-3 whitespace-nowrap">
                        <div className="font-medium">{faculty.name || 'Unknown'}</div>
                        <div className="text-xs text-[var(--color-text-secondary)]">{faculty.email}</div>
                      </td>
                      <td className="py-2.5 px-2 sm:px-3 whitespace-nowrap">{sa.subject}</td>
                      <td className="py-2.5 px-2 sm:px-3 whitespace-nowrap text-xs text-[var(--color-text-secondary)]">
                        <div>{faculty.department || 'N/A'}</div>
                        <div>
                          Sec {faculty.section || '-'} · Sem {faculty.semester || '-'}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 sm:px-3">{statusChip(sa.assignmentStatus)}</td>
                      <td className="py-2.5 px-2 sm:px-3">{statusChip(sa.labStatus)}</td>
                      <td className="py-2.5 px-2 sm:px-3">{statusChip(sa.status)}</td>
                      <td className="py-2.5 px-2 sm:px-3 max-w-xs text-xs text-[var(--color-text-secondary)]">
                        {sa.remarks || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {nd.certificateId && (
        <div className="glass-card p-6">
          <h2 className="font-semibold mb-2">Certificate Available</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">Your clearance certificate is generated.</p>
          <Link href="/certificates" className="btn-primary inline-block">Download Certificate</Link>
        </div>
      )}
    </div>
  );
};

export default NoDuesDetailPage;
