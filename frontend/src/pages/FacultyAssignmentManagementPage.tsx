import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const FacultyAssignmentManagementPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['assignmentManagementRequests'],
    queryFn: () => api.get('/nodues?limit=100').then((r) => r.data.data),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      api.put(`/nodues/${id}/faculty-approve`, { approvalType: 'assignment', status }),
    onSuccess: () => {
      toast.success('Assignment clearance updated');
      queryClient.invalidateQueries({ queryKey: ['assignmentManagementRequests'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  const rows = (data || []).filter((nd: any) => nd.status !== 'approved' && nd.status !== 'rejected');

  const mySubjectApproval = (nd: any) =>
    (nd.subjectApprovals || []).find((sa: any) => sa.faculty?._id === user?.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Faculty Assignment Management</h1>
        <p className="text-[var(--color-text-secondary)] text-sm">Approve or reject Assignment clearance and send forward to HOD</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {rows.map((nd: any) => (
            <div key={nd._id} className="glass-card p-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{nd.student?.name || 'Student'}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {nd.enrollmentNumber} • {mySubjectApproval(nd)?.subject || user?.subject} • Assignment:{' '}
                  <StatusBadge status={mySubjectApproval(nd)?.assignmentStatus || 'pending'} />
                </p>
              </div>
              <div className="flex gap-2">
                <button className="btn-primary text-xs" onClick={() => mutation.mutate({ id: nd._id, status: 'approved' })}>Approve Assignment</button>
                <button className="btn-secondary text-xs" onClick={() => mutation.mutate({ id: nd._id, status: 'rejected' })}>Reject Assignment</button>
              </div>
            </div>
          ))}
          {rows.length === 0 && <div className="glass-card p-8 text-center text-[var(--color-text-secondary)]">No pending assignment clearances.</div>}
        </div>
      )}
    </div>
  );
};

export default FacultyAssignmentManagementPage;
