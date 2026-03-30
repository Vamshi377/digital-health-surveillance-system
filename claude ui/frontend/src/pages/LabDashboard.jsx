import React, { useState, useEffect } from 'react';
import { FlaskConical, FileText, Clock, CheckCircle, Upload, RefreshCw } from 'lucide-react';
import PageHeader  from '../components/ui/PageHeader';
import StatCard    from '../components/ui/StatCard';
import SectionCard from '../components/ui/SectionCard';
import DataTable   from '../components/ui/DataTable';
import Button      from '../components/ui/Button';
import Modal       from '../components/ui/Modal';
import FormField, { Input, Select, Textarea } from '../components/ui/FormField';
import { clinicalService } from '../services/api';

export default function LabDashboard() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [stats, setStats]         = useState(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [resultForm, setResultForm] = useState({});
  const [saving, setSaving]       = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const data = await clinicalService.getLabOrders({ ...params, date: 'today' });
      setOrders(data?.items ?? data ?? []);
      setStats(data?.stats ?? null);
    } catch { setOrders([]); } finally { setLoading(false); }
  }

  function openUploadResult(order) {
    setSelectedOrder(order);
    setResultForm({ order_id: order.id });
    setResultOpen(true);
  }

  async function handleUploadResult() {
    setSaving(true);
    try {
      await clinicalService.updateLabOrder(selectedOrder.id, resultForm);
      setResultOpen(false);
      setResultForm({});
      fetchOrders();
    } catch { } finally { setSaving(false); }
  }

  const orderColumns = [
    { key: 'order_id',     label: 'Order ID', render: v => (
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--brand-700)' }}>{v}</span>
    )},
    { key: 'patient_name', label: 'Patient'   },
    { key: 'test_name',    label: 'Test'       },
    { key: 'ordered_by',   label: 'Ordered By' },
    { key: 'ordered_at',   label: 'Ordered At' },
    { key: 'priority', label: 'Priority', render: v => (
      <span className={`badge badge-${v === 'urgent' ? 'danger' : v === 'high' ? 'warning' : 'neutral'}`}>{v}</span>
    )},
    { key: 'status', label: 'Status', render: (v, row) => (
      v === 'pending' || v === 'in-progress'
        ? <Button size="sm" icon={Upload} onClick={() => openUploadResult(row)}>Upload Result</Button>
        : <span className="badge badge-success">Completed</span>
    )},
  ];

  const FILTERS = ['all', 'pending', 'in-progress', 'completed'];

  return (
    <div className="page-enter">
      <PageHeader
        title="Laboratory"
        subtitle="Manage lab orders, process tests and upload results"
        icon={FlaskConical}
        actions={[
          <Button key="refresh" icon={RefreshCw} variant="secondary" onClick={fetchOrders}>Refresh</Button>,
        ]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 28 }}>
        <StatCard title="Pending Orders"    value={stats?.pending}    gradient="stat-gradient-amber"   icon={Clock}        sub="awaiting processing" />
        <StatCard title="In Progress"       value={stats?.in_progress}gradient="stat-gradient-blue"    icon={FlaskConical} sub="being processed"     />
        <StatCard title="Completed Today"   value={stats?.completed}  gradient="stat-gradient-emerald" icon={CheckCircle}  sub="results uploaded"    />
        <StatCard title="Urgent Orders"     value={stats?.urgent}     gradient="stat-gradient-rose"    icon={FileText}     sub="high priority"       />
      </div>

      <SectionCard
        title="Lab Orders"
        subtitle="All test orders — filter by status"
        actions={
          <div style={{ display: 'flex', gap: 6 }}>
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                style={{
                  padding: '5px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: statusFilter === f ? 'var(--brand-400)' : 'var(--neutral-200)',
                  background: statusFilter === f ? 'var(--brand-50)' : 'transparent',
                  color: statusFilter === f ? 'var(--brand-700)' : 'var(--neutral-500)',
                  fontFamily: 'var(--font-sans)',
                  textTransform: 'capitalize',
                  transition: 'all var(--transition-fast)',
                }}
              >{f}</button>
            ))}
          </div>
        }
      >
        <DataTable columns={orderColumns} data={orders} loading={loading} emptyMessage="No lab orders found" />
      </SectionCard>

      {/* Upload Result Modal */}
      <Modal
        open={resultOpen}
        onClose={() => { setResultOpen(false); setResultForm({}); }}
        title={`Upload Result — ${selectedOrder?.test_name ?? ''}`}
        width={520}
        footer={[
          <Button key="cancel" variant="secondary" onClick={() => setResultOpen(false)}>Cancel</Button>,
          <Button key="save" icon={Upload} loading={saving} onClick={handleUploadResult}>Submit Result</Button>,
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            padding: '12px 16px',
            background: 'var(--neutral-50)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--neutral-100)',
            fontSize: '0.875rem',
            color: 'var(--neutral-600)',
          }}>
            <strong>Patient:</strong> {selectedOrder?.patient_name} &nbsp;|&nbsp;
            <strong>Test:</strong> {selectedOrder?.test_name} &nbsp;|&nbsp;
            <strong>Order ID:</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedOrder?.order_id}</span>
          </div>

          <FormField label="Result Value / Finding" required>
            <Input placeholder="Enter test result" value={resultForm.result_value ?? ''} onChange={e => setResultForm(f => ({ ...f, result_value: e.target.value }))} />
          </FormField>
          <FormField label="Reference Range">
            <Input placeholder="e.g. 70–100 mg/dL" value={resultForm.reference_range ?? ''} onChange={e => setResultForm(f => ({ ...f, reference_range: e.target.value }))} />
          </FormField>
          <FormField label="Interpretation">
            <Select value={resultForm.interpretation ?? ''} onChange={e => setResultForm(f => ({ ...f, interpretation: e.target.value }))}>
              <option value="">Select</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
          </FormField>
          <FormField label="Technician Notes">
            <Textarea placeholder="Additional observations…" value={resultForm.notes ?? ''} onChange={e => setResultForm(f => ({ ...f, notes: e.target.value }))} />
          </FormField>
          <FormField label="Performed By" required>
            <Input placeholder="Lab technician name" value={resultForm.performed_by ?? ''} onChange={e => setResultForm(f => ({ ...f, performed_by: e.target.value }))} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
