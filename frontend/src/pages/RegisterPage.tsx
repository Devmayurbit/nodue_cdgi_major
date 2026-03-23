import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { gsap } from 'gsap';
import {
  UserPlus, Eye, EyeOff, Mail, User, Lock, Building2,
  Hash, CheckCircle2, GraduationCap,
} from 'lucide-react';
import toast from 'react-hot-toast';

const departments = [
  'Computer Science & Engineering',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Information Technology',
];

const currentRole = {
  label: 'Student',
  color: 'from-blue-500 to-blue-600',
};

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    enrollmentNumber: '',
    department: '',
    section: '',
    semester: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // OTP state (only for students)
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  const pageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.fromTo(pageRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
        .fromTo(headerRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, '-=0.25')
        .fromTo(formRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '-=0.1');
    });
    return () => ctx.revert();
  }, []);

  const startCooldown = () => {
    setOtpCooldown(60);
    const iv = setInterval(() => {
      setOtpCooldown((p) => {
        if (p <= 1) { clearInterval(iv); return 0; }
        return p - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    if (!form.email) { toast.error('Enter your email first'); return; }
    setOtpLoading(true);
    try {
      const { data } = await api.post('/auth/send-otp', { email: form.email });
      setOtpSent(true);

      if (data?.devOtp && import.meta.env.DEV) {
        // In development only, auto-fill and show the OTP to
        // speed up testing. In production the student must
        // verify using the code received in their email.
        setOtp(data.devOtp);
        toast.success(`Dev OTP: ${data.devOtp}`, { duration: 8000 });
      } else {
        toast.success('OTP sent to your email!');
      }
      startCooldown();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    }
    setOtpLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) { toast.error('Enter the 6-digit OTP'); return; }
    setOtpLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email: form.email, otp });
      setOtpVerified(true);
      setOtpToken(data?.otpToken || null);
      toast.success('Email verified!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    }
    setOtpLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpVerified || !otpToken) {
      toast.error('Please verify your email with OTP first.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (!form.section.trim()) {
      toast.error('Section is required.');
      return;
    }
    if (!form.semester) {
      toast.error('Semester is required.');
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        enrollmentNumber: form.enrollmentNumber,
        department: form.department,
        section: form.section,
        semester:
          form.semester ? parseInt(form.semester) : undefined,
        otpToken,
      });
      toast.success('Registration successful!');
      setDone(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    }
    setLoading(false);
  };

  if (done) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="glass-card p-8 text-center">
            <div
              className={`w-20 h-20 rounded-full bg-gradient-to-br ${currentRole.color} flex items-center justify-center mx-auto mb-5 shadow-lg`}
            >
              <CheckCircle2 size={36} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              Your student account is ready. Please log in.
            </p>
            <Link href="/login" className="btn-primary !py-3 inline-block">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="min-h-[90vh] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">

        {/* Header banner */}
        <div
          ref={headerRef}
          className={`rounded-2xl p-5 text-white text-center mb-4 bg-gradient-to-r ${currentRole.color} shadow-lg transition-all duration-300`}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <GraduationCap size={18} />
            <span className="text-sm font-medium opacity-90">CDGI No-Dues Management System</span>
          </div>
          <h1 className="text-xl font-bold">Create Account</h1>
          <p className="text-sm opacity-80 mt-0.5">Register as {currentRole.label}</p>
        </div>

        <div className="glass-card p-6">
          {/* Form */}
          <div ref={formRef}>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name + Enrollment (student only) */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={15} />
                    <input
                      type="text"
                      className="input-field pl-9"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Enrollment Number</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={15} />
                    <input
                      type="text"
                      className="input-field pl-9"
                      placeholder="0901CS211001"
                      value={form.enrollmentNumber}
                      onChange={(e) => setForm({ ...form, enrollmentNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Section</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="A"
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  required
                />
              </div>

              {/* Email with OTP (students only) / Plain email (faculty/admin) */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={15} />
                      <input
                        type="email"
                        className="input-field pl-9"
                        placeholder="student@cdgi.edu.in"
                        value={form.email}
                        onChange={(e) => {
                          setForm({ ...form, email: e.target.value });
                          if (otpVerified || otpToken) {
                            setOtpVerified(false);
                            setOtpToken(null);
                            setOtpSent(false);
                            setOtp('');
                          }
                        }}
                        required
                        disabled={otpVerified}
                      />
                    </div>
                    {!otpVerified ? (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpLoading || otpCooldown > 0 || !form.email}
                        className="btn-primary whitespace-nowrap text-sm !py-2 px-4"
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
                  {otpSent && !otpVerified && (
                    <div className="mt-2">
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
                          className="btn-primary text-sm !py-2 px-4"
                        >
                          {otpLoading ? '...' : 'Verify'}
                        </button>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        Check your email for the 6-digit OTP
                      </p>
                    </div>
                  )}
                </>
              </div>

              {/* Department + Semester */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Department</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={15} />
                    <select
                      title="Department"
                      className="input-field pl-9"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      required
                    >
                      <option value="">Select department</option>
                      {departments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Semester</label>
                  <select
                    title="Semester"
                    className="input-field"
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: e.target.value })}
                  >
                    <option value="">Select</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={15} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field pl-9 !pr-10"
                      placeholder="Min 8 characters"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full !py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] bg-gradient-to-r ${currentRole.color} mt-1`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus size={18} /> Register
                  </>
                )}
              </button>
            </form>

            <p className="text-sm text-center mt-5 text-[var(--color-text-secondary)]">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


export default RegisterPage;
