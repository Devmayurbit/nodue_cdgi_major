import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Link } from 'wouter';
import { Users, FileText, Bell, Award, ShieldCheck, Building2, BarChart3 } from 'lucide-react';
import NotificationPanel from '../components/NotificationPanel';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data.data),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-[var(--color-text-secondary)]">Welcome, {user?.name}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Students', value: stats?.students || 0, icon: <Users size={20} />, color: 'from-blue-500 to-blue-700', href: '/admin/students' },
            { label: 'Faculty', value: stats?.faculty || 0, icon: <Users size={20} />, color: 'from-purple-500 to-purple-700', href: '/superadmin/users' },
            { label: 'Total No-Dues', value: stats?.noDuesTotal || 0, icon: <FileText size={20} />, color: 'from-indigo-500 to-indigo-700', href: '/nodues/manage' },
            { label: 'Pending', value: stats?.noDuesPending || 0, icon: <FileText size={20} />, color: 'from-amber-500 to-amber-700', href: '/nodues/manage' },
            { label: 'Approved', value: stats?.noDuesApproved || 0, icon: <FileText size={20} />, color: 'from-green-500 to-green-700', href: '/nodues/manage' },
            { label: 'Notices', value: stats?.notices || 0, icon: <Bell size={20} />, color: 'from-cyan-500 to-cyan-700', href: '/notices/manage' },
            { label: 'Certificates', value: stats?.certificates || 0, icon: <Award size={20} />, color: 'from-emerald-500 to-emerald-700', href: '/certificates' },
            { label: 'Audit Logs', value: '→', icon: <ShieldCheck size={20} />, color: 'from-red-500 to-red-700', href: '/admin/audit-logs' },
          ].map((stat, i) => (
            <Link key={i} href={stat.href} className="glass-card p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center text-white mb-3`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{stat.label}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link href="/admin/students" className="glass-card p-5 hover:shadow-lg transition-all">
          <Users className="text-blue-600 dark:text-blue-400 mb-2" size={24} />
          <h3 className="font-semibold">Manage Students</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">View, activate, deactivate students</p>
        </Link>
        <Link href="/admin/departments" className="glass-card p-5 hover:shadow-lg transition-all">
          <Building2 className="text-purple-600 dark:text-purple-400 mb-2" size={24} />
          <h3 className="font-semibold">Departments</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">Manage department records</p>
        </Link>
        <Link href="/admin/audit-logs" className="glass-card p-5 hover:shadow-lg transition-all">
          <ShieldCheck className="text-red-600 dark:text-red-400 mb-2" size={24} />
          <h3 className="font-semibold">Audit Logs</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">View all system activities</p>
        </Link>
        <Link href="/admin/analytics" className="glass-card p-5 hover:shadow-lg transition-all">
          <BarChart3 className="text-emerald-600 dark:text-emerald-400 mb-2" size={24} />
          <h3 className="font-semibold">Analytics</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">Trends, approval rate, and monthly stats</p>
        </Link>
      </div>

      <NotificationPanel />
    </div>
  );
};

export default AdminDashboard;
