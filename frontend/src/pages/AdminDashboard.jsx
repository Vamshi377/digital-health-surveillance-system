import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, RefreshCw, UserPlus, Users } from 'lucide-react';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import FormField, { Input, Select, Textarea } from '../components/ui/FormField';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import StatCard from '../components/ui/StatCard';
import { adminService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const EMPTY_CREATE_FORM = {
  fullName: '',
  email: '',
  password: '',
  role: 'patient',
  patientCode: ''
};

export default function AdminDashboard() {
  const { role } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [remarksByUser, setRemarksByUser] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [saving, setSaving] = useState(false);

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

  const createUser = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await adminService.createUser(createForm);
      setCreateOpen(false);
      setCreateForm(EMPTY_CREATE_FORM);
      setMessage('User created successfully.');
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
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
        title="Admin & Approval Desk"
        subtitle="Review registrations and manage approved user accounts"
        icon={ShieldCheck}
        actions={[
          <Button key="refresh" icon={RefreshCw} variant="secondary" onClick={loadUsers}>Refresh</Button>,
          role !== 'medical_superintendent' ? <Button key="create" icon={UserPlus} onClick={() => setCreateOpen(true)}>Create User</Button> : null
        ].filter(Boolean)}
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
        subtitle="Filter users and review registrations"
        actions={<Select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">All statuses</option><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option></Select>}
      >
        <DataTable columns={columns} data={users} loading={loading} emptyMessage="No users found" />
      </SectionCard>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Approved User"
        width={520}
        footer={[
          <Button key="cancel" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>,
          <Button key="save" loading={saving} onClick={createUser}>Create</Button>
        ]}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Full Name" required><Input value={createForm.fullName} onChange={(event) => setCreateForm((prev) => ({ ...prev, fullName: event.target.value }))} /></FormField>
          <FormField label="Email" required><Input value={createForm.email} onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))} /></FormField>
          <FormField label="Password" required><Input type="password" value={createForm.password} onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))} /></FormField>
          <FormField label="Role" required>
            <Select value={createForm.role} onChange={(event) => setCreateForm((prev) => ({ ...prev, role: event.target.value }))}>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
              <option value="lab_technician">Lab Technician</option>
              <option value="receptionist">Receptionist</option>
              <option value="hospital_admin">Hospital Admin</option>
              <option value="medical_superintendent">Medical Superintendent</option>
              <option value="dmo">DMO</option>
            </Select>
          </FormField>
          {createForm.role === 'patient' && (
            <FormField label="Patient Code" required style={{ gridColumn: '1 / -1' }}>
              <Input value={createForm.patientCode} onChange={(event) => setCreateForm((prev) => ({ ...prev, patientCode: event.target.value }))} placeholder="PAT-XXXX" />
            </FormField>
          )}
          <FormField label="Notes" hint="Approved users are created directly; role-specific registration details are not collected here." style={{ gridColumn: '1 / -1' }}>
            <Textarea value="Created through admin console" readOnly />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
