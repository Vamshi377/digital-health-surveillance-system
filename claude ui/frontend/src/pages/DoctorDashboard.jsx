import React, { useState, useEffect } from 'react';
import { Stethoscope, Users, CalendarDays, FlaskConical, FileText, Plus, RefreshCw } from 'lucide-react';
import PageHeader  from '../components/ui/PageHeader';
import StatCard    from '../components/ui/StatCard';
import SectionCard from '../components/ui/SectionCard';
import DataTable   from '../components/ui/DataTable';
import Button      from '../components/ui/Button';
import Modal       from '../components/ui/Modal';
import FormField, { Input, Select, Textarea } from '../components/ui/FormField';
import { clinicalService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DoctorDashboard() {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [labOrders, setLabOrders]         = useState([]);
  const [stats, setStats]                 = useState(null);
  const [loadingAppts, setLA]             = useState(true);
  const [loadingConsult, setLC]           = useState(true);
  const [consultOpen, setConsultOpen]     = useState(false);
  const [labOpen, setLabOpen]             = useState(false);
  const [prescribeOpen, setPrescribeOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [form, setForm]                   = useState({});
  const [saving, setSaving]               = useState(false);

  useEffect(() => { fetchAll(); }, []);

  function fetchAll() { fetchAppointments(); fetchConsultations(); fetchLabOrders(); }

  async function fetchAppointments() {
    setLA(true);
    try {
      const data = await clinicalService.getAppointments({ doctor_id: user?.id, date: 'today' });
      setAppointments(data?.items ?? data ?? []);
      setStats(data?.stats ?? null);
    } catch { setAppointments([]); } finally { setLA(false); }
  }

  async function fetchConsultations() {
    setLC(true);
    try {
      const data = await clinicalService.getConsultations({ doctor_id: user?.id, date: 'today' });
      setConsultations(data?.items ?? data ?? []);
    } catch { setConsultations([]); } finally { setLC(false); }
  }

  async function fetchLabOrders() {
    try {
      const data = await clinicalService.getLabOrders({ doctor_id: user?.id, date: 'today' });
      setLabOrders(data?.items ?? data ?? []);
    } catch { setLabOrders([]); }
  }

  async function handleConsultation() {
    setSaving(true);
    try {
      await clinicalService.createConsultation({ ...form, doctor_id: user?.id });
      setConsultOpen(false); setForm({}); fetchConsultations();
    } catch { } finally { setSaving(false); }
  }

  async function handleLabOrder() {
    setSaving(true);
    try {
      await clinicalService.createLabOrder({ ...form, doctor_id: user?.id });
      setLabOpen(false); setForm({}); fetchLabOrders();
    } catch { } finally { setSaving(false); }
  }

  async function handlePrescription() {
    setSaving(true);
    try {
      await clinicalService.createPrescription({ ...form, doctor_id: user?.id });
      setPrescribeOpen(false); setForm({});
    } catch { } finally { setSaving(false); }
  }

  const apptColumns = [
    { key: 'time',         label: 'Time',    render: v => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{v}</span> },
    { key: 'patient_name', label: 'Patient'  },
    { key: 'age',          label: 'Age',     render: v => v ? `${v} yrs` : '—' },
    { key: 'type',         label: 'Type'     },
    { key: 'chief_complaint', label: 'Complaint' },
    { key: 'status', label: 'Status', render: (v, row) => (
      v === 'waiting'
        ? <Button size="sm" onClick={() => { setSelectedPatient(row); setForm({ patient_id: row.patient_id }); setConsultOpen(true); }}>Start</Button>
        : <span className={`badge badge-${v === 'completed' ? 'success' : 'info'}`}>{v}</span>
    )},
  ];

  const consultColumns = [
    { key: 'patient_name', label: 'Patient'    },
    { key: 'chief_complaint', label: 'Complaint' },
    { key: 'diagnosis',    label: 'Diagnosis'  },
    { key: 'created_at',   label: 'Time'       },
    { key: 'follow_up',    label: 'Follow-up', render: v => v ?? 'None' },
  ];

  const labColumns = [
    { key: 'patient_name', label: 'Patient'  },
    { key: 'test_name',    label: 'Test'     },
    { key: 'ordered_at',   label: 'Ordered'  },
    { key: 'status', label: 'Status', render: v => (
      <span className={`badge badge-${v === 'completed' ? 'success' : v === 'in-progress' ? 'info' : 'warning'}`}>{v}</span>
    )},
    { key: 'result_value', label: 'Result', render: v => v ?? '—' },
  ];

  return (
    <div className="page-enter">
      <PageHeader
        title={`Dr. ${user?.name ?? 'Dashboard'}`}
        subtitle="Clinical workspace — consultations, orders and prescriptions"
        icon={Stethoscope}
        actions={[
          <Button key="consult" icon={Plus} onClick={() => setConsultOpen(true)}>New Consultation</Button>,
          <Button key="lab" icon={FlaskConical} variant="secondary" onClick={() => setLabOpen(true)}>Lab Order</Button>,
          <Button key="rx" icon={FileText} variant="secondary" onClick={() => setPrescribeOpen(true)}>Prescribe</Button>,
          <Button key="refresh" icon={RefreshCw} variant="secondary" onClick={fetchAll} />,
        ]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 28 }}>
        <StatCard title="Today's Patients"   value={stats?.total_patients}  gradient="stat-gradient-blue"    icon={Users}       sub="scheduled"         />
        <StatCard title="Completed"          value={stats?.completed}       gradient="stat-gradient-emerald" icon={Stethoscope} sub="consultations done" />
        <StatCard title="Waiting"            value={stats?.waiting}         gradient="stat-gradient-amber"   icon={CalendarDays}sub="in queue"           />
        <StatCard title="Lab Results Back"   value={stats?.lab_results}     gradient="stat-gradient-violet"  icon={FlaskConical}sub="ready to review"    />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 22 }}>
        <SectionCard title="Today's OPD Schedule" subtitle="Your appointment queue for today"
          actions={<Button size="sm" variant="ghost" icon={RefreshCw} onClick={fetchAppointments}>Refresh</Button>}
        >
          <DataTable columns={apptColumns} data={appointments} loading={loadingAppts} emptyMessage="No appointments today" />
        </SectionCard>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 22 }}>
          <SectionCard title="Today's Consultations" subtitle="Completed consultation records">
            <DataTable columns={consultColumns} data={consultations} loading={loadingConsult} emptyMessage="No consultations recorded" />
          </SectionCard>
          <SectionCard title="Lab Orders" subtitle="Orders placed and results">
            <DataTable columns={labColumns} data={labOrders} loading={false} emptyMessage="No lab orders placed" />
          </SectionCard>
        </div>
      </div>

      {/* Consultation Modal */}
      <Modal open={consultOpen} onClose={() => { setConsultOpen(false); setForm({}); }}
        title="New Consultation"
        width={580}
        footer={[
          <Button key="cancel" variant="secondary" onClick={() => setConsultOpen(false)}>Cancel</Button>,
          <Button key="save" loading={saving} onClick={handleConsultation}>Save Consultation</Button>,
        ]}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Patient ID" required style={{ gridColumn: '1 / -1' }}>
            <Input placeholder="Patient ID" value={form.patient_id ?? ''} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))} />
          </FormField>
          <FormField label="Chief Complaint" required style={{ gridColumn: '1 / -1' }}>
            <Input placeholder="Primary complaint" value={form.chief_complaint ?? ''} onChange={e => setForm(f => ({ ...f, chief_complaint: e.target.value }))} />
          </FormField>
          <FormField label="History of Present Illness" style={{ gridColumn: '1 / -1' }}>
            <Textarea placeholder="Detailed history…" value={form.hpi ?? ''} onChange={e => setForm(f => ({ ...f, hpi: e.target.value }))} />
          </FormField>
          <FormField label="Examination Findings" style={{ gridColumn: '1 / -1' }}>
            <Textarea placeholder="Clinical findings…" value={form.examination ?? ''} onChange={e => setForm(f => ({ ...f, examination: e.target.value }))} />
          </FormField>
          <FormField label="Diagnosis" required style={{ gridColumn: '1 / -1' }}>
            <Input placeholder="ICD-10 or free text" value={form.diagnosis ?? ''} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} />
          </FormField>
          <FormField label="Plan / Instructions" style={{ gridColumn: '1 / -1' }}>
            <Textarea placeholder="Treatment plan…" value={form.plan ?? ''} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))} />
          </FormField>
          <FormField label="Follow-up Date">
            <Input type="date" value={form.follow_up ?? ''} onChange={e => setForm(f => ({ ...f, follow_up: e.target.value }))} />
          </FormField>
          <FormField label="Referral">
            <Input placeholder="Refer to (if any)" value={form.referral ?? ''} onChange={e => setForm(f => ({ ...f, referral: e.target.value }))} />
          </FormField>
        </div>
      </Modal>

      {/* Lab Order Modal */}
      <Modal open={labOpen} onClose={() => { setLabOpen(false); setForm({}); }}
        title="Create Lab Order"
        width={460}
        footer={[
          <Button key="cancel" variant="secondary" onClick={() => setLabOpen(false)}>Cancel</Button>,
          <Button key="save" loading={saving} onClick={handleLabOrder}>Place Order</Button>,
        ]}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="Patient ID" required>
            <Input placeholder="Patient ID" value={form.patient_id ?? ''} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))} />
          </FormField>
          <FormField label="Test Name" required>
            <Input placeholder="e.g. CBC, LFT, Lipid Profile" value={form.test_name ?? ''} onChange={e => setForm(f => ({ ...f, test_name: e.target.value }))} />
          </FormField>
          <FormField label="Priority">
            <Select value={form.priority ?? ''} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              <option value="">Select priority</option>
              <option value="routine">Routine</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </FormField>
          <FormField label="Clinical Notes">
            <Textarea placeholder="Reason / clinical context…" value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </FormField>
        </div>
      </Modal>

      {/* Prescribe Modal */}
      <Modal open={prescribeOpen} onClose={() => { setPrescribeOpen(false); setForm({}); }}
        title="Write Prescription"
        width={520}
        footer={[
          <Button key="cancel" variant="secondary" onClick={() => setPrescribeOpen(false)}>Cancel</Button>,
          <Button key="save" loading={saving} onClick={handlePrescription}>Save Prescription</Button>,
        ]}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="Patient ID" required>
            <Input placeholder="Patient ID" value={form.patient_id ?? ''} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))} />
          </FormField>
          <FormField label="Diagnosis">
            <Input placeholder="Diagnosis" value={form.diagnosis ?? ''} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} />
          </FormField>
          <FormField label="Medications" required>
            <Textarea placeholder="Drug name — Dose — Frequency — Duration (one per line)" value={form.medications ?? ''} onChange={e => setForm(f => ({ ...f, medications: e.target.value }))} style={{ minHeight: 120 }} />
          </FormField>
          <FormField label="Instructions">
            <Textarea placeholder="Patient instructions, precautions…" value={form.instructions ?? ''} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} />
          </FormField>
          <FormField label="Valid Until">
            <Input type="date" value={form.valid_until ?? ''} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
