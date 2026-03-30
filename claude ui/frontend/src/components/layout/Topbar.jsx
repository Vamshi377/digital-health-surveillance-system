import React, { useState } from 'react';
import { Bell, Search, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ sidebarCollapsed, onMenuToggle }) {
  const { user, role } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
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
      boxShadow: 'var(--shadow-xs)',
    }}>
      {/* Search */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--neutral-50)',
        border: '1px solid var(--neutral-200)',
        borderRadius: 'var(--radius-md)',
        padding: '8px 14px',
        maxWidth: 360,
      }}>
        <Search size={16} color="var(--neutral-400)" style={{ flexShrink: 0 }} />
        <input
          placeholder="Search patients, records…"
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: '0.875rem',
            color: 'var(--neutral-700)',
            width: '100%',
          }}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Date */}
      <div style={{ color: 'var(--neutral-400)', fontSize: '0.8rem', whiteSpace: 'nowrap', display: 'var(--date-display, flex)' }}>
        {dateStr}
      </div>

      {/* Bell */}
      <button style={{
        position: 'relative',
        background: 'var(--neutral-50)',
        border: '1px solid var(--neutral-200)',
        borderRadius: 'var(--radius-md)',
        width: 38, height: 38,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--neutral-600)',
        transition: 'all var(--transition-fast)',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-50)'; e.currentTarget.style.borderColor = 'var(--brand-200)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--neutral-50)'; e.currentTarget.style.borderColor = 'var(--neutral-200)'; }}
      >
        <Bell size={16} />
        <span style={{
          position: 'absolute', top: 6, right: 6,
          width: 8, height: 8,
          background: 'var(--danger-500)',
          borderRadius: '50%',
          border: '2px solid white',
          animation: 'pulse-ring 2s infinite',
        }} />
      </button>

      {/* Avatar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer',
      }}>
        <div style={{
          width: 36, height: 36,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: '0.875rem',
          boxShadow: 'var(--shadow-brand)',
        }}>
          {user?.name?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--neutral-800)' }}>
            {user?.name ?? 'User'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--neutral-400)', textTransform: 'capitalize' }}>
            {role}
          </div>
        </div>
      </div>
    </header>
  );
}
