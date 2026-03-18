import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import StatusBadge from '../components/StatusBadge';

const HODDepartmentApprovalPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['hodDepartmentRequests'],
    queryFn: () => api.get('/nodues?limit=200').then((r) => r.data.data),
  });

  const finalApproveMutation = useMutation({
    mutationFn: (id: string) => api.put(`/nodues/${id}/superadmin-approve`, { status: 'approved', remarks: 'Final approval by HOD' }),
    onSuccess: () => {
      toast.success('Final approval granted and certificate generated');
      queryClient.invalidateQueries({ queryKey: ['hodDepartmentRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myNoDues'] });
      queryClient.invalidateQueries({ queryKey: ['myCertificates'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Final approval failed'),
  });

  const finalRejectMutation = useMutation({
    mutationFn: (id: string) => api.put(`/nodues/${id}/superadmin-approve`, { status: 'rejected', remarks: 'Rejected by HOD' }),
    onSuccess: () => {
      toast.success('Request rejected by HOD');
      queryClient.invalidateQueries({ queryKey: ['hodDepartmentRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myNoDues'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Rejection failed'),
  });

  const rows = data || [];

  const isAdminVerified = (nd: any) =>
    nd.libraryClearance?.status === 'approved' &&
    nd.accountsClearance?.status === 'approved' &&
    nd.hostelClearance?.status === 'approved' &&
    nd.labClearance?.status === 'approved';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">HOD Final Approval</h1>
        <p className="text-[var(--color-text-secondary)] text-sm">
          Review requests after subject-wise faculty approvals and admin verification, then approve or reject and generate certificate.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="glass-card p-10 text-center text-[var(--color-text-secondary)]">
          No clearance requests found.
        </div>
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead className="border-b border-[var(--color-border)]">
              <tr className="text-left">
                <th className="p-3">Student</th>
                <th className="p-3">Enrollment</th>
                <th className="p-3">Library</th>
                <th className="p-3">Accounts</th>
                <th className="p-3">Hostel</th>
                <th className="p-3">Lab</th>
                <th className="p-3">Admin Verification</th>
                <th className="p-3">HOD Final</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((nd: any) => (
                <tr key={nd._id} className="border-b border-[var(--color-border)] align-top">
                  <td className="p-3 font-medium">{nd.student?.name || 'Student'}</td>
                  <td className="p-3">{nd.enrollmentNumber || '-'}</td>
                  <td className="p-3"><StatusBadge status={nd.libraryClearance?.status || 'pending'} /></td>
                  <td className="p-3"><StatusBadge status={nd.accountsClearance?.status || 'pending'} /></td>
                  <td className="p-3"><StatusBadge status={nd.hostelClearance?.status || 'pending'} /></td>
                  <td className="p-3"><StatusBadge status={nd.labClearance?.status || 'pending'} /></td>
                  <td className="p-3"><StatusBadge status={isAdminVerified(nd) ? 'approved' : 'pending'} /></td>
                  <td className="p-3"><StatusBadge status={nd.status} /></td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="btn-primary text-xs"
                        disabled={finalApproveMutation.isPending || !isAdminVerified(nd)}
                        onClick={() => finalApproveMutation.mutate(nd._id)}
                      >
                        Approve and Generate Certificate
                      </button>
                      <button
                        className="btn-secondary text-xs"
                        disabled={finalRejectMutation.isPending}
                        onClick={() => finalRejectMutation.mutate(nd._id)}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HODDepartmentApprovalPage;
