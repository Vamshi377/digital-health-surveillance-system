import React, { useState } from 'react';
import { Bell, Search, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const roleColors = {
  reception: '#10B981',
  nurse:     '#3B82F6',
  lab:       '#F59E0B',
  doctor:    '#7C3AED',
  patient:   '#1EB5F0',
  admin:     '#F43F5E',
  dmo:       '#0A5C7A',
};

export default function Header({ onMobileToggle }) {
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const color = roleColors[user?.role] || '#0A5C7A';

  return (
    <header style={{
      height: 64,
      background: 'white',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 16,
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      {/* Mobile menu */}
      <button onClick={onMobileToggle} style={{
        display: 'none',
        background: 'none',
        border: 'none',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        padding: 4,
      }} className="mobile-menu-btn">
        <Menu size={22} />
      </button>

      {/* Search */}
      <div style={{
        flex: 1,
        maxWidth: 420,
        position: 'relative',
      }}>
        <Search size={15} style={{
          position: 'absolute', left: 12, top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-muted)',
          pointerEvents: 'none',
        }} />
        <input
          type="text"
          placeholder="Search patients, records..."
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px 8px 36px',
            border: '1.5px solid var(--border-color)',
            borderRadius: 999,
            fontSize: 13,
            background: 'var(--neutral-50)',
            color: 'var(--text-primary)',
            transition: 'all 0.2s',
          }}
          onFocus={e => {
            e.target.style.background = 'white';
            e.target.style.borderColor = 'var(--teal-600)';
            e.target.style.boxShadow = '0 0 0 3px rgba(14,122,163,0.1)';
          }}
          onBlur={e => {
            e.target.style.background = 'var(--neutral-50)';
            e.target.style.borderColor = 'var(--border-color)';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Notifications */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => setNotifOpen(!notifOpen)} style={{
          width: 38, height: 38,
          borderRadius: '50%',
          background: 'var(--neutral-100)',
          border: '1.5px solid var(--border-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text-secondary)',
          position: 'relative',
        }}>
          <Bell size={16} />
          <span style={{
            position: 'absolute', top: 6, right: 7,
            width: 8, height: 8, borderRadius: '50%',
            background: '#F43F5E',
            border: '1.5px solid white',
          }} />
        </button>

        {notifOpen && (
          <div style={{
            position: 'absolute', top: 48, right: 0,
            width: 320, background: 'white',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-color)',
            zIndex: 200, overflow: 'hidden',
            animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
              <span style={{ fontSize: 11, color: 'var(--teal-700)', fontWeight: 600, cursor: 'pointer' }}>Mark all read</span>
            </div>
            {[
              { title: 'New lab report ready', time: '5 min ago', dot: '#F59E0B' },
              { title: 'Patient Arjun Singh checked in', time: '12 min ago', dot: '#10B981' },
              { title: 'Appointment reminder: 3PM', time: '1 hr ago', dot: '#7C3AED' },
            ].map((n, i) => (
              <div key={i} style={{
                padding: '12px 16px',
                borderBottom: i < 2 ? '1px solid var(--border-color)' : 'none',
                display: 'flex', gap: 10, alignItems: 'flex-start',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--neutral-50)'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.dot, marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 700, fontSize: 13,
        }}>{user?.avatar || 'U'}</div>
        <div style={{ display: 'none' }} className="header-user-info">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{user?.email}</div>
        </div>
      </div>
    </header>
  );
}
