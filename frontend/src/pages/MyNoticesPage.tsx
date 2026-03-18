import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Link } from 'wouter';
import StatusBadge from '../components/StatusBadge';
import { Bell, Plus, Eye } from 'lucide-react';

const MyNoticesPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['myNotices'],
    queryFn: () => api.get('/notices/my').then((r) => r.data.data),
  });

  const notices = data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Notices</h1>
          <p className="text-[var(--color-text-secondary)] text-sm">Track your submitted notices</p>
        </div>
        <Link href="/notices/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Notice
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : notices.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Bell className="mx-auto text-[var(--color-text-secondary)] mb-3" size={40} />
          <h2 className="font-semibold text-lg mb-1">No Notices Yet</h2>
          <p className="text-[var(--color-text-secondary)] mb-4">Submit your first notice.</p>
          <Link href="/notices/new" className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} /> Submit Now
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((n: any) => (
            <Link key={n._id} href={`/notices/${n._id}`} className="glass-card p-4 flex items-center justify-between hover:shadow-lg transition-all block">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold">{n.title}</h3>
                  <StatusBadge status={n.status} />
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] line-clamp-1">
                  {n.description}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  {new Date(n.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Eye size={18} className="text-[var(--color-text-secondary)] ml-4 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyNoticesPage;
