import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { gsap } from 'gsap';
import {
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  GraduationCap,
} from 'lucide-react';
import NotificationBell from './NotificationBell';

const Navbar: React.FC<{ onMenuToggle?: () => void; menuOpen?: boolean }> = ({
  onMenuToggle,
  menuOpen,
}) => {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const [location] = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Navbar slide down
      gsap.fromTo(
        navRef.current,
        { y: -80, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
      );
      // Logo slide in from left
      gsap.fromTo(
        logoRef.current,
        { x: -40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.55, ease: 'power2.out', delay: 0.2 }
      );
      // Actions slide in from right
      gsap.fromTo(
        actionsRef.current,
        { x: 40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.55, ease: 'power2.out', delay: 0.25 }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <nav
      ref={navRef}
      className="glass-navbar sticky top-0 z-50 px-4 sm:px-6 h-16 flex items-center justify-between"
    >
      {/* Left: logo + menu toggle */}
      <div ref={logoRef} className="flex items-center gap-3">
        {user && onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg group">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
            <GraduationCap size={18} className="text-white" />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-sky-200 to-amber-200 font-extrabold text-base">
              CDGI No-Dues
            </span>
            <span className="text-[10px] text-[var(--color-text-secondary)] font-normal tracking-wide">
              Management System
            </span>
          </div>
        </Link>
      </div>

      {/* Right: actions */}
      <div ref={actionsRef} className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={toggle}
          className="p-2 rounded-xl hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
          title="Toggle theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {user && <NotificationBell />}

        {user ? (
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col leading-none">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-[10px] text-[var(--color-text-secondary)] capitalize">{user.role}</span>
              </div>
            </Link>
            <button
              onClick={logout}
              className="p-2 rounded-xl hover:bg-red-500/10 text-red-300 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                location === '/login'
                  ? 'bg-white/12 text-white border border-white/10'
                  : 'hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              Login
            </Link>
            <Link href="/register" className="btn-primary text-sm !py-2 !px-4">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
