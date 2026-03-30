import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar  from './Topbar';

export default function DashboardShell({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? 72 : 260;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-app)' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <div style={{
        marginLeft: sidebarWidth,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        transition: 'margin-left var(--transition-base)',
        minWidth: 0,
      }}>
        <Topbar sidebarCollapsed={collapsed} />
        <main style={{
          flex: 1,
          padding: '28px 28px 40px',
          overflowX: 'hidden',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
