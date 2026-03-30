import React, { useState } from 'react';
import { Stethoscope, FileText, Pill, Calendar, Users, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import { SectionCard, Badge, Avatar } from '../components/ui/index';

const patients = [
  { id: 'HP-2401', name: 'Arjun Singh',  age: 34, gender: 'M', dept: 'General',    vitals: { bp: '120/80', pulse: 76, temp: 98.6, spo2: 98 }, complaint: 'Fever and body ache for 3 days', status: 'waiting' },
  { id: 'HP-2402', name: 'Meena Kumari', age: 58, gender: 'F', dept: 'Cardiology',  vitals: { bp: '150/95', pulse: 88, temp: 99.1, spo2: 95 }, complaint: 'Chest pain and breathlessness', status: 'in-progress' },
  { id: 'HP-2403', name: 'Ravi Shankar', age: 22, gender: 'M', dept: 'Ortho',       vitals: { bp: '118/76', pulse: 72, temp: 98.4, spo2: 99 }, complaint: 'Right knee pain after sports injury', status: 'waiting' },
];

const rxTemplate = { drug: '', dose: '', route: 'Oral', freq: 'Once daily', duration: '5 days', instructions: '' };

export default function DoctorDashboard() {
  const [tab, setTab] = useState('patients');
  const [selected, setSelected] = useState(null);
  const [diagnosis, setDiagnosis] = useState({ icd10: '', primaryDx: '', differentials: '', notes: '' });
  const [prescriptions, setPrescriptions] = useState([{ ...rxTemplate }]);
  const [followUp, setFollowUp] = useState('');
  const [saved, setSaved] = useState('');

  const addRx = () => setPrescriptions(p => [...p, { ...rxTemplate }]);
  const removeRx = (i) => setPrescriptions(p => p.filter((_, idx) => idx !== i));
  const updateRx = (i, field, val) => setPrescriptions(p => p.map((rx, idx) => idx === i ? { ...rx, [field]: val } : rx));

  const handleSave = (e) => {
    e.preventDefault();
    setSaved('Diagnosis and prescription saved!');
    setTimeout(() => setSaved(''), 3000);
  };

  const vitalColor = (key, val) => {
    if (key === 'spo2' && val < 96) return '#F43F5E';
    if (key === 'pulse' && (val > 100 || val < 60)) return '#F59E0B';
    return '#10B981';
  };

  return (
    <div>
      <div className="page-header">
        <h1>Doctor Dashboard</h1>
        <p>Review patient summaries, record diagnoses and prescriptions</p>
      </div>

      <div className="stat-grid stagger" style={{ marginBottom: 28 }}>
        <StatCard icon={Users}       label="Today's Patients" value="14"  delta={8}   color="#7C3AED" />
        <StatCard icon={Stethoscope} label="Consultations Done" value="9" delta={12}  color="#10B981" />
        <StatCard icon={Pill}        label="Prescriptions"    value="31"  delta={5}   color="#F59E0B" />
        <StatCard icon={Calendar}    label="Follow-Ups Due"   value="6"   delta={-20} color="#3B82F6" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--neutral-100)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[{id:'patients',label:'Patient Summary'},{id:'diagnosis',label:'Diagnosis'},{id:'prescription',label:'Prescription'}].map(t => (
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

      {tab === 'patients' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {patients.map(p => (
            <div key={p.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'stretch' }}>
                {/* Color bar */}
                <div style={{ width: 5, background: p.status === 'in-progress' ? 'var(--teal-600)' : 'var(--neutral-200)', flexShrink: 0 }} />
                <div style={{ flex: 1, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <Avatar name={p.name} size={46} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {p.id} · {p.age} yrs · {p.gender === 'M' ? 'Male' : 'Female'} · {p.dept}
                        </div>
                        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)', background: 'var(--neutral-50)', padding: '5px 10px', borderRadius: 6, display: 'inline-block' }}>
                          <span style={{ fontWeight: 600 }}>Chief Complaint:</span> {p.complaint}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Badge variant={p.status === 'in-progress' ? 'info' : 'warning'}>
                        {p.status === 'in-progress' ? 'In Progress' : 'Waiting'}
                      </Badge>
                      <button className="btn btn-primary btn-sm" onClick={() => { setSelected(p); setTab('diagnosis'); }}>
                        Consult
                      </button>
                    </div>
                  </div>

                  {/* Vitals Row */}
                  <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Blood Pressure', value: p.vitals.bp, unit: 'mmHg', key: 'bp' },
                      { label: 'Pulse',          value: p.vitals.pulse, unit: 'bpm',  key: 'pulse' },
                      { label: 'Temperature',    value: p.vitals.temp, unit: '°F',   key: 'temp' },
                      { label: 'SpO₂',           value: p.vitals.spo2, unit: '%',    key: 'spo2' },
                    ].map(v => (
                      <div key={v.key} style={{
                        background: 'var(--neutral-50)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8, padding: '8px 14px', minWidth: 90,
                      }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{v.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: vitalColor(v.key, v.value), marginTop: 2 }}>{v.value}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{v.unit}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'diagnosis' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <SectionCard title="Diagnosis Form" subtitle={selected ? `For ${selected.name} · ${selected.id}` : 'Select a patient first'}>
            {saved && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#D1FAE5', border: '1px solid #6EE7B7', color: '#065F46', marginBottom: 16, fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={14} /> {saved}
              </div>
            )}
            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {!selected && (
                  <div className="form-group">
                    <label>Select Patient</label>
                    <select onChange={e => setSelected(patients.find(p => p.id === e.target.value))}>
                      <option value="">Choose patient</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label>ICD-10 Code</label>
                  <input type="text" placeholder="e.g. J11.1" value={diagnosis.icd10} onChange={e => setDiagnosis(d => ({...d, icd10: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>Primary Diagnosis</label>
                  <input type="text" placeholder="e.g. Viral fever with myalgia" value={diagnosis.primaryDx} onChange={e => setDiagnosis(d => ({...d, primaryDx: e.target.value}))} required />
                </div>
                <div className="form-group">
                  <label>Differential Diagnoses</label>
                  <textarea placeholder="List alternative diagnoses..." value={diagnosis.differentials} onChange={e => setDiagnosis(d => ({...d, differentials: e.target.value}))} style={{ minHeight: 70 }} />
                </div>
                <div className="form-group">
                  <label>Clinical Notes</label>
                  <textarea placeholder="Examination findings, clinical reasoning..." value={diagnosis.notes} onChange={e => setDiagnosis(d => ({...d, notes: e.target.value}))} style={{ minHeight: 80 }} />
                </div>
                <div className="form-group">
                  <label>Follow-Up Date</label>
                  <input type="date" value={followUp} onChange={e => setFollowUp(e.target.value)} />
                </div>
              </div>
              <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary">Save Diagnosis</button>
                <button type="button" className="btn btn-secondary" onClick={() => setTab('prescription')}>Next: Prescription →</button>
              </div>
            </form>
          </SectionCard>

          {/* Patient info panel */}
          {selected && (
            <SectionCard title="Patient Details" subtitle="Reference information">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
                <Avatar name={selected.name} size={48} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{selected.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{selected.id} · {selected.age} yrs · {selected.dept}</div>
                </div>
              </div>
              <div style={{ background: 'var(--neutral-50)', borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Vitals Summary</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {Object.entries(selected.vitals).map(([k, v]) => (
                    <div key={k} style={{ background: 'white', borderRadius: 8, padding: '8px 12px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k.toUpperCase()}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: vitalColor(k, v) }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 16, padding: '12px 16px', background: '#FEF3C7', borderRadius: 8, border: '1px solid #FDE68A' }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: '#92400E', marginBottom: 4 }}>Chief Complaint</div>
                <div style={{ fontSize: 13, color: '#78350F' }}>{selected.complaint}</div>
              </div>
            </SectionCard>
          )}
        </div>
      )}

      {tab === 'prescription' && (
        <SectionCard title="Prescription Form" subtitle="Write medications for the patient">
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {selected && (
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Patient: <strong>{selected.name}</strong> · {selected.id}
                </span>
              )}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={addRx}><Plus size={13}/> Add Medicine</button>
          </div>

          {prescriptions.map((rx, i) => (
            <div key={i} style={{
              background: 'var(--neutral-50)', borderRadius: 12, padding: 16, marginBottom: 12,
              border: '1.5px solid var(--border-color)', position: 'relative',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--teal-800)' }}>
                  Rx {String(i+1).padStart(2,'0')}
                </div>
                {prescriptions.length > 1 && (
                  <button onClick={() => removeRx(i)} style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer' }}>
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label>Drug / Medicine</label>
                  <input type="text" placeholder="e.g. Paracetamol" value={rx.drug} onChange={e => updateRx(i, 'drug', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Dose</label>
                  <input type="text" placeholder="500mg" value={rx.dose} onChange={e => updateRx(i, 'dose', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Route</label>
                  <select value={rx.route} onChange={e => updateRx(i, 'route', e.target.value)}>
                    <option>Oral</option><option>IV</option><option>IM</option><option>Topical</option><option>Inhaled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Frequency</label>
                  <select value={rx.freq} onChange={e => updateRx(i, 'freq', e.target.value)}>
                    <option>Once daily</option><option>Twice daily</option><option>Thrice daily</option>
                    <option>Every 6 hrs</option><option>Every 8 hrs</option><option>SOS</option><option>Before food</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Duration</label>
                  <input type="text" placeholder="5 days" value={rx.duration} onChange={e => updateRx(i, 'duration', e.target.value)} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 8 }}>
                <label>Special Instructions</label>
                <input type="text" placeholder="e.g. Take after meals, avoid alcohol" value={rx.instructions} onChange={e => updateRx(i, 'instructions', e.target.value)} />
              </div>
            </div>
          ))}

          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
              <label>Follow-Up Date</label>
              <input type="date" value={followUp} onChange={e => setFollowUp(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 2, minWidth: 200 }}>
              <label>Additional Advice</label>
              <input type="text" placeholder="Rest, diet instructions, activity restrictions..." />
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={handleSave}><FileText size={15}/> Save & Print Prescription</button>
            <button className="btn btn-secondary" onClick={addRx}><Plus size={15}/> Add Drug</button>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function vitalColor(key, val) {
  if (key === 'spo2' && val < 96) return '#F43F5E';
  if (key === 'pulse' && (val > 100 || val < 60)) return '#F59E0B';
  return '#10B981';
}
