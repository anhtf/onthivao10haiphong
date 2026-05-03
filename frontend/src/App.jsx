import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './stores/authStore';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StudentDashboard from './pages/student/StudentDashboard';
import ExamPage from './pages/student/ExamPage';
import ResultPage from './pages/student/ResultPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ExamEditorPage from './pages/admin/ExamEditorPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import LoadingSpinner from './components/common/LoadingSpinner';

// Route guards
const PrivateRoute = ({ children }) => {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <LoadingSpinner fullScreen />;
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
};

const GuestRoute = ({ children }) => {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <LoadingSpinner fullScreen />;
  if (user) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />;
  return children;
};

export default function App() {
  const { initAuth, isLoading } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <Routes>
      {/* Guest routes */}
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Student routes */}
      <Route path="/dashboard" element={<PrivateRoute><StudentDashboard /></PrivateRoute>} />
      <Route path="/exam/:sessionId" element={<PrivateRoute><ExamPage /></PrivateRoute>} />
      <Route path="/result/:sessionId" element={<PrivateRoute><ResultPage /></PrivateRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/exams/:examId/edit" element={<AdminRoute><ExamEditorPage /></AdminRoute>} />
      <Route path="/admin/exams/:examId/analytics" element={<AdminRoute><AnalyticsPage /></AdminRoute>} />

      {/* Fallback */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
