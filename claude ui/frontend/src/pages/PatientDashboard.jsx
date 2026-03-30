import React, { useState, useEffect } from 'react';
import { Activity, CalendarDays, FileText, FlaskConical, Heart, RefreshCw } from 'lucide-react';
import PageHeader  from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import DataTable   from '../components/ui/DataTable';
import Button      from '../components/ui/Button';
import { clinicalService } from '../services/api';
import { useAuth } from '../context/AuthContext';

function VitalBadge({ label, value, unit, normal }) {
  return (
    <div style={{
      background: 'var(--neutral-50)',
      border: '1px solid var(--neutral-100)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px 20px',
      flex: 1,
      minWidth: 120,
    }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--neutral-900)', fontFamily: 'var(--font-serif)', lineHeight: 1 }}>
        {value ?? '—'}
        {value && <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--neutral-400)', marginLeft: 4 }}>{unit}</span>}
      </div>
      {normal && value && (
        <div style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--success-700)', fontWeight: 500 }}>
          ✓ Normal range
        </div>
      )}
    </div>
  );
}

export default function PatientDashboard() {
  const { user } = useAuth();

  const [appointments, setAppointments]   = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labReports, setLabReports]       = useState([]);
  const [vitals, setVitals]               = useState(null);
  const [bills, setBills]                 = useState([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => { fetchAll(); }, []);

  function fetchAll() {
    setLoading(true);
    Promise.all([
      fetchAppointments(),
      fetchPrescriptions(),
      fetchLabReports(),
      fetchVitals(),
      fetchBills(),
    ]).finally(() => setLoading(false));
  }

  async function fetchAppointments() {
    try {
      const data = await clinicalService.getAppointments({ patient_id: user?.id });
      setAppointments(data?.items ?? data ?? []);
    } catch { setAppointments([]); }
  }

  async function fetchPrescriptions() {
    try {
      const data = await clinicalService.getPrescriptions({ patient_id: user?.id });
      setPrescriptions(data?.items ?? data ?? []);
    } catch { setPrescriptions([]); }
  }

  async function fetchLabReports() {
    try {
      const data = await clinicalService.getLabOrders({ patient_id: user?.id, status: 'completed' });
      setLabReports(data?.items ?? data ?? []);
    } catch { setLabReports([]); }
  }

  async function fetchVitals() {
    try {
      const data = await clinicalService.getVitals(user?.id);
      setVitals(data?.latest ?? data ?? null);
    } catch { setVitals(null); }
  }

  async function fetchBills() {
    try {
      const data = await clinicalService.getAppointments({ patient_id: user?.id, billing: true });
      setBills(data?.items ?? data ?? []);
    } catch { setBills([]); }
  }

  const apptColumns = [
    { key: 'date',        label: 'Date'    },
    { key: 'time',        label: 'Time'    },
    { key: 'doctor_name', label: 'Doctor'  },
    { key: 'department',  label: 'Department' },
    { key: 'type',        label: 'Type'    },
    { key: 'status', label: 'Status', render: v => (
      <span className={`badge badge-${v === 'confirmed' ? 'success' : v === 'pending' ? 'warning' : v === 'cancelled' ? 'danger' : 'neutral'}`}>{v}</span>
    )},
  ];

  const rxColumns = [
    { key: 'date',        label: 'Date'      },
    { key: 'doctor_name', label: 'Doctor'    },
    { key: 'diagnosis',   label: 'Diagnosis' },
    { key: 'medications', label: 'Medications', render: v => (
      <span style={{ fontSize: '0.82rem', color: 'var(--neutral-600)' }}>
        {typeof v === 'string' ? v.split('\n')[0] + (v.includes('\n') ? '…' : '') : v}
      </span>
    )},
    { key: 'valid_until', label: 'Valid Until' },
  ];

  const labColumns = [
    { key: 'ordered_at',   label: 'Date'          },
    { key: 'test_name',    label: 'Test'          },
    { key: 'result_value', label: 'Result'        },
    { key: 'interpretation', label: 'Finding', render: v => (
      <span className={`badge badge-${v === 'normal' ? 'success' : v === 'critical' ? 'danger' : 'warning'}`}>{v}</span>
    )},
  ];

  const billColumns = [
    { key: 'date',        label: 'Date'    },
    { key: 'description', label: 'For'     },
    { key: 'amount',      label: 'Amount', render: v => v ? `₹${Number(v).toLocaleString('en-IN')}` : '—' },
    { key: 'status', label: 'Status', render: v => (
      <span className={`badge badge-${v === 'paid' ? 'success' : v === 'pending' ? 'warning' : 'danger'}`}>{v}</span>
    )},
  ];

  return (
    <div className="page-enter">
      <PageHeader
        title={`Hello, ${user?.name?.split(' ')[0] ?? 'Patient'}`}
        subtitle="Your personal health dashboard"
        icon={Heart}
        actions={[
          <Button key="refresh" icon={RefreshCw} variant="secondary" onClick={fetchAll}>Refresh</Button>,
        ]}
      />

      {/* Vitals strip */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--neutral-800)' }}>Latest Vitals</div>
            {vitals?.recorded_at && (
              <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', marginTop: 2 }}>Recorded: {vitals.recorded_at}</div>
            )}
          </div>
          <Activity size={18} color="var(--brand-500)" />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <VitalBadge label="Blood Pressure" value={vitals?.blood_pressure}  unit="mmHg" normal />
          <VitalBadge label="Pulse"          value={vitals?.pulse}           unit="bpm"  normal />
          <VitalBadge label="Temperature"    value={vitals?.temperature}     unit="°C"   normal />
          <VitalBadge label="SpO2"           value={vitals?.spo2}            unit="%"    normal />
          <VitalBadge label="Weight"         value={vitals?.weight}          unit="kg"        />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        <SectionCard title="My Appointments" subtitle="Past and upcoming visits">
          <DataTable columns={apptColumns} data={appointments} loading={loading} emptyMessage="No appointments found" />
        </SectionCard>

        <SectionCard title="My Prescriptions" subtitle="Recent prescriptions from your doctor">
          <DataTable columns={rxColumns} data={prescriptions} loading={loading} emptyMessage="No prescriptions found" />
        </SectionCard>

        <SectionCard title="Lab Reports" subtitle="Completed test results">
          <DataTable columns={labColumns} data={labReports} loading={loading} emptyMessage="No lab reports available" />
        </SectionCard>

        <SectionCard title="Billing" subtitle="Your invoices and payment status">
          <DataTable columns={billColumns} data={bills} loading={loading} emptyMessage="No billing records found" />
        </SectionCard>
      </div>
    </div>
  );
}
