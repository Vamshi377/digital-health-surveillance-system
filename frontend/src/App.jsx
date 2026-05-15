import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardShell from './components/layout/DashboardShell';
import { useAuth } from './context/AuthContext';
import AdminDashboard from './pages/AdminDashboard';
import DMODashboard from './pages/DMODashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import LabDashboard from './pages/LabDashboard';
import LoginPage from './pages/LoginPage';
import NurseDashboard from './pages/NurseDashboard';
import PatientDashboard from './pages/PatientDashboard';
import PatientRegisterPage from './pages/PatientRegisterPage';
import ReceptionDashboard from './pages/ReceptionDashboard';

const ROLE_ROUTES = {
  receptionist: '/reception',
  nurse: '/nurse',
  lab_technician: '/lab',
  doctor: '/doctor',
  patient: '/patient',
  hospital_admin: '/admin',
  dmo: '/dmo'
};

function AppLoader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--surface-app)'
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        border: '3px solid var(--neutral-200)',
        borderTopColor: 'var(--brand-500)',
        animation: 'spin 0.7s linear infinite'
      }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) return <AppLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={ROLE_ROUTES[role] || '/login'} replace />;
  }
  return children;
}

function RoleRedirect() {
  const { role } = useAuth();
  return <Navigate to={ROLE_ROUTES[role] || '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/patient-register" element={<PatientRegisterPage />} />
      <Route path="/" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
      <Route path="/reception" element={<ProtectedRoute allowedRoles={['receptionist']}><DashboardShell><ReceptionDashboard /></DashboardShell></ProtectedRoute>} />
      <Route path="/reception/patients" element={<ProtectedRoute allowedRoles={['receptionist']}><DashboardShell><ReceptionDashboard /></DashboardShell></ProtectedRoute>} />
      <Route path="/reception/appointments" element={<ProtectedRoute allowedRoles={['receptionist']}><DashboardShell><ReceptionDashboard /></DashboardShell></ProtectedRoute>} />

      <Route path="/nurse" element={<ProtectedRoute allowedRoles={['nurse']}><DashboardShell><NurseDashboard /></DashboardShell></ProtectedRoute>} />
      <Route path="/nurse/queue" element={<ProtectedRoute allowedRoles={['nurse']}><DashboardShell><NurseDashboard /></DashboardShell></ProtectedRoute>} />
      <Route path="/nurse/vitals" element={<ProtectedRoute allowedRoles={['nurse']}><DashboardShell><NurseDashboard /></DashboardShell></ProtectedRoute>} />

      <Route path="/lab" element={<ProtectedRoute allowedRoles={['lab_technician']}><DashboardShell><LabDashboard /></DashboardShell></ProtectedRoute>} />
      <Route path="/lab/queue" element={<ProtectedRoute allowedRoles={['lab_technician']}><DashboardShell><LabDashboard /></DashboardShell></ProtectedRoute>} />
      <Route path="/lab/reports" element={<ProtectedRoute allowedRoles={['lab_technician']}><DashboardShell><LabDashboard /></DashboardShell></ProtectedRoute>} />

      <Route path="/doctor" element={<ProtectedRoute allowedRoles={['doctor']}><DashboardShell><DoctorDashboard /></DashboardShell></ProtectedRoute>} />
      <Route path="/doctor/patients" element={<ProtectedRoute allowedRoles={['doctor']}><DashboardShell><DoctorDashboard /></DashboardShell></ProtectedRoute>} />
      <Route path="/doctor/diagnosis" element={<ProtectedRoute allowedRoles={['doctor']}><DashboardShell><DoctorDashboard /></DashboardShell></ProtectedRoute>} />

      <Route path="/patient" element={<ProtectedRoute allowedRoles={['patient']}><DashboardShell><PatientDashboard /></DashboardShell></ProtectedRoute>} />
      <Route path="/patient/reports" element={<ProtectedRoute allowedRoles={['patient']}><DashboardShell><PatientDashboard /></DashboardShell></ProtectedRoute>} />
      <Route path="/patient/prescriptions" element={<ProtectedRoute allowedRoles={['patient']}><DashboardShell><PatientDashboard /></DashboardShell></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute allowedRoles={['hospital_admin']}><DashboardShell><AdminDashboard /></DashboardShell></ProtectedRoute>} />
      <Route path="/admin/approvals" element={<ProtectedRoute allowedRoles={['hospital_admin']}><DashboardShell><AdminDashboard /></DashboardShell></ProtectedRoute>} />

      <Route path="/dmo" element={<ProtectedRoute allowedRoles={['dmo']}><DashboardShell><DMODashboard /></DashboardShell></ProtectedRoute>} />
      <Route path="/dmo/trends" element={<ProtectedRoute allowedRoles={['dmo']}><DashboardShell><DMODashboard /></DashboardShell></ProtectedRoute>} />
      <Route path="/dmo/clusters" element={<ProtectedRoute allowedRoles={['dmo']}><DashboardShell><DMODashboard /></DashboardShell></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
