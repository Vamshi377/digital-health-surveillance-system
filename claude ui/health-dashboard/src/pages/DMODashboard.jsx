import React, { useState } from 'react';
import { BarChart3, Activity, AlertTriangle, TrendingUp, Users, Building2, Map, Filter } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import StatCard from '../components/ui/StatCard';
import { SectionCard, Badge } from '../components/ui/index';

const monthlyData = [
  { month: 'Oct', dengue: 24, malaria: 12, typhoid: 8, covid: 45 },
  { month: 'Nov', dengue: 18, malaria: 9,  typhoid: 11, covid: 38 },
  { month: 'Dec', dengue: 11, malaria: 7,  typhoid: 9,  covid: 52 },
  { month: 'Jan', dengue: 8,  malaria: 5,  typhoid: 7,  covid: 60 },
  { month: 'Feb', dengue: 14, malaria: 8,  typhoid: 13, covid: 42 },
  { month: 'Mar', dengue: 22, malaria: 15, typhoid: 10, covid: 35 },
];

const districtData = [
  { district: 'Kozhikode', cases: 187, facilities: 28, beds: 1240, population: '31L' },
  { district: 'Malappuram', cases: 231, facilities: 35, beds: 980, population: '42L' },
  { district: 'Wayanad',    cases: 94,  facilities: 18, beds: 420, population: '8L' },
  { district: 'Kannur',     cases: 142, facilities: 22, beds: 680, population: '25L' },
  { district: 'Kasaragod',  cases: 78,  facilities: 14, beds: 310, population: '14L' },
];

const pieData = [
  { name: 'Dengue',  value: 22, color: '#F59E0B' },
  { name: 'Malaria', value: 15, color: '#10B981' },
  { name: 'Typhoid', value: 10, color: '#7C3AED' },
  { name: 'COVID-19',value: 35, color: '#F43F5E' },
  { name: 'Others',  value: 18, color: '#3B82F6' },
];

const facilityData = [
  { name: 'District Hospitals', count: 5, utilization: 78 },
  { name: 'CHC',                count: 18, utilization: 62 },
  { name: 'PHC',                count: 54, utilization: 45 },
  { name: 'Sub-centres',        count: 203, utilization: 31 },
];

const alerts = [
  { district: 'Malappuram', disease: 'Dengue', severity: 'high',   cases: 28, change: '+42%', date: '25 Mar' },
  { district: 'Kozhikode',  disease: 'Malaria', severity: 'medium', cases: 15, change: '+18%', date: '24 Mar' },
  { district: 'Wayanad',    disease: 'Typhoid', severity: 'low',    cases: 8,  change: '+5%',  date: '22 Mar' },
];

