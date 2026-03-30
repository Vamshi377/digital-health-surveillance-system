import React from 'react';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar() {
  const { user, role } = useAuth();
  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <header style={{
      height: 'var(--topbar-height)',
      background: 'var(--surface-card)',
      borderBottom: '1px solid var(--neutral-100)',
      display: 'flex',
      alignItems: 'center',
      paddingInline: 24,
      gap: 16,
      position: 'sticky',
      top: 0,
      zIndex: 90,
      boxShadow: 'var(--shadow-xs)'
    }}>
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--neutral-50)',
        border: '1px solid var(--neutral-200)',
        borderRadius: 'var(--radius-md)',
        padding: '8px 14px',
        maxWidth: 360
      }}>
        <Search size={16} color="var(--neutral-400)" style={{ flexShrink: 0 }} />
        <input
          placeholder="Search records or patient code..."
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: '0.875rem',
            color: 'var(--neutral-700)',
            width: '100%'
          }}
        />
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ color: 'var(--neutral-400)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{dateStr}</div>

      <button style={{
        position: 'relative',
        background: 'var(--neutral-50)',
        border: '1px solid var(--neutral-200)',
        borderRadius: 'var(--radius-md)',
        width: 38,
        height: 38,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--neutral-600)'
      }}>
        <Bell size={16} />
        <span style={{
          position: 'absolute',
          top: 6,
          right: 6,
          width: 8,
          height: 8,
          background: 'var(--danger-500)',
          borderRadius: '50%',
          border: '2px solid white'
        }} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.875rem',
          boxShadow: 'var(--shadow-brand)'
        }}>
          {user?.fullName?.[0]?.toUpperCase() || 'U'}
        </div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--neutral-800)' }}>{user?.fullName || 'User'}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--neutral-400)', textTransform: 'capitalize' }}>{role}</div>
        </div>
      </div>
    </header>
  );
}
