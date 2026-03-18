import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Link } from 'wouter';
import StatusBadge from '../components/StatusBadge';
import { FileText, Plus, Eye } from 'lucide-react';

const MyNoDuesPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['myNoDues'],
    queryFn: () => api.get('/nodues/my').then((r) => r.data.data),
  });

  const noDues = data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My No-Dues Applications</h1>
          <p className="text-[var(--color-text-secondary)] text-sm">Track all your clearance requests</p>
        </div>
        <Link href="/nodues/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Application
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : noDues.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FileText className="mx-auto text-[var(--color-text-secondary)] mb-3" size={40} />
          <h2 className="font-semibold text-lg mb-1">No Applications Yet</h2>
          <p className="text-[var(--color-text-secondary)] mb-4">Submit your first no-dues clearance request.</p>
          <Link href="/nodues/new" className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} /> Submit Now
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {noDues.map((nd: any) => (
            <Link key={nd._id} href={`/nodues/${nd._id}`} className="glass-card p-4 flex items-center justify-between hover:shadow-lg transition-all block">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold">Application #{nd._id.slice(-6).toUpperCase()}</h3>
                  <StatusBadge status={nd.status} />
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Submitted: {new Date(nd.createdAt).toLocaleDateString()} &middot; Department: {nd.student?.department || 'N/A'}
                </p>
              </div>
              <Eye size={18} className="text-[var(--color-text-secondary)]" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyNoDuesPage;
