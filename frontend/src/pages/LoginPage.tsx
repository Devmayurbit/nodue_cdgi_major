import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { gsap } from 'gsap';
import {
  LogIn, Eye, EyeOff, Key, GraduationCap,
  BookOpen, Shield, Crown,
} from 'lucide-react';
import toast from 'react-hot-toast';

type RoleId = 'student' | 'faculty' | 'admin' | 'superadmin';

const roles: { id: RoleId; label: string; desc: string; icon: React.ReactNode; color: string; borderColor: string }[] = [
  {
    id: 'student',
    label: 'Student',
    desc: 'Self-registered',
    icon: <GraduationCap size={22} />,
    color: 'from-blue-500 to-blue-600',
    borderColor: 'border-blue-500',
  },
  {
    id: 'faculty',
    label: 'Faculty',
    desc: 'Assigned by HOD',
    icon: <BookOpen size={22} />,
    color: 'from-emerald-500 to-teal-600',
    borderColor: 'border-emerald-500',
  },
  {
    id: 'admin',
    label: 'Admin',
    desc: 'System administrator',
    icon: <Shield size={22} />,
    color: 'from-violet-500 to-purple-600',
    borderColor: 'border-violet-500',
  },
  {
    id: 'superadmin',
    label: 'Super Admin',
    desc: 'HOD / Director',
    icon: <Crown size={22} />,
    color: 'from-amber-500 to-orange-500',
    borderColor: 'border-amber-500',
  },
];

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<RoleId>('student');
  const [form, setForm] = useState({ email: '', password: '', accessKey: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [loading, setLoading] = useState(false);

  const pageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const rolesRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.fromTo(pageRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
        .fromTo(headerRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, '-=0.25')
        .fromTo(
          rolesRef.current ? rolesRef.current.children : [],
          { opacity: 0, y: 20, scale: 0.92 },
          { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.08, ease: 'back.out(1.4)' },
          '-=0.2'
        )
        .fromTo(formRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '-=0.1');
    });
    return () => ctx.revert();
  }, []);

  const needsAccessKey = selectedRole === 'faculty' || selectedRole === 'admin';
  const currentRole = roles.find((r) => r.id === selectedRole)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (needsAccessKey && !form.accessKey) {
      toast.error('Access key is required for this role.');
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password, form.accessKey || undefined);
      toast.success('Login successful!');
      setLocation('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed';
      if (err.response?.data?.requiresAccessKey) {
        toast.error('Enter your access key to complete first-time login.');
      } else {
        toast.error(msg);
      }
    }
    setLoading(false);
  };

  return (
    <div ref={pageRef} className="min-h-[90vh] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Header banner */}
        <div
          ref={headerRef}
          className={`rounded-2xl p-6 text-white text-center mb-4 bg-gradient-to-r ${currentRole.color} shadow-lg transition-all duration-300`}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <GraduationCap size={20} />
            <span className="text-sm font-medium opacity-90">CDGI No-Dues Management System</span>
          </div>
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-sm opacity-80 mt-1">Sign in to CDGI No-Dues Management System</p>
        </div>

        <div className="glass-card p-6">
          {/* Role selector */}
          <div ref={rolesRef} className="grid grid-cols-2 gap-3 mb-6">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => {
                  setSelectedRole(role.id);
                  setForm((f) => ({ ...f, accessKey: '' }));
                }}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                  selectedRole === role.id
                    ? `${role.borderColor} bg-opacity-10 bg-blue-50 dark:bg-blue-900/10 shadow-sm`
                    : 'border-[var(--color-border)] hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}
                >
                  {role.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-tight">{role.label}</div>
                  <div className="text-[11px] text-[var(--color-text-secondary)] leading-tight truncate">{role.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Form */}
          <div ref={formRef}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="your.email@cdgi.edu.in"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field !pr-10"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <Link href="/forgot-password" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Access Key for Faculty / Admin */}
              {needsAccessKey && (
                <div>
                  <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                    <Key size={14} />
                    Access Key
                    <span className="text-[10px] text-[var(--color-text-secondary)] font-normal">(first login)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showAccessKey ? 'text' : 'password'}
                      className="input-field !pr-10"
                      placeholder={`CDGI-${selectedRole.toUpperCase()}-2026`}
                      value={form.accessKey}
                      onChange={(e) => setForm({ ...form, accessKey: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccessKey(!showAccessKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
                    >
                      {showAccessKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    Required only on first login. Provided by HOD.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full !py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] bg-gradient-to-r ${currentRole.color}`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={18} />
                    Sign In as {currentRole.label}
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 rounded-2xl bg-[var(--color-surface)]/80 p-4 border border-[var(--color-border)]">
              {selectedRole === 'student' && (
                <p className="text-sm text-center text-[var(--color-text-secondary)]">
                  Don't have an account?{' '}
                  <Link href="/register" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                    Register as Student
                  </Link>
                </p>
              )}
              {(selectedRole === 'faculty' || selectedRole === 'admin') && (
                <p className="text-sm text-center text-[var(--color-text-secondary)]">
                  New {selectedRole}?{' '}
                  <Link
                    href={`/register?role=${selectedRole}`}
                    className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                  >
                    Register with access key
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
