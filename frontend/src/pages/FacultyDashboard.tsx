import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import StatusBadge from '../components/StatusBadge';
import { Link } from 'wouter';
import { FileText, Bell, CheckCircle, XCircle, Clock } from 'lucide-react';
import NotificationPanel from '../components/NotificationPanel';

const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: noDues, isLoading } = useQuery({
    queryKey: ['allNoDues'],
    queryFn: () => api.get('/nodues?limit=50').then((r) => r.data.data),
    refetchInterval: 15000,
  });

  const { data: notices } = useQuery({
    queryKey: ['allNotices'],
    queryFn: () => api.get('/notices?limit=50').then((r) => r.data.data),
    refetchInterval: 15000,
  });

  const pendingND =
    noDues?.filter((nd: any) =>
      (nd.subjectApprovals || []).some(
        (sa: any) =>
          sa.faculty?._id === user?.id &&
          (sa.assignmentStatus === 'pending' || sa.labStatus === 'pending')
      )
    ) || [];
  const pendingNotices = notices?.filter((n: any) => n.facultyApproval?.status === 'pending') || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold mb-1">Faculty Dashboard</h1>
        <p className="text-[var(--color-text-secondary)]">
          Welcome, {user?.name} • {user?.department} • {user?.section} • {user?.subject}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending No-Dues', value: pendingND.length, icon: <FileText size={20} />, color: 'from-amber-500 to-amber-700' },
          { label: 'Pending Notices', value: pendingNotices.length, icon: <Bell size={20} />, color: 'from-blue-500 to-blue-700' },
          { label: 'Total No-Dues', value: noDues?.length || 0, icon: <CheckCircle size={20} />, color: 'from-green-500 to-green-700' },
          { label: 'Total Notices', value: notices?.length || 0, icon: <Clock size={20} />, color: 'from-purple-500 to-purple-700' },
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

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/faculty/lab-management" className="glass-card p-5 hover:shadow-lg transition-all">
          <FileText className="text-emerald-600 dark:text-emerald-400 mb-2" size={24} />
          <h3 className="font-semibold">Approve Lab</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">Review and update lab clearance status</p>
        </Link>
        <Link href="/faculty/assignment-management" className="glass-card p-5 hover:shadow-lg transition-all">
          <FileText className="text-violet-600 dark:text-violet-400 mb-2" size={24} />
          <h3 className="font-semibold">Approve Assignment</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">Review and update assignment clearance status</p>
        </Link>
      </div>

      {/* Pending No-Dues */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Pending No-Dues for Review</h2>
          <Link href="/nodues/manage" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            View All
          </Link>
        </div>
        {pendingND.length === 0 ? (
          <p className="text-[var(--color-text-secondary)] text-sm py-4 text-center">No pending requests.</p>
        ) : (
          <div className="space-y-3">
            {pendingND.slice(0, 5).map((nd: any) => (
              <Link
                key={nd._id}
                href={`/nodues/manage`}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{nd.student?.name || 'Student'}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{nd.enrollmentNumber} • {nd.department}</p>
                </div>
                <StatusBadge status={nd.status} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Pending Notices */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Pending Notices</h2>
          <Link href="/notices/manage" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            View All
          </Link>
        </div>
        {pendingNotices.length === 0 ? (
          <p className="text-[var(--color-text-secondary)] text-sm py-4 text-center">No pending notices.</p>
        ) : (
          <div className="space-y-3">
            {pendingNotices.slice(0, 5).map((n: any) => (
              <div key={n._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div>
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">By {n.student?.name}</p>
                </div>
                <StatusBadge status={n.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <NotificationPanel />
    </div>
  );
};

export default FacultyDashboard;
