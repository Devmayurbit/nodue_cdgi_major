import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { BarChart3, Users, FileText, Award, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['smartAnalytics', user?.role],
    queryFn: async () => {
      if (user?.role === 'admin') {
        const { data } = await api.get('/admin/analytics');
        return data.data;
      }

      const { data } = await api.get('/superadmin/analytics');
      const noDuesTotal = data.data?.noDues?.total || 0;
      const approved = data.data?.noDues?.approved || 0;
      return {
        totals: {
          totalStudents: data.data?.users?.totalStudents || 0,
          totalNoDues: noDuesTotal,
          pendingRequests: data.data?.noDues?.pending || 0,
          approvedRequests: approved,
          rejectedRequests: data.data?.noDues?.rejected || 0,
          certificatesGenerated: data.data?.totalCertificates || 0,
          approvalRate: noDuesTotal > 0 ? Math.round((approved / noDuesTotal) * 100) : 0,
        },
        requestsPerDepartment: (data.data?.departmentBreakdown || []).map((d: any) => ({
          _id: d._id,
          total: d.count,
        })),
        monthly: [],
      };
    },
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-12 w-64 rounded-xl" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  const totals = analytics?.totals || {};
  const stats = [
    { label: 'Total Students', value: totals.totalStudents || 0, icon: <Users size={20} />, color: 'from-blue-500 to-cyan-500' },
    { label: 'Total Requests', value: totals.totalNoDues || 0, icon: <FileText size={20} />, color: 'from-indigo-500 to-blue-500' },
    { label: 'Pending Requests', value: totals.pendingRequests || 0, icon: <TrendingUp size={20} />, color: 'from-amber-500 to-orange-500' },
    { label: 'Approved Requests', value: totals.approvedRequests || 0, icon: <CheckCircle2 size={20} />, color: 'from-green-500 to-emerald-500' },
    { label: 'Rejected Requests', value: totals.rejectedRequests || 0, icon: <XCircle size={20} />, color: 'from-rose-500 to-red-500' },
    { label: 'Certificates', value: totals.certificatesGenerated || 0, icon: <Award size={20} />, color: 'from-teal-500 to-emerald-500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-purple-600 dark:text-purple-400" size={28} />
          <div>
            <h1 className="text-2xl font-bold">Smart Analytics Dashboard</h1>
            <p className="text-[var(--color-text-secondary)] text-sm">Live clearance intelligence for operations and decision-making</p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card p-5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center text-white mb-3`}>
              {stat.icon}
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        <h2 className="font-semibold mb-4">Approval Rate</h2>
        <div className="flex items-center gap-4">
          <div className="w-full h-4 bg-[var(--color-border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${totals.approvalRate || 0}%` }}
            />
          </div>
          <span className="text-xl font-bold">{totals.approvalRate || 0}%</span>
        </div>
      </div>

      {/* Requests per department */}
      {analytics?.requestsPerDepartment && analytics.requestsPerDepartment.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="font-semibold mb-4">Requests Per Department</h2>
          <div className="space-y-2">
            {analytics.requestsPerDepartment.map((d: any) => {
              const pct = Math.round((d.total / (totals.totalNoDues || 1)) * 100);
              return (
                <div key={d._id} className="bg-[var(--color-surface)] rounded-xl p-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-[var(--color-text-secondary)] truncate">{d._id}</span>
                    <span className="font-semibold">{d.total}</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">{pct}% of all requests</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly stats */}
      {analytics?.monthly && analytics.monthly.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="font-semibold mb-4">Monthly Clearance Trend</h2>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[var(--color-border)]">
                  <th className="py-2">Month</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Approved</th>
                  <th className="py-2">Rejected</th>
                </tr>
              </thead>
              <tbody>
                {analytics.monthly.map((item: any) => (
                  <tr key={item.label} className="border-b border-[var(--color-border)]/50">
                    <td className="py-2 text-[var(--color-text-secondary)]">{item.label}</td>
                    <td className="py-2 font-semibold">{item.total}</td>
                    <td className="py-2 text-green-600 dark:text-green-400">{item.approved}</td>
                    <td className="py-2 text-red-600 dark:text-red-400">{item.rejected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-2">
            {analytics.monthly.map((item: any) => {
              const pct = Math.round((item.approved / (item.total || 1)) * 100);
              return (
                <div key={`${item.label}-bar`}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>{item.label}</span>
                    <span>{pct}% approval</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
