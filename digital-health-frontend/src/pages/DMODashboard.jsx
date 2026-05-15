import React, { useState, useEffect, useCallback, useMemo } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { Card, StatCard, Button, SectionHeader, LoadingSpinner, EmptyState, SkeletonGrid } from '../components/ui'
import { analyticsAPI } from '../services/api'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { BarChart3, AlertTriangle, Activity, MapPin, RefreshCw, TrendingUp, TrendingDown, Users, ToggleLeft, ToggleRight, Download } from 'lucide-react'

const SEVERITY_COLORS = { low: '#00e5a0', moderate: '#f59e0b', high: '#f43f5e' }
const CHART_COLORS    = ['#00e5a0','#0099ff','#f59e0b','#f43f5e','#8b5cf6','#06b6d4','#10b981']
const MAP_DEFAULT_FILL = '#334155'
const INPUT_STYLE = { width: 'auto', minWidth: '170px', padding: '8px 12px', fontSize: '0.82rem', background: '#f9fcfe' }

const DISTRICT_NAME_KEYS = ['D_NAME', 'D_N', 'DISTRICT', 'district', 'dist_name', 'name']

function normalizeBurdenRows(payload) {
  const rawRows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.districts)
      ? payload.districts
      : Array.isArray(payload?.mandalSummary)
        ? payload.mandalSummary
        : Array.isArray(payload?.areaSummary)
          ? payload.areaSummary
          : []

  return rawRows.map((row) => {
    const severity = row?.severity || {}
    const low = Number(row?.low ?? severity.low ?? 0)
    const moderate = Number(row?.moderate ?? severity.moderate ?? 0)
    const high = Number(row?.high ?? severity.high ?? 0)
    const total =
      row?.total != null
        ? Number(row.total)
        : row?.totalAffected != null
          ? Number(row.totalAffected)
          : low + moderate + high

    return {
      ...row,
      district: row?.district || 'Unknown',
      mandal: row?.mandal || row?.area || 'Unknown',
      total,
      low,
      moderate,
      high,
      priority:
        high >= 10 || total >= 50
          ? 'HIGH'
          : high >= 5 || total >= 20
            ? 'MEDIUM'
            : 'LOW',
      trend: row?.trend || null,
    }
  })
}

function normalizeOverview(payload) {
  const severityPie = Array.isArray(payload?.severityPie)
    ? payload.severityPie
    : (payload?.severityTotals || []).map(item => ({
        name: item.severity,
        value: Number(item.total || 0),
      }))

  const totalCases = payload?.totalCases ?? payload?.districtSummary?.totalCases ?? severityPie.reduce((sum, item) => sum + Number(item.value || 0), 0)
  const highCases = severityPie.find(item => item.name === 'high')?.value || 0

  const trendMap = new Map()
  ;(payload?.trend || payload?.dailyTrend || []).forEach(item => {
    const date = item.date
    trendMap.set(date, (trendMap.get(date) || 0) + Number(item.cases ?? item.total ?? 0))
  })
  const trend = Array.from(trendMap.entries())
    .map(([date, cases]) => ({ date, cases }))
    .sort((left, right) => left.date.localeCompare(right.date))

  const topDiseases = Array.isArray(payload?.topDiseases)
    ? payload.topDiseases
    : (payload?.diseaseDistribution || payload?.diseaseTotals || []).map(item => ({
        disease: item.disease,
        count: Number(item.count ?? item.totalAffected ?? 0),
      }))

  const weekComparison = Array.isArray(payload?.weekComparison)
    ? payload.weekComparison
    : (payload?.weeklyComparison?.diseases || []).map(item => ({
        day: item.disease,
        thisWeek: Number(item.currentCases || 0),
        lastWeek: Number(item.previousCases || 0),
      }))

  return {
    ...payload,
    totalCases,
    highPct: totalCases > 0 ? Math.round((Number(highCases) / totalCases) * 100) : 0,
    pressureScore: severityPie.reduce((sum, item) => {
      const weight = item.name === 'high' ? 3 : item.name === 'moderate' ? 2 : 1
      return sum + Number(item.value || 0) * weight
    }, 0),
    caseChange: payload?.caseChange ?? payload?.weeklyComparison?.totals?.deltaPct,
    trend,
    severityPie,
    topDiseases,
    weekComparison,
  }
}

