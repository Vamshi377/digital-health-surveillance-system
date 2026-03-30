import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, CalendarDays, FlaskConical, Stethoscope,
  ClipboardList, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight,
  BedDouble, FileText, Package, ShieldCheck, Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_CONFIG = {
  reception: [
    { label: 'Dashboard',    icon: LayoutDashboard,  to: '/reception' },
    { label: 'Patients',     icon: Users,             to: '/reception/patients' },
    { label: 'Appointments', icon: CalendarDays,      to: '/reception/appointments' },
    { label: 'Queue',        icon: ClipboardList,     to: '/reception/queue' },
    { label: 'Billing',      icon: FileText,          to: '/reception/billing' },
  ],
  nurse: [
    { label: 'Dashboard',    icon: LayoutDashboard,   to: '/nurse' },
    { label: 'Patients',     icon: Users,             to: '/nurse/patients' },
    { label: 'Vitals',       icon: Activity,          to: '/nurse/vitals' },
    { label: 'Tasks',        icon: ClipboardList,     to: '/nurse/tasks' },
    { label: 'Wards',        icon: BedDouble,         to: '/nurse/wards' },
  ],
  lab: [
    { label: 'Dashboard',    icon: LayoutDashboard,   to: '/lab' },
    { label: 'Orders',       icon: FlaskConical,      to: '/lab/orders' },
    { label: 'Results',      icon: FileText,          to: '/lab/results' },
    { label: 'Reports',      icon: BarChart3,         to: '/lab/reports' },
  ],
  doctor: [
    { label: 'Dashboard',    icon: LayoutDashboard,   to: '/doctor' },
    { label: 'My Patients',  icon: Users,             to: '/doctor/patients' },
    { label: 'Consultations',icon: Stethoscope,       to: '/doctor/consultations' },
    { label: 'Appointments', icon: CalendarDays,      to: '/doctor/appointments' },
    { label: 'Lab Orders',   icon: FlaskConical,      to: '/doctor/lab-orders' },
    { label: 'Prescriptions',icon: FileText,          to: '/doctor/prescriptions' },
  ],
  patient: [
    { label: 'My Health',    icon: Activity,          to: '/patient' },
    { label: 'Appointments', icon: CalendarDays,      to: '/patient/appointments' },
    { label: 'Prescriptions',icon: FileText,          to: '/patient/prescriptions' },
    { label: 'Lab Reports',  icon: FlaskConical,      to: '/patient/reports' },
    { label: 'Billing',      icon: FileText,          to: '/patient/billing' },
  ],
  admin: [
    { label: 'Dashboard',    icon: LayoutDashboard,   to: '/admin' },
    { label: 'Staff',        icon: Users,             to: '/admin/staff' },
    { label: 'Departments',  icon: ShieldCheck,       to: '/admin/departments' },
    { label: 'Inventory',    icon: Package,           to: '/admin/inventory' },
    { label: 'Billing',      icon: FileText,          to: '/admin/billing' },
    { label: 'Audit Logs',   icon: ClipboardList,     to: '/admin/audit' },
    { label: 'Settings',     icon: Settings,          to: '/admin/settings' },
  ],
  dmo: [
    { label: 'Overview',     icon: LayoutDashboard,   to: '/dmo' },
    { label: 'OPD/IPD Stats',icon: BarChart3,         to: '/dmo/stats' },
    { label: 'Disease Trends',icon: Activity,         to: '/dmo/trends' },
    { label: 'Departments',  icon: ShieldCheck,       to: '/dmo/departments' },
    { label: 'Reports',      icon: FileText,          to: '/dmo/reports' },
  ],
};

const ROLE_LABELS = {
  reception: 'Reception',
  nurse:     'Nursing',
  lab:       'Laboratory',
  doctor:    'Clinical',
  patient:   'Patient Portal',
  admin:     'Administration',
  dmo:       'DMO Analytics',
};

export default function Sidebar({ collapsed, onToggle }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = NAV_CONFIG[role] ?? [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside style={{
      width: collapsed ? 72 : 'var(--sidebar-width)',
      minHeight: '100vh',
      background: 'var(--surface-sidebar)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width var(--transition-base)',
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      zIndex: 100,
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 0' : '24px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: 36, height: 36,
          background: 'var(--brand-500)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(26,111,240,0.4)',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6L12 2z" fill="white" fillOpacity="0.9"/>
            <path d="M9 12h6M12 9v6" stroke="var(--brand-500)" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        {!collapsed && (
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-serif)' }}>
              MediCore
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {ROLE_LABELS[role]}
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', overflowX: 'hidden' }}>
        {navItems.map((item) => (
          <SidebarLink key={item.to} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* User + Toggle */}
      <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {!collapsed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', marginBottom: 8,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 'var(--radius-md)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--brand-600)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 600, fontSize: '0.8rem', flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name ?? 'User'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
                {user?.email ?? ''}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            gap: collapsed ? 0 : 10,
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: '9px 12px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 'var(--radius-md)',
            color: 'rgba(255,255,255,0.55)',
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            marginBottom: 8,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#fca5a5'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
        >
          <LogOut size={16} />
          {!collapsed && 'Sign Out'}
        </button>

        <button
          onClick={onToggle}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '7px',
            background: 'rgba(255,255,255,0.05)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({ item, collapsed }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to.split('/').length <= 2}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: collapsed ? 0 : 10,
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: '9px 12px',
        marginBottom: 2,
        borderRadius: 'var(--radius-md)',
        color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
        background: isActive ? 'rgba(26,111,240,0.25)' : 'transparent',
        borderLeft: isActive ? '3px solid var(--brand-400)' : '3px solid transparent',
        fontSize: '0.875rem',
        fontWeight: isActive ? 600 : 400,
        transition: 'all var(--transition-fast)',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      })}
      onMouseEnter={e => {
        if (!e.currentTarget.classList.contains('active')) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
        }
      }}
      onMouseLeave={e => {
        if (!e.currentTarget.classList.contains('active')) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
        }
      }}
    >
      <Icon size={18} style={{ flexShrink: 0 }} />
      {!collapsed && item.label}
    </NavLink>
  );
}
