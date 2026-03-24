
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { GeoJSON, MapContainer } from "react-leaflet";
import api from "../services/api";
import StatCard from "../components/StatCard";

const TELANGANA_CENTER = [17.95, 79.2];
const BASE_DEMO_ROWS = [
  { district: "Hyderabad", area: "Hyderabad", disease: "Dengue", totalAffected: 14, lat: 17.4375, lng: 78.4482, severity: { low: 4, moderate: 5, high: 5 } },
  { district: "Warangal Urban", area: "Warangal Urban", disease: "Typhoid", totalAffected: 9, lat: 18.0011, lng: 79.5788, severity: { low: 3, moderate: 4, high: 2 } },
  { district: "Nizamabad", area: "Nizamabad", disease: "Malaria", totalAffected: 7, lat: 18.6725, lng: 78.0941, severity: { low: 3, moderate: 2, high: 2 } }
];

const DISEASE_POOL = ["Dengue", "Malaria", "Typhoid", "Chikungunya", "Viral Fever"];
const DISTRICT_ALIASES = {
  warangalurban: "hanumakonda",
  warangalrural: "warangal",
  jagitial: "jagtial",
  komarambheemasifabad: "kumrambheemasifabad",
  jayashankarbhupalpally: "jayashankarbhupalapally",
  medchalmalkajgiri: "medchal",
  bhadradrikothagudem: "bhadradri"
};

function normalizeDistrictName(value) {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/district/g, "")
    .replace(/[^a-z]/g, "")
    .trim();
  return DISTRICT_ALIASES[normalized] || normalized;
}

function resolveDistrictKey(name, availableKeys) {
  const normalized = normalizeDistrictName(name);
  if (availableKeys.includes(normalized)) {
    return normalized;
  }

  const contained = availableKeys.find(
    (key) => key.includes(normalized) || normalized.includes(key)
  );
  return contained || normalized;
}

function extractFeatureDistrictName(feature) {
  const props = feature?.properties || {};
  return (
    props.district ||
    props.DISTRICT ||
    props.D_NAME ||
    props.D_N ||
    props.dist_name ||
    props.name ||
    props.NAME_2 ||
    props.dtname ||
    ""
  );
}

function getPriority(totalCases, highSeverityPercent) {
  if (highSeverityPercent > 15 || totalCases > 20) {
    return "Urgent";
  }
  if (totalCases > 5) {
    return "Watch";
  }
  return "Stable";
}

