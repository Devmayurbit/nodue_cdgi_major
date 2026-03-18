import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Bell,
  Award,
  Users,
  Settings,
  BarChart3,
  ShieldCheck,
  Building2,
  ScrollText,
  MessageSquare,
  UserPlus,
  ClipboardList,
} from 'lucide-react';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
}

const menuItems: SidebarItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} />, roles: ['student', 'faculty', 'admin', 'superadmin'] },
  { label: 'No-Dues Form', href: '/nodues/new', icon: <FileText size={18} />, roles: ['student'] },
  { label: 'My No-Dues', href: '/nodues/my', icon: <ClipboardList size={18} />, roles: ['student'] },
  { label: 'Notice Form', href: '/notices/new', icon: <Bell size={18} />, roles: ['student'] },
  { label: 'My Notices', href: '/notices/my', icon: <ScrollText size={18} />, roles: ['student'] },
  { label: 'Certificates', href: '/certificates', icon: <Award size={18} />, roles: ['student'] },
  { label: 'No-Dues Requests', href: '/nodues/manage', icon: <FileText size={18} />, roles: ['faculty', 'admin', 'superadmin'] },
  { label: 'Lab Management', href: '/faculty/lab-management', icon: <FileText size={18} />, roles: ['faculty'] },
  { label: 'Assignment Management', href: '/faculty/assignment-management', icon: <FileText size={18} />, roles: ['faculty'] },
  { label: 'Notice Requests', href: '/notices/manage', icon: <Bell size={18} />, roles: ['faculty', 'admin', 'superadmin'] },
  { label: 'Student Clearance', href: '/admin/student-clearance', icon: <FileText size={18} />, roles: ['admin', 'superadmin'] },
  { label: 'System Control', href: '/admin/system-control', icon: <Settings size={18} />, roles: ['admin', 'superadmin'] },
  { label: 'Students', href: '/admin/students', icon: <Users size={18} />, roles: ['admin', 'superadmin'] },
  { label: 'Departments', href: '/admin/departments', icon: <Building2 size={18} />, roles: ['admin', 'superadmin'] },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: <ShieldCheck size={18} />, roles: ['admin', 'superadmin'] },
  { label: 'HOD Department Clearance', href: '/hod/department-approval', icon: <Building2 size={18} />, roles: ['superadmin'] },
  { label: 'HOD Student Clearance', href: '/hod/student-clearance', icon: <Users size={18} />, roles: ['superadmin'] },
  { label: 'Create Accounts', href: '/superadmin/create-accounts', icon: <UserPlus size={18} />, roles: ['superadmin'] },
  { label: 'Analytics', href: '/superadmin/analytics', icon: <BarChart3 size={18} />, roles: ['superadmin'] },
  { label: 'All Users', href: '/superadmin/users', icon: <Users size={18} />, roles: ['superadmin'] },
];

const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const filteredItems = menuItems.filter((item) => item.roles.includes(user.role));

  const roleLabel = {
    student: 'Student',
    faculty: 'Faculty',
    admin: 'Admin',
    superadmin: 'HOD',
  }[user.role];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/55 z-40 lg:hidden backdrop-blur-sm" onClick={onClose} />
      )}
      <aside
        className={`sidebar-shell fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 z-40 border-r border-[var(--color-border)] transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{user.name}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{roleLabel}</p>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-88px)]">
          {filteredItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'sidebar-active-link text-white border border-sky-300/20'
                    : 'text-[var(--color-text-secondary)] hover:bg-white/6 hover:text-[var(--color-text)]'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
