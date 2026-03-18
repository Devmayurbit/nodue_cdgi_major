import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { FileText, Bell, Award, Clock, CheckCircle, XCircle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import ApprovalTimeline from '../components/ApprovalTimeline';
import { Link } from 'wouter';
import NotificationPanel from '../components/NotificationPanel';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: noDuesData, isLoading: loadingND } = useQuery({
    queryKey: ['myNoDues'],
    queryFn: () => api.get('/nodues/my').then((r) => r.data.data),
    refetchInterval: 15000,
  });

  const { data: noticesData, isLoading: loadingN } = useQuery({
    queryKey: ['myNotices'],
    queryFn: () => api.get('/notices/my').then((r) => r.data.data),
    refetchInterval: 15000,
  });

  const { data: certsData, isLoading: loadingC } = useQuery({
    queryKey: ['myCerts'],
    queryFn: () => api.get('/certificates/my').then((r) => r.data.data),
    refetchInterval: 15000,
  });

  const latestNoDues = noDuesData?.[0];

  const getTimelineSteps = (nd: any) => {
    if (!nd) return [];
    return [
      { label: 'Faculty Approval', status: nd.facultyApproval?.status || 'pending' },
      { label: 'Library Clearance', status: nd.libraryClearance?.status || 'pending' },
      { label: 'Accounts Clearance', status: nd.accountsClearance?.status || 'pending' },
      { label: 'Hostel Clearance', status: nd.hostelClearance?.status || 'pending' },
      { label: 'Lab Clearance', status: nd.labClearance?.status || 'pending' },
      { label: 'Assignment Clearance', status: nd.assignmentClearance?.status || 'pending' },
      { label: 'Admin Approval', status: nd.adminApproval?.status || 'pending' },
      { label: 'HOD Approval', status: nd.superAdminApproval?.status || 'pending' },
    ];
  };

  const approvedCount = latestNoDues ? getTimelineSteps(latestNoDues).filter((s) => s.status === 'approved').length : 0;
  const totalSteps = 8;
  const progressPercent = (approvedCount / totalSteps) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold mb-1">Welcome, {user?.name}!</h1>
        <p className="text-[var(--color-text-secondary)] text-sm">
          {user?.enrollmentNumber} • {user?.department} • Semester {user?.semester}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'No-Dues', value: noDuesData?.length || 0, icon: <FileText size={20} />, color: 'from-blue-500 to-blue-700' },
          { label: 'Notices', value: noticesData?.length || 0, icon: <Bell size={20} />, color: 'from-amber-500 to-amber-700' },
          { label: 'Certificates', value: certsData?.length || 0, icon: <Award size={20} />, color: 'from-green-500 to-green-700' },
          { label: 'Progress', value: `${approvedCount}/${totalSteps}`, icon: <CheckCircle size={20} />, color: 'from-purple-500 to-purple-700' },
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

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link href="/nodues/new" className="glass-card p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group">
          <FileText size={24} className="text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold">Submit No-Dues</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">Apply for clearance</p>
        </Link>
        <Link href="/notices/new" className="glass-card p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group">
          <Bell size={24} className="text-amber-600 dark:text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold">Submit Notice</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">File a new notice</p>
        </Link>
        <Link href="/certificates" className="glass-card p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group">
          <Award size={24} className="text-green-600 dark:text-green-400 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold">Certificates</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">Download your certificates</p>
        </Link>
      </div>

      {/* Progress & Timeline */}
      <div className="grid lg:grid-cols-2 gap-6">
        {latestNoDues ? (
          <>
            <div className="glass-card p-6">
              <h2 className="font-semibold text-lg mb-4">Clearance Progress</h2>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span className="font-semibold">{Math.round(progressPercent)}%</span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-sm text-[var(--color-text-secondary)]">Status:</span>
                <StatusBadge status={latestNoDues.status} />
              </div>
              {latestNoDues.status !== 'approved' && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-3">Clearance still pending.</p>
              )}
              {latestNoDues.status === 'approved' && (
                <Link href="/certificates" className="btn-primary inline-flex items-center gap-2 mt-4">
                  <Award size={16} /> Download Clearance Certificate (PDF)
                </Link>
              )}
            </div>
            <div className="glass-card p-6">
              <h2 className="font-semibold text-lg mb-4">Approval Timeline</h2>
              <ApprovalTimeline steps={getTimelineSteps(latestNoDues)} />
            </div>
          </>
        ) : (
          <div className="glass-card p-6 lg:col-span-2 text-center py-12">
            <FileText size={48} className="mx-auto text-[var(--color-text-secondary)] mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Active No-Dues Request</h3>
            <p className="text-[var(--color-text-secondary)] mb-4">Submit your No-Dues form to start the clearance process.</p>
            <Link href="/nodues/new" className="btn-primary inline-flex items-center gap-2">
              <FileText size={16} /> Submit Now
            </Link>
          </div>
        )}
      </div>

      <NotificationPanel title="Recent Updates" />
    </div>
  );
};

export default StudentDashboard;
