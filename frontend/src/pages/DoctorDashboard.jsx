import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FlaskConical, RefreshCw, Save, Search, Stethoscope, Users } from 'lucide-react';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import FormField, { Input, Select, Textarea } from '../components/ui/FormField';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import StatCard from '../components/ui/StatCard';
import { clinicalService } from '../services/api';

function emptyMedicine() {
  return { medicineName: '', dosage: '', frequency: '', durationDays: '' };
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : '-';
}

export default function DoctorDashboard() {
  const location = useLocation();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [form, setForm] = useState({
    diseaseName: '',
    diagnosisNotes: '',
    doctorSeverity: '',
    generalAdvice: '',
    followUpDate: '',
    medicines: [emptyMedicine()]
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [historyFilter, setHistoryFilter] = useState('diagnosed');

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await clinicalService.getDoctorDashboard();
      setRecords(data?.records || []);
    } catch (err) {
      setError(err.message);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async (recordId) => {
    if (!recordId) {
      setSummary(null);
      return;
    }
    setLoadingSummary(true);
    try {
      const data = await clinicalService.getRecordSummary(recordId);
      setSummary(data);
    } catch (err) {
      setError(err.message);
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    loadSummary(selectedRecordId);
  }, [selectedRecordId]);

  const stats = useMemo(() => ({
    total: records.length,
    open: records.filter((item) => item.status === 'in_review').length,
    diagnosed: records.filter((item) => item.status === 'diagnosed').length
  }), [records]);

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return records;
    return records.filter((item) => {
      const patientName = item.patient?.fullName?.toLowerCase() || '';
      const patientCode = item.patient?.patientCode?.toLowerCase() || '';
      return patientName.includes(query) || patientCode.includes(query);
    });
  }, [records, searchTerm]);

  const reviewQueue = useMemo(
    () => filteredRecords.filter((item) => item.status === 'in_review'),
    [filteredRecords]
  );

  const completedCases = useMemo(() => {
    const base = filteredRecords.filter((item) => item.status !== 'in_review');
    if (historyFilter === 'all') return base;
    return base.filter((item) => item.status === historyFilter);
  }, [filteredRecords, historyFilter]);

  const columns = [
    { key: 'patientName', label: 'Patient', render: (_, row) => row.patient?.fullName || '-' },
    { key: 'patientCode', label: 'Patient Code', render: (_, row) => row.patient?.patientCode || '-' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created', render: (value) => formatDateTime(value) }
  ];

  const visitHistoryColumns = [
    { key: 'createdAt', label: 'Visit Date', render: (value) => formatDateTime(value) },
    { key: 'symptoms', label: 'Symptoms', render: (value) => Array.isArray(value) && value.length ? value.join(', ') : '-' },
    { key: 'vitalsAlertLevel', label: 'Vitals Alert', render: (value) => value || '-' },
    { key: 'status', label: 'Status' }
  ];

  const diagnosisColumns = [
    { key: 'createdAt', label: 'Date', render: (value) => formatDateTime(value) },
    { key: 'diseaseName', label: 'Disease' },
    { key: 'diagnosisNotes', label: 'Notes', render: (value) => value || '-' }
  ];

  const followUpColumns = [
    { key: 'createdAt', label: 'Created', render: (value) => formatDateTime(value) },
    { key: 'title', label: 'Title' },
    { key: 'followUpDate', label: 'Follow-up', render: (value) => value ? new Date(value).toLocaleDateString() : '-' },
    { key: 'message', label: 'Message' }
  ];

  const updateMedicine = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      medicines: prev.medicines.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item)
    }));
  };

  const addMedicine = () => setForm((prev) => ({ ...prev, medicines: [...prev.medicines, emptyMedicine()] }));
  const removeMedicine = (index) => setForm((prev) => ({ ...prev, medicines: prev.medicines.filter((_, itemIndex) => itemIndex !== index) }));
  const viewMode = location.pathname.includes('/doctor/patients')
    ? 'patients'
    : location.pathname.includes('/doctor/diagnosis')
      ? 'review'
      : 'overview';

  const handleSubmit = async () => {
    if (!selectedRecordId) return;
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const medicines = form.medicines
        .filter((item) => item.medicineName && item.dosage && item.frequency && Number(item.durationDays) > 0)
        .map((item) => ({
          medicineName: item.medicineName,
          dosage: item.dosage,
          frequency: item.frequency,
          durationDays: Number(item.durationDays),
          instructions: ''
        }));

      await clinicalService.submitDiagnosis(selectedRecordId, {
        diseaseName: form.diseaseName.trim(),
        diagnosisNotes: form.diagnosisNotes,
        doctorSeverity: form.doctorSeverity || null,
        prescription: {
          medicines,
          generalAdvice: form.generalAdvice,
          followUpDate: form.followUpDate || null
        }
      });

      setMessage('Diagnosis submitted successfully.');
      setForm({ diseaseName: '', diagnosisNotes: '', doctorSeverity: '', generalAdvice: '', followUpDate: '', medicines: [emptyMedicine()] });
      setSelectedRecordId('');
      setSummary(null);
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-enter">
      <PageHeader title="Clinical Review" subtitle="Review patient history and complete diagnosis or follow-up prescription" icon={Stethoscope} actions={[<Button key="refresh" icon={RefreshCw} variant="secondary" onClick={loadDashboard}>Refresh</Button>]} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 28 }}>
        <StatCard title="Total Records" value={stats.total} gradient="stat-gradient-blue" icon={Users} sub="available to review" />
        <StatCard title="Open Cases" value={stats.open} gradient="stat-gradient-amber" icon={Stethoscope} sub="awaiting diagnosis" />
        <StatCard title="Diagnosed" value={stats.diagnosed} gradient="stat-gradient-teal" icon={FlaskConical} sub="completed cases" />
      </div>

      <SectionCard
        title="Doctor Filters"
        subtitle="Search by patient name or patient ID and keep the queue focused on active work"
        style={{ marginBottom: 22 }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <FormField label="Search">
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search patient name or patient ID" />
          </FormField>
          <FormField label="Completed Cases">
            <Select value={historyFilter} onChange={(event) => setHistoryFilter(event.target.value)}>
              <option value="diagnosed">Diagnosed only</option>
              <option value="all">All completed statuses</option>
            </Select>
          </FormField>
        </div>
      </SectionCard>

      {(message || error) && (
        <div className="card" style={{ padding: '14px 18px', marginBottom: 18, borderColor: error ? 'rgba(239,68,68,0.3)' : 'var(--neutral-100)' }}>
          <div style={{ color: error ? 'var(--danger-700)' : 'var(--success-700)', fontWeight: 600, fontSize: '0.88rem' }}>{error || message}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 22 }}>
        {(viewMode === 'overview' || viewMode === 'patients') && (
          <SectionCard title="Patient Review Queue" subtitle="Only active in-review cases are shown here" bodyStyle={{ maxHeight: 440, overflowY: 'auto' }}>
          <DataTable columns={columns} data={reviewQueue} loading={loading} emptyMessage="No active review cases available" onRowClick={(row) => {
            setSelectedRecordId(row._id);
            setMessage('');
            setError('');
          }} />
          </SectionCard>
        )}

        {(viewMode === 'overview' || viewMode === 'patients') && (
          <SectionCard title="Record Summary" subtitle={summary?.record?.patient?.fullName || 'Select a record'}>
          {loadingSummary ? (
            <div style={{ color: 'var(--neutral-500)', fontSize: '0.85rem' }}>Loading summary...</div>
          ) : summary ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.85rem' }}>
              <div><strong>Patient Code:</strong> {summary.record?.patient?.patientCode}</div>
              <div><strong>Age / Gender:</strong> {summary.record?.patient?.age ?? '-'} / {summary.record?.patient?.gender || '-'}</div>
              <div><strong>Contact:</strong> {summary.record?.patient?.contactNumber || '-'}</div>
              <div><strong>Address:</strong> {[summary.record?.patient?.area, summary.record?.patient?.mandal, summary.record?.patient?.district].filter(Boolean).join(', ') || '-'}</div>
              <div><strong>Symptoms:</strong> {(summary.record?.symptoms || []).join(', ') || '-'}</div>
              <div><strong>Vitals:</strong> Temp {summary.record?.vitals?.temperature ?? '-'}, BP {summary.record?.vitals?.bpSystolic ?? '-'}/{summary.record?.vitals?.bpDiastolic ?? '-'}, Pulse {summary.record?.vitals?.pulse ?? '-'}, SpO2 {summary.record?.vitals?.spo2 ?? '-'}</div>
              <div><strong>Nurse Notes:</strong> {summary.record?.nurseNotes || '-'}</div>
              <div><strong>Latest Lab:</strong> {summary.latestLabReport ? `${summary.latestLabReport.testName} (${summary.latestLabReport.isCritical ? 'Critical' : 'Normal/Review'})` : 'No lab report uploaded'}</div>
              <div><strong>Previous Visits:</strong> {(summary.visitHistory || []).length}</div>
              <div><strong>Diagnosis History:</strong> {(summary.diagnosisHistory || []).length}</div>
              <div><strong>Latest Known Disease:</strong> {summary.diagnosisHistory?.[0]?.diseaseName || 'No previous diagnosis'}</div>
            </div>
          ) : (
            <div style={{ color: 'var(--neutral-500)', fontSize: '0.85rem' }}>Choose a queue item to see the full patient summary.</div>
          )}
          </SectionCard>
        )}
      </div>

      {(viewMode === 'overview' || viewMode === 'patients') && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginTop: 22 }}>
          <SectionCard title="Previous Visits" subtitle="Earlier vitals and complaints for this patient">
          <DataTable columns={visitHistoryColumns} data={summary?.visitHistory || []} loading={loadingSummary} emptyMessage="No previous visits available" />
          </SectionCard>
          <SectionCard title="Previous Diagnoses" subtitle="Helps a new doctor understand past treatment">
          <DataTable columns={diagnosisColumns} data={summary?.diagnosisHistory || []} loading={loadingSummary} emptyMessage="No diagnosis history available" />
          </SectionCard>
          <SectionCard title="Follow-up Notifications" subtitle="Existing reminders for continuity of care">
          <DataTable columns={followUpColumns} data={(summary?.notifications || []).filter((item) => item.category === 'follow_up')} loading={loadingSummary} emptyMessage="No follow-up notifications available" />
          </SectionCard>
          <SectionCard title="Completed Cases" subtitle="Diagnosed records are moved here so the main queue stays short" bodyStyle={{ maxHeight: 440, overflowY: 'auto' }}>
          <DataTable columns={columns} data={completedCases} loading={loading} emptyMessage="No completed cases found for the current filter" onRowClick={(row) => {
            setSelectedRecordId(row._id);
            setMessage('');
            setError('');
          }} />
          </SectionCard>
        </div>
      )}

      {(viewMode === 'overview' || viewMode === 'review') && (
        <SectionCard title="Submit Diagnosis" subtitle="Save medicines and follow-up. Leave disease blank to reuse the patient's latest diagnosis on follow-up visits." style={{ marginTop: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Disease Name"><Input value={form.diseaseName} placeholder="Optional for follow-up visits" onChange={(event) => setForm((prev) => ({ ...prev, diseaseName: event.target.value }))} /></FormField>
          <FormField label="Doctor Severity"><Select value={form.doctorSeverity} onChange={(event) => setForm((prev) => ({ ...prev, doctorSeverity: event.target.value }))}><option value="">Not recorded</option><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option></Select></FormField>
          <FormField label="Diagnosis Notes" style={{ gridColumn: '1 / -1' }}><Textarea value={form.diagnosisNotes} onChange={(event) => setForm((prev) => ({ ...prev, diagnosisNotes: event.target.value }))} /></FormField>
          <FormField label="General Advice"><Textarea value={form.generalAdvice} onChange={(event) => setForm((prev) => ({ ...prev, generalAdvice: event.target.value }))} /></FormField>
          <FormField label="Follow-up Date"><Input type="date" value={form.followUpDate} onChange={(event) => setForm((prev) => ({ ...prev, followUpDate: event.target.value }))} /></FormField>

          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--neutral-700)' }}>Prescription Medicines</div>
            {form.medicines.map((medicine, index) => (
              <div key={`medicine-${index}`} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 12 }}>
                <Input value={medicine.medicineName} onChange={(event) => updateMedicine(index, 'medicineName', event.target.value)} placeholder="Medicine name" />
                <Input value={medicine.dosage} onChange={(event) => updateMedicine(index, 'dosage', event.target.value)} placeholder="Dosage" />
                <Input value={medicine.frequency} onChange={(event) => updateMedicine(index, 'frequency', event.target.value)} placeholder="Frequency" />
                <Input type="number" value={medicine.durationDays} onChange={(event) => updateMedicine(index, 'durationDays', event.target.value)} placeholder="Days" />
                <Button variant="secondary" onClick={() => removeMedicine(index)}>Remove</Button>
              </div>
            ))}
            <div><Button variant="secondary" onClick={addMedicine}>Add Medicine</Button></div>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <Button icon={Save} loading={saving} onClick={handleSubmit}>Submit Diagnosis</Button>
          </div>
        </div>
        </SectionCard>
      )}
    </div>
  );
}
