import React, { lazy, Suspense } from 'react';
import { Route, Switch, Redirect, useLocation } from 'wouter';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import DashboardLayout from './components/DashboardLayout';
import ChatWidget from './components/ChatWidget';

// Lazy loaded pages
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const FacultyDashboard = lazy(() => import('./pages/FacultyDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NoDuesFormPage = lazy(() => import('./pages/NoDuesFormPage'));
const MyNoDuesPage = lazy(() => import('./pages/MyNoDuesPage'));
const NoticeFormPage = lazy(() => import('./pages/NoticeFormPage'));
const MyNoticesPage = lazy(() => import('./pages/MyNoticesPage'));
const CertificateDownloadPage = lazy(() => import('./pages/CertificateDownloadPage'));
const ManageNoDuesPage = lazy(() => import('./pages/ManageNoDuesPage'));
const ManageNoticesPage = lazy(() => import('./pages/ManageNoticesPage'));
const CreateAccountsPage = lazy(() => import('./pages/CreateAccountsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SuperAdminUsersPage = lazy(() => import('./pages/SuperAdminUsersPage'));
const AdminStudentsPage = lazy(() => import('./pages/AdminStudentsPage'));
const AdminDepartmentsPage = lazy(() => import('./pages/AdminDepartmentsPage'));
const AdminAuditLogsPage = lazy(() => import('./pages/AdminAuditLogsPage'));
const NoDuesDetailPage = lazy(() => import('./pages/NoDuesDetailPage'));
const FacultyLabManagementPage = lazy(() => import('./pages/FacultyLabManagementPage'));
const FacultyAssignmentManagementPage = lazy(() => import('./pages/FacultyAssignmentManagementPage'));
const HODDepartmentApprovalPage = lazy(() => import('./pages/HODDepartmentApprovalPage'));

// Loading fallback
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
  </div>
);

// Protected Route wrapper
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  roles?: string[];
}> = ({ children, roles }) => {
  const { user, token, isLoading } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!token || !user) {
    return <Redirect to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect to appropriate dashboard
    const dashboardMap: Record<string, string> = {
      student: '/dashboard',
      faculty: '/faculty/dashboard',
      admin: '/admin/dashboard',
      superadmin: '/superadmin/dashboard',
    };
    return <Redirect to={dashboardMap[user.role] || '/dashboard'} />;
  }

  return <>{children}</>;
};

// Guest route - redirect logged-in users
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (token && user) {
    const dashboardMap: Record<string, string> = {
      student: '/dashboard',
      faculty: '/faculty/dashboard',
      admin: '/admin/dashboard',
      superadmin: '/superadmin/dashboard',
    };
    return <Redirect to={dashboardMap[user.role] || '/dashboard'} />;
  }

  return <>{children}</>;
};

// Dashboard wrapper
const WithDashboard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DashboardLayout>{children}</DashboardLayout>
);

