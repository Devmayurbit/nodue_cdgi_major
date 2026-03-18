import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Link } from 'wouter';
import { Users, FileText, Bell, Award, BarChart3, Settings, UserPlus, ShieldAlert } from 'lucide-react';
import NotificationPanel from '../components/NotificationPanel';

const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['superAdminAnalytics'],
    queryFn: () => api.get('/superadmin/analytics').then((r) => r.data.data),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6 bg-gradient-to-r from-purple-600/10 to-indigo-600/10">
        <h1 className="text-2xl font-bold mb-1">HOD Control Panel</h1>
        <p className="text-[var(--color-text-secondary)]">Welcome, {user?.name}. Manual department clearance and final oversight.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: (analytics?.users?.totalStudents || 0) + (analytics?.users?.totalFaculty || 0) + (analytics?.users?.totalAdmins || 0), icon: <Users size={20} />, color: 'from-blue-500 to-cyan-500' },
              { label: 'Students', value: analytics?.users?.totalStudents || 0, icon: <Users size={20} />, color: 'from-indigo-500 to-blue-500' },
              { label: 'Faculty', value: analytics?.users?.totalFaculty || 0, icon: <Users size={20} />, color: 'from-purple-500 to-indigo-500' },
              { label: 'Admins', value: analytics?.users?.totalAdmins || 0, icon: <ShieldAlert size={20} />, color: 'from-red-500 to-pink-500' },
              { label: 'Total No-Dues', value: analytics?.noDues?.total || 0, icon: <FileText size={20} />, color: 'from-green-500 to-emerald-500' },
              { label: 'Total Notices', value: analytics?.totalNotices || 0, icon: <Bell size={20} />, color: 'from-amber-500 to-orange-500' },
              { label: 'Certificates', value: analytics?.totalCertificates || 0, icon: <Award size={20} />, color: 'from-emerald-500 to-teal-500' },
              { label: 'Departments', value: analytics?.departmentBreakdown?.length || 0, icon: <Settings size={20} />, color: 'from-gray-500 to-zinc-500' },
            ].map((stat, i) => (
              <div key={i} className="glass-card p-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center text-white mb-3`}>
                  {stat.icon}
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* No-Dues breakdown */}
          {analytics?.noDues && (
            <div className="glass-card p-6">
              <h2 className="font-semibold mb-4">No-Dues Status Breakdown</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['pending', 'approved', 'rejected'] as const).map((key) => (
                  <div key={key} className="text-center bg-[var(--color-surface)] rounded-xl p-3">
                    <p className="text-xl font-bold">{(analytics.noDues as any)[key] || 0}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] capitalize">{key}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/hod/department-approval" className="glass-card p-5 hover:shadow-lg transition-all">
          <Settings className="text-orange-600 dark:text-orange-400 mb-2" size={24} />
          <h3 className="font-semibold">Department Clearance</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">Update Library/Accounts/Hostel/Lab/Assignment manually</p>
        </Link>
        <Link href="/superadmin/create-accounts" className="glass-card p-5 hover:shadow-lg transition-all">
          <UserPlus className="text-green-600 dark:text-green-400 mb-2" size={24} />
          <h3 className="font-semibold">Create Accounts</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">Add faculty / admin users</p>
        </Link>
        <Link href="/superadmin/users" className="glass-card p-5 hover:shadow-lg transition-all">
          <Users className="text-blue-600 dark:text-blue-400 mb-2" size={24} />
          <h3 className="font-semibold">All Users</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">Manage all accounts</p>
        </Link>
        <Link href="/superadmin/analytics" className="glass-card p-5 hover:shadow-lg transition-all">
          <BarChart3 className="text-purple-600 dark:text-purple-400 mb-2" size={24} />
          <h3 className="font-semibold">Analytics</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">Detailed system analytics</p>
        </Link>
        <Link href="/nodues/manage" className="glass-card p-5 hover:shadow-lg transition-all">
          <FileText className="text-amber-600 dark:text-amber-400 mb-2" size={24} />
          <h3 className="font-semibold">Override Decisions</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">Override no-dues / notices</p>
        </Link>
      </div>

      <NotificationPanel />
    </div>
  );
};

export default SuperAdminDashboard;
