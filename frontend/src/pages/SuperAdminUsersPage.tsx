import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Users, Search, Shield, ShieldOff, ChevronDown, ChevronUp } from 'lucide-react';

const SuperAdminUsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['allUsers', page, roleFilter],
    queryFn: () =>
      api.get('/superadmin/users', { params: { page, limit: 15, role: roleFilter || undefined } }).then((r) => r.data),
  });

  const users = data?.data || [];
  const pagination = data?.pagination;

  const toggleMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.put(`/superadmin/users/${userId}/toggle-active`).then((r) => r.data);
    },
    onSuccess: () => {
      toast.success('User status updated');
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Action failed');
    },
  });

  const filtered = search
    ? users.filter((u: any) =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.enrollmentNumber?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">All Users</h1>
        <p className="text-[var(--color-text-secondary)] text-sm">Manage all platform accounts</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-[var(--color-text-secondary)]" size={16} />
          <input
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or enrollment..."
          />
        </div>
        <select
          className="input-field w-auto"
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="faculty">Faculty</option>
          <option value="admin">Admins</option>
          <option value="superadmin">Super Admins</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="mx-auto text-[var(--color-text-secondary)] mb-3" size={40} />
          <p className="text-[var(--color-text-secondary)]">No users found</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left">
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">Role</th>
                  <th className="p-3 font-medium">Department</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u: any) => (
                  <tr key={u._id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors">
                    <td className="p-3 font-medium">{u.name}</td>
                    <td className="p-3 text-[var(--color-text-secondary)]">{u.email}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        u.role === 'superadmin' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                        u.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                        u.role === 'faculty' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-[var(--color-text-secondary)]">{u.department || '—'}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive !== false ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                        {u.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3">
                      {u.role !== 'superadmin' && (
                        <button
                          onClick={() => toggleMutation.mutate(u._id)}
                          className="text-xs flex items-center gap-1 hover:text-blue-600 transition-colors"
                          disabled={toggleMutation.isPending}
                        >
                          {u.isActive !== false ? <ShieldOff size={12} /> : <Shield size={12} />}
                          {u.isActive !== false ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

export default SuperAdminUsersPage;
