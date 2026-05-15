import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import LoginPage         from './pages/LoginPage'
import RegisterPage      from './pages/RegisterPage'
import AdminDashboard    from './pages/AdminDashboard'
import ReceptionDashboard from './pages/ReceptionDashboard'
import NurseDashboard    from './pages/NurseDashboard'
import LabDashboard      from './pages/LabDashboard'
import DoctorDashboard   from './pages/DoctorDashboard'
import DMODashboard      from './pages/DMODashboard'
import PatientDashboard  from './pages/PatientDashboard'
import NotFound          from './pages/NotFound'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          {/* Public routes */}
          <Route path="/"         element={<Navigate to="/login" replace />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Admin / Hospital Admin / Medical Superintendent */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['hospital_admin', 'medical_superintendent']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Reception */}
          <Route path="/reception" element={
            <ProtectedRoute allowedRoles={['receptionist', 'hospital_admin']}>
              <ReceptionDashboard />
            </ProtectedRoute>
          } />

          {/* Nurse */}
          <Route path="/nurse" element={
            <ProtectedRoute allowedRoles={['nurse', 'hospital_admin']}>
              <NurseDashboard />
            </ProtectedRoute>
          } />

          {/* Lab */}
          <Route path="/lab" element={
            <ProtectedRoute allowedRoles={['lab_technician', 'hospital_admin']}>
              <LabDashboard />
            </ProtectedRoute>
          } />

          {/* Doctor */}
          <Route path="/doctor" element={
            <ProtectedRoute allowedRoles={['doctor', 'hospital_admin']}>
              <DoctorDashboard />
            </ProtectedRoute>
          } />

          {/* DMO */}
          <Route path="/dmo" element={
            <ProtectedRoute allowedRoles={['dmo']}>
              <DMODashboard />
            </ProtectedRoute>
          } />

          {/* Patient */}
          <Route path="/patient" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientDashboard />
            </ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
