import React, { useState } from 'react';
import { ShieldCheck, UserCheck, UserX, Clock, Users, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import { SectionCard, Badge, Avatar } from '../components/ui/index';

const initPending = [
  { id: 'U-101', name: 'Dr. Kavya Reddy',    email: 'kavya@district.gov.in', role: 'doctor',    dept: 'Neurology',    applied: '2026-03-26', facility: 'District Hospital Kozhikode', docs: true },
  { id: 'U-102', name: 'Nurse Asha Thomas',   email: 'asha.t@chc.gov.in',    role: 'nurse',     dept: 'General',      applied: '2026-03-26', facility: 'CHC Vadakara', docs: true },
  { id: 'U-103', name: 'Rahul Nair',          email: 'rahul.n@lab.gov.in',   role: 'lab',       dept: 'Pathology',    applied: '2026-03-25', facility: 'PHC Kalpetta', docs: false },
  { id: 'U-104', name: 'Smt. Preethi Kumar',  email: 'preethi@dmo.gov.in',   role: 'reception', dept: 'Front Desk',   applied: '2026-03-24', facility: 'District Hospital Malappuram', docs: true },
  { id: 'U-105', name: 'Dr. Arun Suresh',     email: 'arun.s@gov.in',        role: 'doctor',    dept: 'Paediatrics',  applied: '2026-03-23', facility: 'CHC Perambra', docs: true },
];

const roleColors = {
  doctor: '#7C3AED', nurse: '#3B82F6', lab: '#F59E0B', reception: '#10B981', admin: '#F43F5E',
};
const roleBadge = { doctor: 'violet', nurse: 'info', lab: 'warning', reception: 'success', admin: 'danger' };

export default function AdminDashboard() {
  const [pending, setPending] = useState(initPending);
  const [tab, setTab] = useState('pending');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [log, setLog] = useState([]);

  const approve = (id) => {
    const user = pending.find(u => u.id === id);
    setLog(l => [{ ...user, action: 'approved', time: new Date().toLocaleTimeString() }, ...l]);
    setPending(p => p.filter(u => u.id !== id));
  };

  const reject = () => {
    const user = pending.find(u => u.id === rejectModal);
    setLog(l => [{ ...user, action: 'rejected', reason: rejectReason, time: new Date().toLocaleTimeString() }, ...l]);
    setPending(p => p.filter(u => u.id !== rejectModal));
    setRejectModal(null);
    setRejectReason('');
  };

  const allUsers = [
    { name: 'Dr. Mehta',   role: 'doctor',    facility: 'District Hospital', status: 'active', joined: '2025-01-15' },
    { name: 'Anita Devi',  role: 'nurse',     facility: 'CHC Vadakara',      status: 'active', joined: '2025-03-20' },
    { name: 'Ravi Kumar',  role: 'lab',       facility: 'PHC Kalpetta',      status: 'active', joined: '2025-02-08' },
    { name: 'Priya Sharma',role: 'reception', facility: 'District Hospital', status: 'inactive', joined: '2024-11-01' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Manage user registrations and system access control</p>
      </div>

      <div className="stat-grid stagger" style={{ marginBottom: 28 }}>
        <StatCard icon={Clock}        label="Pending Approvals" value={pending.length} delta={null} color="#F59E0B" />
        <StatCard icon={UserCheck}    label="Approved Today"    value={log.filter(l=>l.action==='approved').length} delta={null} color="#10B981" />
        <StatCard icon={UserX}        label="Rejected Today"    value={log.filter(l=>l.action==='rejected').length} delta={null} color="#F43F5E" />
        <StatCard icon={Users}        label="Total Active Users" value="47" delta={8} color="#0A5C7A" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--neutral-100)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[
          { id: 'pending', label: `Pending Approvals${pending.length ? ` (${pending.length})` : ''}` },
          { id: 'users', label: 'All Users' },
          { id: 'log', label: 'Activity Log' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none',
            background: tab === t.id ? 'white' : 'transparent',
            color: tab === t.id ? 'var(--teal-800)' : 'var(--text-muted)',
            fontWeight: tab === t.id ? 700 : 500, fontSize: 13, cursor: 'pointer',
            boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.2s', fontFamily: 'var(--font-body)',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'pending' && (
        <>
          {pending.length === 0 ? (
            <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
              <CheckCircle2 size={48} color="#10B981" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-secondary)' }}>All caught up!</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>No pending approvals at this time.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {pending.map(u => (
                <div key={u.id} className="card" style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: (roleColors[u.role] || '#0A5C7A') + '20',
                      border: `2px solid ${roleColors[u.role] || '#0A5C7A'}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: roleColors[u.role], fontWeight: 700, fontSize: 14, flexShrink: 0,
                    }}>{u.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>

                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{u.name}</span>
                        <Badge variant={roleBadge[u.role] || 'neutral'}>{u.role}</Badge>
                        {!u.docs && <Badge variant="danger"><AlertTriangle size={10}/> Docs Missing</Badge>}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                        {u.email} · {u.dept} · {u.facility}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        Applied: {u.applied} · ID: {u.id}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                      <button
                        className="btn btn-sm"
                        style={{ background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7', display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => approve(u.id)}
                      >
                        <UserCheck size={14}/> Approve
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{ background: '#FFE4E6', color: '#9F1239', border: '1px solid #FECDD3', display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => setRejectModal(u.id)}
                      >
                        <UserX size={14}/> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'users' && (
        <SectionCard title="All System Users" subtitle="Manage active accounts">
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Name</th><th>Role</th><th>Facility</th><th>Joined</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {allUsers.map((u, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={u.name} size={30} />
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</span>
                      </div>
                    </td>
                    <td><Badge variant={roleBadge[u.role] || 'neutral'}>{u.role}</Badge></td>
                    <td style={{ fontSize: 13 }}>{u.facility}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.joined}</td>
                    <td><Badge variant={u.status === 'active' ? 'success' : 'neutral'}>{u.status}</Badge></td>
                    <td><button className="btn btn-ghost btn-sm">Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {tab === 'log' && (
        <SectionCard title="Activity Log" subtitle="Recent approval actions">
          {log.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 14 }}>
              No actions taken yet in this session.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {log.map((l, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, alignItems: 'center',
                  padding: '12px 16px',
                  background: l.action === 'approved' ? '#F0FDF4' : '#FFF1F2',
                  borderRadius: 10,
                  border: `1px solid ${l.action === 'approved' ? '#BBF7D0' : '#FECDD3'}`,
                }}>
                  {l.action === 'approved'
                    ? <CheckCircle2 size={18} color="#10B981" />
                    : <XCircle size={18} color="#F43F5E" />}
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{l.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}> · {l.role} at {l.facility}</span>
                    {l.reason && <div style={{ fontSize: 12, color: '#9F1239', marginTop: 2 }}>Reason: {l.reason}</div>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.time}</div>
                  <Badge variant={l.action === 'approved' ? 'success' : 'danger'}>{l.action}</Badge>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 28, width: 420,
            boxShadow: 'var(--shadow-xl)', animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>Reject User Application</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>
              Please provide a reason for rejection. This will be communicated to the applicant.
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>Rejection Reason</label>
              <textarea
                placeholder="e.g. Incomplete documents, Invalid credentials..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                style={{ minHeight: 80 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={reject}><UserX size={14}/> Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
