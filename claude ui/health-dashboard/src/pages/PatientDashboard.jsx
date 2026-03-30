import React, { useState } from 'react';
import { Bell, FileText, Pill, Activity, Calendar, Download, Eye, Heart } from 'lucide-react';
import { SectionCard, Badge, Avatar } from '../components/ui/index';
import { useAuth } from '../context/AuthContext';

const notifications = [
  { id: 1, type: 'report',   title: 'Lab Report Ready', desc: 'Your CBC report has been uploaded by the lab.', time: '5 min ago',  read: false, color: '#F59E0B' },
  { id: 2, type: 'appt',    title: 'Appointment Reminder', desc: 'Follow-up with Dr. Mehta tomorrow at 10:00 AM.', time: '2 hrs ago', read: false, color: '#7C3AED' },
  { id: 3, type: 'rx',      title: 'New Prescription', desc: 'Dr. Mehta has issued a new prescription for you.', time: 'Yesterday', read: true,  color: '#10B981' },
  { id: 4, type: 'general', title: 'Health Tip', desc: 'Remember to take your medications on time and drink plenty of water.', time: '2 days ago', read: true, color: '#3B82F6' },
];

const records = [
  { date: '2026-03-20', type: 'OPD Visit',    doctor: 'Dr. Mehta',   dept: 'General',    diagnosis: 'Viral Fever', status: 'completed' },
  { date: '2026-02-15', type: 'Lab Test',     doctor: 'Lab (Ravi)',  dept: 'Pathology',  diagnosis: 'CBC Normal',  status: 'completed' },
  { date: '2026-01-10', type: 'OPD Visit',    doctor: 'Dr. Singh',   dept: 'Cardiology', diagnosis: 'Hypertension monitoring', status: 'completed' },
];

const prescriptions = [
  { date: '2026-03-20', doctor: 'Dr. Mehta', medicines: ['Paracetamol 500mg 3×/day', 'Cetirizine 10mg OD', 'Vitamin C 500mg OD'], followUp: '2026-03-27', status: 'active' },
  { date: '2026-01-10', doctor: 'Dr. Singh', medicines: ['Amlodipine 5mg OD', 'Aspirin 75mg OD'], followUp: '2026-02-10', status: 'completed' },
];

const labReports = [
  { id: 'LB-1003', date: '2026-03-20', test: 'CBC + ESR',     result: 'Normal', file: 'CBC_March2026.pdf' },
  { id: 'LB-0921', date: '2026-02-15', test: 'Lipid Profile', result: 'Borderline', file: 'Lipid_Feb2026.pdf' },
];

