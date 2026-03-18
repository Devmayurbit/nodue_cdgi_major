import React, { useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  FileCheck,
  Bell,
  Award,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

const features = [
  { icon: <FileCheck size={28} />, title: 'No-Dues Management', desc: 'Complete digital clearance workflow with multi-level approvals' },
  { icon: <Bell size={28} />, title: 'Notice Submission', desc: 'Submit and track notices with file and audio attachments' },
  { icon: <Award size={28} />, title: 'Certificate Generation', desc: 'Auto-generated certificates with QR verification codes' },
  { icon: <Shield size={28} />, title: 'Secure & Role-based', desc: 'JWT authentication with 4 role levels and audit logging' },
  { icon: <Zap size={28} />, title: 'AI Chatbot Assistant', desc: 'CDGI Sahayak helps navigate the entire clearance process' },
  { icon: <GraduationCap size={28} />, title: 'Academic Workflow', desc: 'Designed for real CDGI college No-Dues process automation' },
];

const stats = [
  { label: 'Departments', value: '6+' },
  { label: 'Approval Levels', value: '4' },
  { label: 'User Roles', value: '4' },
  { label: 'PDF Reports', value: '✓' },
];

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-transparent dark:from-blue-900/20 dark:via-purple-900/10" />
        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-32">
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium mb-6">
              <GraduationCap size={16} />
              CDGI Academic Operations Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                No-Dues Management
              </span>
              <br />
              <span className="text-[var(--color-text)]">System</span>
            </h1>

            <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-10">
              Digitize and automate the complete college No-Dues process.
              From submission to certificate generation — all in one platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link href="/dashboard" className="btn-primary flex items-center justify-center gap-2 !py-3 !px-8 text-lg">
                  Go to Dashboard <ArrowRight size={20} />
                </Link>
              ) : (
                <>
                  <Link href="/register" className="btn-primary flex items-center justify-center gap-2 !py-3 !px-8 text-lg">
                    Get Started <ArrowRight size={20} />
                  </Link>
                  <Link href="/login" className="btn-secondary flex items-center justify-center gap-2 !py-3 !px-8 text-lg">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  {s.value}
                </div>
                <div className="text-sm text-[var(--color-text-secondary)] mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-[var(--color-text-secondary)] text-lg max-w-xl mx-auto">
              A complete suite of tools for managing the academic No-Dues clearance process.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="glass-card p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20 bg-gradient-to-b from-transparent via-blue-50/50 to-transparent dark:via-blue-950/10">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-4">
            {[
              'Register and verify your email',
              'Submit No-Dues form with auto-filled details',
              'Upload assignments and documents',
              'Faculty reviews and approves',
              'Department clearances (Library, Accounts, Hostel, Lab)',
              'Admin reviews the complete request',
              'Super Admin gives final approval',
              'Download your No-Dues certificate with QR code',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-4 glass-card p-4">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm sm:text-base pt-1">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">
            © 2026 CDGI No-Dues Management System. Chameli Devi Group of Institutions.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
