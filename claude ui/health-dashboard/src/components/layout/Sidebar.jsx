import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, FlaskConical, Stethoscope,
  User, ShieldCheck, BarChart3, ChevronLeft, ChevronRight, LogOut,
  Activity, Bell, Settings, Heart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../ui/Logo';

const navByRole = {
  reception: [
    { label: 'Dashboard',     icon: LayoutDashboard, path: '/reception' },
    { label: 'Register Patient', icon: Users,        path: '/reception/register' },
    { label: 'Appointments',  icon: Calendar,        path: '/reception/appointments' },
  ],
  nurse: [
    { label: 'Dashboard',    icon: LayoutDashboard,  path: '/nurse' },
    { label: 'Patient Queue',icon: Users,            path: '/nurse/queue' },
    { label: 'Vitals Entry', icon: Activity,         path: '/nurse/vitals' },
    { label: 'Medical Records', icon: Heart,         path: '/nurse/records' },
  ],
  lab: [
    { label: 'Dashboard',    icon: LayoutDashboard,  path: '/lab' },
    { label: 'Lab Queue',    icon: FlaskConical,     path: '/lab/queue' },
    { label: 'Upload Report',icon: Activity,         path: '/lab/upload' },
  ],
  doctor: [
    { label: 'Dashboard',    icon: LayoutDashboard,  path: '/doctor' },
    { label: 'Patient Summary', icon: Users,         path: '/doctor/patients' },
    { label: 'Diagnosis',    icon: Stethoscope,      path: '/doctor/diagnosis' },
    { label: 'Prescriptions',icon: Heart,            path: '/doctor/prescriptions' },
  ],
  patient: [
    { label: 'My Dashboard', icon: LayoutDashboard,  path: '/patient' },
    { label: 'Notifications',icon: Bell,             path: '/patient/notifications' },
    { label: 'Health Records',icon: Activity,        path: '/patient/records' },
    { label: 'Prescriptions',icon: Heart,            path: '/patient/prescriptions' },
    { label: 'Lab Reports',  icon: FlaskConical,     path: '/patient/reports' },
  ],
  admin: [
    { label: 'Dashboard',    icon: LayoutDashboard,  path: '/admin' },
    { label: 'User Approvals',icon: ShieldCheck,     path: '/admin/approvals' },
    { label: 'All Users',    icon: Users,            path: '/admin/users' },
  ],
  dmo: [
    { label: 'Analytics',    icon: BarChart3,        path: '/dmo' },
    { label: 'Disease Insights', icon: Activity,     path: '/dmo/diseases' },
    { label: 'Facilities',   icon: LayoutDashboard,  path: '/dmo/facilities' },
  ],
};

const roleLabels = {
  reception: 'Receptionist',
  nurse:     'Nurse',
  lab:       'Lab Technician',
  doctor:    'Doctor',
  patient:   'Patient',
  admin:     'Administrator',
  dmo:       'District Medical Officer',
};

const roleColors = {
  reception: '#10B981',
  nurse:     '#3B82F6',
  lab:       '#F59E0B',
  doctor:    '#7C3AED',
  patient:   '#1EB5F0',
  admin:     '#F43F5E',
  dmo:       '#0A5C7A',
};

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = navByRole[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside style={{
      width: collapsed ? 72 : 260,
      minHeight: '100vh',
      background: 'var(--bg-sidebar)',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflow: 'hidden',
      transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      flexShrink: 0,
      zIndex: 100,
    }}>
      {/* Header */}
      <div style={{
        padding: collapsed ? '20px 0' : '20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        minHeight: 72,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                <rect x="17" y="5" width="6" height="30" rx="3" fill="white" />
                <rect x="5" y="17" width="30" height="6" rx="3" fill="white" />
              </svg>
            </div>
            <div>
              <div style={{ color: 'white', fontFamily: "'DM Serif Display',serif", fontSize: 16, lineHeight: 1 }}>HealthPulse</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, letterSpacing: '0.06em', marginTop: 2 }}>HEALTH RECORDS</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
              <rect x="17" y="5" width="6" height="30" rx="3" fill="white" />
              <rect x="5" y="17" width="30" height="6" rx="3" fill="white" />
            </svg>
          </div>
        )}
        <button onClick={onToggle} style={{
          background: 'rgba(255,255,255,0.08)',
          border: 'none',
          color: 'rgba(255,255,255,0.6)',
          width: 28, height: 28, borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all 0.2s',
        }}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* User Profile */}
      {!collapsed && user && (
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: roleColors[user.role] || '#0A5C7A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 13, flexShrink: 0,
            }}>{user.avatar}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: 'white', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{
                fontSize: 11, fontWeight: 500,
                color: roleColors[user.role] || '#1EB5F0',
                marginTop: 1,
              }}>{roleLabels[user.role]}</div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {nav.map((item) => (
          <NavItem key={item.path} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={handleLogout} style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: collapsed ? '10px 0' : '10px 20px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.5)',
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          borderRadius: 0,
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#F43F5E'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
        >
          <LogOut size={16} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

function NavItem({ item, collapsed }) {
  const { icon: Icon, label, path } = item;
  return (
    <NavLink
      to={path}
      end
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: collapsed ? '10px 0' : '10px 20px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: 0,
        margin: '1px 0',
        color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
        fontWeight: isActive ? 600 : 400,
        fontSize: 14,
        textDecoration: 'none',
        background: isActive ? 'rgba(30,181,240,0.15)' : 'transparent',
        borderRight: isActive ? '3px solid #1EB5F0' : '3px solid transparent',
        transition: 'all 0.15s',
        position: 'relative',
      })}
    >
      <Icon size={18} style={{ flexShrink: 0 }} />
      {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>}
      {collapsed && (
        <span style={{
          position: 'absolute',
          left: 72,
          background: '#0A3D52',
          color: 'white',
          padding: '5px 10px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 200,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }} className="tooltip">{label}</span>
      )}
    </NavLink>
  );
}