function normalizeDistrictName(name) {
  const normalized = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  if (normalized === 'jagitial' || normalized === 'jagtial') return 'jagtial'
  return normalized
}

function getFeatureDistrictName(feature) {
  const props = feature?.properties || {}
  for (const key of DISTRICT_NAME_KEYS) {
    if (props[key]) return String(props[key])
  }
  return ''
}

function buildSvgPathFromGeometry(geometry, projector) {
  if (!geometry) return ''
  const polys = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : []
  const parts = []
  for (const polygon of polys) {
    for (const ring of polygon) {
      if (!Array.isArray(ring) || ring.length === 0) continue
      const [firstX, firstY] = projector(ring[0][0], ring[0][1])
      let path = `M ${firstX.toFixed(2)} ${firstY.toFixed(2)}`
      for (let i = 1; i < ring.length; i += 1) {
        const [x, y] = projector(ring[i][0], ring[i][1])
        path += ` L ${x.toFixed(2)} ${y.toFixed(2)}`
      }
      path += ' Z'
      parts.push(path)
    }
  }
  return parts.join(' ')
}

function getGeometryBounds(features) {
  let minLon = Infinity
  let maxLon = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity
  let hasPoints = false

  features.forEach((feature) => {
    const geometry = feature?.geometry
    const polys =
      geometry?.type === 'Polygon'
        ? [geometry.coordinates]
        : geometry?.type === 'MultiPolygon'
          ? geometry.coordinates
          : []

    polys.forEach((polygon) => {
      polygon.forEach((ring) => {
        ring.forEach(([lon, lat]) => {
          hasPoints = true
          if (lon < minLon) minLon = lon
          if (lon > maxLon) maxLon = lon
          if (lat < minLat) minLat = lat
          if (lat > maxLat) maxLat = lat
        })
      })
    })
  })

  if (!hasPoints) return null

  return { minLon, maxLon, minLat, maxLat }
}

function dominantSeverity(row) {
  const low = Number(row?.low || 0)
  const moderate = Number(row?.moderate || 0)
  const high = Number(row?.high || 0)
  if (high >= moderate && high >= low) return 'high'
  if (moderate >= low) return 'moderate'
  return 'low'
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.8rem' }}>
      {label && <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '4px' }}>{label}</p>}
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color || 'var(--text-secondary)' }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong>
        </p>
      ))}
    </div>
  )
}

