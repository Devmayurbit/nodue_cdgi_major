import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Bell } from 'lucide-react';

const NotificationPanel: React.FC<{ title?: string }> = ({ title = 'Notifications' }) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['myNotifications', 'panel'],
    queryFn: () => api.get('/notifications/my?limit=6').then((r) => r.data),
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/read/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myNotifications'] }),
  });

  const items = data?.data || [];

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Bell size={18} className="text-blue-600 dark:text-blue-400" />
        <h2 className="font-semibold text-lg">{title}</h2>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)]">No notifications available.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item: any) => (
            <button
              key={item._id}
              onClick={() => {
                if (!item.isRead) markReadMutation.mutate(item._id);
              }}
              className={`w-full text-left p-3 rounded-xl border transition-colors ${
                item.isRead
                  ? 'border-[var(--color-border)] bg-[var(--color-surface)]'
                  : 'border-blue-300 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-900/20'
              }`}
            >
              <p className="text-sm font-medium">{item.message}</p>
              <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
