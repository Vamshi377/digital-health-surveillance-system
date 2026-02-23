import { useEffect, useMemo, useState } from "react";
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
} from "recharts";
import api from "../services/api";
import StatCard from "../components/StatCard";

export default function DMOPage() {
  const [district, setDistrict] = useState("Hyderabad");
  const [area, setArea] = useState("");
  const [data, setData] = useState([]);
  const [overview, setOverview] = useState({ diseaseTotals: [], severityTotals: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const query = new URLSearchParams();
      if (district.trim()) query.set("district", district.trim());
      if (area.trim()) query.set("area", area.trim());

      const [burden, summary] = await Promise.all([
        api.get(`/api/analytics/dmo/disease-burden?${query.toString()}`),
        api.get(`/api/analytics/dmo/overview?${query.toString()}`)
      ]);
      setData(burden.data.areaSummary || []);
      setOverview(summary.data || { diseaseTotals: [], severityTotals: [] });
    } catch (err) {
      setError(err?.response?.data?.error || "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalCases = useMemo(
    () => data.reduce((acc, item) => acc + Number(item.totalAffected || 0), 0),
    [data]
  );

  const chartData = data.map((item) => ({
    area: `${item.area} (${item.disease})`,
    low: item.severity.low,
    moderate: item.severity.moderate,
    high: item.severity.high
  }));

  const severityPieData = (overview.severityTotals || []).map((item) => ({
    name: item.severity,
    value: item.total
  }));

  const trendMap = (overview.dailyTrend || []).reduce((acc, row) => {
    if (!acc[row.date]) {
      acc[row.date] = { date: row.date, total: 0 };
    }
    acc[row.date].total += Number(row.total || 0);
    return acc;
  }, {});
  const trendData = Object.values(trendMap).sort((a, b) => (a.date > b.date ? 1 : -1));
  const topDiseases = (overview.diseaseTotals || []).slice(0, 7);

  return (
    <section>
      <h2>DMO Disease Surveillance</h2>
      <p>Area-wise disease impact and severity trend intelligence.</p>

      <div className="card">
        <h3>Filters</h3>
        <div className="grid-2">
          <input value={district} onChange={(event) => setDistrict(event.target.value)} placeholder="District" />
          <input value={area} onChange={(event) => setArea(event.target.value)} placeholder="Area (optional)" />
        </div>
        <button type="button" className="primary" onClick={load}>
          {loading ? "Loading..." : "Apply Filters"}
        </button>
        {error ? <p className="error">{error}</p> : null}
      </div>

      <div className="stats-grid">
        <StatCard label="Total Cases" value={totalCases} />
        <StatCard label="Disease Buckets" value={data.length} />
        <StatCard label="Diseases Tracked" value={overview.diseaseTotals.length} />
      </div>

      <div className="card">
        <h3>Severity by Area and Disease</h3>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="area" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="low" stackId="a" fill="#1f9f77" />
              <Bar dataKey="moderate" stackId="a" fill="#efb40f" />
              <Bar dataKey="high" stackId="a" fill="#e64b3c" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Severity Distribution</h3>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={severityPieData} dataKey="value" nameKey="name" outerRadius={90} label>
                  {severityPieData.map((_, index) => (
                    <Cell
                      key={`pie-${index}`}
                      fill={index === 0 ? "#1f9f77" : index === 1 ? "#efb40f" : "#e64b3c"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3>Cases Trend Over Time</h3>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#0a7a52" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Top Diseases</h3>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={topDiseases}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="disease" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalAffected" fill="#377fe6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="table-wrap card">
        <h3>Detailed Rows</h3>
        <table>
          <thead>
            <tr>
              <th>District</th>
              <th>Area</th>
              <th>Disease</th>
              <th>Total</th>
              <th>Low</th>
              <th>Moderate</th>
              <th>High</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={`${row.area}-${row.disease}-${idx}`}>
                <td>{row.district}</td>
                <td>{row.area}</td>
                <td>{row.disease}</td>
                <td>{row.totalAffected}</td>
                <td>{row.severity.low}</td>
                <td>{row.severity.moderate}</td>
                <td>{row.severity.high}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
