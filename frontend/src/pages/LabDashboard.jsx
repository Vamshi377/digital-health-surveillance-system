import React, { useEffect, useState } from 'react';
import { FlaskConical, RefreshCw, Upload } from 'lucide-react';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import FormField, { Input, Textarea } from '../components/ui/FormField';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import StatCard from '../components/ui/StatCard';
import { clinicalService } from '../services/api';

export default function LabDashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ testName: '', valuesText: '{}', summary: '', reportImage: null });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await clinicalService.getLabQueue();
      setRecords(data?.queue || []);
    } catch (err) {
      setError(err.message);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const columns = [
    { key: 'patientCode', label: 'Patient Code', render: (_, row) => row.patient?.patientCode || '-' },
    { key: 'patientName', label: 'Patient', render: (_, row) => row.patient?.fullName || '-' },
    { key: 'appointmentAt', label: 'Appointment', render: (value) => value ? new Date(value).toLocaleString() : '-' },
    { key: 'status', label: 'Status' }
  ];

  const handleUpload = async () => {
    if (!selected?._id) return;
    setSaving(true);
    setMessage('');
    setError('');

    try {
      JSON.parse(form.valuesText || '{}');
      const formData = new FormData();
      formData.append('testName', form.testName);
      formData.append('values', form.valuesText || '{}');
      formData.append('summary', form.summary || '');
      if (form.reportImage) {
        formData.append('reportImage', form.reportImage);
      }
      await clinicalService.uploadLabReport(selected._id, formData);
      setMessage('Lab report uploaded successfully.');
      setSelected(null);
      setForm({ testName: '', valuesText: '{}', summary: '', reportImage: null });
      await loadQueue();
    } catch (err) {
      setError(err.message.includes('JSON') ? 'Values must be valid JSON.' : err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-enter">
      <PageHeader title="Laboratory" subtitle="Upload reports for medical records waiting in the lab queue" icon={FlaskConical} actions={[<Button key="refresh" icon={RefreshCw} variant="secondary" onClick={loadQueue}>Refresh</Button>]} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 28 }}>
        <StatCard title="Queued Records" value={records.length} gradient="stat-gradient-blue" icon={FlaskConical} sub="medical records awaiting lab upload" />
        <StatCard title="Selected Record" value={selected ? 1 : 0} gradient="stat-gradient-amber" icon={Upload} sub="ready for report submission" />
      </div>

      {(message || error) && (
        <div className="card" style={{ padding: '14px 18px', marginBottom: 18, borderColor: error ? 'rgba(239,68,68,0.3)' : 'var(--neutral-100)' }}>
          <div style={{ color: error ? 'var(--danger-700)' : 'var(--success-700)', fontWeight: 600, fontSize: '0.88rem' }}>{error || message}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 22 }}>
        <SectionCard title="Lab Queue" subtitle="Select a record and upload a report">
          <DataTable columns={columns} data={records} loading={loading} emptyMessage="No records are waiting for lab upload" onRowClick={(row) => {
            setSelected(row);
            setMessage('');
            setError('');
          }} />
        </SectionCard>

        <SectionCard title="Upload Lab Report" subtitle={selected ? `${selected.patient?.fullName} (${selected.patient?.patientCode})` : 'Select a record from queue'}>
          {selected ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FormField label="Test Name" required><Input value={form.testName} onChange={(event) => setForm((prev) => ({ ...prev, testName: event.target.value }))} placeholder="CBC / LFT / X-Ray" /></FormField>
              <FormField label="Values JSON" hint='Example: {"platelet_count": 120000, "wbc_count": 5600}'><Textarea value={form.valuesText} onChange={(event) => setForm((prev) => ({ ...prev, valuesText: event.target.value }))} /></FormField>
              <FormField label="Summary"><Textarea value={form.summary} onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))} /></FormField>
              <FormField label="Report File"><Input type="file" onChange={(event) => setForm((prev) => ({ ...prev, reportImage: event.target.files?.[0] || null }))} /></FormField>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button icon={Upload} loading={saving} onClick={handleUpload}>Upload Report</Button>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--neutral-500)', fontSize: '0.85rem' }}>Pick a queued record to upload test values and an optional file.</div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
