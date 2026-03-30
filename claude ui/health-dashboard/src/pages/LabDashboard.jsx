import React, { useState } from 'react';
import { FlaskConical, Upload, FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import { SectionCard, Badge, Avatar } from '../components/ui/index';

const labQueue = [
  { id: 'LB-1001', patient: 'Arjun Singh',  patientId:'HP-2401', test: 'CBC + ESR',          priority: 'routine', collected: '08:30', status: 'processing' },
  { id: 'LB-1002', patient: 'Meena Kumari', patientId:'HP-2402', test: 'Lipid Profile',       priority: 'urgent',  collected: '08:45', status: 'pending' },
  { id: 'LB-1003', patient: 'Ravi Shankar', patientId:'HP-2403', test: 'X-Ray (Knee)',        priority: 'routine', collected: '09:00', status: 'completed' },
  { id: 'LB-1004', patient: 'Sunita Devi',  patientId:'HP-2404', test: 'Urine R/M + Culture', priority: 'routine', collected: '09:15', status: 'processing' },
  { id: 'LB-1005', patient: 'Deepak Verma', patientId:'HP-2405', test: 'Audiometry',          priority: 'high',    collected: '09:30', status: 'pending' },
];

const statusMap = {
  pending:    { label: 'Pending',    variant: 'warning' },
  processing: { label: 'Processing', variant: 'info'    },
  completed:  { label: 'Completed',  variant: 'success' },
};
const priorityMap = {
  routine: { label: 'Routine', variant: 'neutral' },
  high:    { label: 'High',    variant: 'warning' },
  urgent:  { label: 'Urgent',  variant: 'danger'  },
};

export default function LabDashboard() {
  const [tab, setTab] = useState('queue');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadForm, setUploadForm] = useState({ labId:'', testType:'', findings:'', notes:'' });
  const [uploaded, setUploaded] = useState(false);

  const handleUpload = (e) => {
    e.preventDefault();
    setUploaded(true);
    setTimeout(() => setUploaded(false), 3000);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Lab Dashboard</h1>
        <p>Manage lab tests, process samples, and upload reports</p>
      </div>

      <div className="stat-grid stagger" style={{ marginBottom: 28 }}>
        <StatCard icon={FlaskConical} label="Tests Pending"    value="18"  delta={-8}  color="#F59E0B" />
        <StatCard icon={Clock}        label="Processing"       value="7"   delta={0}   color="#3B82F6" />
        <StatCard icon={CheckCircle2} label="Completed Today"  value="42"  delta={20}  color="#10B981" />
        <StatCard icon={AlertCircle}  label="Critical Results" value="3"   delta={50}  color="#F43F5E" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--neutral-100)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[{id:'queue',label:'Lab Queue'},{id:'upload',label:'Upload Report'}].map(t => (
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
        <SectionCard title="Lab Queue" subtitle="Samples received and pending tests">
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Lab ID</th><th>Patient</th><th>Test</th><th>Priority</th><th>Collected</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {labQueue.map(item => (
                  <tr key={item.id}>
                    <td><code style={{ fontSize: 12, background: '#FEF3C7', padding: '2px 6px', borderRadius: 4, color: '#92400E' }}>{item.id}</code></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={item.patient} size={30} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{item.patient}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.patientId}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500, fontSize: 13 }}>{item.test}</td>
                    <td><Badge variant={priorityMap[item.priority].variant}>{priorityMap[item.priority].label}</Badge></td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.collected} AM</td>
                    <td><Badge variant={statusMap[item.status].variant}>{statusMap[item.status].label}</Badge></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setTab('upload')}><Upload size={12}/> Upload</button>
                        <button className="btn btn-ghost btn-sm">View</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {tab === 'upload' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <SectionCard title="Upload Lab Report" subtitle="Attach report file and enter findings">
            {uploaded && (
              <div style={{ padding: '12px 16px', borderRadius: 8, background: '#D1FAE5', border: '1px solid #6EE7B7', color: '#065F46', marginBottom: 20, fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} /> Report uploaded successfully!
              </div>
            )}
            <form onSubmit={handleUpload}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label>Lab Queue ID</label>
                  <select value={uploadForm.labId} onChange={e => setUploadForm(f => ({...f, labId: e.target.value}))} required>
                    <option value="">Select lab item</option>
                    {labQueue.map(l => <option key={l.id} value={l.id}>{l.id} — {l.patient} — {l.test}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Test Type</label>
                  <select value={uploadForm.testType} onChange={e => setUploadForm(f => ({...f, testType: e.target.value}))}>
                    <option value="">Select test</option>
                    <option>CBC</option><option>Lipid Profile</option><option>Blood Sugar</option>
                    <option>Urine R/M</option><option>Liver Function Test</option>
                    <option>Kidney Function Test</option><option>X-Ray</option><option>MRI</option><option>CT Scan</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Key Findings</label>
                  <textarea placeholder="Summarize critical findings..." value={uploadForm.findings} onChange={e => setUploadForm(f => ({...f, findings: e.target.value}))} style={{ minHeight: 90 }} />
                </div>
                <div className="form-group">
                  <label>Lab Technician Notes</label>
                  <textarea placeholder="Internal notes..." value={uploadForm.notes} onChange={e => setUploadForm(f => ({...f, notes: e.target.value}))} style={{ minHeight: 60 }} />
                </div>
              </div>
              <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-primary"><Upload size={15}/> Submit Report</button>
                <button type="button" className="btn btn-secondary">Clear</button>
              </div>
            </form>
          </SectionCard>

          <SectionCard title="Attach File" subtitle="Upload PDF or image of lab report">
            {/* Upload zone */}
            <div
              className="upload-zone"
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{ borderColor: dragOver ? 'var(--teal-700)' : undefined, background: dragOver ? 'var(--teal-100)' : undefined }}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <input id="fileInput" type="file" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0])} />
              <Upload size={32} color="var(--teal-600)" style={{ marginBottom: 12 }} />
              <div style={{ fontWeight: 600, color: 'var(--teal-800)', marginBottom: 4 }}>
                {file ? file.name : 'Drag & drop or click to upload'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {file ? `${(file.size / 1024).toFixed(0)} KB · ${file.type}` : 'Supports PDF, JPG, PNG (max 10 MB)'}
              </div>
            </div>

            {file && (
              <div style={{
                marginTop: 16, padding: '12px 16px',
                background: 'var(--teal-50)', borderRadius: 10,
                border: '1px solid var(--teal-200, #b3dff0)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <FileText size={20} color="var(--teal-700)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{file.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(0)} KB</div>
                </div>
                <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: 18 }}>×</button>
              </div>
            )}

            {/* Recently uploaded */}
            <div style={{ marginTop: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Recent Uploads</div>
              {[
                { name: 'CBC_RaviShankar_HP2403.pdf', size: '128 KB', date: 'Today 09:15', test: 'CBC' },
                { name: 'Xray_Knee_HP2403.jpg',        size: '2.1 MB', date: 'Today 09:00', test: 'X-Ray' },
              ].map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 0',
                  borderBottom: i === 0 ? '1px solid var(--border-color)' : 'none',
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={15} color="#10B981" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.size} · {f.date}</div>
                  </div>
                  <Badge variant="success">{f.test}</Badge>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
