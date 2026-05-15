import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, MapPinned, RefreshCw, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
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
import Modal from '../components/ui/Modal';
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
const MAP_DEFAULT_FILL = '#94a3b8';
const DISTRICT_NAME_KEYS = ['D_NAME', 'D_N', 'DISTRICT', 'district', 'dist_name', 'name'];

const normalizeDistrictName = (name) =>
  String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const getFeatureDistrictName = (feature) => {
  const props = feature?.properties || {};
  for (const key of DISTRICT_NAME_KEYS) {
    if (props[key]) return String(props[key]);
  }
  return '';
};

const buildSvgPathFromGeometry = (geometry, projector) => {
  if (!geometry) return '';
  const polygons = geometry.type === 'Polygon'
    ? [geometry.coordinates]
    : geometry.type === 'MultiPolygon'
      ? geometry.coordinates
      : [];
  const parts = [];
  for (const polygon of polygons) {
    for (const ring of polygon) {
      if (!Array.isArray(ring) || !ring.length) continue;
      const [x0, y0] = projector(ring[0][0], ring[0][1]);
      let d = `M ${x0.toFixed(2)} ${y0.toFixed(2)}`;
      for (let i = 1; i < ring.length; i += 1) {
        const [x, y] = projector(ring[i][0], ring[i][1]);
        d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
      }
      d += ' Z';
      parts.push(d);
    }
  }
  return parts.join(' ');
};

const dominantSeverity = (row) => {
  const low = Number(row?.low || 0);
  const moderate = Number(row?.moderate || 0);
  const high = Number(row?.high || 0);
  if (high >= moderate && high >= low) return 'high';
  if (moderate >= low) return 'moderate';
  return 'low';
};

