import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
import LoginPage          from './pages/LoginPage';
import ReceptionDashboard from './pages/ReceptionDashboard';
import NurseDashboard     from './pages/NurseDashboard';
import LabDashboard       from './pages/LabDashboard';
import DoctorDashboard    from './pages/DoctorDashboard';
import PatientDashboard   from './pages/PatientDashboard';
import AdminDashboard     from './pages/AdminDashboard';
import DMODashboard       from './pages/DMODashboard';

function PrivateRoutes() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        {/* Reception */}
        <Route path="/reception"              element={<ReceptionDashboard />} />
        <Route path="/reception/register"     element={<ReceptionDashboard />} />
        <Route path="/reception/appointments" element={<ReceptionDashboard />} />

        {/* Nurse */}
        <Route path="/nurse"         element={<NurseDashboard />} />
        <Route path="/nurse/queue"   element={<NurseDashboard />} />
        <Route path="/nurse/vitals"  element={<NurseDashboard />} />
        <Route path="/nurse/records" element={<NurseDashboard />} />

        {/* Lab */}
        <Route path="/lab"         element={<LabDashboard />} />
        <Route path="/lab/queue"   element={<LabDashboard />} />
        <Route path="/lab/upload"  element={<LabDashboard />} />

        {/* Doctor */}
        <Route path="/doctor"               element={<DoctorDashboard />} />
        <Route path="/doctor/patients"      element={<DoctorDashboard />} />
        <Route path="/doctor/diagnosis"     element={<DoctorDashboard />} />
        <Route path="/doctor/prescriptions" element={<DoctorDashboard />} />

        {/* Patient */}
        <Route path="/patient"                  element={<PatientDashboard />} />
        <Route path="/patient/notifications"    element={<PatientDashboard />} />
        <Route path="/patient/records"          element={<PatientDashboard />} />
        <Route path="/patient/prescriptions"    element={<PatientDashboard />} />
        <Route path="/patient/reports"          element={<PatientDashboard />} />

        {/* Admin */}
        <Route path="/admin"           element={<AdminDashboard />} />
        <Route path="/admin/approvals" element={<AdminDashboard />} />
        <Route path="/admin/users"     element={<AdminDashboard />} />

        {/* DMO */}
        <Route path="/dmo"            element={<DMODashboard />} />
        <Route path="/dmo/diseases"   element={<DMODashboard />} />
        <Route path="/dmo/facilities" element={<DMODashboard />} />

        {/* Default redirect based on role */}
        <Route path="*" element={<RoleRedirect />} />
      </Route>
    </Routes>
  );
}

function RoleRedirect() {
  const { user } = useAuth();
  const map = {
    reception: '/reception',
    nurse:     '/nurse',
    lab:       '/lab',
    doctor:    '/doctor',
    patient:   '/patient',
    admin:     '/admin',
    dmo:       '/dmo',
  };
  return <Navigate to={map[user?.role] || '/doctor'} replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*" element={<PrivateRoutes />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
