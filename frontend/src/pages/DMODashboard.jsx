import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, MapPinned, RefreshCw, Search } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import FormField, { Input, Select } from '../components/ui/FormField';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import StatCard from '../components/ui/StatCard';
import { analyticsService } from '../services/api';
import { TELANGANA_DISTRICTS } from '../constants/locations';

const SEVERITY_COLORS = {
  low: '#14b8a6',
  moderate: '#f59e0b',
  high: '#ef4444'
};

const DISEASE_COLORS = ['#0f766e', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#22c55e'];

export default function DMODashboard() {
  const [filters, setFilters] = useState({ district: '', mandal: '', disease: '', fromDate: '', toDate: '' });
  const [overview, setOverview] = useState(null);
  const [burden, setBurden] = useState(null);
  const [cluster, setCluster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clusterLoading, setClusterLoading] = useState(false);
  const [error, setError] = useState('');

  const loadAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const [overviewData, burdenData] = await Promise.all([
        analyticsService.getOverview(filters),
        analyticsService.getDiseaseBurden(filters)
      ]);
      setOverview(overviewData);
      setBurden(burdenData);
    } catch (err) {
      setError(err.message);
      setOverview(null);
      setBurden(null);
    } finally {
      setLoading(false);
    }
  };

  const loadCluster = async () => {
    if (!filters.mandal || !filters.disease) return;
    setClusterLoading(true);
    setError('');
    try {
      const data = await analyticsService.getPatientCluster(filters);
      setCluster(data);
    } catch (err) {
      setError(err.message);
      setCluster(null);
    } finally {
      setClusterLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const summary = useMemo(() => overview?.districtSummary || {}, [overview]);
  const severityChartData = useMemo(
    () => (overview?.severityTotals || []).map((item) => ({ ...item, total: Number(item.total || 0) })),
    [overview]
  );
  const dailyTrendChartData = useMemo(() => {
    const rows = overview?.dailyTrend || [];
    const grouped = rows.reduce((acc, item) => {
      const key = item.date;
      acc[key] = (acc[key] || 0) + Number(item.total || 0);
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, total]) => ({ date, total }));
  }, [overview]);
  const districtSeverityData = useMemo(() => {
    const rows = burden?.mandalSummary || [];
    const grouped = rows.reduce((acc, item) => {
      const district = item.district || 'Unknown';
      if (!acc[district]) {
        acc[district] = { district, low: 0, moderate: 0, high: 0, total: 0 };
      }

      const low = Number(item.severity?.low || 0);
      const moderate = Number(item.severity?.moderate || 0);
      const high = Number(item.severity?.high || 0);

      acc[district].low += low;
      acc[district].moderate += moderate;
      acc[district].high += high;
      acc[district].total += Number(item.totalAffected || 0);
      return acc;
    }, {});

    return Object.values(grouped).sort((left, right) => right.total - left.total);
  }, [burden]);
  const diseaseChartData = useMemo(
    () => (overview?.diseaseDistribution || []).slice(0, 6).map((item) => ({ ...item, totalAffected: Number(item.totalAffected || 0) })),
    [overview]
  );

  const distributionColumns = [
    { key: 'disease', label: 'Disease' },
    { key: 'totalAffected', label: 'Cases' },
    { key: 'percentage', label: 'Share %' }
  ];

  const warningColumns = [
    { key: 'district', label: 'District' },
    { key: 'mandal', label: 'Mandal' },
    { key: 'disease', label: 'Disease' },
    { key: 'totalCases', label: 'Cases' }
  ];

  const burdenColumns = [
    { key: 'district', label: 'District' },
    { key: 'mandal', label: 'Mandal' },
    { key: 'disease', label: 'Disease' },
    { key: 'totalAffected', label: 'Affected' }
  ];

  const clusterColumns = [
    { key: 'patientCode', label: 'Patient Code' },
    { key: 'fullName', label: 'Patient' },
    { key: 'contactNumber', label: 'Contact' },
    { key: 'predictedSeverity', label: 'Severity' }
  ];

  return (
    <div className="page-enter">
      <PageHeader title="Digital Surveillance" subtitle="Disease burden, outbreak warnings, patient clusters, and active-case statistics" icon={BarChart3} actions={[<Button key="refresh" icon={RefreshCw} variant="secondary" onClick={loadAnalytics}>Refresh</Button>]} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 28 }}>
        <StatCard title="Total Cases" value={summary.totalCases || 0} gradient="stat-gradient-blue" icon={Activity} sub="current filter window" />
        <StatCard title="Top Disease" value={summary.topDisease || '-'} gradient="stat-gradient-violet" icon={BarChart3} sub="highest burden" />
        <StatCard title="High Risk Mandals" value={summary.highRiskMandals || 0} gradient="stat-gradient-amber" icon={AlertTriangle} sub="priority areas" />
        <StatCard title="Mapped Mandals" value={summary.totalMandals || 0} gradient="stat-gradient-teal" icon={MapPinned} sub="available comparisons" />
      </div>

      {error && (
        <div className="card" style={{ padding: '14px 18px', marginBottom: 18, borderColor: 'rgba(239,68,68,0.3)' }}>
          <div style={{ color: 'var(--danger-700)', fontWeight: 600, fontSize: '0.88rem' }}>{error}</div>
        </div>
      )}

      <SectionCard title="Filter Analytics" subtitle="Use district, mandal, disease, and date filters" style={{ marginBottom: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 16 }}>
          <FormField label="District">
            <Select value={filters.district} onChange={(event) => setFilters((prev) => ({ ...prev, district: event.target.value }))}>
              <option value="">All districts</option>
              {TELANGANA_DISTRICTS.map((district) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Mandal"><Input value={filters.mandal} onChange={(event) => setFilters((prev) => ({ ...prev, mandal: event.target.value }))} /></FormField>
          <FormField label="Disease"><Input value={filters.disease} onChange={(event) => setFilters((prev) => ({ ...prev, disease: event.target.value }))} /></FormField>
          <FormField label="From Date"><Input type="date" value={filters.fromDate} onChange={(event) => setFilters((prev) => ({ ...prev, fromDate: event.target.value }))} /></FormField>
          <FormField label="To Date"><Input type="date" value={filters.toDate} onChange={(event) => setFilters((prev) => ({ ...prev, toDate: event.target.value }))} /></FormField>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Button icon={Search} onClick={loadAnalytics}>Apply Filters</Button>
            <Button variant="secondary" onClick={loadCluster} loading={clusterLoading}>Load Patient Cluster</Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Statistics" subtitle="Visual overview of active district-wise severity, disease share, and trend" style={{ marginBottom: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
          <div className="card" style={{ padding: 18, minHeight: 320 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--neutral-800)' }}>Severity Split</div>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={severityChartData} dataKey="total" nameKey="severity" innerRadius={55} outerRadius={88} paddingAngle={4}>
                    {severityChartData.map((entry) => (
                      <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ padding: 18, minHeight: 320 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--neutral-800)' }}>Disease Share</div>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={diseaseChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="disease" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="totalAffected" radius={[8, 8, 0, 0]}>
                    {diseaseChartData.map((entry, index) => (
                      <Cell key={entry.disease} fill={DISEASE_COLORS[index % DISEASE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ padding: 18, minHeight: 340 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--neutral-800)' }}>District-wise Severity</div>
            <div style={{ height: 270, overflowX: 'auto' }}>
              <div style={{ minWidth: `${Math.max(720, districtSeverityData.length * 90)}px`, height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={districtSeverityData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="district" tick={{ fontSize: 12 }} interval={0} angle={-18} textAnchor="end" height={70} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="low" stackId="severity" fill={SEVERITY_COLORS.low} radius={[0, 0, 4, 4]} />
                    <Bar dataKey="moderate" stackId="severity" fill={SEVERITY_COLORS.moderate} />
                    <Bar dataKey="high" stackId="severity" fill={SEVERITY_COLORS.high} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 18, minHeight: 340 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--neutral-800)' }}>Active Case Trend</div>
            <div style={{ height: 270 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrendChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </SectionCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        <SectionCard title="Disease Distribution" subtitle="Case contribution by disease">
          <DataTable columns={distributionColumns} data={overview?.diseaseDistribution || []} loading={loading} emptyMessage="No disease distribution available" />
        </SectionCard>
        <SectionCard title="Outbreak Warnings" subtitle="Areas crossing alert threshold">
          <DataTable columns={warningColumns} data={overview?.outbreakWarnings || []} loading={loading} emptyMessage="No outbreak warnings found" />
        </SectionCard>
        <SectionCard title="Disease Burden by Mandal" subtitle="Affected counts from disease burden endpoint">
          <DataTable columns={burdenColumns} data={burden?.mandalSummary || []} loading={loading} emptyMessage="No burden rows available" />
        </SectionCard>
        <SectionCard title="Patient Cluster" subtitle="Requires mandal and disease filters">
          <DataTable columns={clusterColumns} data={cluster?.patients || []} loading={clusterLoading} emptyMessage="Load a patient cluster to view patient-level results" />
        </SectionCard>
      </div>
    </div>
  );
}
