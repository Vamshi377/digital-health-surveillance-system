import React, { useState, useEffect } from 'react';
import { BarChart3, Activity, Users, TrendingUp, Download, RefreshCw, Calendar } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import PageHeader  from '../components/ui/PageHeader';
import StatCard    from '../components/ui/StatCard';
import SectionCard from '../components/ui/SectionCard';
import DataTable   from '../components/ui/DataTable';
import Button      from '../components/ui/Button';
import { analyticsService } from '../services/api';

const PERIODS = ['7d', '30d', '90d', '1y'];

export default function DMODashboard() {
  const [period, setPeriod]           = useState('30d');
  const [overview, setOverview]       = useState(null);
  const [patientTrend, setPatientTrend] = useState([]);
  const [deptStats, setDeptStats]     = useState([]);
  const [diseaseTrend, setDiseaseTrend] = useState([]);
  const [opdStats, setOpdStats]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [exporting, setExporting]     = useState(false);

  useEffect(() => { fetchAll(); }, [period]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [ov, pt, ds, dt, opd] = await Promise.allSettled([
        analyticsService.getOverview({ period }),
        analyticsService.getPatientStats({ period }),
        analyticsService.getDepartmentStats({ period }),
        analyticsService.getPatientStats({ period, group_by: 'disease' }),
        analyticsService.getOpdStats({ period }),
      ]);
      if (ov.status === 'fulfilled')  setOverview(ov.value);
      if (pt.status === 'fulfilled')  setPatientTrend(pt.value?.trend ?? []);
      if (ds.status === 'fulfilled')  setDeptStats(ds.value?.items ?? ds.value ?? []);
      if (dt.status === 'fulfilled')  setDiseaseTrend(dt.value?.trend ?? []);
      if (opd.status === 'fulfilled') setOpdStats(opd.value?.trend ?? []);
    } catch { } finally { setLoading(false); }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await analyticsService.exportReport({ period, format: 'pdf' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `medicore-report-${period}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { } finally { setExporting(false); }
  }

  const deptColumns = [
    { key: 'department',    label: 'Department'      },
    { key: 'total_patients',label: 'Total Patients'  },
    { key: 'opd_count',     label: 'OPD'             },
    { key: 'ipd_count',     label: 'IPD'             },
    { key: 'avg_wait_time', label: 'Avg Wait (min)'  },
    { key: 'revenue',       label: 'Revenue', render: v => v ? `₹${Number(v).toLocaleString('en-IN')}` : '—' },
    { key: 'occupancy', label: 'Bed Occ.', render: v => v ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 6, background: 'var(--neutral-100)', borderRadius: 3 }}>
          <div style={{ width: `${Math.min(v, 100)}%`, height: '100%', background: v > 85 ? 'var(--danger-500)' : 'var(--brand-500)', borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--neutral-600)', minWidth: 36 }}>{v}%</span>
      </div>
    ) : '—'},
  ];

  const chartTooltipStyle = {
    background: '#fff',
    border: '1px solid var(--neutral-200)',
    borderRadius: 8,
    fontSize: '0.8rem',
    boxShadow: 'var(--shadow-md)',
  };

  const CHART_COLORS = {
    blue:    '#1a6ff0',
    teal:    '#0d9488',
    violet:  '#7c3aed',
    emerald: '#059669',
    rose:    '#e11d48',
    amber:   '#d97706',
  };

  return (
    <div className="page-enter">
      <PageHeader
        title="Health Analytics"
        subtitle="District-level clinical performance and epidemiological overview"
        icon={BarChart3}
        actions={[
          /* Period selector */
          <div key="period" style={{ display: 'flex', background: 'var(--neutral-100)', borderRadius: 'var(--radius-md)', padding: 3, gap: 2 }}>
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '6px 14px', border: 'none', borderRadius: 8, cursor: 'pointer',
                background: period === p ? '#fff' : 'transparent',
                color: period === p ? 'var(--neutral-900)' : 'var(--neutral-500)',
                fontWeight: period === p ? 700 : 500,
                fontSize: '0.82rem', fontFamily: 'var(--font-sans)',
                boxShadow: period === p ? 'var(--shadow-xs)' : 'none',
                transition: 'all var(--transition-fast)',
              }}>{p}</button>
            ))}
          </div>,
          <Button key="export" icon={Download} variant="secondary" loading={exporting} onClick={handleExport}>Export PDF</Button>,
          <Button key="refresh" icon={RefreshCw} variant="secondary" onClick={fetchAll} />,
        ]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 28 }}>
        <StatCard title="Total Patients"      value={overview?.total_patients}    gradient="stat-gradient-blue"    icon={Users}      sub={`last ${period}`}          trend="up"   trendValue={overview?.patient_growth} />
        <StatCard title="OPD Visits"          value={overview?.opd_visits}        gradient="stat-gradient-teal"    icon={Activity}   sub={`last ${period}`}          trend="up"   trendValue={overview?.opd_growth}     />
        <StatCard title="IPD Admissions"      value={overview?.ipd_admissions}    gradient="stat-gradient-violet"  icon={Calendar}   sub={`last ${period}`}                                                            />
        <StatCard title="Avg Bed Occupancy"   value={overview?.avg_bed_occupancy} gradient="stat-gradient-emerald" icon={BarChart3}  sub="across all wards"                                                          />
        <StatCard title="Avg Wait Time"       value={overview?.avg_wait_time}     gradient="stat-gradient-amber"   icon={TrendingUp} sub="minutes (OPD)"                                                             />
        <StatCard title="Revenue"             value={overview?.total_revenue}     gradient="stat-gradient-rose"    icon={TrendingUp} sub={`last ${period}`}          trend="up"   trendValue={overview?.revenue_growth}/>
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 22, marginBottom: 22 }}>
        <SectionCard title="Patient Volume Trend" subtitle={`Daily patient visits — last ${period}`}>
          <div style={{ height: 240, paddingTop: 8 }}>
            {patientTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={patientTrend}>
                  <defs>
                    <linearGradient id="opdGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={CHART_COLORS.blue}  stopOpacity={0.2} />
                      <stop offset="95%" stopColor={CHART_COLORS.blue}  stopOpacity={0}   />
                    </linearGradient>
                    <linearGradient id="ipdGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={CHART_COLORS.teal}  stopOpacity={0.2} />
                      <stop offset="95%" stopColor={CHART_COLORS.teal}  stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-100)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--neutral-400)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--neutral-400)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.78rem' }} />
                  <Area type="monotone" dataKey="opd" name="OPD"  stroke={CHART_COLORS.blue}  fill="url(#opdGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="ipd" name="IPD"  stroke={CHART_COLORS.teal}  fill="url(#ipdGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <ChartPlaceholder loading={loading} />}
          </div>
        </SectionCard>

        <SectionCard title="OPD by Department" subtitle="Distribution across specialties">
          <div style={{ height: 240, paddingTop: 8 }}>
            {opdStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={opdStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-100)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--neutral-400)' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="department" tick={{ fontSize: 10, fill: 'var(--neutral-500)' }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="count" name="Visits" fill={CHART_COLORS.blue} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <ChartPlaceholder loading={loading} />}
          </div>
        </SectionCard>
      </div>

      {/* Department table */}
      <SectionCard title="Department Performance" subtitle="Key metrics by department">
        <DataTable columns={deptColumns} data={deptStats} loading={loading} emptyMessage="No department data available" />
      </SectionCard>
    </div>
  );
}

function ChartPlaceholder({ loading }) {
  return (
    <div style={{
      height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--neutral-300)', fontSize: '0.85rem', flexDirection: 'column', gap: 10,
    }}>
      {loading ? (
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          border: '3px solid var(--neutral-200)', borderTopColor: 'var(--brand-400)',
          animation: 'spin 0.7s linear infinite',
        }}>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <>
          <BarChart3 size={32} />
          <span>No data for selected period</span>
        </>
      )}
    </div>
  );
}