export default function DMODashboard() {
  const [demoMode, setDemoMode] = useState(true)
  const [overview, setOverview] = useState(null)
  const [burden, setBurden] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [filters, setFilters] = useState({ district: '', fromDate: '', toDate: '' })
  const [alertThreshold, setAlertThreshold] = useState(5)
  const [alerts, setAlerts] = useState([])
  const [telanganaGeo, setTelanganaGeo] = useState(null)
  const [mapError, setMapError] = useState('')
  const [hoverDistrict, setHoverDistrict] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { demo: demoMode, ...filters, alertThreshold }
      const [ovRes, bdRes, alertRes] = await Promise.all([
        analyticsAPI.getOverview(params),
        analyticsAPI.getDiseaseBurden(params),
        analyticsAPI.getAlerts(params),
      ])
      setOverview(normalizeOverview(ovRes.data))
      setBurden(normalizeBurdenRows(bdRes.data))
      setAlerts(alertRes.data.alerts || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics. Check backend connection.')
      setOverview(null)
      setBurden([])
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }, [demoMode, filters, alertThreshold])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(fetchData, 30000)
    return () => clearInterval(id)
  }, [autoRefresh, fetchData])

  useEffect(() => {
    let active = true
    fetch('/data/telanganaDistricts.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load Telangana map data')
        return res.json()
      })
      .then(data => {
        if (active) {
          setTelanganaGeo(data)
          setMapError('')
        }
      })
      .catch(() => {
        if (active) {
          setTelanganaGeo(null)
          setMapError('Unable to load Telangana map file.')
        }
      })
    return () => { active = false }
  }, [])

  const burdenByDistrict = useMemo(() => {
    const map = new Map()
    burden.forEach(row => {
      const key = normalizeDistrictName(row.district)
      const current = map.get(key) || {
        district: row.district,
        total: 0,
        low: 0,
        moderate: 0,
        high: 0,
      }
      current.total += Number(row.total || 0)
      current.low += Number(row.low || 0)
      current.moderate += Number(row.moderate || 0)
      current.high += Number(row.high || 0)
      map.set(key, current)
    })
    return map
  }, [burden])

  const mapShapes = useMemo(() => {
    const features = telanganaGeo?.features || []
    if (!features.length) return []

    const bounds = getGeometryBounds(features)
    if (!bounds) return []

    const { minLon, maxLon, minLat, maxLat } = bounds

    const width = 700
    const height = 620
    const padding = 18
    const lonScale = (width - padding * 2) / Math.max(maxLon - minLon, 0.00001)
    const latScale = (height - padding * 2) / Math.max(maxLat - minLat, 0.00001)
    const scale = Math.min(lonScale, latScale)

    const projector = (lon, lat) => {
      const x = padding + (lon - minLon) * scale
      const y = height - padding - (lat - minLat) * scale
      return [x, y]
    }

    return features.map((feature, idx) => {
      const districtName = getFeatureDistrictName(feature) || `District ${idx + 1}`
      const districtData = burdenByDistrict.get(normalizeDistrictName(districtName))
      const sev = districtData ? dominantSeverity(districtData) : null
      const fill = sev ? SEVERITY_COLORS[sev] : MAP_DEFAULT_FILL
      return {
        districtName,
        districtData,
        severity: sev,
        fill,
        path: buildSvgPathFromGeometry(feature.geometry, projector),
      }
    })
  }, [telanganaGeo, burdenByDistrict])

  const exportBurden = async () => {
    const res = await analyticsAPI.exportDiseaseBurden({ demo: demoMode, ...filters })
    const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'dmo-disease-burden.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout title="DMO Analytics" subtitle="District Medical Officer — Disease Surveillance">

      {/* Controls bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Data Mode:</span>
          <button
            onClick={() => setDemoMode(d => !d)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', color: demoMode ? 'var(--accent-amber)' : 'var(--accent-primary)', fontWeight: 700, fontSize: '0.83rem', cursor: 'pointer' }}
          >
            {demoMode ? <ToggleLeft size={20} /> : <ToggleRight size={20} />}
            {demoMode ? 'Demo' : 'Live'}
          </button>
        </div>

        {/* Date filters */}
        <input type="date" value={filters.fromDate} onChange={e => setFilters(f => ({ ...f, fromDate: e.target.value }))} style={INPUT_STYLE} />
        <input type="date" value={filters.toDate}   onChange={e => setFilters(f => ({ ...f, toDate: e.target.value }))}   style={INPUT_STYLE} />
        <input
          type="number"
          min="1"
          value={alertThreshold}
          onChange={e => setAlertThreshold(e.target.value)}
          title="Cases required to trigger an outbreak alert"
          style={{ ...INPUT_STYLE, minWidth: '140px' }}
        />

        <Button icon={RefreshCw} variant="secondary" size="sm" onClick={fetchData}>Refresh</Button>
        <Button icon={Download} variant="secondary" size="sm" onClick={exportBurden}>Export CSV</Button>

        {/* Auto-refresh toggle */}
        <button
          onClick={() => setAutoRefresh(a => !a)}
          style={{
            padding: '8px 14px',
            background: autoRefresh ? 'rgba(0,229,160,0.12)' : 'var(--bg-card)',
            border: `1px solid ${autoRefresh ? 'rgba(0,229,160,0.3)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-sm)',
            color: autoRefresh ? 'var(--accent-primary)' : 'var(--text-muted)',
            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          <span style={{ width: '8px', height: '8px', background: autoRefresh ? 'var(--accent-primary)' : 'var(--text-muted)', borderRadius: '50%', animation: autoRefresh ? 'pulse-glow 1.5s infinite' : 'none' }} />
          {autoRefresh ? 'Auto-Refresh ON (30s)' : 'Auto-Refresh OFF'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Total Cases"     value={loading ? '—' : overview?.totalCases    ?? '—'} icon={Users}         accent="var(--accent-primary)"   change={overview?.caseChange} />
        <StatCard label="High Severity %"  value={loading ? '—' : overview?.highPct       != null ? `${overview.highPct}%` : '—'} icon={AlertTriangle} accent="var(--accent-rose)" />
        <StatCard label="Pressure Score"   value={loading ? '—' : overview?.pressureScore ?? '—'} icon={Activity}      accent="var(--accent-amber)" />
        <StatCard label="Active Alerts"    value={loading ? '—' : alerts.length} icon={BarChart3}     accent="var(--accent-violet)" />
      </div>

      {loading ? (
        <>
          <SkeletonGrid cards={4} />
          <LoadingSpinner label="Processing district analytics and heatmap overlays..." />
        </>
      ) : error ? (
        <Card style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ color: 'var(--accent-rose)', fontSize: '0.875rem', marginBottom: '16px' }}>{error}</p>
          <Button variant="secondary" onClick={fetchData} icon={RefreshCw}>Retry</Button>
        </Card>
      ) : !overview ? (
        <EmptyState icon={BarChart3} title="No analytics data" subtitle="Run the seed script or switch to Demo mode to see analytics." />
      ) : (
        <>
          <Card style={{ marginBottom: '20px' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <SectionHeader title="Outbreak Alerts" subtitle={`Areas crossing ${alertThreshold || 5}+ cases in the selected window`} />
            </div>
            {alerts.length === 0 ? (
              <EmptyState icon={AlertTriangle} title="No active alerts" subtitle="Lower the threshold or expand the date range to review possible clusters." />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>District</th>
                      <th>Mandal</th>
                      <th>Disease</th>
                      <th>Total Cases</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((alert, index) => (
                      <tr key={`${alert.district}-${alert.mandal}-${alert.disease}-${index}`}>
                        <td>{alert.district || 'Unknown'}</td>
                        <td>{alert.mandal || alert.area || 'Unknown'}</td>
                        <td>{alert.disease}</td>
                        <td><span className="badge badge-rose">{alert.totalCases}</span></td>
                        <td>Threshold crossed</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Row 1: Trend + Pie */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '20px', marginBottom: '20px' }}>
            <Card style={{ padding: '20px' }}>
              <SectionHeader title="Cases Trend" subtitle="Daily case count" />
              {overview.trend?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={overview.trend}>
                    <defs>
                      <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#00e5a0" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00e5a0" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date"  tick={{ fill: '#4a6080', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis               tick={{ fill: '#4a6080', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="cases" name="Cases" stroke="#00e5a0" strokeWidth={2} fill="url(#trendGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <EmptyState icon={Activity} title="No trend data" subtitle="No case trend data available." />}
            </Card>

            <Card style={{ padding: '20px' }}>
              <SectionHeader title="Severity Split" subtitle="All cases" />
              {overview.severityPie?.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={overview.severityPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {overview.severityPie.map((entry, i) => (
                          <Cell key={i} fill={SEVERITY_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '8px', fontSize: '0.8rem' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {overview.severityPie.map(({ name, value }) => (
                      <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem' }}>
                        <div style={{ width: '8px', height: '8px', background: SEVERITY_COLORS[name] || '#8fa8c8', borderRadius: '50%' }} />
                        <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{name}: <strong style={{ color: 'var(--text-primary)' }}>{value}</strong></span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <EmptyState icon={Activity} title="No data" subtitle="No severity data available." />}
            </Card>
          </div>

          {/* Row 2: Top Diseases + Week comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '20px', marginBottom: '20px' }}>
            <Card style={{ padding: '20px' }}>
              <SectionHeader title="Top Diseases" subtitle="By case count" />
              {overview.topDiseases?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={overview.topDiseases} layout="vertical">
                    <XAxis type="number" tick={{ fill: '#4a6080', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="disease" tick={{ fill: '#8fa8c8', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" name="Cases" radius={[0, 4, 4, 0]}>
                      {overview.topDiseases.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState icon={BarChart3} title="No disease data" subtitle="No diagnosed cases yet." />}
            </Card>

            <Card style={{ padding: '20px' }}>
              <SectionHeader title="Week-over-Week" subtitle="Current vs previous week" />
              {overview.weekComparison?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={overview.weekComparison}>
                    <XAxis dataKey="day"  tick={{ fill: '#4a6080', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis               tick={{ fill: '#4a6080', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-muted)' }} />
                    <Bar dataKey="thisWeek" name="This Week" fill="#00e5a0" radius={[4,4,0,0]} />
                    <Bar dataKey="lastWeek" name="Last Week" fill="#0099ff" radius={[4,4,0,0]} opacity={0.6} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState icon={TrendingUp} title="No comparison data" subtitle="No weekly comparison data available." />}
            </Card>
          </div>

          {/* District Burden Table */}
          <Card style={{ marginBottom: '20px', padding: '20px' }}>
            <SectionHeader title="Telangana District Severity Map" subtitle="District color = dominant severity (green low, yellow moderate, red high)" />
            {mapError ? (
              <EmptyState icon={MapPin} title="Map unavailable" subtitle={mapError} />
            ) : mapShapes.length === 0 ? (
              <EmptyState icon={MapPin} title="Map loading" subtitle="Loading Telangana district boundaries..." />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '16px', alignItems: 'start' }}>
                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: 'linear-gradient(160deg, #0b1726 0%, #0f2238 100%)', padding: '8px' }}>
                  <svg viewBox="0 0 700 620" style={{ width: '100%', height: 'auto', display: 'block' }}>
                    {mapShapes.map(shape => (
                      <path
                        key={shape.districtName}
                        d={shape.path}
                        fill={shape.fill}
                        stroke="#0b1220"
                        strokeWidth="0.65"
                        style={{ cursor: 'pointer', opacity: hoverDistrict === shape.districtName ? 0.85 : 1 }}
                        onMouseEnter={() => setHoverDistrict(shape.districtName)}
                        onMouseLeave={() => setHoverDistrict(null)}
                      />
                    ))}
                  </svg>
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px', background: 'var(--bg-card)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Legend</div>
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}><span style={{ width: '12px', height: '12px', borderRadius: '2px', background: SEVERITY_COLORS.low }} />Low</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}><span style={{ width: '12px', height: '12px', borderRadius: '2px', background: SEVERITY_COLORS.moderate }} />Moderate</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}><span style={{ width: '12px', height: '12px', borderRadius: '2px', background: SEVERITY_COLORS.high }} />High</div>
                    </div>
                  </div>
                  <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px', background: 'var(--bg-card)' }}>
                    {(() => {
                      const selected = mapShapes.find(item => item.districtName === hoverDistrict) || null
                      const row = selected?.districtData
                      return (
                        <>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Hover Details</div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{selected?.districtName || 'Hover district on map'}</div>
                          <div style={{ display: 'grid', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <div>Total Cases: <strong style={{ color: 'var(--text-primary)' }}>{row?.total ?? '—'}</strong></div>
                            <div>Low: <strong style={{ color: SEVERITY_COLORS.low }}>{row?.low ?? '—'}</strong></div>
                            <div>Moderate: <strong style={{ color: SEVERITY_COLORS.moderate }}>{row?.moderate ?? '—'}</strong></div>
                            <div>High: <strong style={{ color: SEVERITY_COLORS.high }}>{row?.high ?? '—'}</strong></div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <SectionHeader title="District Disease Burden" subtitle={`${burden.length} districts`} />
            </div>
            {burden.length === 0 ? (
              <EmptyState icon={MapPin} title="No district data" subtitle="No district-level data available. Try Demo mode or run seed:dmo-mock." />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>District</th>
                      <th>Total</th>
                      <th>Low</th>
                      <th>Moderate</th>
                      <th>High</th>
                      <th>Priority</th>
                      <th>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {burden.map((row, i) => (
                      <tr key={row.district || i}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{i + 1}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={12} color="var(--text-muted)" />
                            {row.district}
                          </div>
                        </td>
                        <td><span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)' }}>{row.total ?? '—'}</span></td>
                        <td>{row.low      != null ? <span className="badge badge-green">{row.low}</span>      : '—'}</td>
                        <td>{row.moderate != null ? <span className="badge badge-amber">{row.moderate}</span>  : '—'}</td>
                        <td>{row.high     != null ? <span className="badge badge-rose">{row.high}</span>      : '—'}</td>
                        <td>
                          {row.priority ? (
                            <span className={`badge ${row.priority === 'HIGH' ? 'badge-rose' : row.priority === 'MEDIUM' ? 'badge-amber' : 'badge-green'}`}>
                              {row.priority}
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          {row.trend === 'rising'  ? <TrendingUp   size={14} color="var(--accent-rose)" /> :
                           row.trend === 'falling' ? <TrendingDown size={14} color="var(--accent-primary)" /> : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </DashboardLayout>
  )
}