const AppRoutes: React.FC = () => {
  const { user, token } = useAuth();

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          {/* Public routes */}
          <Route path="/">
            <GuestRoute>
              <HomePage />
            </GuestRoute>
          </Route>

          <Route path="/login">
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          </Route>

          <Route path="/register">
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          </Route>

          <Route path="/forgot-password">
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          </Route>

          <Route path="/reset-password">
            <GuestRoute>
              <ResetPasswordPage />
            </GuestRoute>
          </Route>

          {/* Student routes */}
          <Route path="/dashboard">
            <ProtectedRoute roles={['student']}>
              <WithDashboard><StudentDashboard /></WithDashboard>
            </ProtectedRoute>
          </Route>

          <Route path="/nodues/new">
            <ProtectedRoute roles={['student']}>
              <WithDashboard><NoDuesFormPage /></WithDashboard>
            </ProtectedRoute>
          </Route>

          <Route path="/nodues/my">
            <ProtectedRoute roles={['student']}>
              <WithDashboard><MyNoDuesPage /></WithDashboard>
            </ProtectedRoute>
          </Route>

          <Route path="/student/library-status">
            <ProtectedRoute roles={['student']}>
              <WithDashboard><MyNoDuesPage /></WithDashboard>
            </ProtectedRoute>
          </Route>

          <Route path="/student/hostel-status">
            <ProtectedRoute roles={['student']}>
              <WithDashboard><MyNoDuesPage /></WithDashboard>
            </ProtectedRoute>
          </Route>

          <Route path="/student/lab-status">
            <ProtectedRoute roles={['student']}>
              <WithDashboard><MyNoDuesPage /></WithDashboard>
            </ProtectedRoute>
          </Route>

          <Route path="/student/assignment-status">
            <ProtectedRoute roles={['student']}>
              <WithDashboard><MyNoDuesPage /></WithDashboard>
            </ProtectedRoute>
          </Route>

          <Route path="/notices/new">
            <ProtectedRoute roles={['student']}>
              <WithDashboard><NoticeFormPage /></WithDashboard>
            </ProtectedRoute>
          </Route>

          <Route path="/notices/my">
            <ProtectedRoute roles={['student']}>
              <WithDashboard><MyNoticesPage /></WithDashboard>
            </ProtectedRoute>
          </Route>

          <Route path="/certificates">
            <ProtectedRoute roles={['student']}>
              <WithDashboard><CertificateDownloadPage /></WithDashboard>
            </ProtectedRoute>
          </Route>

          {/* Faculty routes */}
          <Route path="/faculty/dashboard">
            <ProtectedRoute roles={['faculty']}>
              <WithDashboard><FacultyDashboard /></WithDashboard>
            </ProtectedRoute>
          </Route>

          <Route path="/faculty/lab-management">
            <ProtectedRoute roles={['faculty']}>
              <WithDashboard><FacultyLabManagementPage /></WithDashboard>
            </ProtectedRoute>
          </Route>

          <Route path="/faculty/assignment-management">
            <ProtectedRoute roles={['faculty']}>
              <WithDashboard><FacultyAssignmentManagementPage /></WithDashboard>
            </ProtectedRoute>
          </Route>

          {/* Manage routes (faculty, admin, superadmin) */}
          <Route path="/nodues/manage">
            <ProtectedRoute roles={['faculty', 'admin', 'superadmin']}>
              <WithDashboard><ManageNoDuesPage /></WithDashboard>
            </ProtectedRoute>
          </Route>

          <Route path="/notices/manage">
            <ProtectedRoute roles={['faculty', 'admin', 'superadmin']}>
              <WithDashboard><ManageNoticesPage /></WithDashboard>
            </ProtectedRoute>
          </Route>

          <Route path="/nodues/:id">
            <ProtectedRoute roles={['student']}>
              <WithDashboard><NoDuesDetailPage /></WithDashboard>
            </ProtectedRoute>
          </Route>

          {/* Admin routes */}
          <Route path="/admin/dashboard">
            <ProtectedRoute roles={['admin', 'superadmin']}>
              <WithDashboard><AdminDashboard /></WithDashboard>
            </ProtectedRoute>
          </Route>

          <Route path="/admin/students">
            <ProtectedRoute roles={['admin', 'superadmin']}>
              <WithDashboard><AdminStudentsPage /></WithDashboard>
            </ProtectedRoute>
          </Route>

          <Route path="/admin/departments">
            <ProtectedRoute roles={['admin', 'superadmin']}>
              <WithDashboard><AdminDepartmentsPage /></WithDashboard>
            </ProtectedRoute>
          </Route>

          <Route path="/admin/audit-logs">
            <ProtectedRoute roles={['admin', 'superadmin']}>
              <WithDashboard><AdminAuditLogsPage /></WithDashboard>
            </ProtectedRoute>
          </Route>

          <Route path="/admin/student-clearance">
            <ProtectedRoute roles={['admin', 'superadmin']}>
              <WithDashboard><ManageNoDuesPage /></WithDashboard>
            </ProtectedRoute>
          </Route>

          <Route path="/admin/system-control">
            <ProtectedRoute roles={['admin', 'superadmin']}>
              <WithDashboard><AdminDashboard /></WithDashboard>
            </ProtectedRoute>
          </Route>

          <Route path="/admin/analytics">
            <ProtectedRoute roles={['admin', 'superadmin']}>
              <WithDashboard><AnalyticsPage /></WithDashboard>
            </ProtectedRoute>
          </Route>

          {/* Super Admin routes */}
          <Route path="/superadmin/dashboard">
            <ProtectedRoute roles={['superadmin']}>
              <WithDashboard><SuperAdminDashboard /></WithDashboard>
            </ProtectedRoute>
          </Route>

          <Route path="/hod/dashboard">
            <ProtectedRoute roles={['superadmin']}>
              <WithDashboard><SuperAdminDashboard /></WithDashboard>
            </ProtectedRoute>
          </Route>

          <Route path="/hod/student-clearance">
            <ProtectedRoute roles={['superadmin']}>
              <WithDashboard><ManageNoDuesPage /></WithDashboard>
            </ProtectedRoute>
          </Route>

          <Route path="/hod/department-approval">
            <ProtectedRoute roles={['superadmin']}>
              <WithDashboard><HODDepartmentApprovalPage /></WithDashboard>
            </ProtectedRoute>
          </Route>

          <Route path="/superadmin/create-accounts">
            <ProtectedRoute roles={['superadmin']}>
              <WithDashboard><CreateAccountsPage /></WithDashboard>
            </ProtectedRoute>
          </Route>

          <Route path="/superadmin/analytics">
            <ProtectedRoute roles={['superadmin']}>
              <WithDashboard><AnalyticsPage /></WithDashboard>
            </ProtectedRoute>
          </Route>

          <Route path="/superadmin/users">
            <ProtectedRoute roles={['superadmin']}>
              <WithDashboard><SuperAdminUsersPage /></WithDashboard>
            </ProtectedRoute>
          </Route>

          {/* Shared authenticated routes */}
          <Route path="/profile">
            <ProtectedRoute>
              <WithDashboard><ProfilePage /></WithDashboard>
            </ProtectedRoute>
          </Route>

          {/* 404 fallback */}
          <Route>
            <div className="flex flex-col items-center justify-center min-h-screen">
              <h1 className="text-6xl font-bold text-[var(--color-text-secondary)] mb-4">404</h1>
              <p className="text-[var(--color-text-secondary)] mb-6">Page not found</p>
              <a href="/" className="btn-primary">Go Home</a>
            </div>
          </Route>
        </Switch>
      </Suspense>

      {/* Chat widget visible when logged in */}
      {token && user && <ChatWidget />}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--color-card)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
          },
        }}
      />
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
