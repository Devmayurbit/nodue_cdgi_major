import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import api from '../lib/api';

const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['myNotifications', 'bell'],
    queryFn: () => api.get('/notifications/my?limit=8').then((r) => r.data),
    refetchInterval: 45000,
    retry: false,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/read/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myNotifications'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myNotifications'] });
    },
  });

  const notifications = data?.data || [];
  const unread = data?.unread || 0;

  const hasUnread = useMemo(() => unread > 0, [unread]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Notifications"
      >
        <Bell size={18} />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center font-semibold">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[420px] overflow-auto glass-card shadow-xl z-[60]">
          <div className="p-3 border-b border-[var(--color-border)] flex items-center justify-between">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <button
              onClick={() => markAllMutation.mutate()}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Mark all read
            </button>
          </div>

          <div className="p-2 space-y-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)] p-3">No notifications yet.</p>
            ) : (
              notifications.map((item: any) => (
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
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
