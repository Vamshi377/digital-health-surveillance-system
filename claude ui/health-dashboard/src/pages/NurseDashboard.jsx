import React, { useState } from 'react';
import { Activity, Heart, Thermometer, Droplets, Wind, Users, CheckCircle2 } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import { SectionCard, Badge, Avatar } from '../components/ui/index';

const queue = [
  { id: 'HP-2401', name: 'Arjun Singh',  age: 34, dept: 'General',  priority: 'normal',  vitals: false },
  { id: 'HP-2402', name: 'Meena Kumari', age: 58, dept: 'Cardiology',priority: 'urgent',  vitals: false },
  { id: 'HP-2403', name: 'Ravi Shankar', age: 22, dept: 'Ortho',     priority: 'normal',  vitals: true  },
  { id: 'HP-2404', name: 'Sunita Devi',  age: 45, dept: 'Gynaecology',priority: 'normal', vitals: false },
  { id: 'HP-2405', name: 'Deepak Verma', age: 67, dept: 'ENT',       priority: 'high',    vitals: true  },
];

const priorityMap = {
  normal: { label: 'Normal', variant: 'neutral' },
  high:   { label: 'High',   variant: 'warning' },
  urgent: { label: 'Urgent', variant: 'danger' },
};

export default function NurseDashboard() {
  const [tab, setTab] = useState('queue');
  const [vitals, setVitals] = useState({
    patientId: '', bp_sys: '', bp_dia: '', pulse: '',
    temp: '', spo2: '', rr: '', weight: '', height: '', notes: '',
  });
  const [saved, setSaved] = useState(false);

  const handleVitals = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Nurse Dashboard</h1>
        <p>Manage patient queue, record vitals, and update medical records</p>
      </div>

      <div className="stat-grid stagger" style={{ marginBottom: 28 }}>
        <StatCard icon={Users}        label="In Queue"       value="12"  delta={-5}  color="#3B82F6" />
        <StatCard icon={Activity}     label="Vitals Pending" value="5"   delta={0}   color="#F59E0B" />
        <StatCard icon={CheckCircle2} label="Completed"      value="19"  delta={15}  color="#10B981" />
        <StatCard icon={Heart}        label="Critical Cases" value="2"   delta={100} color="#F43F5E" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--neutral-100)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[{id:'queue',label:'Patient Queue'},{id:'vitals',label:'Enter Vitals'},{id:'records',label:'Medical Record'}].map(t => (
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

      {tab === 'queue' && (
        <SectionCard title="Nurse Queue" subtitle="Patients pending vitals and assessment">
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Token</th><th>Patient</th><th>Age</th><th>Department</th><th>Priority</th><th>Vitals</th><th>Action</th></tr>
              </thead>
              <tbody>
                {queue.map((p, i) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, color: 'var(--teal-700)', fontSize: 16 }}>#{String(i+1).padStart(2,'0')}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={p.name} size={30} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.age} yrs</td>
                    <td><Badge variant="info">{p.dept}</Badge></td>
                    <td><Badge variant={priorityMap[p.priority].variant}>{priorityMap[p.priority].label}</Badge></td>
                    <td>
                      {p.vitals
                        ? <span style={{ color: '#10B981', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={13}/> Done</span>
                        : <span style={{ color: '#F59E0B', fontWeight: 600, fontSize: 12 }}>Pending</span>
                      }
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => setTab('vitals')}>Record Vitals</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {tab === 'vitals' && (
        <SectionCard title="Record Patient Vitals" subtitle="Enter and save vital signs for the selected patient">
          {saved && (
            <div style={{ padding: '12px 16px', borderRadius: 8, background: '#D1FAE5', border: '1px solid #6EE7B7', color: '#065F46', marginBottom: 20, fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} /> Vitals saved successfully!
            </div>
          )}
          <form onSubmit={handleVitals}>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>Select Patient</label>
              <select value={vitals.patientId} onChange={e => setVitals(v => ({...v, patientId: e.target.value}))} required>
                <option value="">Choose patient from queue...</option>
                {queue.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
              </select>
            </div>

            {/* Vitals Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
              {[
                { icon: Heart, label: 'Blood Pressure', color: '#F43F5E', content: (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="number" placeholder="Systolic" value={vitals.bp_sys} onChange={e => setVitals(v => ({...v, bp_sys: e.target.value}))} style={{ flex:1 }} />
                    <span style={{ alignSelf: 'center', color: 'var(--text-muted)', fontWeight: 700 }}>/</span>
                    <input type="number" placeholder="Diastolic" value={vitals.bp_dia} onChange={e => setVitals(v => ({...v, bp_dia: e.target.value}))} style={{ flex:1 }} />
                  </div>
                )},
                { icon: Activity, label: 'Pulse Rate (bpm)', color: '#F59E0B', content: (
                  <input type="number" placeholder="e.g. 72" value={vitals.pulse} onChange={e => setVitals(v => ({...v, pulse: e.target.value}))} />
                )},
                { icon: Thermometer, label: 'Temperature (°F)', color: '#F97316', content: (
                  <input type="number" placeholder="e.g. 98.6" step="0.1" value={vitals.temp} onChange={e => setVitals(v => ({...v, temp: e.target.value}))} />
                )},
                { icon: Droplets, label: 'SpO2 (%)', color: '#3B82F6', content: (
                  <input type="number" placeholder="e.g. 98" value={vitals.spo2} onChange={e => setVitals(v => ({...v, spo2: e.target.value}))} />
                )},
                { icon: Wind, label: 'Respiratory Rate', color: '#10B981', content: (
                  <input type="number" placeholder="breaths/min" value={vitals.rr} onChange={e => setVitals(v => ({...v, rr: e.target.value}))} />
                )},
                { icon: Activity, label: 'Weight (kg)', color: '#7C3AED', content: (
                  <input type="number" placeholder="e.g. 65" step="0.1" value={vitals.weight} onChange={e => setVitals(v => ({...v, weight: e.target.value}))} />
                )},
              ].map((item, i) => (
                <div key={i} style={{
                  background: item.color + '08',
                  border: `1.5px solid ${item.color}20`,
                  borderRadius: 12, padding: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <item.icon size={16} color={item.color} />
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>{item.label}</label>
                  </div>
                  {item.content}
                </div>
              ))}
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>Clinical Notes</label>
              <textarea placeholder="Any additional observations..." value={vitals.notes} onChange={e => setVitals(v => ({...v, notes: e.target.value}))} />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary"><Activity size={15}/> Save Vitals</button>
              <button type="button" className="btn btn-secondary">Clear</button>
            </div>
          </form>
        </SectionCard>
      )}

      {tab === 'records' && (
        <SectionCard title="Medical Record Form" subtitle="Document patient symptoms and initial assessment">
          <form onSubmit={handleVitals}>
            <div className="form-grid">
              <div className="form-group">
                <label>Patient</label>
                <select required>
                  <option value="">Select patient</option>
                  {queue.map(p => <option key={p.id}>{p.name} ({p.id})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Visit Date</label>
                <input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="form-group span-2">
                <label>Chief Complaint</label>
                <input type="text" placeholder="Primary reason for visit..." />
              </div>
              <div className="form-group span-2">
                <label>History of Present Illness</label>
                <textarea placeholder="Describe the onset, duration, severity, and character of symptoms..." />
              </div>
              <div className="form-group">
                <label>Past Medical History</label>
                <textarea placeholder="Existing conditions, past surgeries..." style={{ minHeight: 80 }} />
              </div>
              <div className="form-group">
                <label>Current Medications</label>
                <textarea placeholder="List current medications and dosages..." style={{ minHeight: 80 }} />
              </div>
              <div className="form-group">
                <label>Allergies</label>
                <input type="text" placeholder="Known allergies..." />
              </div>
              <div className="form-group">
                <label>Family History</label>
                <input type="text" placeholder="Relevant family medical history..." />
              </div>
            </div>
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary">Save Record</button>
              <button type="button" className="btn btn-secondary">Save Draft</button>
            </div>
          </form>
        </SectionCard>
      )}
    </div>
  );
}
