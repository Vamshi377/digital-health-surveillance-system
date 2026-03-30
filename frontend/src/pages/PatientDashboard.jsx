import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Bell, ClipboardList, FlaskConical, RefreshCw } from 'lucide-react';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import StatCard from '../components/ui/StatCard';
import { clinicalService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await clinicalService.getMyHistory();
      setHistory(data);
    } catch (err) {
      setError(err.message);
      setHistory(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const stats = useMemo(() => ({
    notifications: history?.notifications?.length || 0,
    records: history?.medicalRecords?.length || 0,
    labReports: history?.labReports?.length || 0,
    prescriptions: history?.prescriptions?.length || 0
  }), [history]);

  const recordColumns = [
    { key: 'createdAt', label: 'Date', render: (value) => value ? new Date(value).toLocaleString() : '-' },
    { key: 'symptoms', label: 'Symptoms', render: (value) => Array.isArray(value) ? value.join(', ') : '-' },
    { key: 'status', label: 'Status' }
  ];

  const labColumns = [
    { key: 'createdAt', label: 'Date', render: (value) => value ? new Date(value).toLocaleString() : '-' },
    { key: 'testName', label: 'Test' },
    { key: 'summary', label: 'Summary' },
    { key: 'isCritical', label: 'Critical', render: (value) => value ? 'Yes' : 'No' }
  ];

  const prescriptionColumns = [
    { key: 'createdAt', label: 'Date', render: (value) => value ? new Date(value).toLocaleString() : '-' },
    { key: 'medicines', label: 'Medicines', render: (value) => (value || []).map((item) => `${item.medicineName} (${item.dosage})`).join(', ') || '-' },
    { key: 'followUpDate', label: 'Follow-up', render: (value) => value ? new Date(value).toLocaleDateString() : '-' }
  ];

  const notificationColumns = [
    { key: 'createdAt', label: 'Updated', render: (value) => value ? new Date(value).toLocaleString() : '-' },
    { key: 'title', label: 'Title' },
    { key: 'message', label: 'Message' }
  ];

  return (
    <div className="page-enter">
      <PageHeader title={`Hello, ${user?.fullName?.split(' ')[0] || 'Patient'}`} subtitle="Your health records, reports, and follow-up notifications" icon={Activity} actions={[<Button key="refresh" icon={RefreshCw} variant="secondary" onClick={loadHistory}>Refresh</Button>]} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 28 }}>
        <StatCard title="Notifications" value={stats.notifications} gradient="stat-gradient-blue" icon={Bell} sub="hospital updates" />
        <StatCard title="Health Records" value={stats.records} gradient="stat-gradient-teal" icon={ClipboardList} sub="uploaded by hospital" />
        <StatCard title="Lab Reports" value={stats.labReports} gradient="stat-gradient-violet" icon={FlaskConical} sub="available reports" />
        <StatCard title="Prescriptions" value={stats.prescriptions} gradient="stat-gradient-amber" icon={Activity} sub="doctor advice" />
      </div>

      {history?.patient && (
        <div className="card" style={{ padding: '14px 18px', marginBottom: 18 }}>
          <div style={{ fontWeight: 700, color: 'var(--neutral-800)', marginBottom: 6 }}>Patient Identity</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--neutral-600)', lineHeight: 1.6 }}>
            <strong>Patient Code:</strong> {history.patient.patientCode || '-'}{' '}
            <strong style={{ marginLeft: 14 }}>Contact:</strong> {history.patient.contactNumber || '-'}
          </div>
        </div>
      )}

      {error && (
        <div className="card" style={{ padding: '14px 18px', marginBottom: 18, borderColor: 'rgba(239,68,68,0.3)' }}>
          <div style={{ color: 'var(--danger-700)', fontWeight: 600, fontSize: '0.88rem' }}>{error}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        <SectionCard title="Hospital Notifications" subtitle="Follow-up reminders and report alerts">
          <DataTable columns={notificationColumns} data={history?.notifications || []} loading={loading} emptyMessage="No notifications available" />
        </SectionCard>
        <SectionCard title="Health Records" subtitle="Vitals and nurse entries">
          <DataTable columns={recordColumns} data={history?.medicalRecords || []} loading={loading} emptyMessage="No medical records available" />
        </SectionCard>
        <SectionCard title="Uploaded Lab Reports" subtitle="Reports uploaded by hospital lab team">
          <DataTable columns={labColumns} data={history?.labReports || []} loading={loading} emptyMessage="No lab reports available" />
        </SectionCard>
        <SectionCard title="Prescriptions" subtitle="Medicines and follow-up plan">
          <DataTable columns={prescriptionColumns} data={history?.prescriptions || []} loading={loading} emptyMessage="No prescriptions available" />
        </SectionCard>
      </div>
    </div>
  );
}
