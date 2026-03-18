import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { User, Save, Eye, EyeOff } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.put('/auth/profile', payload);
      return res.data.data;
    },
    onSuccess: (data) => {
      updateUser(data);
      toast.success('Profile updated');
      setCurrentPassword('');
      setNewPassword('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Update failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { name };
    if (newPassword) {
      if (!currentPassword) {
        toast.error('Enter current password to change password');
        return;
      }
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }
    updateMutation.mutate(payload);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <div className="glass-card p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-xl font-bold">{user?.name}</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">{user?.email}</p>
        <span className="inline-block mt-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full capitalize">
          {user?.role}
        </span>
      </div>

      {/* Details card */}
      <div className="glass-card p-6">
        <h2 className="font-semibold mb-4">Account Details</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {user?.enrollmentNumber && (
            <>
              <span className="text-[var(--color-text-secondary)]">Enrollment</span>
              <span>{user.enrollmentNumber}</span>
            </>
          )}
          {user?.department && (
            <>
              <span className="text-[var(--color-text-secondary)]">Department</span>
              <span>{user.department}</span>
            </>
          )}
          {user?.semester && (
            <>
              <span className="text-[var(--color-text-secondary)]">Semester</span>
              <span>{user.semester}</span>
            </>
          )}
          <span className="text-[var(--color-text-secondary)]">Email Verified</span>
          <span>{user?.isEmailVerified ? '✅ Yes' : '❌ No'}</span>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
        <h2 className="font-semibold">Edit Profile</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <hr className="border-[var(--color-border)]" />
        <h3 className="text-sm font-medium">Change Password (optional)</h3>

        <div className="relative">
          <label className="block text-sm font-medium mb-1">Current Password</label>
          <input
            type={showCurrent ? 'text' : 'password'}
            className="input-field pr-10"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-3 top-8 text-[var(--color-text-secondary)]"
          >
            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium mb-1">New Password</label>
          <input
            type={showNew ? 'text' : 'password'}
            className="input-field pr-10"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-8 text-[var(--color-text-secondary)]"
          >
            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Save size={16} />
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
