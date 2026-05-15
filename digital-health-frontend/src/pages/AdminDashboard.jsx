import React, { useState, useEffect } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { Card, StatCard, Button, SectionHeader, Modal, FormField, AlertBanner, LoadingSpinner, EmptyState } from '../components/ui'
import { adminAPI } from '../services/api'
import { Users, UserCheck, Clock, Stethoscope, Plus, RefreshCw, CheckCircle, XCircle, FileClock, Download } from 'lucide-react'

const ROLE_OPTIONS = [
  { value: 'receptionist',           label: 'Receptionist' },
  { value: 'nurse',                  label: 'Nurse' },
  { value: 'lab_technician',         label: 'Lab Technician' },
  { value: 'doctor',                 label: 'Doctor' },
  { value: 'medical_superintendent', label: 'Medical Superintendent' },
  { value: 'hospital_admin',         label: 'Hospital Admin' },
  { value: 'dmo',                    label: 'DMO' },
  { value: 'patient',                label: 'Patient' },
]

const roleColors = {
  hospital_admin: '#00e5a0', receptionist: '#0099ff', nurse: '#f43f5e',
  lab_technician: '#f59e0b', doctor: '#8b5cf6', medical_superintendent: '#06b6d4',
  dmo: '#22d3ee', patient: '#10b981',
}

const approvalBadge = {
  APPROVED: { cls: 'badge badge-green', label: 'Approved' },
  PENDING:  { cls: 'badge badge-amber', label: 'Pending' },
  REJECTED: { cls: 'badge badge-rose',  label: 'Rejected' },
}