const COLORS = ['#F59E0B','#10B981','#7C3AED','#F43F5E','#3B82F6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--teal-950)', border: 'none',
        borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
            <span style={{ opacity: 0.75 }}>{p.name}:</span>
            <span style={{ fontWeight: 700 }}>{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DMODashboard() {
  const [period, setPeriod] = useState('6m');
  const [filterDistrict, setFilterDistrict] = useState('all');

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>DMO Analytics Dashboard</h1>
          <p>District-wide disease surveillance and health facility insights · Kerala</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Filter size={14} color="var(--text-muted)" />
          <select value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)} style={{ padding: '7px 12px', fontSize: 13, borderRadius: 8 }}>
            <option value="all">All Districts</option>
            {districtData.map(d => <option key={d.district} value={d.district}>{d.district}</option>)}
          </select>
          <div style={{ display: 'flex', background: 'var(--neutral-100)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            {['1m','3m','6m','1y'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '6px 12px', border: 'none', fontSize: 12, fontWeight: 600,
                background: period === p ? 'var(--teal-800)' : 'transparent',
                color: period === p ? 'white' : 'var(--text-muted)',
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                transition: 'all 0.15s',
              }}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid stagger" style={{ marginBottom: 28 }}>
        <StatCard icon={Users}      label="Total Cases (Mar)"   value="732"  delta={8}   color="#F43F5E" />
        <StatCard icon={Building2}  label="Active Facilities"   value="280"  delta={2}   color="#0A5C7A" />
        <StatCard icon={Activity}   label="Outbreak Alerts"     value="3"    delta={50}  color="#F59E0B" />
        <StatCard icon={TrendingUp} label="Vaccination Coverage" value="84%" delta={3}   color="#10B981" />
      </div>

      {/* Outbreak Alerts */}
      <SectionCard title="Active Outbreak Alerts" subtitle="Districts requiring immediate attention" style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {alerts.map((a, i) => (
            <div key={i} style={{
              background: a.severity === 'high' ? '#FFF1F2' : a.severity === 'medium' ? '#FFFBEB' : '#F0FDF4',
              border: `1.5px solid ${a.severity === 'high' ? '#FECDD3' : a.severity === 'medium' ? '#FDE68A' : '#BBF7D0'}`,
              borderRadius: 12, padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{a.district}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{a.disease}</div>
                </div>
                <Badge variant={a.severity === 'high' ? 'danger' : a.severity === 'medium' ? 'warning' : 'success'}>
                  {a.severity.toUpperCase()}
                </Badge>
              </div>
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'DM Serif Display',serif" }}>{a.cases}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>new cases</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F43F5E' }}>{a.change}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>this week · {a.date}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        <SectionCard title="Disease Trend (Monthly)" subtitle="Reported cases by disease type — last 6 months">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
              <defs>
                {[['dengue','#F59E0B'],['malaria','#10B981'],['typhoid','#7C3AED'],['covid','#F43F5E']].map(([k,c]) => (
                  <linearGradient key={k} id={`g${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="covid"   name="COVID-19" stroke="#F43F5E" fill="url(#gcovid)"   strokeWidth={2.5} dot={false} />
              <Area type="monotone" dataKey="dengue"  name="Dengue"   stroke="#F59E0B" fill="url(#gdengue)"  strokeWidth={2.5} dot={false} />
              <Area type="monotone" dataKey="malaria" name="Malaria"  stroke="#10B981" fill="url(#gmalaria)" strokeWidth={2.5} dot={false} />
              <Area type="monotone" dataKey="typhoid" name="Typhoid"  stroke="#7C3AED" fill="url(#gtyphoid)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Disease Distribution" subtitle="Current month breakdown">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v}%`, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4, justifyContent: 'center' }}>
            {pieData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{d.name} {d.value}%</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <SectionCard title="Cases by District" subtitle="March 2026 — total reported cases">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={districtData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="district" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="cases" name="Cases" fill="#0A5C7A" radius={[6, 6, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Facility Utilization" subtitle="Current bed occupancy by facility type">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
            {facilityData.map((f, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{f.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{f.count} facilities</span>
                  </div>
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    color: f.utilization > 70 ? '#F43F5E' : f.utilization > 50 ? '#F59E0B' : '#10B981',
                  }}>{f.utilization}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--neutral-100)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    width: `${f.utilization}%`, height: '100%', borderRadius: 99,
                    background: f.utilization > 70 ? '#F43F5E' : f.utilization > 50 ? '#F59E0B' : '#10B981',
                    transition: 'width 0.8s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* District Table */}
      <SectionCard title="District Summary" subtitle="Comprehensive health metrics by district">
        <div className="table-container">
          <table>
            <thead>
              <tr><th>District</th><th>Total Cases</th><th>Facilities</th><th>Beds</th><th>Population</th><th>Alert Level</th><th>Action</th></tr>
            </thead>
            <tbody>
              {districtData.map((d, i) => {
                const alertLevel = d.cases > 200 ? 'high' : d.cases > 120 ? 'medium' : 'low';
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{d.district}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{d.cases}</span>
                        <div style={{ width: 40, height: 4, background: 'var(--neutral-100)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ width: `${(d.cases/231)*100}%`, height: '100%', background: 'var(--teal-600)', borderRadius: 99 }} />
                        </div>
                      </div>
                    </td>
                    <td>{d.facilities}</td>
                    <td>{d.beds.toLocaleString()}</td>
                    <td>{d.population}</td>
                    <td><Badge variant={alertLevel === 'high' ? 'danger' : alertLevel === 'medium' ? 'warning' : 'success'}>{alertLevel.toUpperCase()}</Badge></td>
                    <td><button className="btn btn-ghost btn-sm">Details</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
