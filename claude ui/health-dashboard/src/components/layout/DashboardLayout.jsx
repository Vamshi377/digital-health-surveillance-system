import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="dashboard-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="main-content">
        <Header onMobileToggle={() => setCollapsed(!collapsed)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