export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ fullName: '', email: '', password: '', role: '', patientCode: '' })
  const [createLoading, setCreateLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const [search, setSearch] = useState('')
  const [auditLogs, setAuditLogs] = useState([])
  const [auditLoading, setAuditLoading] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adminAPI.getUsers()
      setUsers(res.data.users || res.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users. Ensure the backend is running.')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAuditLogs = async () => {
    setAuditLoading(true)
    try {
      const res = await adminAPI.getAuditLogs({ limit: 25 })
      setAuditLogs(res.data.logs || [])
    } catch {
      setAuditLogs([])
    } finally {
      setAuditLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchAuditLogs()
  }, [])

  const handleApproval = async (userId, status) => {
    try {
      await adminAPI.updateApproval(userId, status)
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, approvalStatus: status } : u))
      setAlert({ type: 'success', message: `User ${status.toLowerCase()} successfully.` })
    } catch {
      setAlert({ type: 'error', message: 'Failed to update approval status.' })
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreateLoading(true)
    try {
      await adminAPI.createUser(createForm)
      setAlert({ type: 'success', message: 'User created successfully!' })
      setShowCreate(false)
      setCreateForm({ fullName: '', email: '', password: '', role: '', patientCode: '' })
      fetchUsers()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to create user.' })
    } finally {
      setCreateLoading(false)
    }
  }

  const filtered = users.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  )

  const exportUsers = () => {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Approval']
    const rows = filtered.map(u => [u.fullName || '', u.email || '', u.role || '', u.isActive !== false ? 'Active' : 'Inactive', u.approvalStatus || ''])
    const csv = [headers, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'users-export.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const total   = users.length
  const active  = users.filter(u => u.isActive !== false && u.approvalStatus === 'APPROVED').length
  const pending = users.filter(u => u.approvalStatus === 'PENDING').length
  const doctors = users.filter(u => u.role === 'doctor').length

  return (
    <DashboardLayout title="Admin Dashboard" subtitle="Manage users, roles, and system access">
      {alert && <AlertBanner type={alert.type} message={alert.message} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px', marginBottom: '28px' }}>
        <StatCard label="Total Users"      value={loading ? '—' : total}   icon={Users}       accent="var(--accent-primary)" />
        <StatCard label="Active Users"     value={loading ? '—' : active}  icon={UserCheck}   accent="var(--accent-secondary)" />
        <StatCard label="Pending Approval" value={loading ? '—' : pending} icon={Clock}       accent="var(--accent-amber)" />
        <StatCard label="Doctors"          value={loading ? '—' : doctors} icon={Stethoscope} accent="var(--accent-violet)" />
      </div>

      <Card>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <SectionHeader
              title="All Users"
              subtitle={loading ? 'Loading...' : `${filtered.length} of ${total} users`}
            />
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or role..."
            style={{ width: '240px', padding: '8px 14px', fontSize: '0.83rem', minWidth: '220px' }}
          />
          <Button icon={RefreshCw} variant="secondary" size="sm" onClick={fetchUsers}>Refresh</Button>
          <Button icon={Download} variant="secondary" size="sm" onClick={exportUsers}>Export CSV</Button>
          <Button icon={Plus} variant="primary" size="sm" onClick={() => setShowCreate(true)}>Create User</Button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ color: 'var(--accent-rose)', fontSize: '0.875rem', marginBottom: '16px' }}>{error}</p>
            <Button variant="secondary" onClick={fetchUsers} icon={RefreshCw}>Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? 'No users match your search' : 'No users found'}
            subtitle={search ? 'Try a different search term.' : 'Create the first user to get started.'}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Approval</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const ab = approvalBadge[u.approvalStatus] || approvalBadge.PENDING
                  const roleColor = roleColors[u.role] || '#8fa8c8'
                  return (
                    <tr key={u._id}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.fullName || '—'}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className="badge" style={{ background: `${roleColor}15`, color: roleColor, border: `1px solid ${roleColor}30` }}>
                          {u.role?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={u.isActive !== false ? 'badge badge-green' : 'badge badge-muted'}>
                          {u.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td><span className={ab.cls}>{ab.label}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {u.approvalStatus !== 'APPROVED' && (
                            <button
                              onClick={() => handleApproval(u._id, 'APPROVED')}
                              style={{ padding: '4px 10px', background: 'rgba(0,229,160,0.12)', color: 'var(--accent-primary)', border: '1px solid rgba(0,229,160,0.25)', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <CheckCircle size={12} /> Approve
                            </button>
                          )}
                          {u.approvalStatus !== 'REJECTED' && (
                            <button
                              onClick={() => handleApproval(u._id, 'REJECTED')}
                              style={{ padding: '4px 10px', background: 'rgba(244,63,94,0.1)', color: 'var(--accent-rose)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <XCircle size={12} /> Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card style={{ marginTop: '24px' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <SectionHeader title="Audit Logs" subtitle="Recent protected activity across the platform" />
          <Button icon={RefreshCw} variant="secondary" size="sm" onClick={fetchAuditLogs}>Refresh Logs</Button>
        </div>
        {auditLoading ? (
          <LoadingSpinner label="Loading audit logs..." />
        ) : auditLogs.length === 0 ? (
          <EmptyState icon={FileClock} title="No audit logs found" subtitle="Actions like viewing patient history or DMO analytics will appear here." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log._id}>
                    <td>{new Date(log.createdAt).toLocaleString('en-IN')}</td>
                    <td>{log.actor?.fullName || log.actor?.email || 'System'}</td>
                    <td><span className="badge badge-blue">{log.action}</span></td>
                    <td>{log.entityType} · {log.entityId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New User">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <FormField label="Full Name">
              <input value={createForm.fullName} onChange={e => setCreateForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Full name" required />
            </FormField>
            <FormField label="Role">
              <select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))} required>
                <option value="">Select role</option>
                {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Email">
            <input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="user@health.local" required />
          </FormField>
          <FormField label="Password">
            <input type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" required minLength={8} />
          </FormField>
          {createForm.role === 'patient' && (
            <FormField label="Patient Code (link to existing patient record)">
              <input value={createForm.patientCode} onChange={e => setCreateForm(f => ({ ...f, patientCode: e.target.value }))} placeholder="PAT-XXXXXXXX" />
            </FormField>
          )}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button variant="secondary" onClick={() => setShowCreate(false)} type="button">Cancel</Button>
            <Button variant="primary" type="submit" loading={createLoading}>Create User</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}
