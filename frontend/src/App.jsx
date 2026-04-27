import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages - Auth
import LoginPage from './pages/auth/LoginPage';

// Pages - Admin
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminGroups from './pages/admin/AdminGroups';
import AdminFees from './pages/admin/AdminFees';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminChat from './pages/admin/AdminChat';

// Pages - Teacher
import TeacherLayout from './pages/teacher/TeacherLayout';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherChat from './pages/teacher/TeacherChat';
import TeacherGroups from './pages/teacher/TeacherGroups';

// Pages - Student
import StudentLayout from './pages/student/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentChat from './pages/student/StudentChat';
import StudentFees from './pages/student/StudentFees';
import StudentAnnouncements from './pages/student/StudentAnnouncements';

import NotFound from './pages/NotFound';

// ── Route Guards ──────────────────────────────────────────
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role}`} replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (user)    return <Navigate to={`/${user.role}`} replace />;
  return children;
};

const FullPageLoader = () => (
  <div className="min-h-screen bg-surface-50 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center animate-pulse-soft">
        <span className="text-white font-display font-bold text-lg">P</span>
      </div>
      <p className="text-sm text-surface-500 font-medium">Loading PDO Education...</p>
    </div>
  </div>
);

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? `/${user.role}` : '/login'} replace />} />

      {/* Public */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="groups" element={<AdminGroups />} />
        <Route path="fees" element={<AdminFees />} />
        <Route path="announcements" element={<AdminAnnouncements />} />
        <Route path="chat" element={<AdminChat />} />
        <Route path="chat/:groupId" element={<AdminChat />} />
      </Route>

      {/* Teacher */}
      <Route path="/teacher" element={<ProtectedRoute roles={['teacher']}><TeacherLayout /></ProtectedRoute>}>
        <Route index element={<TeacherDashboard />} />
        <Route path="groups" element={<TeacherGroups />} />
        <Route path="chat" element={<TeacherChat />} />
        <Route path="chat/:groupId" element={<TeacherChat />} />
      </Route>

      {/* Student */}
      <Route path="/student" element={<ProtectedRoute roles={['student']}><StudentLayout /></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="chat" element={<StudentChat />} />
        <Route path="fees" element={<StudentFees />} />
        <Route path="announcements" element={<StudentAnnouncements />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '12px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