function getColor(cases) {
  if (cases > 20) return "#bd0026";
  if (cases > 10) return "#feb24c";
  if (cases > 0) return "#ffeda0";
  return "#f7f7f7";
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getFirstPointFromGeometry(geometry) {
  if (!geometry || !geometry.coordinates) {
    return null;
  }

  if (geometry.type === "Polygon") {
    return geometry.coordinates?.[0]?.[0] || null;
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates?.[0]?.[0]?.[0] || null;
  }
  return null;
}

function mutateDemoRowsFromGeo(geoJson) {
  const features = Array.isArray(geoJson?.features) ? geoJson.features : [];
  if (!features.length) {
    return BASE_DEMO_ROWS.map((row) => {
      const total = Math.max(2, row.totalAffected + randomBetween(-2, 3));
      const high = Math.max(0, Math.min(total, row.severity.high + randomBetween(-1, 2)));
      const moderate = Math.max(0, Math.min(total - high, row.severity.moderate + randomBetween(-1, 1)));
      const low = Math.max(0, total - high - moderate);
      return { ...row, totalAffected: total, severity: { low, moderate, high } };
    });
  }

  return features.map((feature) => {
    const district = extractFeatureDistrictName(feature) || "Unknown";
    const point = getFirstPointFromGeometry(feature.geometry);
    const lng = point?.[0] ?? 78.5;
    const lat = point?.[1] ?? 17.8;
    const totalAffected = randomBetween(3, 22);
    const high = randomBetween(0, Math.max(1, Math.floor(totalAffected * 0.35)));
    const moderate = randomBetween(1, Math.max(1, Math.floor((totalAffected - high) * 0.6)));
    const low = Math.max(0, totalAffected - high - moderate);

    return {
      district,
      area: district,
      disease: DISEASE_POOL[randomBetween(0, DISEASE_POOL.length - 1)],
      totalAffected,
      lat,
      lng,
      severity: { low, moderate, high }
    };
  });
}

function toIsoDate(date) {
  return new Date(date).toISOString();
}

function buildWeeklyComparisonFromRows(rows) {
  const diseaseCurrent = {};
  rows.forEach((row) => {
    diseaseCurrent[row.disease] = (diseaseCurrent[row.disease] || 0) + row.totalAffected;
  });

  const diseases = Object.keys(diseaseCurrent).sort().map((disease) => {
    const currentCases = diseaseCurrent[disease];
    const previousCases = Math.max(0, currentCases - randomBetween(-3, 5));
    const deltaPct = previousCases === 0 ? (currentCases > 0 ? 100 : 0) : Number((((currentCases - previousCases) / previousCases) * 100).toFixed(2));
    const trend = deltaPct > 0 ? "rising" : deltaPct < 0 ? "falling" : "stable";
    return { disease, currentCases, previousCases, deltaPct, trend };
  });

  const currentTotal = diseases.reduce((acc, item) => acc + item.currentCases, 0);
  const previousTotal = diseases.reduce((acc, item) => acc + item.previousCases, 0);
  const totalDeltaPct = previousTotal === 0 ? (currentTotal > 0 ? 100 : 0) : Number((((currentTotal - previousTotal) / previousTotal) * 100).toFixed(2));

  const now = new Date();
  const currentFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const previousFrom = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  return {
    currentWindow: { from: toIsoDate(currentFrom), to: toIsoDate(now) },
    previousWindow: { from: toIsoDate(previousFrom), to: toIsoDate(currentFrom) },
    totals: {
      current: currentTotal,
      previous: previousTotal,
      deltaPct: totalDeltaPct,
      trend: totalDeltaPct > 0 ? "rising" : totalDeltaPct < 0 ? "falling" : "stable"
    },
    diseases
  };
}

function buildOverviewFromRows(rows) {
  const diseaseTotalsMap = {};
  const severityMap = { low: 0, moderate: 0, high: 0 };
  const geoMap = {};

  rows.forEach((row) => {
    diseaseTotalsMap[row.disease] = (diseaseTotalsMap[row.disease] || 0) + row.totalAffected;
    severityMap.low += Number(row.severity.low || 0);
    severityMap.moderate += Number(row.severity.moderate || 0);
    severityMap.high += Number(row.severity.high || 0);

    const key = `${row.district}-${row.area}`;
    if (!geoMap[key]) {
      geoMap[key] = {
        district: row.district,
        area: row.area,
        totalCases: 0,
        lat: row.lat,
        lng: row.lng
      };
    }
    geoMap[key].totalCases += row.totalAffected;
  });

  const outbreakWarnings = rows
    .filter((row) => row.totalAffected > 5)
    .map((row) => ({
      district: row.district,
      area: row.area,
      disease: row.disease,
      totalCases: row.totalAffected,
      outbreakWarning: true
    }))
    .sort((a, b) => b.totalCases - a.totalCases);

  const today = new Date();
  const dailyTrend = Array.from({ length: 7 }).map((_, idx) => {
    const date = new Date(today.getTime() - (6 - idx) * 24 * 60 * 60 * 1000);
    const total = rows.reduce((acc, row) => acc + Math.max(0, row.totalAffected + randomBetween(-2, 2)), 0);
    return {
      date: date.toISOString().slice(0, 10),
      disease: "All",
      total
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    diseaseTotals: Object.entries(diseaseTotalsMap)
      .map(([disease, totalAffected]) => ({ disease, totalAffected }))
      .sort((a, b) => b.totalAffected - a.totalAffected),
    severityTotals: Object.entries(severityMap).map(([severity, total]) => ({ severity, total })),
    dailyTrend,
    geoHeatmap: Object.values(geoMap),
    outbreakSummary: {
      threshold: 5,
      totalAlerts: outbreakWarnings.length
    },
    outbreakWarnings,
    weeklyComparison: buildWeeklyComparisonFromRows(rows)
  };
}

function buildTimePreset(preset, customFrom, customTo) {
  const now = new Date();
  if (preset === "24h") {
    return { fromDate: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), toDate: now.toISOString() };
  }
  if (preset === "7d") {
    return { fromDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), toDate: now.toISOString() };
  }
  if (preset === "custom" && customFrom && customTo) {
    return {
      fromDate: new Date(customFrom).toISOString(),
      toDate: new Date(customTo).toISOString()
    };
  }
  return {};
}

function getStartOfWeekIso() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

function buildQuery({ district, area, timeRange, customFrom, customTo }) {
  const query = new URLSearchParams();
  if (district.trim()) query.set("district", district.trim());
  if (area.trim()) query.set("area", area.trim());

  const range = buildTimePreset(timeRange, customFrom, customTo);
  if (range.fromDate) query.set("fromDate", range.fromDate);
  if (range.toDate) query.set("toDate", range.toDate);
  return { query, range };
}

function buildMockCluster(row) {
  const baseNames = ["Ravi", "Lakshmi", "Mahesh", "Sravani", "Ajay", "Priya"];
  return Array.from({ length: Math.min(8, row.totalAffected) }).map((_, idx) => ({
    patientCode: `PAT-DEMO${String(idx + 101).padStart(3, "0")}`,
    fullName: `${baseNames[idx % baseNames.length]} ${row.area}`,
    contactNumber: `9${String(100000000 + idx * 7213).slice(0, 9)}`,
    addressLine: `${idx + 3}-${Math.max(1, idx + 1)} Main Street, ${row.area}`,
    predictedSeverity: idx % 3 === 0 ? "high" : idx % 2 === 0 ? "moderate" : "low",
    detectedAt: new Date(Date.now() - idx * 3600 * 1000).toISOString()
  }));
}

export default function DMOPage() {
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");
  const [timeRange, setTimeRange] = useState("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [dataMode, setDataMode] = useState("demo");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshSeconds, setRefreshSeconds] = useState(15);
  const [countdown, setCountdown] = useState(15);
  const [telanganaDistrictsGeo, setTelanganaDistrictsGeo] = useState({
    type: "FeatureCollection",
    features: []
  });
  const [districtMetaMap, setDistrictMetaMap] = useState({});

  const [data, setData] = useState([]);
  const [overview, setOverview] = useState({
    diseaseTotals: [],
    severityTotals: [],
    outbreakSummary: { totalAlerts: 0, threshold: 5 },
    weeklyComparison: { totals: { current: 0, previous: 0, deltaPct: 0, trend: "stable" }, diseases: [] }
  });
  const [clusterModal, setClusterModal] = useState({ open: false, title: "", patients: [] });
  const [selectedDistrictSummary, setSelectedDistrictSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) setLoading(true);
        setError("");

        if (dataMode === "demo") {
          const demoRows = mutateDemoRowsFromGeo(telanganaDistrictsGeo);
          const demoOverview = buildOverviewFromRows(demoRows);
          setData(demoRows);
          setOverview(demoOverview);
          setLastUpdatedAt(new Date().toISOString());
          return;
        }

        const { query } = buildQuery({ district, area, timeRange, customFrom, customTo });
        const [burden, summary] = await Promise.all([
          api.get(`/api/analytics/dmo/disease-burden?${query.toString()}`),
          api.get(`/api/analytics/dmo/overview?${query.toString()}`)
        ]);

        setData(burden.data.areaSummary || []);
        setOverview(
          summary.data || {
            diseaseTotals: [],
            severityTotals: [],
            outbreakSummary: { totalAlerts: 0, threshold: 5 },
            weeklyComparison: { totals: { current: 0, previous: 0, deltaPct: 0, trend: "stable" }, diseases: [] }
          }
        );
        setLastUpdatedAt(new Date().toISOString());
      } catch (err) {
        setError(err?.response?.data?.error || "Unable to load dashboard");
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [district, area, timeRange, customFrom, customTo, dataMode, telanganaDistrictsGeo]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setCountdown(refreshSeconds);
  }, [refreshSeconds]);

  useEffect(() => {
    if (!autoRefresh) {
      return undefined;
    }

    const tick = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          load(false);
          return refreshSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [autoRefresh, refreshSeconds, load]);

  useEffect(() => {
    let active = true;
    fetch("/data/telanganaDistricts.json")
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        if (json && Array.isArray(json.features)) {
          setTelanganaDistrictsGeo(json);
        }
      })
      .catch(() => {
        if (active) {
          setTelanganaDistrictsGeo({ type: "FeatureCollection", features: [] });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/data/telanganaDistrictMeta.json")
      .then((res) => res.json())
      .then((json) => {
        if (!active || typeof json !== "object") {
          return;
        }
        const normalized = Object.entries(json || {}).reduce((acc, [name, info]) => {
          acc[normalizeDistrictName(name)] = info;
          return acc;
        }, {});
        setDistrictMetaMap(normalized);
      })
      .catch(() => {
        if (active) {
          setDistrictMetaMap({});
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const totalCases = useMemo(
    () => data.reduce((acc, item) => acc + Number(item.totalAffected || 0), 0),
    [data]
  );

  const severityByArea = Object.values(
    data.reduce((acc, item) => {
      const key = `${item.district}-${item.area}`;
      if (!acc[key]) {
        acc[key] = {
          area: item.area,
          district: item.district,
          low: 0,
          moderate: 0,
          high: 0,
          total: 0
        };
      }
      const low = Number(item.severity.low || 0);
      const moderate = Number(item.severity.moderate || 0);
      const high = Number(item.severity.high || 0);
      const total = Number(item.totalAffected || 0);
      acc[key].low += low;
      acc[key].moderate += moderate;
      acc[key].high += high;
      acc[key].total += total;
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

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

  const outbreakWarnings = overview.outbreakWarnings || [];
  const outbreakAlertCount = Number(overview?.outbreakSummary?.totalAlerts || 0);
  const comparison = overview.weeklyComparison || { totals: {}, diseases: [] };
  const highSeverityCount = severityByArea.reduce((acc, row) => acc + Number(row.high || 0), 0);
  const highSeverityRate = totalCases > 0 ? Number(((highSeverityCount / totalCases) * 100).toFixed(2)) : 0;
  const pressureScore = Number((highSeverityRate * 1.5 + outbreakAlertCount * 10).toFixed(2));

  const districtCaseMap = useMemo(() => {
    return data.reduce((acc, row) => {
      const key = normalizeDistrictName(row.district);
      acc[key] = (acc[key] || 0) + Number(row.totalAffected || 0);
      return acc;
    }, {});
  }, [data]);
  const districtCaseKeys = useMemo(() => Object.keys(districtCaseMap), [districtCaseMap]);

  const districtSeverityMap = useMemo(() => {
    return data.reduce((acc, row) => {
      const key = normalizeDistrictName(row.district);
      if (!acc[key]) {
        acc[key] = { low: 0, moderate: 0, high: 0 };
      }
      acc[key].low += Number(row.severity?.low || 0);
      acc[key].moderate += Number(row.severity?.moderate || 0);
      acc[key].high += Number(row.severity?.high || 0);
      return acc;
    }, {});
  }, [data]);

  const districtBurdenList = useMemo(() => {
    const features = Array.isArray(telanganaDistrictsGeo?.features) ? telanganaDistrictsGeo.features : [];
    const uniqueDistricts = Array.from(
      new Set(features.map((feature) => extractFeatureDistrictName(feature)).filter(Boolean))
    );

    return uniqueDistricts
      .map((name) => {
        const normalized = normalizeDistrictName(name);
        const resolvedKey = resolveDistrictKey(normalized, districtCaseKeys);
        const meta = districtMetaMap[normalized];
        const severity = districtSeverityMap[resolvedKey] || { low: 0, moderate: 0, high: 0 };
        const cases = districtCaseMap[resolvedKey] || 0;
        const highSeverityPercent = cases > 0 ? Number(((severity.high / cases) * 100).toFixed(2)) : 0;
        const priority = getPriority(cases, highSeverityPercent);
        return {
          district: name,
          normalizedDistrict: normalized,
          cases,
          severity,
          highSeverityPercent,
          priority,
          population: meta?.["Population(2011 census)"] || null
        };
      })
      .sort((a, b) => b.cases - a.cases);
  }, [telanganaDistrictsGeo, districtMetaMap, districtCaseMap, districtSeverityMap, districtCaseKeys]);

  const geoLayerKey = useMemo(
    () => `geo-${JSON.stringify(districtCaseMap)}-${JSON.stringify(districtSeverityMap)}`,
    [districtCaseMap, districtSeverityMap]
  );

  const liveFeed = useMemo(() => {
    return districtBurdenList
      .filter((item) => item.highSeverityPercent > 15 || item.cases > 5)
      .slice(0, 12)
      .map((item) => ({
        type: "district-alert",
        title: `${item.district} surveillance alert`,
        detail: `cases: ${item.cases} | low: ${item.severity.low} | moderate: ${item.severity.moderate} | high: ${item.severity.high} | high%: ${item.highSeverityPercent}`,
        severity: item.priority === "Urgent" ? "high" : "moderate"
      }));
  }, [districtBurdenList]);

  const districtStyle = useCallback(
    (feature) => {
      const districtName = extractFeatureDistrictName(feature);
      const resolvedKey = resolveDistrictKey(districtName, districtCaseKeys);
      const count = districtCaseMap[resolvedKey] || 0;
      return {
        color: "#23395d",
        weight: 1.2,
        fillColor: getColor(count),
        fillOpacity: count > 0 ? 0.42 : 0.1
      };
    },
    [districtCaseMap, districtCaseKeys]
  );

  const onEachDistrict = useCallback(
    (feature, layer) => {
      const districtName = extractFeatureDistrictName(feature) || "Unknown";
      const resolvedKey = resolveDistrictKey(districtName, districtCaseKeys);
      const count = districtCaseMap[resolvedKey] || 0;
      const severity = districtSeverityMap[resolvedKey] || { low: 0, moderate: 0, high: 0 };
      const highSeverityPercent = count > 0 ? Number(((severity.high / count) * 100).toFixed(2)) : 0;
      const priority = getPriority(count, highSeverityPercent);
      const meta = districtMetaMap[normalizeDistrictName(districtName)];
      const literacy = meta?.["Literacy (%)"] ? ` | Literacy: ${meta["Literacy (%)"]}%` : "";
      const population = meta?.["Population(2011 census)"]
        ? ` | Pop: ${Number(meta["Population(2011 census)"]).toLocaleString()}`
        : "";
      layer.bindPopup(
        `<div style="min-width:170px">
          <strong>${districtName}</strong><br/>
          Active cases: ${count}<br/>
          low: ${severity.low}<br/>
          moderate: ${severity.moderate}<br/>
          high: ${severity.high}<br/>
          priority: ${priority}<br/>
          ${population.replace(" | ", "")}<br/>
          ${literacy.replace(" | ", "")}
        </div>`
      );
      layer.bindTooltip(
        `<div style="min-width:170px">
          <strong>${districtName}</strong><br/>
          Active: ${count}<br/>
          Low: ${severity.low}<br/>
          Moderate: ${severity.moderate}<br/>
          High: ${severity.high}<br/>
          Priority: ${priority}
        </div>`,
        { sticky: true }
      );
      layer.on("click", () => {
        setSelectedDistrictSummary({
          district: districtName,
          total: count,
          low: severity.low,
          moderate: severity.moderate,
          high: severity.high,
          priority
        });
      });
    },
    [districtCaseMap, districtSeverityMap, districtMetaMap, districtCaseKeys]
  );

  return (
    <section className="dmo-console">
      <div className="dmo-hero">
        <div>
          <h2>DMO Telangana Intelligence Hub</h2>
          <p>Live surveillance with operational triage and outbreak forecasting.</p>
        </div>
        <div className="dmo-hero-badge">{dataMode === "demo" ? "Demo Data" : "Live Data"}</div>
      </div>

      <div className="card dmo-panel">
        <h3>Live Controls</h3>
        <div className="grid-3">
          <div className="field">
            <label>Data Mode</label>
            <select value={dataMode} onChange={(event) => setDataMode(event.target.value)}>
              <option value="demo">Telangana Demo Data</option>
              <option value="live">Live Database Data</option>
            </select>
          </div>
          <div className="field">
            <label>Auto Refresh</label>
            <select value={autoRefresh ? "on" : "off"} onChange={(event) => setAutoRefresh(event.target.value === "on")}>
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          </div>
          <div className="field">
            <label>Refresh Interval</label>
            <select value={refreshSeconds} onChange={(event) => setRefreshSeconds(Number(event.target.value))}>
              <option value={10}>10 seconds</option>
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>60 seconds</option>
            </select>
          </div>
        </div>
        <p className="hint live-status">
          {autoRefresh ? `Next refresh in ${countdown}s` : "Paused"}
          {lastUpdatedAt ? ` | Last updated ${new Date(lastUpdatedAt).toLocaleTimeString()}` : ""}
        </p>
      </div>

      <div className="card dmo-panel">
        <h3>Filters</h3>
        <div className="grid-3">
          <input value={district} onChange={(event) => setDistrict(event.target.value)} placeholder="District" disabled={dataMode === "demo"} />
          <input value={area} onChange={(event) => setArea(event.target.value)} placeholder="Area (optional)" disabled={dataMode === "demo"} />
          <select value={timeRange} onChange={(event) => setTimeRange(event.target.value)} disabled={dataMode === "demo"}>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {timeRange === "custom" && dataMode !== "demo" ? (
          <div className="grid-2">
            <div className="field">
              <label>From</label>
              <input type="datetime-local" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} />
            </div>
            <div className="field">
              <label>To</label>
              <input type="datetime-local" value={customTo} onChange={(event) => setCustomTo(event.target.value)} />
            </div>
          </div>
        ) : null}

        <div className="inline">
          <button type="button" className="primary" onClick={() => load()}>
            {loading ? "Loading..." : "Refresh Insights"}
          </button>
          <button
            type="button"
            onClick={async () => {
              if (dataMode === "demo") {
                load();
                return;
              }
              const startOfWeekIso = getStartOfWeekIso();
              const nowIso = new Date().toISOString();
              setTimeRange("custom");
              setCustomFrom(startOfWeekIso.slice(0, 16));
              setCustomTo(nowIso.slice(0, 16));

              try {
                setLoading(true);
                const query = new URLSearchParams();
                if (district.trim()) query.set("district", district.trim());
                if (area.trim()) query.set("area", area.trim());
                query.set("fromDate", startOfWeekIso);
                query.set("toDate", nowIso);

                const [burden, summary] = await Promise.all([
                  api.get(`/api/analytics/dmo/disease-burden?${query.toString()}`),
                  api.get(`/api/analytics/dmo/overview?${query.toString()}`)
                ]);
                setData(burden.data.areaSummary || []);
                setOverview(summary.data || {});
                setLastUpdatedAt(new Date().toISOString());
              } catch (err) {
                setError(err?.response?.data?.error || "Unable to load week comparison");
              } finally {
                setLoading(false);
              }
            }}
          >
            This Week vs Last Week
          </button>
        </div>

        {error ? <p className="error">{error}</p> : null}
      </div>

      <div className="stats-grid">
        <StatCard label="Total Cases" value={totalCases} />
        <StatCard label="High Severity %" value={`${highSeverityRate}%`} />
        <StatCard label="Pressure Score" value={pressureScore} />
        <div className={`stat-card ${outbreakAlertCount > 0 ? "alert-card" : ""}`}>
          <span>Outbreak Alerts</span>
          <strong>{outbreakAlertCount}</strong>
          <small>Threshold {overview?.outbreakSummary?.threshold || 5}+ in one area/disease</small>
        </div>
      </div>

      <div className="grid-2">
        <div className="card dmo-panel">
          <h3>Live Alert Feed</h3>
          {liveFeed.length === 0 ? <p className="success-text">No active alerts in current window.</p> : null}
          <div className="alert-feed">
            {liveFeed.map((event, index) => (
              <div key={`${event.title}-${index}`} className={`feed-item feed-${event.severity}`}>
                <strong>{event.title}</strong>
                <p>{event.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card dmo-panel">
          <h3>Hotspot Ranking</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Total</th>
                  <th>High</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {severityByArea.slice(0, 8).map((row) => {
                  const priorityScore = row.total + row.high * 2;
                  const priority = priorityScore >= 20 ? "Urgent" : priorityScore >= 10 ? "Watch" : "Stable";
                  return (
                    <tr key={`${row.district}-${row.area}`}>
                      <td>{row.area}</td>
                      <td>{row.total}</td>
                      <td>{row.high}</td>
                      <td>
                        <span className={`badge ${priority === "Urgent" ? "badge-up" : priority === "Watch" ? "badge-flat" : "badge-down"}`}>
                          {priority}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card dmo-panel">
        <h3>33 District Burden</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>District</th>
                <th>Cases</th>
                <th>Low</th>
                <th>Moderate</th>
                <th>High</th>
                <th>Priority</th>
                <th>Population</th>
              </tr>
            </thead>
            <tbody>
              {districtBurdenList.map((row) => (
                <tr key={row.district}>
                  <td>{row.district}</td>
                  <td>{row.cases}</td>
                  <td>{row.severity.low}</td>
                  <td>{row.severity.moderate}</td>
                  <td>{row.severity.high}</td>
                  <td>{row.priority}</td>
                  <td>{row.population ? Number(row.population).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card dmo-panel map-card">
        <h3>Telangana Outbreak Map</h3>
        <div className="map-wrap">
          <MapContainer
            className="telangana-only-map"
            center={TELANGANA_CENTER}
            zoom={7}
            scrollWheelZoom={false}
            style={{ height: "390px", width: "100%" }}
            zoomControl={false}
          >
            {Array.isArray(telanganaDistrictsGeo?.features) && telanganaDistrictsGeo.features.length > 0 ? (
              <GeoJSON
                key={geoLayerKey}
                data={telanganaDistrictsGeo}
                style={districtStyle}
                onEachFeature={onEachDistrict}
              />
            ) : null}
          </MapContainer>
        </div>
        {(!Array.isArray(telanganaDistrictsGeo?.features) || telanganaDistrictsGeo.features.length === 0) ? (
          <p className="hint">
            District layer placeholder is empty. Add district GeoJSON to `frontend/public/data/telanganaDistricts.json`.
          </p>
        ) : null}

        <div className="district-summary">
          <h4>Selected District Summary</h4>
          {selectedDistrictSummary ? (
            <div className="district-summary-grid">
              <span>{selectedDistrictSummary.district}</span>
              <span>Total: {selectedDistrictSummary.total}</span>
              <span>Low: {selectedDistrictSummary.low}</span>
              <span>Moderate: {selectedDistrictSummary.moderate}</span>
              <span>High: {selectedDistrictSummary.high}</span>
              <span>Priority: {selectedDistrictSummary.priority}</span>
            </div>
          ) : (
            <p className="hint">Click any district on map to view Total, Low, Moderate, High and Priority.</p>
          )}
        </div>
      </div>

      <div className="card dmo-panel">
        <h3>Severity by Area</h3>
        <div className="chart-box chart-3d">
          <ResponsiveContainer width="100%" height={330}>
            <BarChart data={severityByArea}>
              <defs>
                <linearGradient id="lowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2fc9b0" />
                  <stop offset="100%" stopColor="#11806b" />
                </linearGradient>
                <linearGradient id="modGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffd166" />
                  <stop offset="100%" stopColor="#f29f05" />
                </linearGradient>
                <linearGradient id="highGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff7b89" />
                  <stop offset="100%" stopColor="#c9184a" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9e3f3" />
              <XAxis dataKey="area" tick={{ fill: "#1f2a44", fontWeight: 600, fontSize: 12 }} />
              <YAxis tick={{ fill: "#1f2a44", fontWeight: 600, fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="low" stackId="a" fill="url(#lowGrad)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="moderate" stackId="a" fill="url(#modGrad)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="high" stackId="a" fill="url(#highGrad)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2">
        <div className="card dmo-panel">
          <h3>Severity Distribution</h3>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={290}>
              <PieChart>
                <Pie data={severityPieData} dataKey="value" nameKey="name" outerRadius={95} innerRadius={45} label>
                  {severityPieData.map((_, index) => (
                    <Cell
                      key={`pie-${index}`}
                      fill={index === 0 ? "#1b998b" : index === 1 ? "#f0a202" : "#d7263d"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card dmo-panel">
          <h3>Cases Trend Over Time</h3>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={290}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="4 4" stroke="#d9e3f3" />
                <XAxis dataKey="date" tick={{ fill: "#1f2a44", fontWeight: 600 }} />
                <YAxis tick={{ fill: "#1f2a44", fontWeight: 600 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#2e5bff" strokeWidth={3.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card dmo-panel">
        <h3>Top Diseases</h3>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={topDiseases}>
              <CartesianGrid strokeDasharray="4 4" stroke="#d9e3f3" />
              <XAxis dataKey="disease" tick={{ fill: "#1f2a44", fontWeight: 600 }} />
              <YAxis tick={{ fill: "#1f2a44", fontWeight: 600 }} />
              <Tooltip />
              <Bar dataKey="totalAffected" fill="#2e5bff" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card dmo-panel">
        <h3>Week-over-Week Comparison</h3>
        <div className="stats-grid">
          <StatCard label="Current Window Cases" value={comparison?.totals?.current || 0} />
          <StatCard label="Previous Window Cases" value={comparison?.totals?.previous || 0} />
          <div className={`stat-card ${comparison?.totals?.trend === "rising" ? "badge-trend-up" : comparison?.totals?.trend === "falling" ? "badge-trend-down" : "badge-trend-flat"}`}>
            <span>Overall Trend</span>
            <strong>{comparison?.totals?.deltaPct || 0}%</strong>
            <small>{comparison?.totals?.trend || "stable"}</small>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Disease</th>
                <th>Current</th>
                <th>Previous</th>
                <th>Delta %</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {(comparison?.diseases || []).map((row) => (
                <tr key={row.disease}>
                  <td>{row.disease}</td>
                  <td>{row.currentCases}</td>
                  <td>{row.previousCases}</td>
                  <td>{row.deltaPct}%</td>
                  <td>
                    <span
                      className={
                        row.trend === "rising"
                          ? "badge badge-up"
                          : row.trend === "falling"
                            ? "badge badge-down"
                            : "badge badge-flat"
                      }
                    >
                      {row.trend}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="table-wrap card dmo-panel">
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
              <th>Action</th>
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
                <td>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (dataMode === "demo") {
                          setClusterModal({
                            open: true,
                            title: `${row.disease} cluster in ${row.area}`,
                            patients: buildMockCluster(row)
                          });
                          return;
                        }

                        const { query } = buildQuery({ district, area, timeRange, customFrom, customTo });
                        query.set("area", row.area);
                        query.set("disease", row.disease);

                        const { data: clusterData } = await api.get(
                          `/api/analytics/dmo/patient-cluster?${query.toString()}`
                        );
                        setClusterModal({
                          open: true,
                          title: `${row.disease} cluster in ${row.area}`,
                          patients: clusterData.patients || []
                        });
                      } catch (err) {
                        setError(err?.response?.data?.error || "Unable to load patient cluster");
                      }
                    }}
                  >
                    View Patient Cluster
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {clusterModal.open ? (
        <div className="modal-backdrop" onClick={() => setClusterModal({ open: false, title: "", patients: [] })}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="inline" style={{ justifyContent: "space-between" }}>
              <h3>{clusterModal.title}</h3>
              <button type="button" onClick={() => setClusterModal({ open: false, title: "", patients: [] })}>
                Close
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Contact</th>
                    <th>Address</th>
                    <th>Severity</th>
                    <th>Detected At</th>
                  </tr>
                </thead>
                <tbody>
                  {clusterModal.patients.map((patient, idx) => (
                    <tr key={`${patient.patientCode}-${idx}`}>
                      <td>
                        {patient.fullName} ({patient.patientCode})
                      </td>
                      <td>{patient.contactNumber || "-"}</td>
                      <td>{patient.addressLine || "-"}</td>
                      <td>{patient.predictedSeverity}</td>
                      <td>{new Date(patient.detectedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
