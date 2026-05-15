import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, RefreshCw, Users } from 'lucide-react';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import { Input, Select } from '../components/ui/FormField';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import StatCard from '../components/ui/StatCard';
import { adminService } from '../services/api';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [remarksByUser, setRemarksByUser] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.listUsers(filter ? { approvalStatus: filter } : {});
      setUsers(data?.users || []);
    } catch (err) {
      setError(err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [filter]);

  const stats = useMemo(() => ({
    total: users.length,
    pending: users.filter((item) => item.approvalStatus === 'PENDING').length,
    approved: users.filter((item) => item.approvalStatus === 'APPROVED').length,
    active: users.filter((item) => item.isActive !== false).length
  }), [users]);

  const reviewUser = async (userId, status) => {
    setMessage('');
    setError('');
    try {
      await adminService.reviewApproval(userId, {
        status,
        remarks: remarksByUser[userId] || ''
      });
      setMessage(`User ${status.toLowerCase()} successfully.`);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const columns = [
    { key: 'fullName', label: 'Full Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'approvalStatus', label: 'Approval Status' },
    { key: 'isActive', label: 'Active', render: (value) => value === false ? 'No' : 'Yes' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => row.approvalStatus === 'PENDING' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 220 }}>
          <Input placeholder="Remarks" value={remarksByUser[row._id] || ''} onChange={(event) => setRemarksByUser((prev) => ({ ...prev, [row._id]: event.target.value }))} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="sm" onClick={() => reviewUser(row._id, 'APPROVED')}>Approve</Button>
            <Button size="sm" variant="danger" onClick={() => reviewUser(row._id, 'REJECTED')}>Reject</Button>
          </div>
        </div>
      ) : '-'
    }
  ];

  return (
    <div className="page-enter">
      <PageHeader
        title="Approval Desk"
        subtitle="Review staff registrations and keep the user list clean"
        icon={ShieldCheck}
        actions={[
          <Button key="refresh" icon={RefreshCw} variant="secondary" onClick={loadUsers}>Refresh</Button>
        ]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 28 }}>
        <StatCard title="Total Users" value={stats.total} gradient="stat-gradient-blue" icon={Users} sub="all roles" />
        <StatCard title="Pending Review" value={stats.pending} gradient="stat-gradient-amber" icon={ShieldCheck} sub="awaiting approval" />
        <StatCard title="Approved" value={stats.approved} gradient="stat-gradient-teal" icon={ShieldCheck} sub="verified users" />
        <StatCard title="Active" value={stats.active} gradient="stat-gradient-violet" icon={Users} sub="currently enabled" />
      </div>

      {(message || error) && (
        <div className="card" style={{ padding: '14px 18px', marginBottom: 18, borderColor: error ? 'rgba(239,68,68,0.3)' : 'var(--neutral-100)' }}>
          <div style={{ color: error ? 'var(--danger-700)' : 'var(--success-700)', fontWeight: 600, fontSize: '0.88rem' }}>{error || message}</div>
        </div>
      )}

      <SectionCard
        title="User Approval Queue"
        subtitle="Filter users and approve or reject pending registrations"
        actions={<Select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">All statuses</option><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option></Select>}
      >
        <DataTable columns={columns} data={users} loading={loading} emptyMessage="No users found" />
      </SectionCard>
    </div>
  );
}
