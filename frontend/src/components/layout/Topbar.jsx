import React, { useMemo, useState } from 'react';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function Topbar() {
  const { user, role } = useAuth();
  const [noticeOpen, setNoticeOpen] = useState(false);
  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const notices = useMemo(() => {
    const common = [
      { title: 'Navigation', text: 'Sidebar sections now switch between focused views for each role.' },
      { title: 'Refresh', text: 'Use the Refresh button on each page after creating or reviewing records.' }
    ];

    const byRole = {
      receptionist: [
        { title: 'Patients', text: 'Use the Patients section to search or register a patient profile.' },
        { title: 'Appointments', text: 'Use the Appointments section to book visits after selecting a patient.' }
      ],
      nurse: [
        { title: 'Queue', text: 'Select a queue row first, then open the Vitals section to save a medical record.' }
      ],
      lab_technician: [
        { title: 'Reports', text: 'Pick a queued medical record before uploading JSON values and a lab file.' }
      ],
      doctor: [
        { title: 'Patients', text: 'Open a row in the review queue to load the patient summary and history.' },
        { title: 'Review', text: 'Use the Review section to submit diagnosis, medicines, advice, and follow-up.' }
      ],
      patient: [
        { title: 'Reports', text: 'Switch between reports and prescriptions using the sidebar sections.' }
      ],
      medical_superintendent: [
        { title: 'Approvals', text: 'Review staff registrations that require superintendent approval.' }
      ],
      dmo: [
        { title: 'Statistics', text: 'Use Statistics and Clusters sections to focus analytics views.' }
      ]
    };

    return [...common, ...(byRole[role] || [])];
  }, [role]);

  return (
    <>
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
            placeholder="Use sidebar sections to navigate role actions..."
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

        <button
          onClick={() => setNoticeOpen(true)}
          style={{
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
          }}
        >
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

      <Modal
        open={noticeOpen}
        onClose={() => setNoticeOpen(false)}
        title="Quick Actions Guide"
        width={560}
        footer={[<Button key="close" onClick={() => setNoticeOpen(false)}>Close</Button>]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {notices.map((notice) => (
            <div key={notice.title} className="card" style={{ padding: '14px 16px', boxShadow: 'none', border: '1px solid var(--neutral-100)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--neutral-800)', marginBottom: 4 }}>{notice.title}</div>
              <div style={{ fontSize: '0.84rem', color: 'var(--neutral-500)', lineHeight: 1.6 }}>{notice.text}</div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