export default function DMODashboard() {
  const location = useLocation();
  const [filters, setFilters] = useState({ district: '', mandal: '', disease: '', fromDate: '', toDate: '' });
  const [overview, setOverview] = useState(null);
  const [burden, setBurden] = useState(null);
  const [cluster, setCluster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clusterLoading, setClusterLoading] = useState(false);
  const [error, setError] = useState('');
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [telanganaGeo, setTelanganaGeo] = useState(null);
  const [hoverDistrict, setHoverDistrict] = useState(null);

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

  useEffect(() => {
    let active = true;
    fetch('/data/telanganaDistricts.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load map data');
        return res.json();
      })
      .then((data) => {
        if (active) setTelanganaGeo(data);
      })
      .catch(() => {
        if (active) setTelanganaGeo(null);
      });
    return () => { active = false; };
  }, []);

  const viewMode = useMemo(() => {
    if (location.pathname.includes('/dmo/clusters')) return 'clusters';
    if (location.pathname.includes('/dmo/trends')) return 'statistics';
    return 'overview';
  }, [location.pathname]);

  const summary = useMemo(() => overview?.districtSummary || {}, [overview]);
  const prioritySummary = useMemo(() => overview?.prioritySummary || null, [overview]);
  const outbreakThreshold = overview?.outbreakSummary?.threshold || 5;
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
  const districtSeverityMap = useMemo(() => {
    const map = new Map();
    districtSeverityData.forEach((row) => {
      map.set(normalizeDistrictName(row.district), row);
    });
    return map;
  }, [districtSeverityData]);
  const telanganaMapShapes = useMemo(() => {
    const features = telanganaGeo?.features || [];
    if (!features.length) return [];

    const allPoints = [];
    features.forEach((feature) => {
      const geometry = feature?.geometry;
      const polygons = geometry?.type === 'Polygon'
        ? [geometry.coordinates]
        : geometry?.type === 'MultiPolygon'
          ? geometry.coordinates
          : [];
      polygons.forEach((polygon) => {
        polygon.forEach((ring) => {
          ring.forEach(([lon, lat]) => allPoints.push([lon, lat]));
        });
      });
    });
    if (!allPoints.length) return [];

    let minLon = Infinity;
    let maxLon = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    for (const [lon, lat] of allPoints) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }

    const width = 700;
    const height = 620;
    const padding = 18;
    const lonScale = (width - padding * 2) / Math.max(maxLon - minLon, 0.00001);
    const latScale = (height - padding * 2) / Math.max(maxLat - minLat, 0.00001);
    const scale = Math.min(lonScale, latScale);
    const projector = (lon, lat) => {
      const x = padding + (lon - minLon) * scale;
      const y = height - padding - (lat - minLat) * scale;
      return [x, y];
    };

    return features.map((feature, idx) => {
      const districtName = getFeatureDistrictName(feature) || `District ${idx + 1}`;
      const districtData = districtSeverityMap.get(normalizeDistrictName(districtName));
      const severity = districtData ? dominantSeverity(districtData) : null;
      return {
        districtName,
        districtData,
        severity,
        fill: severity ? SEVERITY_COLORS[severity] : MAP_DEFAULT_FILL,
        path: buildSvgPathFromGeometry(feature.geometry, projector)
      };
    });
  }, [telanganaGeo, districtSeverityMap]);
  const diseaseChartData = useMemo(
    () => (overview?.diseaseDistribution || []).slice(0, 6).map((item) => ({ ...item, totalAffected: Number(item.totalAffected || 0) })),
    [overview]
  );
  const highPriorityDistricts = prioritySummary?.highPriorityDistricts || [];
  const highPriorityMandals = prioritySummary?.highPriorityMandals || [];

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

  const clusterColumns = [
    { key: 'patientCode', label: 'Patient Code' },
    { key: 'fullName', label: 'Patient' },
    { key: 'contactNumber', label: 'Contact' },
    { key: 'predictedSeverity', label: 'Severity' }
  ];
  const districtPriorityColumns = [
    { key: 'district', label: 'District' },
    { key: 'totalCases', label: 'Cases' },
    { key: 'highSeverityCases', label: 'High Severity' },
    { key: 'priorityScore', label: 'Priority Score' },
    { key: 'reason', label: 'Reason' }
  ];
  const mandalPriorityColumns = [
    { key: 'district', label: 'District' },
    { key: 'mandal', label: 'Mandal' },
    { key: 'totalCases', label: 'Cases' },
    { key: 'highSeverityCases', label: 'High Severity' },
    { key: 'priorityScore', label: 'Priority Score' },
    { key: 'reason', label: 'Reason' }
  ];

  const pageTitle = viewMode === 'statistics' ? 'DMO Statistics' : viewMode === 'clusters' ? 'DMO Clusters' : 'Digital Surveillance';
  const pageSubtitle = viewMode === 'statistics'
    ? 'Review severity charts, disease share, outbreak alerts, and mandal-level trends'
    : viewMode === 'clusters'
      ? 'Find patient clusters for a selected mandal and disease'
      : 'Monitor alerts, priority mandals, and the current disease situation';

  return (
    <div className="page-enter">
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        icon={BarChart3}
        actions={[
          <Button key="priority" icon={AlertTriangle} onClick={() => setPriorityOpen(true)}>Priority Areas</Button>,
          <Button key="refresh" icon={RefreshCw} variant="secondary" onClick={loadAnalytics}>Refresh</Button>
        ]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 28 }}>
        <StatCard title="Total Cases" value={summary.totalCases || 0} gradient="stat-gradient-blue" icon={Activity} sub="current filter window" />
        <StatCard title="Top Disease" value={summary.topDisease || '-'} gradient="stat-gradient-violet" icon={BarChart3} sub="highest burden" />
        <StatCard title="Priority Districts" value={highPriorityDistricts.length} gradient="stat-gradient-amber" icon={AlertTriangle} sub="medical camp targets" />
        <StatCard title="Priority Mandals" value={highPriorityMandals.length} gradient="stat-gradient-teal" icon={MapPinned} sub={`last ${prioritySummary?.windowDays || 7} days`} />
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

      {viewMode === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
          <SectionCard title="High Priority Districts" subtitle="Districts that should be considered for medical camps">
            <DataTable columns={districtPriorityColumns} data={highPriorityDistricts} loading={loading} emptyMessage="No high priority districts found in the last 7 days" />
          </SectionCard>

          <SectionCard title="High Priority Mandals" subtitle="Mandal-level local hotspots from the same 7-day window">
            <DataTable columns={mandalPriorityColumns} data={highPriorityMandals} loading={loading} emptyMessage="No high priority mandals found in the last 7 days" />
          </SectionCard>

          <SectionCard title="Outbreak Warnings" subtitle={`Alerts raised when total cases go above ${outbreakThreshold}`}>
            <DataTable columns={warningColumns} data={overview?.outbreakWarnings || []} loading={loading} emptyMessage="No outbreak warnings found" />
          </SectionCard>

          <SectionCard title="Disease Distribution" subtitle="Case contribution by disease">
            <DataTable columns={distributionColumns} data={overview?.diseaseDistribution || []} loading={loading} emptyMessage="No disease distribution available" />
          </SectionCard>
        </div>
      )}

      {viewMode === 'statistics' && (
        <SectionCard title="Statistics" subtitle="Visual overview of active district-wise severity, disease share, and trend" style={{ marginBottom: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
            <div className="card" style={{ padding: 18, minHeight: 360 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--neutral-800)' }}>Telangana Severity Map</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', marginBottom: 10 }}>
                Green = Low, Yellow = Moderate, Red = High (dominant district severity)
              </div>
              {telanganaMapShapes.length === 0 ? (
                <div style={{ color: 'var(--neutral-500)', fontSize: '0.85rem' }}>Loading Telangana district map...</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 12, alignItems: 'start' }}>
                  <div style={{ border: '1px solid rgba(15,118,110,0.2)', borderRadius: 12, background: 'linear-gradient(165deg, #f0fdfa 0%, #f8fafc 100%)', padding: 6 }}>
                    <svg viewBox="0 0 700 620" style={{ width: '100%', height: 'auto', display: 'block' }}>
                      {telanganaMapShapes.map((shape) => (
                        <path
                          key={shape.districtName}
                          d={shape.path}
                          fill={shape.fill}
                          stroke="#0f172a"
                          strokeWidth="0.65"
                          style={{ cursor: 'pointer', opacity: hoverDistrict === shape.districtName ? 0.86 : 1 }}
                          onMouseEnter={() => setHoverDistrict(shape.districtName)}
                          onMouseLeave={() => setHoverDistrict(null)}
                        />
                      ))}
                    </svg>
                  </div>
                  <div style={{ border: '1px solid rgba(15,118,110,0.15)', borderRadius: 12, padding: 12, background: '#ffffff' }}>
                    {(() => {
                      const selected = telanganaMapShapes.find((entry) => entry.districtName === hoverDistrict) || null;
                      const row = selected?.districtData;
                      return (
                        <>
                          <div style={{ fontSize: '0.78rem', color: 'var(--neutral-500)', marginBottom: 8 }}>Hover District Details</div>
                          <div style={{ fontWeight: 700, color: 'var(--neutral-800)', marginBottom: 8 }}>
                            {selected?.districtName || 'Hover on map'}
                          </div>
                          <div style={{ display: 'grid', gap: 4, fontSize: '0.8rem', color: 'var(--neutral-600)' }}>
                            <div>Total Cases: <strong style={{ color: 'var(--neutral-800)' }}>{row?.total ?? '—'}</strong></div>
                            <div>Low: <strong style={{ color: SEVERITY_COLORS.low }}>{row?.low ?? '—'}</strong></div>
                            <div>Moderate: <strong style={{ color: SEVERITY_COLORS.moderate }}>{row?.moderate ?? '—'}</strong></div>
                            <div>High: <strong style={{ color: SEVERITY_COLORS.high }}>{row?.high ?? '—'}</strong></div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

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
      )}

      {viewMode === 'clusters' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
          <SectionCard title="High Priority Mandals" subtitle="Use one of these mandals to drill into patient clusters">
            <DataTable columns={mandalPriorityColumns} data={highPriorityMandals} loading={loading} emptyMessage="No high priority mandals found in the last 7 days" />
          </SectionCard>
          <SectionCard title="Patient Cluster" subtitle="Requires mandal and disease filters">
            <DataTable columns={clusterColumns} data={cluster?.patients || []} loading={clusterLoading} emptyMessage="Set mandal and disease, then click Load Patient Cluster" />
          </SectionCard>
        </div>
      )}

      <Modal
        open={priorityOpen}
        onClose={() => setPriorityOpen(false)}
        title="Priority Areas"
        width={760}
        footer={[<Button key="close" onClick={() => setPriorityOpen(false)}>Close</Button>]}
      >
        <div style={{ marginBottom: 14, color: 'var(--neutral-500)', fontSize: '0.85rem', lineHeight: 1.6 }}>
          Districts are flagged only when they have at least <strong>{prioritySummary?.districtThresholds?.totalCases || 50} cases</strong> in the last <strong>{prioritySummary?.windowDays || 7} days</strong> and at least <strong>{prioritySummary?.districtThresholds?.highSeverityCases || 10} high severity cases</strong>.
          Mandals are flagged only when they have at least <strong>{prioritySummary?.mandalThresholds?.totalCases || 10} cases</strong> and at least <strong>{prioritySummary?.mandalThresholds?.highSeverityCases || 5} high severity cases</strong>.
        </div>
        <div style={{ display: 'grid', gap: 18 }}>
          <SectionCard title="High Priority Districts" subtitle="Districts that should receive medical camps">
            <DataTable columns={districtPriorityColumns} data={highPriorityDistricts} loading={loading} emptyMessage="No high priority districts found in the last 7 days" />
          </SectionCard>
          <SectionCard title="High Priority Mandals" subtitle="Local priority mandals from the same recent window">
            <DataTable columns={mandalPriorityColumns} data={highPriorityMandals} loading={loading} emptyMessage="No high priority mandals found in the last 7 days" />
          </SectionCard>
        </div>
      </Modal>
    </div>
  );
}
