import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Package, FileText, Plus, RefreshCw, Settings, Trash2 } from 'lucide-react';
import PageHeader  from '../components/ui/PageHeader';
import StatCard    from '../components/ui/StatCard';
import SectionCard from '../components/ui/SectionCard';
import DataTable   from '../components/ui/DataTable';
import Button      from '../components/ui/Button';
import Modal       from '../components/ui/Modal';
import FormField, { Input, Select } from '../components/ui/FormField';
import { adminService } from '../services/api';

const TABS = ['Staff', 'Departments', 'Inventory', 'Billing', 'Audit'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Staff');
  const [staff, setStaff]               = useState([]);
  const [departments, setDepartments]   = useState([]);
  const [inventory, setInventory]       = useState([]);
  const [bills, setBills]               = useState([]);
  const [auditLogs, setAuditLogs]       = useState([]);
  const [stats, setStats]               = useState(null);
  const [loading, setLoading]           = useState(false);
  const [staffOpen, setStaffOpen]       = useState(false);
  const [deptOpen, setDeptOpen]         = useState(false);
  const [form, setForm]                 = useState({});
  const [saving, setSaving]             = useState(false);

  useEffect(() => { fetchStats(); fetchTab(activeTab); }, [activeTab]);

  async function fetchStats() {
    try {
      const data = await adminService.getStaff({ summary: true });
      setStats(data?.stats ?? null);
    } catch { }
  }

  async function fetchTab(tab) {
    setLoading(true);
    try {
      if (tab === 'Staff')       { const d = await adminService.getStaff();       setStaff(d?.items ?? d ?? []); }
      if (tab === 'Departments') { const d = await adminService.getDepartments();  setDepartments(d?.items ?? d ?? []); }
      if (tab === 'Inventory')   { const d = await adminService.getInventory();    setInventory(d?.items ?? d ?? []); }
      if (tab === 'Billing')     { const d = await adminService.getBills();        setBills(d?.items ?? d ?? []); }
      if (tab === 'Audit')       { const d = await adminService.getAuditLogs();   setAuditLogs(d?.items ?? d ?? []); }
    } catch { } finally { setLoading(false); }
  }

  async function handleCreateStaff() {
    setSaving(true);
    try {
      await adminService.createStaff(form);
      setStaffOpen(false); setForm({}); fetchTab('Staff');
    } catch { } finally { setSaving(false); }
  }

  async function handleCreateDept() {
    setSaving(true);
    try {
      await adminService.createDepartment(form);
      setDeptOpen(false); setForm({}); fetchTab('Departments');
    } catch { } finally { setSaving(false); }
  }

  async function handleDeactivate(id) {
    if (!window.confirm('Deactivate this staff member?')) return;
    try { await adminService.deactivateStaff(id); fetchTab('Staff'); } catch { }
  }

  const staffColumns = [
    { key: 'employee_id', label: 'Emp ID', render: v => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{v}</span> },
    { key: 'name',       label: 'Name'       },
    { key: 'role',       label: 'Role', render: v => <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{v}</span> },
    { key: 'department', label: 'Department' },
    { key: 'phone',      label: 'Phone'      },
    { key: 'status', label: 'Status', render: v => (
      <span className={`badge badge-${v === 'active' ? 'success' : 'danger'}`}>{v}</span>
    )},
    { key: 'id', label: '', render: (v) => (
      <Button size="sm" variant="ghost" icon={Trash2} onClick={() => handleDeactivate(v)} style={{ color: 'var(--danger-500)' }} />
    )},
  ];

  const deptColumns = [
    { key: 'name',         label: 'Department'   },
    { key: 'head',         label: 'Head'         },
    { key: 'staff_count',  label: 'Staff Count'  },
    { key: 'bed_count',    label: 'Beds'         },
    { key: 'status', label: 'Status', render: v => (
      <span className={`badge badge-${v === 'active' ? 'success' : 'neutral'}`}>{v}</span>
    )},
  ];

  const inventoryColumns = [
    { key: 'item_name',    label: 'Item'        },
    { key: 'category',     label: 'Category'    },
    { key: 'quantity',     label: 'Qty'         },
    { key: 'unit',         label: 'Unit'        },
    { key: 'reorder_level',label: 'Reorder At'  },
    { key: 'status', label: 'Status', render: (v, row) => {
      const low = row.quantity <= row.reorder_level;
      return <span className={`badge badge-${low ? 'danger' : 'success'}`}>{low ? 'Low Stock' : 'Adequate'}</span>;
    }},
  ];

  const billColumns = [
    { key: 'bill_number',  label: 'Bill #', render: v => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{v}</span> },
    { key: 'patient_name', label: 'Patient'    },
    { key: 'amount',       label: 'Amount',    render: v => v ? `₹${Number(v).toLocaleString('en-IN')}` : '—' },
    { key: 'date',         label: 'Date'       },
    { key: 'status', label: 'Status', render: v => (
      <span className={`badge badge-${v === 'paid' ? 'success' : v === 'pending' ? 'warning' : 'danger'}`}>{v}</span>
    )},
  ];

  const auditColumns = [
    { key: 'timestamp',  label: 'Time'    },
    { key: 'user',       label: 'User'    },
    { key: 'action',     label: 'Action'  },
    { key: 'resource',   label: 'Resource'},
    { key: 'ip_address', label: 'IP'      },
    { key: 'status', label: 'Status', render: v => (
      <span className={`badge badge-${v === 'success' ? 'success' : 'danger'}`}>{v}</span>
    )},
  ];

  const TABLE_MAP = {
    Staff:       { columns: staffColumns,     data: staff,       empty: 'No staff records'    },
    Departments: { columns: deptColumns,      data: departments, empty: 'No departments'      },
    Inventory:   { columns: inventoryColumns, data: inventory,   empty: 'No inventory items'  },
    Billing:     { columns: billColumns,      data: bills,       empty: 'No billing records'  },
    Audit:       { columns: auditColumns,     data: auditLogs,   empty: 'No audit logs'       },
  };

  const current = TABLE_MAP[activeTab];

  return (
    <div className="page-enter">
      <PageHeader
        title="Administration"
        subtitle="Manage staff, inventory, billing and system settings"
        icon={ShieldCheck}
        actions={[
          activeTab === 'Staff'       && <Button key="staff" icon={Plus} onClick={() => setStaffOpen(true)}>Add Staff</Button>,
          activeTab === 'Departments' && <Button key="dept"  icon={Plus} onClick={() => setDeptOpen(true)}>Add Department</Button>,
          <Button key="refresh" icon={RefreshCw} variant="secondary" onClick={() => fetchTab(activeTab)} />,
        ].filter(Boolean)}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 28 }}>
        <StatCard title="Total Staff"      value={stats?.total_staff}      gradient="stat-gradient-blue"    icon={Users}     sub="across all roles"  />
        <StatCard title="Departments"      value={stats?.departments}      gradient="stat-gradient-violet"  icon={Settings}  sub="active units"      />
        <StatCard title="Pending Bills"    value={stats?.pending_bills}    gradient="stat-gradient-amber"   icon={FileText}  sub="awaiting payment"  />
        <StatCard title="Low Stock Items"  value={stats?.low_stock}        gradient="stat-gradient-rose"    icon={Package}   sub="need reordering"   />
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--neutral-100)', borderRadius: 'var(--radius-lg)', padding: 4, width: 'fit-content' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '7px 18px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === tab ? '#fff' : 'transparent',
            color: activeTab === tab ? 'var(--neutral-900)' : 'var(--neutral-500)',
            fontWeight: activeTab === tab ? 700 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
            boxShadow: activeTab === tab ? 'var(--shadow-xs)' : 'none',
            transition: 'all var(--transition-fast)',
            fontFamily: 'var(--font-sans)',
          }}>{tab}</button>
        ))}
      </div>

      <SectionCard title={activeTab} actions={<Button size="sm" variant="ghost" icon={RefreshCw} onClick={() => fetchTab(activeTab)}>Refresh</Button>}>
        <DataTable columns={current.columns} data={current.data} loading={loading} emptyMessage={current.empty} />
      </SectionCard>

      {/* Add Staff Modal */}
      <Modal open={staffOpen} onClose={() => { setStaffOpen(false); setForm({}); }} title="Add Staff Member"
        width={520}
        footer={[
          <Button key="cancel" variant="secondary" onClick={() => setStaffOpen(false)}>Cancel</Button>,
          <Button key="save" loading={saving} onClick={handleCreateStaff}>Create Staff</Button>,
        ]}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Full Name" required style={{ gridColumn: '1 / -1' }}>
            <Input placeholder="Full name" value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </FormField>
          <FormField label="Email" required>
            <Input type="email" placeholder="staff@hospital.org" value={form.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </FormField>
          <FormField label="Phone">
            <Input placeholder="Phone number" value={form.phone ?? ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </FormField>
          <FormField label="Role" required>
            <Select value={form.role ?? ''} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="">Select role</option>
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
              <option value="lab">Lab Technician</option>
              <option value="reception">Receptionist</option>
              <option value="admin">Admin</option>
              <option value="dmo">DMO</option>
            </Select>
          </FormField>
          <FormField label="Department">
            <Input placeholder="Department" value={form.department ?? ''} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
          </FormField>
        </div>
      </Modal>

      {/* Add Department Modal */}
      <Modal open={deptOpen} onClose={() => { setDeptOpen(false); setForm({}); }} title="Add Department"
        width={440}
        footer={[
          <Button key="cancel" variant="secondary" onClick={() => setDeptOpen(false)}>Cancel</Button>,
          <Button key="save" loading={saving} onClick={handleCreateDept}>Create</Button>,
        ]}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="Department Name" required>
            <Input placeholder="e.g. Cardiology" value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </FormField>
          <FormField label="Head of Department">
            <Input placeholder="Doctor name" value={form.head ?? ''} onChange={e => setForm(f => ({ ...f, head: e.target.value }))} />
          </FormField>
          <FormField label="Total Beds">
            <Input type="number" placeholder="0" value={form.bed_count ?? ''} onChange={e => setForm(f => ({ ...f, bed_count: e.target.value }))} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
