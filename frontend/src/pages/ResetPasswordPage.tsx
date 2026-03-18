import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const ResetPasswordPage: React.FC = () => {
  const [location, navigate] = useLocation();
  const token = useMemo(() => new URLSearchParams(location.split('?')[1] || '').get('token') || '', [location]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => api.post('/auth/reset-password', { token, password }),
    onSuccess: (response) => {
      toast.success(response.data.message || 'Password reset successful.');
      navigate('/login');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Unable to reset password.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Reset token is missing or invalid.');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        <div className="rounded-3xl bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.3),_transparent_42%),linear-gradient(135deg,#0f172a,#0f766e)] text-white shadow-xl p-7">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <LockKeyhole size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Reset Password</h1>
              <p className="text-sm text-white/80">Choose a new secure password</p>
            </div>
          </div>
          <p className="text-sm text-white/75">
            Set a new password for your account. This reset link is time-limited for security.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field !pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-field"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
            />
          </div>

          <button type="submit" disabled={mutation.isPending} className="btn-primary w-full !py-3">
            {mutation.isPending ? 'Resetting password...' : 'Reset Password'}
          </button>

          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
