import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';

const AdminStudentsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminStudents'],
    queryFn: () => api.get('/admin/students?limit=200').then((r) => r.data.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.put(`/admin/students/${id}/toggle-active`),
    onSuccess: () => {
      toast.success('Student status updated');
      queryClient.invalidateQueries({ queryKey: ['adminStudents'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update student'),
  });

  const students = data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Student List</h1>
        <p className="text-[var(--color-text-secondary)] text-sm">View and manage student accounts</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)]">
              <tr className="text-left">
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Enrollment</th>
                <th className="p-3">Department</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s: any) => (
                <tr key={s._id} className="border-b border-[var(--color-border)]">
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3">{s.email}</td>
                  <td className="p-3">{s.enrollmentNumber || '-'}</td>
                  <td className="p-3">{s.department || '-'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${s.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      className="btn-secondary text-xs"
                      onClick={() => toggleMutation.mutate(s._id)}
                      disabled={toggleMutation.isPending}
                    >
                      Toggle
                    </button>
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

export default AdminStudentsPage;
