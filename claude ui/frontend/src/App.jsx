import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import LoginPage          from './pages/LoginPage';
import ReceptionDashboard from './pages/ReceptionDashboard';
import NurseDashboard     from './pages/NurseDashboard';
import LabDashboard       from './pages/LabDashboard';
import DoctorDashboard    from './pages/DoctorDashboard';
import PatientDashboard   from './pages/PatientDashboard';
import AdminDashboard     from './pages/AdminDashboard';
import DMODashboard       from './pages/DMODashboard';

import DashboardShell from './components/layout/DashboardShell';

const ROLE_ROUTES = {
  reception: '/reception',
  nurse:     '/nurse',
  lab:       '/lab',
  doctor:    '/doctor',
  patient:   '/patient',
  admin:     '/admin',
  dmo:       '/dmo',
};

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) return <AppLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={ROLE_ROUTES[role] ?? '/login'} replace />;
  }
  return children;
}

function AppLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--surface-app)',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '3px solid var(--neutral-200)',
        borderTopColor: 'var(--brand-500)',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function RoleRedirect() {
  const { role } = useAuth();
  return <Navigate to={ROLE_ROUTES[role] ?? '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={
        <ProtectedRoute><RoleRedirect /></ProtectedRoute>
      } />

      <Route path="/reception" element={
        <ProtectedRoute allowedRoles={['reception','admin']}>
          <DashboardShell><ReceptionDashboard /></DashboardShell>
        </ProtectedRoute>
      } />

      <Route path="/nurse" element={
        <ProtectedRoute allowedRoles={['nurse','admin']}>
          <DashboardShell><NurseDashboard /></DashboardShell>
        </ProtectedRoute>
      } />

      <Route path="/lab" element={
        <ProtectedRoute allowedRoles={['lab','admin']}>
          <DashboardShell><LabDashboard /></DashboardShell>
        </ProtectedRoute>
      } />

      <Route path="/doctor" element={
        <ProtectedRoute allowedRoles={['doctor','admin']}>
          <DashboardShell><DoctorDashboard /></DashboardShell>
        </ProtectedRoute>
      } />

      <Route path="/patient" element={
        <ProtectedRoute allowedRoles={['patient']}>
          <DashboardShell><PatientDashboard /></DashboardShell>
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardShell><AdminDashboard /></DashboardShell>
        </ProtectedRoute>
      } />

      <Route path="/dmo" element={
        <ProtectedRoute allowedRoles={['dmo','admin']}>
          <DashboardShell><DMODashboard /></DashboardShell>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
