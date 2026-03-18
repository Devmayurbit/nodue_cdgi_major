import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import StatusBadge from '../components/StatusBadge';
import { Bell, CheckCircle, XCircle, ChevronDown, ChevronUp, Paperclip, Mic } from 'lucide-react';

const ManageNoticesPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['allNotices', page, statusFilter],
    queryFn: () =>
      api.get('/notices', { params: { page, limit: 10, status: statusFilter || undefined } }).then((r) => r.data),
  });

  const notices = data?.data || [];
  const pagination = data?.pagination;

  const approveMutation = useMutation({
    mutationFn: async ({ id, action, remarks, endpoint }: { id: string; action: 'approved' | 'rejected'; remarks: string; endpoint: string }) => {
      return api.put(`/notices/${id}/${endpoint}`, { status: action, remarks });
    },
    onSuccess: () => {
      toast.success('Decision submitted');
      queryClient.invalidateQueries({ queryKey: ['allNotices'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Action failed');
    },
  });

  const getEndpoint = () => {
    switch (user?.role) {
      case 'faculty': return 'faculty-approve';
      case 'admin': return 'admin-approve';
      case 'superadmin': return 'superadmin-approve';
      default: return 'faculty-approve';
    }
  };

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    const remarks = action === 'rejected' ? prompt('Enter rejection reason:') || '' : '';
    approveMutation.mutate({ id, action, remarks, endpoint: getEndpoint() });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manage Notices</h1>
          <p className="text-[var(--color-text-secondary)] text-sm">Review and approve/reject notices</p>
        </div>
        <select
          className="input-field w-auto"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="faculty_approved">Faculty Approved</option>
          <option value="admin_approved">Admin Approved</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      ) : notices.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Bell className="mx-auto text-[var(--color-text-secondary)] mb-3" size={40} />
          <p className="text-[var(--color-text-secondary)]">No notices found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((n: any) => {
            const isExpanded = expandedId === n._id;
            const submitter = n.student || n.submittedBy || {};
            return (
              <div key={n._id} className="glass-card overflow-hidden">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--color-surface)] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : n._id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold">{n.title}</h3>
                      <StatusBadge status={n.status} />
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      By {submitter.name || 'Student'} &middot; {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>

                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-[var(--color-border)] space-y-3">
                    <p className="text-sm">{n.description}</p>

                    <div className="flex gap-3 flex-wrap">
                      {n.filePath && (
                        <a
                          href={`${api.defaults.baseURL?.replace('/api/v1', '')}/${n.filePath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Paperclip size={12} /> Attachment
                        </a>
                      )}
                      {n.audioPath && (
                        <a
                          href={`${api.defaults.baseURL?.replace('/api/v1', '')}/${n.audioPath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          <Mic size={12} /> Audio
                        </a>
                      )}
                    </div>

                    {/* Approval chain */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {[
                        { label: 'Faculty', data: n.facultyApproval },
                        { label: 'Admin', data: n.adminApproval },
                        { label: 'SuperAdmin', data: n.superAdminApproval },
                      ].map((a) => (
                        <div key={a.label} className="bg-[var(--color-surface)] rounded-lg p-2 text-center">
                          <p className="font-medium">{a.label}</p>
                          <StatusBadge status={a.data?.status || 'pending'} />
                        </div>
                      ))}
                    </div>

                    {n.status !== 'approved' && n.status !== 'rejected' && (
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleAction(n._id, 'approved')}
                          disabled={approveMutation.isPending}
                          className="btn-primary flex items-center gap-1 text-sm"
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button
                          onClick={() => handleAction(n._id, 'rejected')}
                          disabled={approveMutation.isPending}
                          className="btn-secondary flex items-center gap-1 text-sm border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary text-sm">Previous</button>
          <span className="flex items-center text-sm text-[var(--color-text-secondary)]">Page {page} of {pagination.pages}</span>
          <button disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)} className="btn-secondary text-sm">Next</button>
        </div>
      )}
    </div>
  );
};

export default ManageNoticesPage;