export default function PatientDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [unreadCount, setUnreadCount] = useState(notifications.filter(n => !n.read).length);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'notifications', label: `Notifications${unreadCount ? ` (${unreadCount})` : ''}` },
    { id: 'records', label: 'Health Records' },
    { id: 'prescriptions', label: 'Prescriptions' },
    { id: 'reports', label: 'Lab Reports' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>My Health Dashboard</h1>
        <p>Your personal health summary and records</p>
      </div>

      {/* Profile card */}
      <div className="card" style={{ padding: '24px', marginBottom: 24, background: 'linear-gradient(135deg, var(--teal-950) 0%, var(--teal-800) 100%)', border: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{
            width: 70, height: 70, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 24,
            border: '3px solid rgba(255,255,255,0.3)',
          }}>{user?.avatar || 'AS'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: 'white', fontFamily: "'DM Serif Display',serif", fontSize: 22 }}>{user?.name || 'Arjun Singh'}</div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 4 }}>
              Patient ID: HP-2401 · Age: 34 yrs · Blood Group: O+
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Last Visit', value: '20 Mar 2026' },
              { label: 'Next Follow-up', value: '27 Mar 2026' },
              { label: 'Active Rx', value: '1' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 18, fontFamily: "'DM Serif Display',serif" }}>{s.value}</div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--neutral-100)', borderRadius: 10, padding: 4, overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', whiteSpace: 'nowrap',
            background: tab === t.id ? 'white' : 'transparent',
            color: tab === t.id ? 'var(--teal-800)' : 'var(--text-muted)',
            fontWeight: tab === t.id ? 700 : 500, fontSize: 13, cursor: 'pointer',
            boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.2s', fontFamily: 'var(--font-body)',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Quick vitals */}
          <SectionCard title="Latest Vitals" subtitle="Recorded 20 Mar 2026">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Blood Pressure', value: '120/80', unit: 'mmHg', color: '#F43F5E', icon: Heart },
                { label: 'Pulse Rate', value: '76', unit: 'bpm', color: '#F59E0B', icon: Activity },
                { label: 'Temperature', value: '98.6', unit: '°F', color: '#F97316', icon: Activity },
                { label: 'SpO₂', value: '98', unit: '%', color: '#10B981', icon: Activity },
              ].map((v, i) => (
                <div key={i} style={{
                  background: v.color + '10', border: `1.5px solid ${v.color}25`,
                  borderRadius: 10, padding: '12px 14px',
                }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{v.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: v.color, fontFamily: "'DM Serif Display',serif", marginTop: 4 }}>{v.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.unit}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Upcoming */}
          <SectionCard title="Upcoming Appointments" subtitle="Scheduled visits">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { date: '27 Mar', time: '10:00 AM', doctor: 'Dr. Mehta', dept: 'General Medicine', type: 'Follow-Up' },
                { date: '15 Apr', time: '02:30 PM', doctor: 'Dr. Singh', dept: 'Cardiology', type: 'Check-Up' },
              ].map((appt, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 14, alignItems: 'center',
                  padding: '12px 14px', background: 'var(--teal-50)',
                  borderRadius: 10, border: '1px solid var(--teal-100, #b3e8f5)',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: 'var(--teal-800)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    color: 'white', flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{appt.date.split(' ')[0]}</div>
                    <div style={{ fontSize: 9, opacity: 0.75 }}>{appt.date.split(' ')[1]}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{appt.doctor}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{appt.dept} · {appt.time}</div>
                  </div>
                  <Badge variant="info">{appt.type}</Badge>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Recent diagnosis */}
          <SectionCard title="Diagnosis Summary" subtitle="Last consultation">
            <div style={{ padding: '14px 16px', background: 'var(--neutral-50)', borderRadius: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>20 MAR 2026 · DR. MEHTA</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Viral Fever with Myalgia</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>ICD-10: J11.1 · Rest advised, adequate hydration, follow up in 7 days.</div>
            </div>
            <button className="btn btn-secondary btn-sm"><Eye size={13}/> View Full Record</button>
          </SectionCard>

          {/* Recent prescription */}
          <SectionCard title="Active Prescription" subtitle="Current medications">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {prescriptions[0].medicines.map((med, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', background: 'var(--neutral-50)',
                  borderRadius: 8, fontSize: 13,
                }}>
                  <Pill size={14} color="#7C3AED" />
                  <span style={{ fontWeight: 500 }}>{med}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
              By {prescriptions[0].doctor} · Follow-up: {prescriptions[0].followUp}
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'notifications' && (
        <SectionCard title="Notifications" subtitle="Your health updates and alerts">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {notifications.map((n, i) => (
              <div key={n.id} style={{
                display: 'flex', gap: 14, padding: '14px 16px',
                background: n.read ? 'transparent' : n.color + '08',
                borderRadius: 10,
                border: n.read ? 'none' : `1px solid ${n.color}20`,
                marginBottom: 4,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: n.color + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {n.type === 'report' ? <FileText size={16} color={n.color} />
                    : n.type === 'appt' ? <Calendar size={16} color={n.color} />
                    : n.type === 'rx' ? <Pill size={16} color={n.color} />
                    : <Bell size={16} color={n.color} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: n.read ? 500 : 700, fontSize: 14 }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{n.time}</div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{n.desc}</div>
                </div>
                {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.color, flexShrink: 0, marginTop: 6 }} />}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === 'records' && (
        <SectionCard title="Health Records" subtitle="Your complete visit history">
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Date</th><th>Visit Type</th><th>Doctor</th><th>Department</th><th>Diagnosis</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.date}</td>
                    <td><Badge variant="neutral">{r.type}</Badge></td>
                    <td style={{ fontWeight: 500, fontSize: 13 }}>{r.doctor}</td>
                    <td style={{ fontSize: 13 }}>{r.dept}</td>
                    <td style={{ fontSize: 13 }}>{r.diagnosis}</td>
                    <td><Badge variant="success">{r.status}</Badge></td>
                    <td><button className="btn btn-ghost btn-sm"><Eye size={12}/> View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {tab === 'prescriptions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {prescriptions.map((rx, i) => (
            <SectionCard key={i} title={`Prescription — ${rx.date}`} subtitle={`By ${rx.doctor}`}
              action={<Badge variant={rx.status === 'active' ? 'success' : 'neutral'}>{rx.status}</Badge>}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rx.medicines.map((med, j) => (
                  <div key={j} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 14px', background: 'var(--neutral-50)',
                    borderRadius: 8, fontSize: 13,
                  }}>
                    <Pill size={14} color="#7C3AED" />
                    <span style={{ fontWeight: 500 }}>{med}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Follow-up: <strong>{rx.followUp}</strong></div>
                <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}><Download size={12}/> Download PDF</button>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      {tab === 'reports' && (
        <SectionCard title="Lab Reports" subtitle="Uploaded diagnostic reports">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {labReports.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '14px 16px', background: 'var(--neutral-50)',
                borderRadius: 12, border: '1px solid var(--border-color)',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: '#FEF3C7', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FileText size={20} color="#F59E0B" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{r.test}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.id} · {r.date} · {r.file}</div>
                </div>
                <Badge variant={r.result === 'Normal' ? 'success' : 'warning'}>{r.result}</Badge>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm"><Eye size={12}/> View</button>
                  <button className="btn btn-ghost btn-sm"><Download size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
