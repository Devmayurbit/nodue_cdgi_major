import React, { useMemo, useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { UserPlus, Mail, Lock, Building2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const departments = [
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Information Technology',
  'Library',
  'Accounts',
  'Hostel',
  'Laboratory',
];

const CreateAccountsPage: React.FC = () => {
  const { user } = useAuth();

  const canCreateHod = useMemo(() => {
    const dept = (user?.department || '').trim().toLowerCase();
    return user?.role === 'superadmin' && dept === 'administration';
  }, [user?.department, user?.role]);

  const roleOptions = useMemo(
    () => (canCreateHod ? (['faculty', 'admin', 'hod'] as const) : (['faculty', 'admin'] as const)),
    [canCreateHod]
  );

  const [role, setRole] = useState<'faculty' | 'admin' | 'hod'>('faculty');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState(departments[0]);
  const [section, setSection] = useState('');
  const [semester, setSemester] = useState('');
  const [subject, setSubject] = useState('');

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  const startCooldown = () => {
    setOtpCooldown(60);
    const interval = setInterval(() => {
      setOtpCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    if (!email) { toast.error('Enter email first'); return; }
    setOtpLoading(true);
    try {
      await api.post('/auth/send-otp', { email });
      setOtpSent(true);
      toast.success('OTP sent!');
      startCooldown();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    }
    setOtpLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    setOtpLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp });
      setOtpVerified(true);
      toast.success('Email verified!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    }
    setOtpLoading(false);
  };

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const endpoint =
        role === 'faculty'
          ? '/superadmin/create-faculty'
          : role === 'admin'
            ? '/superadmin/create-admin'
            : '/superadmin/create-hod';
      return api.post(endpoint, payload).then((r) => r.data);
    },
    onSuccess: (data) => {
      const label = role === 'faculty' ? 'Faculty' : role === 'admin' ? 'Admin' : 'HOD';
      toast.success(`${label} account created!`);
      setName('');
      setEmail('');
      setPassword('');
      setSection('');
      setSemester('');
      setSubject('');
      setOtpSent(false);
      setOtpVerified(false);
      setOtp('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create account');
    },
  });

  useEffect(() => {
    if (!canCreateHod && role === 'hod') {
      setRole('faculty');
    }
  }, [canCreateHod, role]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpVerified) {
      toast.error('Please verify the email with OTP first.');
      return;
    }
    if (role === 'faculty' && !section.trim()) {
      toast.error('Section is required for faculty account.');
      return;
    }
    if (role === 'faculty' && !semester) {
      toast.error('Semester is required for faculty account.');
      return;
    }
    if (role === 'faculty' && !subject.trim()) {
      toast.error('Subject is required for faculty account.');
      return;
    }

    createMutation.mutate({
      name,
      email,
      password,
      department,
      section: role === 'faculty' ? section : undefined,
      semester: role === 'faculty' ? parseInt(semester, 10) : undefined,
      subject: role === 'faculty' ? subject : undefined,
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white">
            <UserPlus size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Create Account</h1>
            <p className="text-[var(--color-text-secondary)] text-sm">Add new staff users</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
        {/* Role selector */}
        <div>
          <label className="block text-sm font-medium mb-2">Account Type</label>
          <div className="flex gap-3">
            {roleOptions.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                  role === r
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
                }`}
              >
                {r === 'faculty' ? 'Faculty' : r === 'admin' ? 'Admin' : 'HOD'}
              </button>
            ))}
          </div>
          {!canCreateHod && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-2">
              HOD accounts can only be created by the root Super Admin.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter full name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-3 text-[var(--color-text-secondary)]" size={16} />
              <input
                type="email"
                className="input-field pl-10"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (otpVerified) { setOtpVerified(false); setOtpSent(false); setOtp(''); }
                }}
                placeholder="user@cdgi.edu.in"
                required
                disabled={otpVerified}
              />
            </div>
            {!otpVerified ? (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={otpLoading || otpCooldown > 0 || !email}
                className="btn-primary whitespace-nowrap text-sm"
              >
                {otpLoading ? '...' : otpCooldown > 0 ? `${otpCooldown}s` : otpSent ? 'Resend' : 'Send OTP'}
              </button>
            ) : (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400 px-3">
                <CheckCircle2 size={18} />
                <span className="text-sm font-medium">Verified</span>
              </div>
            )}
          </div>
        </div>

        {/* OTP Input */}
        {otpSent && !otpVerified && (
          <div className="animate-fade-in">
            <label className="block text-sm font-medium mb-1">Enter OTP</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input-field flex-1 text-center tracking-[0.5em] text-lg font-mono"
                placeholder="------"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={otpLoading || otp.length !== 6}
                className="btn-primary text-sm"
              >
                {otpLoading ? '...' : 'Verify'}
              </button>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">Check the email inbox for OTP</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-[var(--color-text-secondary)]" size={16} />
            <input
              type="password"
              className="input-field pl-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              required
              minLength={8}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Department</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-3 text-[var(--color-text-secondary)]" size={16} />
            <select
              title="Department"
              className="input-field pl-10"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {role === 'faculty' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Section</label>
              <input
                className="input-field"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="A"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Semester</label>
              <select
                title="Semester"
                className="input-field"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                required
              >
                <option value="">Select semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <input
                className="input-field"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Data Structures"
                required
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <UserPlus size={16} />
          {createMutation.isPending
            ? 'Creating...'
            : `Create ${role === 'faculty' ? 'Faculty' : role === 'admin' ? 'Admin' : 'HOD'} Account`}
        </button>
      </form>
    </div>
  );
};

export default CreateAccountsPage;
