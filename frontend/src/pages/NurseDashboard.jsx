import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ClipboardList, RefreshCw, Save } from 'lucide-react';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import FormField, { Input, Textarea } from '../components/ui/FormField';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import StatCard from '../components/ui/StatCard';
import { clinicalService } from '../services/api';

const EMPTY_FORM = {
  chiefComplaint: '',
  symptomsText: '',
  temperature: '',
  bpSystolic: '',
  bpDiastolic: '',
  pulse: '',
  spo2: '',
  nurseNotes: ''
};

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
}

export default function NurseDashboard() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await clinicalService.getNurseQueue();
      const nextQueue = data?.queue || [];
      setQueue(nextQueue);
      if (selected) {
        const updatedSelected = nextQueue.find((item) => item._id === selected._id) || null;
        setSelected(updatedSelected);
      }
    } catch (err) {
      setError(err.message);
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const stats = useMemo(() => ({
    total: queue.length,
    withComplaint: queue.filter((item) => item.reason).length,
    selected: Number(Boolean(selected))
  }), [queue, selected]);

  const columns = [
    { key: 'patientCode', label: 'Patient Code', render: (_, row) => row.patient?.patientCode || '-' },
    { key: 'patientName', label: 'Patient', render: (_, row) => row.patient?.fullName || '-' },
    { key: 'scheduledAt', label: 'Visit Time', render: (value) => value ? new Date(value).toLocaleString() : '-' },
    { key: 'reason', label: 'Reason' }
  ];

  const handleSave = async () => {
    if (!selected?._id) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await clinicalService.createMedicalRecord(selected._id, {
        chiefComplaint: form.chiefComplaint,
        symptoms: form.symptomsText.split(',').map((item) => item.trim()).filter(Boolean),
        nurseNotes: form.nurseNotes,
        vitals: {
          temperature: toNumberOrNull(form.temperature),
          bpSystolic: toNumberOrNull(form.bpSystolic),
          bpDiastolic: toNumberOrNull(form.bpDiastolic),
          pulse: toNumberOrNull(form.pulse),
          spo2: toNumberOrNull(form.spo2)
        }
      });
      setMessage('Medical record saved successfully.');
      setForm(EMPTY_FORM);
      setSelected(null);
      await loadQueue();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-enter">
      <PageHeader title="Nursing Desk" subtitle="Capture vitals and create medical records for today’s queue" icon={Activity} actions={[<Button key="refresh" icon={RefreshCw} variant="secondary" onClick={loadQueue}>Refresh</Button>]} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 28 }}>
        <StatCard title="Queue Size" value={stats.total} gradient="stat-gradient-blue" icon={ClipboardList} sub="appointments awaiting triage" />
        <StatCard title="Complaints Added" value={stats.withComplaint} gradient="stat-gradient-teal" icon={Activity} sub="reason captured" />
        <StatCard title="Selected Case" value={stats.selected} gradient="stat-gradient-amber" icon={Save} sub="ready for record entry" />
      </div>

      {(message || error) && (
        <div className="card" style={{ padding: '14px 18px', marginBottom: 18, borderColor: error ? 'rgba(239,68,68,0.3)' : 'var(--neutral-100)' }}>
          <div style={{ color: error ? 'var(--danger-700)' : 'var(--success-700)', fontWeight: 600, fontSize: '0.88rem' }}>{error || message}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 22 }}>
        <SectionCard title="Today’s Nurse Queue" subtitle="Select an appointment to record vitals">
          <DataTable columns={columns} data={queue} loading={loading} emptyMessage="No appointments in nurse queue" onRowClick={(row) => {
            setSelected(row);
            setMessage('');
            setError('');
          }} />
        </SectionCard>

        <SectionCard title="Medical Record Entry" subtitle={selected ? `${selected.patient?.fullName} (${selected.patient?.patientCode})` : 'Select a patient from queue'}>
          {selected ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FormField label="Chief Complaint"><Input value={form.chiefComplaint} onChange={(event) => setForm((prev) => ({ ...prev, chiefComplaint: event.target.value }))} /></FormField>
              <FormField label="Symptoms"><Input value={form.symptomsText} onChange={(event) => setForm((prev) => ({ ...prev, symptomsText: event.target.value }))} placeholder="fever, cough" /></FormField>
              <FormField label="Temperature"><Input type="number" step="0.1" value={form.temperature} onChange={(event) => setForm((prev) => ({ ...prev, temperature: event.target.value }))} /></FormField>
              <FormField label="Pulse"><Input type="number" value={form.pulse} onChange={(event) => setForm((prev) => ({ ...prev, pulse: event.target.value }))} /></FormField>
              <FormField label="BP Systolic"><Input type="number" value={form.bpSystolic} onChange={(event) => setForm((prev) => ({ ...prev, bpSystolic: event.target.value }))} /></FormField>
              <FormField label="BP Diastolic"><Input type="number" value={form.bpDiastolic} onChange={(event) => setForm((prev) => ({ ...prev, bpDiastolic: event.target.value }))} /></FormField>
              <FormField label="SpO2"><Input type="number" value={form.spo2} onChange={(event) => setForm((prev) => ({ ...prev, spo2: event.target.value }))} /></FormField>
              <FormField label="Nurse Notes" style={{ gridColumn: '1 / -1' }}><Textarea value={form.nurseNotes} onChange={(event) => setForm((prev) => ({ ...prev, nurseNotes: event.target.value }))} /></FormField>
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                <Button icon={Save} loading={saving} onClick={handleSave}>Save Medical Record</Button>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--neutral-500)', fontSize: '0.85rem' }}>Choose a patient from the queue to begin recording vitals and observations.</div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}


