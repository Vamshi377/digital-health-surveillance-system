import React, { useState, useEffect } from 'react';
import { Activity, BedDouble, ClipboardList, CheckCircle, Plus, RefreshCw } from 'lucide-react';
import PageHeader  from '../components/ui/PageHeader';
import StatCard    from '../components/ui/StatCard';
import SectionCard from '../components/ui/SectionCard';
import DataTable   from '../components/ui/DataTable';
import Button      from '../components/ui/Button';
import Modal       from '../components/ui/Modal';
import FormField, { Input, Select, Textarea } from '../components/ui/FormField';
import { clinicalService } from '../services/api';

export default function NurseDashboard() {
  const [tasks, setTasks]           = useState([]);
  const [patients, setPatients]     = useState([]);
  const [beds, setBeds]             = useState([]);
  const [loadingTasks, setLT]       = useState(true);
  const [loadingPts, setLP]         = useState(true);
  const [loadingBeds, setLB]        = useState(true);
  const [vitalOpen, setVitalOpen]   = useState(false);
  const [vitalForm, setVitalForm]   = useState({});
  const [saving, setSaving]         = useState(false);
  const [stats, setStats]           = useState(null);

  useEffect(() => { fetchAll(); }, []);

  function fetchAll() { fetchTasks(); fetchPatients(); fetchBeds(); }

  async function fetchTasks() {
    setLT(true);
    try {
      const data = await clinicalService.getNursingTasks({ date: 'today' });
      setTasks(data?.items ?? data ?? []);
    } catch { setTasks([]); } finally { setLT(false); }
  }

  async function fetchPatients() {
    setLP(true);
    try {
      const data = await clinicalService.getPatients({ ward: true });
      setPatients(data?.items ?? data ?? []);
      setStats(data?.stats ?? null);
    } catch { setPatients([]); } finally { setLP(false); }
  }

  async function fetchBeds() {
    setLB(true);
    try {
      const data = await clinicalService.getBeds();
      setBeds(data?.items ?? data ?? []);
    } catch { setBeds([]); } finally { setLB(false); }
  }

  async function completeTask(id) {
    try {
      await clinicalService.completeTask(id);
      setTasks(t => t.map(task => task.id === id ? { ...task, status: 'completed' } : task));
    } catch { }
  }

  async function handleRecordVitals() {
    setSaving(true);
    try {
      await clinicalService.recordVitals(vitalForm);
      setVitalOpen(false);
      setVitalForm({});
    } catch { } finally { setSaving(false); }
  }

  const taskColumns = [
    { key: 'priority', label: 'Priority', render: v => (
      <span className={`badge badge-${v === 'high' ? 'danger' : v === 'medium' ? 'warning' : 'neutral'}`}>{v}</span>
    )},
    { key: 'task',        label: 'Task'    },
    { key: 'patient_name',label: 'Patient' },
    { key: 'ward',        label: 'Ward'    },
    { key: 'due_time',    label: 'Due'     },
    { key: 'status', label: 'Status', render: (v, row) => (
      v === 'pending'
        ? <Button size="sm" onClick={() => completeTask(row.id)} icon={CheckCircle}>Mark Done</Button>
        : <span className="badge badge-success">Done</span>
    )},
  ];

  const patientColumns = [
    { key: 'name',        label: 'Patient'   },
    { key: 'ward',        label: 'Ward'      },
    { key: 'bed_number',  label: 'Bed'       },
    { key: 'diagnosis',   label: 'Diagnosis' },
    { key: 'last_vitals', label: 'Last Vitals', render: v => v ?? 'Not recorded' },
    { key: 'condition', label: 'Condition', render: v => (
      <span className={`badge badge-${v === 'stable' ? 'success' : v === 'critical' ? 'danger' : 'warning'}`}>{v}</span>
    )},
  ];

  const bedColumns = [
    { key: 'bed_number',   label: 'Bed No.'  },
    { key: 'ward',         label: 'Ward'     },
    { key: 'patient_name', label: 'Patient'  },
    { key: 'status', label: 'Status', render: v => (
      <span className={`badge badge-${v === 'occupied' ? 'info' : v === 'available' ? 'success' : 'warning'}`}>{v}</span>
    )},
  ];

  return (
    <div className="page-enter">
      <PageHeader
        title="Nursing Station"
        subtitle="Ward management, vitals and patient care tasks"
        icon={Activity}
        actions={[
          <Button key="vitals" icon={Plus} onClick={() => setVitalOpen(true)}>Record Vitals</Button>,
          <Button key="refresh" icon={RefreshCw} variant="secondary" onClick={fetchAll} />,
        ]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 28 }}>
        <StatCard title="Ward Patients"   value={stats?.ward_patients}   gradient="stat-gradient-blue"   icon={BedDouble}     sub="currently admitted" />
        <StatCard title="Pending Tasks"   value={stats?.pending_tasks}   gradient="stat-gradient-rose"   icon={ClipboardList} sub="require attention"  />
        <StatCard title="Vitals Due"      value={stats?.vitals_due}      gradient="stat-gradient-amber"  icon={Activity}      sub="awaiting recording" />
        <StatCard title="Available Beds"  value={stats?.available_beds}  gradient="stat-gradient-emerald"icon={BedDouble}     sub="in wards"           />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 22 }}>
        <SectionCard
          title="Today's Nursing Tasks"
          subtitle="Prioritised care tasks for your shift"
          actions={<Button size="sm" variant="ghost" icon={RefreshCw} onClick={fetchTasks}>Refresh</Button>}
        >
          <DataTable columns={taskColumns} data={tasks} loading={loadingTasks} emptyMessage="No tasks assigned for today" />
        </SectionCard>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 22 }}>
          <SectionCard title="Ward Patients" subtitle="Admitted patients under your care">
            <DataTable columns={patientColumns} data={patients} loading={loadingPts} emptyMessage="No ward patients" />
          </SectionCard>

          <SectionCard title="Bed Status" subtitle="Live bed occupancy">
            <DataTable columns={bedColumns} data={beds} loading={loadingBeds} emptyMessage="No bed data available" />
          </SectionCard>
        </div>
      </div>

      {/* Record Vitals Modal */}
      <Modal
        open={vitalOpen}
        onClose={() => { setVitalOpen(false); setVitalForm({}); }}
        title="Record Patient Vitals"
        width={500}
        footer={[
          <Button key="cancel" variant="secondary" onClick={() => setVitalOpen(false)}>Cancel</Button>,
          <Button key="save" loading={saving} onClick={handleRecordVitals}>Save Vitals</Button>,
        ]}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Patient ID" required style={{ gridColumn: '1 / -1' }}>
            <Input placeholder="Enter patient ID" value={vitalForm.patient_id ?? ''} onChange={e => setVitalForm(f => ({ ...f, patient_id: e.target.value }))} />
          </FormField>
          <FormField label="Temperature (°C)">
            <Input type="number" step="0.1" placeholder="37.0" value={vitalForm.temperature ?? ''} onChange={e => setVitalForm(f => ({ ...f, temperature: e.target.value }))} />
          </FormField>
          <FormField label="Pulse (bpm)">
            <Input type="number" placeholder="72" value={vitalForm.pulse ?? ''} onChange={e => setVitalForm(f => ({ ...f, pulse: e.target.value }))} />
          </FormField>
          <FormField label="Blood Pressure">
            <Input placeholder="120/80" value={vitalForm.blood_pressure ?? ''} onChange={e => setVitalForm(f => ({ ...f, blood_pressure: e.target.value }))} />
          </FormField>
          <FormField label="SpO2 (%)">
            <Input type="number" placeholder="98" value={vitalForm.spo2 ?? ''} onChange={e => setVitalForm(f => ({ ...f, spo2: e.target.value }))} />
          </FormField>
          <FormField label="Respiratory Rate">
            <Input type="number" placeholder="16" value={vitalForm.respiratory_rate ?? ''} onChange={e => setVitalForm(f => ({ ...f, respiratory_rate: e.target.value }))} />
          </FormField>
          <FormField label="Weight (kg)">
            <Input type="number" step="0.1" placeholder="70" value={vitalForm.weight ?? ''} onChange={e => setVitalForm(f => ({ ...f, weight: e.target.value }))} />
          </FormField>
          <FormField label="Notes" style={{ gridColumn: '1 / -1' }}>
            <Textarea placeholder="Clinical observations…" value={vitalForm.notes ?? ''} onChange={e => setVitalForm(f => ({ ...f, notes: e.target.value }))} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
