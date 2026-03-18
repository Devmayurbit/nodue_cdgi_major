import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen text-[var(--color-text)]">
      <Navbar
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        menuOpen={sidebarOpen}
      />
      <div className="flex">
        {user && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
        <main className={`flex-1 p-4 sm:p-6 ${user ? 'lg:ml-64' : ''} min-h-[calc(100vh-4rem)]`}>
          <div className="mx-auto max-w-7xl">
          {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
