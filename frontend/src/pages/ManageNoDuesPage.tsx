import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import StatusBadge from '../components/StatusBadge';
import ApprovalTimeline from '../components/ApprovalTimeline';
import { FileText, CheckCircle, XCircle, Eye, ChevronDown, ChevronUp } from 'lucide-react';

const ManageNoDuesPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['allNoDues', page, statusFilter, search],
    queryFn: () =>
      api
        .get('/nodues', { params: { page, limit: 10, status: statusFilter || undefined, search: search || undefined } })
        .then((r) => r.data),
    refetchInterval: 15000,
  });

  const noDuesList = data?.data || [];
  const pagination = data?.pagination;

  const approveMutation = useMutation({
    mutationFn: async ({ id, action, remarks, endpoint }: { id: string; action: 'approved' | 'rejected'; remarks: string; endpoint: string }) => {
      return api.put(`/nodues/${id}/${endpoint}`, { status: action, remarks });
    },
    onSuccess: () => {
      toast.success('Decision submitted');
      queryClient.invalidateQueries({ queryKey: ['allNoDues'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Action failed');
    },
  });

  const getApprovalEndpoint = () => {
    if (!user) return 'faculty-approve';
    switch (user.role) {
      case 'faculty': return 'faculty-approve';
      case 'admin': return 'admin-approve';
      case 'superadmin': return 'superadmin-approve';
      default: return 'faculty-approve';
    }
  };

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    const remarks = action === 'rejected' ? prompt('Enter rejection reason:') || '' : '';
    approveMutation.mutate({ id, action, remarks, endpoint: getApprovalEndpoint() });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manage No-Dues</h1>
          <p className="text-[var(--color-text-secondary)] text-sm">Review and approve/reject applications</p>
        </div>
        <div className="flex gap-2">
          <input
            className="input-field w-56"
            placeholder="Search name or enrollment"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            title="Status Filter"
            className="input-field w-auto"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="in_progress">In Progress</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      ) : noDuesList.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FileText className="mx-auto text-[var(--color-text-secondary)] mb-3" size={40} />
          <p className="text-[var(--color-text-secondary)]">No applications found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {noDuesList.map((nd: any) => {
            const isExpanded = expandedId === nd._id;
            const student = nd.student || {};
            return (
              <div key={nd._id} className="glass-card overflow-hidden">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--color-surface)] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : nd._id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold">{student.name || 'Student'}</h3>
                      <StatusBadge status={nd.status} />
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {student.enrollmentNumber} &middot; {student.department} &middot; Sem {student.semester} &middot; {new Date(nd.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>

                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-[var(--color-border)] space-y-4">
                    {/* Clearance statuses */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      {['library', 'accounts', 'hostel', 'lab', 'assignment'].map((dept) => {
                        const cl = nd[dept + 'Clearance'] || {};
                        return (
                          <div key={dept} className="bg-[var(--color-surface)] rounded-lg p-2 text-center">
                            <p className="capitalize font-medium">{dept}</p>
                            <StatusBadge status={cl.status || 'pending'} />
                          </div>
                        );
                      })}
                    </div>

                    {/* Approval timeline */}
                    <ApprovalTimeline
                      steps={[
                        {
                          label: 'Subject Faculty',
                          status: (nd.subjectApprovals || []).every(
                            (sa: any) => sa.assignmentStatus === 'approved' && sa.labStatus === 'approved'
                          )
                            ? 'approved'
                            : (nd.subjectApprovals || []).some(
                                  (sa: any) => sa.assignmentStatus === 'rejected' || sa.labStatus === 'rejected'
                                )
                              ? 'rejected'
                              : 'pending',
                        },
                        { label: 'Library', status: nd.libraryClearance?.status || 'pending' },
                        { label: 'Accounts', status: nd.accountsClearance?.status || 'pending' },
                        { label: 'Hostel', status: nd.hostelClearance?.status || 'pending' },
                        { label: 'Lab', status: nd.labClearance?.status || 'pending' },
                        { label: 'Assignment', status: nd.assignmentClearance?.status || 'pending' },
                        { label: 'Admin', status: nd.adminApproval?.status || 'pending' },
                        { label: 'HOD', status: nd.superAdminApproval?.status || 'pending' },
                      ]}
                    />

                    {/* Actions */}
                    {nd.status !== 'approved' && nd.status !== 'rejected' && (
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleAction(nd._id, 'approved')}
                          disabled={approveMutation.isPending}
                          className="btn-primary flex items-center gap-1 text-sm"
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button
                          onClick={() => handleAction(nd._id, 'rejected')}
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

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-secondary text-sm"
          >
            Previous
          </button>
          <span className="flex items-center text-sm text-[var(--color-text-secondary)]">
            Page {page} of {pagination.pages}
          </span>
          <button
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
            className="btn-secondary text-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ManageNoDuesPage;
