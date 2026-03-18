import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

const AdminAuditLogsPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['adminAuditLogs'],
    queryFn: () => api.get('/admin/audit-logs?limit=200').then((r) => r.data.data),
  });

  const logs = data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">System Logs</h1>
        <p className="text-[var(--color-text-secondary)] text-sm">Audit trail of user and approval actions</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-white/5">
              <tr className="text-left">
                <th className="p-3 font-semibold text-[var(--color-text)]">When</th>
                <th className="p-3 font-semibold text-[var(--color-text)]">User</th>
                <th className="p-3 font-semibold text-[var(--color-text)]">Action</th>
                <th className="p-3 font-semibold text-[var(--color-text)]">Entity</th>
                <th className="p-3 font-semibold text-[var(--color-text)]">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log._id} className="border-b border-[var(--color-border)] even:bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                  <td className="p-3 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="p-3">{log.user?.name || log.user?.email || '-'}</td>
                  <td className="p-3 font-medium text-sky-200">{log.action}</td>
                  <td className="p-3 text-[var(--color-text-secondary)]">{log.entityType || '-'}</td>
                  <td className="p-3 text-[var(--color-text-secondary)]">{log.details || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogsPage;
