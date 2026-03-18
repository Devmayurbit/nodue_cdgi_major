import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';

const AdminDepartmentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState({ name: '', code: '', description: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['adminDepartments'],
    queryFn: () => api.get('/admin/departments').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/admin/departments', form),
    onSuccess: () => {
      toast.success('Department created');
      setForm({ name: '', code: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['adminDepartments'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create department'),
  });

  const departments = data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Department Status</h1>
        <p className="text-[var(--color-text-secondary)] text-sm">Manage department master records</p>
      </div>

      <div className="glass-card p-4 grid sm:grid-cols-3 gap-3">
        <input
          className="input-field"
          placeholder="Department name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <input
          className="input-field"
          placeholder="Code"
          value={form.code}
          onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
        />
        <input
          className="input-field"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <div className="sm:col-span-3">
          <button
            className="btn-primary text-sm"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !form.name || !form.code}
          >
            Add Department
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)]">
              <tr className="text-left">
                <th className="p-3">Name</th>
                <th className="p-3">Code</th>
                <th className="p-3">Description</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d: any) => (
                <tr key={d._id} className="border-b border-[var(--color-border)]">
                  <td className="p-3">{d.name}</td>
                  <td className="p-3">{d.code}</td>
                  <td className="p-3">{d.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDepartmentsPage;
