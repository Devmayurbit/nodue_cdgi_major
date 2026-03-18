import React, { useState } from 'react';
import { Link } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Mail, ArrowLeft, ShieldCheck } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');

  const mutation = useMutation({
    mutationFn: async () => api.post('/auth/forgot-password', { email }),
    onSuccess: (response) => {
      toast.success(response.data.message || 'Reset link sent if the email is registered.');
      setEmail('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Unable to process request.');
    },
  });

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        <div className="rounded-3xl bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.28),_transparent_45%),linear-gradient(135deg,#0f172a,#1d4ed8)] text-white shadow-xl p-7">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Forgot Password</h1>
              <p className="text-sm text-white/80">Receive a secure reset link on your email</p>
            </div>
          </div>
          <p className="text-sm text-white/75">
            Enter your registered email address. If it exists in the system, we will send a password reset link.
          </p>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }} className="glass-card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Registered Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={16} />
              <input
                type="email"
                className="input-field pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@cdgi.edu.in"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary w-full !py-3"
          >
            {mutation.isPending ? 'Sending reset link...' : 'Send Reset Link'}
          </button>

          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
