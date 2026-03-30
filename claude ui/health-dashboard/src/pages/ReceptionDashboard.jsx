import React, { useState } from 'react';
import { Users, Calendar, Clock, CheckCircle2, Plus, Search } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import { SectionCard, Badge, Avatar } from '../components/ui/index';

const mockPatients = [
  { id: 'HP-2401', name: 'Arjun Singh',    age: 34, phone: '9876543210', dept: 'General', status: 'waiting',   time: '09:15' },
  { id: 'HP-2402', name: 'Meena Kumari',   age: 58, phone: '9988776655', dept: 'Cardiology', status: 'with-doctor', time: '09:30' },
  { id: 'HP-2403', name: 'Ravi Shankar',   age: 22, phone: '9123456789', dept: 'Ortho', status: 'completed', time: '09:45' },
  { id: 'HP-2404', name: 'Sunita Devi',    age: 45, phone: '9001234567', dept: 'Gynaecology', status: 'waiting', time: '10:00' },
  { id: 'HP-2405', name: 'Deepak Verma',   age: 67, phone: '9765432100', dept: 'ENT', status: 'checked-in', time: '10:15' },
];

const statusMap = {
  'waiting':     { label: 'Waiting',     variant: 'warning' },
  'with-doctor': { label: 'With Doctor', variant: 'info' },
  'completed':   { label: 'Completed',   variant: 'success' },
  'checked-in':  { label: 'Checked In',  variant: 'neutral' },
};

const depts = ['General', 'Cardiology', 'Ortho', 'Gynaecology', 'ENT', 'Neurology', 'Paediatrics', 'Dermatology'];

export default function ReceptionDashboard() {
  const [tab, setTab] = useState('queue');
  const [form, setForm] = useState({
    firstName:'', lastName:'', dob:'', gender:'', phone:'', address:'',
    dept:'', appointmentDate:'', appointmentTime:'', reason:'',
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const handleRegister = (e) => {
    e.preventDefault();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setForm({ firstName:'', lastName:'', dob:'', gender:'', phone:'', address:'', dept:'', appointmentDate:'', appointmentTime:'', reason:'' });
  };

  return (
    <div>
      <div className="page-header">
        <h1>Reception Dashboard</h1>
        <p>Manage patient check-ins and appointment scheduling</p>
      </div>

      <div className="stat-grid stagger" style={{ marginBottom: 28 }}>
        <StatCard icon={Users}    label="Today's Patients"   value="47"  delta={12}  color="#10B981" />
        <StatCard icon={Clock}    label="Currently Waiting"  value="8"   delta={-3}  color="#F59E0B" />
        <StatCard icon={Calendar} label="Appointments Today" value="38"  delta={5}   color="#0A5C7A" />
        <StatCard icon={CheckCircle2} label="Completed"      value="31"  delta={8}   color="#7C3AED" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--neutral-100)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[{id:'queue', label:'Today\'s Queue'}, {id:'register', label:'Register Patient'}, {id:'appointment', label:'New Appointment'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none',
            background: tab === t.id ? 'white' : 'transparent',
            color: tab === t.id ? 'var(--teal-800)' : 'var(--text-muted)',
            fontWeight: tab === t.id ? 700 : 500,
            fontSize: 13, cursor: 'pointer',
            boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.2s',
            fontFamily: 'var(--font-body)',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'queue' && (
        <SectionCard
          title="Patient Queue"
          subtitle="Real-time check-in status"
          action={
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Search patient..." style={{ paddingLeft: 30, width: 180, padding: '7px 10px 7px 30px', fontSize: 13 }} />
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setTab('register')}>
                <Plus size={14} /> New Patient
              </button>
            </div>
          }
        >
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Patient ID</th><th>Name</th><th>Age</th><th>Department</th>
                  <th>Check-in</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {mockPatients.map(p => {
                  const s = statusMap[p.status];
                  return (
                    <tr key={p.id}>
                      <td><code style={{ fontSize: 12, background: 'var(--teal-50)', padding: '2px 6px', borderRadius: 4, color: 'var(--teal-800)' }}>{p.id}</code></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar name={p.name} size={30} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td>{p.age} yrs</td>
                      <td><Badge variant="info">{p.dept}</Badge></td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.time} AM</td>
                      <td><Badge variant={s.variant}>{s.label}</Badge></td>
                      <td>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>View</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {tab === 'register' && (
        <SectionCard title="Register New Patient" subtitle="Fill in patient details for registration">
          {showSuccess && (
            <div style={{
              padding: '12px 16px', borderRadius: 8, background: '#D1FAE5',
              border: '1px solid #6EE7B7', color: '#065F46',
              marginBottom: 20, fontWeight: 600, fontSize: 14,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <CheckCircle2 size={16} /> Patient registered successfully!
            </div>
          )}
          <form onSubmit={handleRegister}>
            <div className="form-grid">
              <div className="form-group">
                <label>First Name</label>
                <input type="text" placeholder="e.g. Arjun" value={form.firstName} onChange={e => setForm(f => ({...f, firstName: e.target.value}))} required />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" placeholder="e.g. Singh" value={form.lastName} onChange={e => setForm(f => ({...f, lastName: e.target.value}))} required />
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" value={form.dob} onChange={e => setForm(f => ({...f, dob: e.target.value}))} required />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select value={form.gender} onChange={e => setForm(f => ({...f, gender: e.target.value}))} required>
                  <option value="">Select gender</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" placeholder="10-digit mobile" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} required />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select value={form.dept} onChange={e => setForm(f => ({...f, dept: e.target.value}))} required>
                  <option value="">Select department</option>
                  {depts.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group span-2">
                <label>Address</label>
                <input type="text" placeholder="Full address" value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} />
              </div>
            </div>
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary">Register Patient</button>
              <button type="button" className="btn btn-secondary" onClick={() => setForm({ firstName:'', lastName:'', dob:'', gender:'', phone:'', address:'', dept:'', appointmentDate:'', appointmentTime:'', reason:'' })}>Clear</button>
            </div>
          </form>
        </SectionCard>
      )}

      {tab === 'appointment' && (
        <SectionCard title="Create Appointment" subtitle="Schedule a new patient appointment">
          <form onSubmit={handleRegister}>
            <div className="form-grid">
              <div className="form-group">
                <label>Patient ID / Name</label>
                <input type="text" placeholder="Search patient..." required />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select required>
                  <option value="">Select department</option>
                  {depts.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Appointment Date</label>
                <input type="date" required />
              </div>
              <div className="form-group">
                <label>Appointment Time</label>
                <input type="time" required />
              </div>
              <div className="form-group">
                <label>Doctor</label>
                <select>
                  <option>Dr. Mehta (General)</option>
                  <option>Dr. Singh (Cardiology)</option>
                  <option>Dr. Patel (Ortho)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Visit Type</label>
                <select>
                  <option>OPD Consultation</option>
                  <option>Follow-Up</option>
                  <option>Emergency</option>
                  <option>Procedure</option>
                </select>
              </div>
              <div className="form-group span-2">
                <label>Chief Complaint / Reason</label>
                <textarea placeholder="Brief reason for visit..." style={{ minHeight: 80 }} />
              </div>
            </div>
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary"><Calendar size={15} /> Book Appointment</button>
              <button type="button" className="btn btn-secondary">Clear</button>
            </div>
          </form>
        </SectionCard>
      )}
    </div>
  );
}
