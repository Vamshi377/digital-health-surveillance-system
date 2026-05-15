import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div style={{
          width: '40px', height: '40px',
          border: '3px solid var(--border-subtle)',
          borderTopColor: 'var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard
    const roleRedirect = {
      hospital_admin: '/admin',
      medical_superintendent: '/admin',
      receptionist:   '/reception',
      nurse:          '/nurse',
      lab_technician: '/lab',
      doctor:         '/doctor',
      dmo:            '/dmo',
      patient:        '/patient',
    }
    return <Navigate to={roleRedirect[user.role] || '/login'} replace />
  }

  return children
}
