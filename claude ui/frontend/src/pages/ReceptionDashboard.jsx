import React, { useState, useEffect } from 'react';
import { Users, CalendarDays, ClipboardList, FileText, Plus, Search, RefreshCw } from 'lucide-react';
import PageHeader  from '../components/ui/PageHeader';
import StatCard    from '../components/ui/StatCard';
import SectionCard from '../components/ui/SectionCard';
import DataTable   from '../components/ui/DataTable';
import Button      from '../components/ui/Button';
import Modal       from '../components/ui/Modal';
import FormField, { Input, Select } from '../components/ui/FormField';
import { clinicalService } from '../services/api';

export default function ReceptionDashboard() {
  const [stats, setStats]               = useState(null);
  const [queue, setQueue]               = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [apptOpen, setApptOpen]         = useState(false);
  const [form, setForm]                 = useState({});
  const [saving, setSaving]             = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    fetchStats();
    fetchQueue();
    fetchAppointments();
  }

  async function fetchStats() {
    try {
      const data = await clinicalService.getAppointments({ date: 'today', summary: true });
      setStats(data);
    } catch { /* handled by API interceptor */ }
  }

  async function fetchQueue() {
    setLoadingQueue(true);
    try {
      const data = await clinicalService.getQueue({ date: 'today' });
      setQueue(data?.items ?? data ?? []);
    } catch { setQueue([]); }
    finally { setLoadingQueue(false); }
  }

  async function fetchAppointments() {
    setLoadingAppts(true);
    try {
      const data = await clinicalService.getAppointments({ date: 'today' });
      setAppointments(data?.items ?? data ?? []);
    } catch { setAppointments([]); }
    finally { setLoadingAppts(false); }
  }

  async function handleRegisterPatient() {
    setSaving(true);
    try {
      await clinicalService.registerPatient(form);
      setRegisterOpen(false);
      setForm({});
    } catch { }
    finally { setSaving(false); }
  }

  async function handleCreateAppointment() {
    setSaving(true);
    try {
      await clinicalService.createAppointment(form);
      setApptOpen(false);
      setForm({});
      fetchAppointments();
    } catch { }
    finally { setSaving(false); }
  }

  const queueColumns = [
    { key: 'token_number', label: 'Token', render: (v) => (
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-600)', fontSize: '0.9rem' }}>{v}</span>
    )},
    { key: 'patient_name', label: 'Patient' },
    { key: 'department',   label: 'Department' },
    { key: 'doctor_name',  label: 'Doctor' },
    { key: 'status', label: 'Status', render: (v) => (
      <span className={`badge badge-${v === 'waiting' ? 'warning' : v === 'in-consultation' ? 'info' : 'success'}`}>
        {v?.replace('-', ' ')}
      </span>
    )},
    { key: 'wait_time', label: 'Wait', render: (v) => v ? `${v} min` : '—' },
  ];

  const apptColumns = [
    { key: 'time',        label: 'Time',    render: v => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{v}</span> },
    { key: 'patient_name',label: 'Patient' },
    { key: 'doctor_name', label: 'Doctor'  },
    { key: 'type',        label: 'Type'    },
    { key: 'status', label: 'Status', render: v => (
      <span className={`badge badge-${v === 'confirmed' ? 'success' : v === 'pending' ? 'warning' : 'neutral'}`}>{v}</span>
    )},
  ];

  return (
    <div className="page-enter">
      <PageHeader
        title="Reception"
        subtitle="Manage patient registration, appointments and queue"
        icon={Users}
        actions={[
          <Button key="reg" icon={Plus} onClick={() => setRegisterOpen(true)}>Register Patient</Button>,
          <Button key="appt" icon={CalendarDays} variant="secondary" onClick={() => setApptOpen(true)}>New Appointment</Button>,
          <Button key="refresh" icon={RefreshCw} variant="secondary" size="md" onClick={fetchAll} style={{ padding: '9px' }}><span className="sr-only">Refresh</span></Button>,
        ]}
      />

      {/* Stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 28 }}>
        <StatCard title="Today's Appointments" value={stats?.total_appointments}    gradient="stat-gradient-blue"    icon={CalendarDays} sub="scheduled today"      />
        <StatCard title="Patients in Queue"     value={stats?.queue_count}          gradient="stat-gradient-teal"    icon={ClipboardList} sub="currently waiting"   />
        <StatCard title="Registered Today"      value={stats?.new_patients_today}   gradient="stat-gradient-violet"  icon={Users}         sub="new registrations"   />
        <StatCard title="Pending Billing"       value={stats?.pending_billing}      gradient="stat-gradient-amber"   icon={FileText}      sub="bills to be raised"  />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        {/* Queue */}
        <SectionCard
          title="Live OPD Queue"
          subtitle="Real-time queue for today"
          actions={<Button size="sm" variant="ghost" icon={RefreshCw} onClick={fetchQueue}>Refresh</Button>}
          style={{ gridColumn: '1 / -1' }}
        >
          <DataTable columns={queueColumns} data={queue} loading={loadingQueue} emptyMessage="Queue is empty" />
        </SectionCard>

        {/* Appointments */}
        <SectionCard
          title="Today's Appointments"
          subtitle="All scheduled slots"
          style={{ gridColumn: '1 / -1' }}
          actions={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)',
                borderRadius: 'var(--radius-md)', padding: '5px 10px',
              }}>
                <Search size={14} color="var(--neutral-400)" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search…"
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.82rem', width: 120, color: 'var(--neutral-700)' }}
                />
              </div>
            </div>
          }
        >
          <DataTable
            columns={apptColumns}
            data={appointments.filter(a =>
              !searchQuery || a.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              a.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            loading={loadingAppts}
            emptyMessage="No appointments scheduled for today"
          />
        </SectionCard>
      </div>

      {/* Register Patient Modal */}
      <Modal
        open={registerOpen}
        onClose={() => { setRegisterOpen(false); setForm({}); }}
        title="Register New Patient"
        width={560}
        footer={[
          <Button key="cancel" variant="secondary" onClick={() => setRegisterOpen(false)}>Cancel</Button>,
          <Button key="save" loading={saving} onClick={handleRegisterPatient}>Register</Button>,
        ]}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="First Name" required>
            <Input placeholder="First name" value={form.first_name ?? ''} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
          </FormField>
          <FormField label="Last Name" required>
            <Input placeholder="Last name" value={form.last_name ?? ''} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
          </FormField>
          <FormField label="Date of Birth" required>
            <Input type="date" value={form.dob ?? ''} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} />
          </FormField>
          <FormField label="Gender" required>
            <Select value={form.gender ?? ''} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
          </FormField>
          <FormField label="Phone" required style={{ gridColumn: '1 / -1' }}>
            <Input placeholder="+91 00000 00000" value={form.phone ?? ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </FormField>
          <FormField label="Email" style={{ gridColumn: '1 / -1' }}>
            <Input type="email" placeholder="patient@email.com" value={form.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </FormField>
          <FormField label="Blood Group">
            <Select value={form.blood_group ?? ''} onChange={e => setForm(f => ({ ...f, blood_group: e.target.value }))}>
              <option value="">Select</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Emergency Contact">
            <Input placeholder="Emergency phone" value={form.emergency_contact ?? ''} onChange={e => setForm(f => ({ ...f, emergency_contact: e.target.value }))} />
          </FormField>
        </div>
      </Modal>

      {/* New Appointment Modal */}
      <Modal
        open={apptOpen}
        onClose={() => { setApptOpen(false); setForm({}); }}
        title="Book Appointment"
        width={480}
        footer={[
          <Button key="cancel" variant="secondary" onClick={() => setApptOpen(false)}>Cancel</Button>,
          <Button key="save" loading={saving} onClick={handleCreateAppointment}>Book</Button>,
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="Patient ID / Name" required>
            <Input placeholder="Search patient…" value={form.patient_id ?? ''} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))} />
          </FormField>
          <FormField label="Department" required>
            <Input placeholder="e.g. Cardiology" value={form.department ?? ''} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
          </FormField>
          <FormField label="Doctor" required>
            <Input placeholder="Assign doctor" value={form.doctor_id ?? ''} onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))} />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Date" required>
              <Input type="date" value={form.date ?? ''} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </FormField>
            <FormField label="Time" required>
              <Input type="time" value={form.time ?? ''} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Appointment Type">
            <Select value={form.type ?? ''} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="">Select type</option>
              <option value="opd">OPD</option>
              <option value="follow-up">Follow-up</option>
              <option value="emergency">Emergency</option>
              <option value="teleconsult">Teleconsult</option>
            </Select>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
