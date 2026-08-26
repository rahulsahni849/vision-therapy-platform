import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import { LoginPage } from './modules/auth/LoginPage';
import { SetPasswordPage } from './modules/auth/SetPasswordPage';
import { AdminDashboard } from './modules/admin/AdminDashboard';
import { PractitionerDashboard } from './modules/practitioner/PractitionerDashboard';
import { PatientDashboard } from './modules/patient/PatientDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  const { user } = useAuthStore();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/set-password" element={<SetPasswordPage />} />

      {/* Protected routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/practitioner/*"
        element={
          <ProtectedRoute requiredRole="PRACTITIONER">
            <PractitionerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/*"
        element={
          <ProtectedRoute requiredRole="PATIENT">
            <PatientDashboard />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={`/${user.role?.toLowerCase() || 'login'}`} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
