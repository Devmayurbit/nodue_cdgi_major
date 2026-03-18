import React from 'react';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = status?.toLowerCase() || 'pending';
  let cls = 'status-badge status-pending';
  let label = status;

  if (s === 'approved' || s === 'faculty_approved' || s === 'admin_approved' || s === 'superadmin_approved') {
    cls = 'status-badge status-approved';
    label = s === 'approved' ? 'Approved' : s.replace('_approved', ' Approved').replace(/^\w/, (c) => c.toUpperCase());
  } else if (s === 'rejected') {
    cls = 'status-badge status-rejected';
    label = 'Rejected';
  } else if (s === 'pending' || s === 'submitted' || s === 'in_progress' || s === 'draft') {
    cls = 'status-badge status-pending';
    label = s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1);
  }

  return <span className={cls}>{label}</span>;
};

export default StatusBadge;
