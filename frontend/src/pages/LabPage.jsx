import { useState } from "react";
import api from "../services/api";
import StatCard from "../components/StatCard";

const TEST_REFERENCE = {
  CBC: {
    platelet_count: { min: 150000, max: 450000, unit: "/uL", criticalBelow: 100000 },
    wbc_count: { min: 4000, max: 11000, unit: "/uL" },
    hemoglobin: { min: 12, max: 17.5, unit: "g/dL" }
  }
};

function checkCritical(testName, values) {
  const ranges = TEST_REFERENCE[testName] || {};
  const abnormal = [];
  let critical = false;

  Object.keys(ranges).forEach((key) => {
    const range = ranges[key];
    const current = Number(values[key]);
    if (Number.isNaN(current)) return;
    if (current < range.min || current > range.max) {
      abnormal.push(`${key}: ${current} (normal ${range.min}-${range.max})`);
    }
    if (typeof range.criticalBelow === "number" && current < range.criticalBelow) {
      critical = true;
    }
  });

  return { abnormal, critical };
}

export default function LabPage() {
  const [recordId, setRecordId] = useState("");
  const [result, setResult] = useState("");
  const [reportImage, setReportImage] = useState(null);
  const [form, setForm] = useState({
    testName: "CBC",
    platelet_count: "90000",
    wbc_count: "12000",
    hemoglobin: "10.5",
    summary: "Platelets reduced and markers elevated."
  });

  const ranges = TEST_REFERENCE[form.testName] || {};
  const { abnormal, critical } = checkCritical(form.testName, {
    platelet_count: form.platelet_count,
    wbc_count: form.wbc_count,
    hemoglobin: form.hemoglobin
  });

  return (
    <section>
      <h2>Lab Upload</h2>
      <p>Upload patient laboratory findings to the active medical record.</p>

      <div className="stats-grid">
        <StatCard label="Workflow Stage" value="Lab Validation" />
        <StatCard label="Record ID" value={recordId || "Pending"} />
        <StatCard label="Critical Flag" value={critical ? "Yes" : "No"} />
        <StatCard label="Next Step" value="Doctor Diagnosis" />
      </div>

      <div className="card grid-2">
        <input placeholder="Medical Record ID" value={recordId} onChange={(event) => setRecordId(event.target.value)} />
        <select value={form.testName} onChange={(event) => setForm((prev) => ({ ...prev, testName: event.target.value }))}>
          <option value="CBC">CBC</option>
        </select>
        <input type="number" placeholder="Platelet count" value={form.platelet_count} onChange={(event) => setForm((prev) => ({ ...prev, platelet_count: event.target.value }))} />
        <input type="number" placeholder="WBC count" value={form.wbc_count} onChange={(event) => setForm((prev) => ({ ...prev, wbc_count: event.target.value }))} />
        <input type="number" placeholder="Hemoglobin" value={form.hemoglobin} onChange={(event) => setForm((prev) => ({ ...prev, hemoglobin: event.target.value }))} />
        <input placeholder="Summary" value={form.summary} onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))} />
      </div>

      <div className="card">
        <h3>Reference Ranges ({form.testName})</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Normal Range</th>
                <th>Current Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(ranges).map((key) => {
                const range = ranges[key];
                const value = Number(form[key]);
                const isOut = !Number.isNaN(value) && (value < range.min || value > range.max);
                return (
                  <tr key={key}>
                    <td>{key}</td>
                    <td>
                      {range.min}-{range.max} {range.unit}
                    </td>
                    <td>{form[key]}</td>
                    <td className={isOut ? "error" : "success-text"}>{isOut ? "Out of range" : "Normal"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {abnormal.length > 0 ? <p className="error">Abnormal markers: {abnormal.join(", ")}</p> : null}
      </div>

      <button
        type="button"
        className="primary"
        onClick={async () => {
          try {
            const payload = new FormData();
            payload.append("testName", form.testName);
            payload.append(
              "values",
              JSON.stringify({
                platelet_count: Number(form.platelet_count),
                wbc_count: Number(form.wbc_count),
                hemoglobin: Number(form.hemoglobin)
              })
            );
            payload.append("summary", form.summary);
            if (reportImage) {
              payload.append("reportImage", reportImage);
            }

            const { data } = await api.post(`/api/clinical/records/${recordId}/lab-reports`, payload, {
              headers: {
                "Content-Type": "multipart/form-data"
              }
            });
            const imageInfo = data.labReport.reportImageUrl ? ` | File: ${data.labReport.reportImageUrl}` : "";
            setResult(`Lab report uploaded${imageInfo}`);
          } catch (err) {
            setResult(err?.response?.data?.error || "Upload failed");
          }
        }}
      >
        Upload Report
      </button>

      <div className="card">
        <h3>Optional Report Image/PDF</h3>
        <input
          type="file"
          accept=".png,.jpg,.jpeg,.pdf"
          onChange={(event) => setReportImage(event.target.files?.[0] || null)}
        />
      </div>

      {result ? <p className="success-text">{result}</p> : null}
    </section>
  );
}
