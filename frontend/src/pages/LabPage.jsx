import { useState } from "react";
import api from "../services/api";
import StatCard from "../components/StatCard";

export default function LabPage() {
  const [recordId, setRecordId] = useState("");
  const [result, setResult] = useState("");
  const [form, setForm] = useState({
    testName: "CBC",
    plateletCount: "90000",
    wbc: "high",
    crp: "positive",
    summary: "Platelets reduced and markers elevated."
  });

  return (
    <section>
      <h2>Lab Upload</h2>
      <p>Upload patient laboratory findings to the active medical record.</p>

      <div className="stats-grid">
        <StatCard label="Workflow Stage" value="Lab Validation" />
        <StatCard label="Record ID" value={recordId || "Pending"} />
        <StatCard label="Next Step" value="Doctor Diagnosis" />
      </div>

      <div className="card grid-2">
        <input placeholder="Medical Record ID" value={recordId} onChange={(event) => setRecordId(event.target.value)} />
        <input placeholder="Test name" value={form.testName} onChange={(event) => setForm((prev) => ({ ...prev, testName: event.target.value }))} />
        <input placeholder="Platelet count" value={form.plateletCount} onChange={(event) => setForm((prev) => ({ ...prev, plateletCount: event.target.value }))} />
        <input placeholder="WBC" value={form.wbc} onChange={(event) => setForm((prev) => ({ ...prev, wbc: event.target.value }))} />
        <input placeholder="CRP" value={form.crp} onChange={(event) => setForm((prev) => ({ ...prev, crp: event.target.value }))} />
        <input placeholder="Summary" value={form.summary} onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))} />
      </div>

      <button
        type="button"
        className="primary"
        onClick={async () => {
          try {
            await api.post(`/api/clinical/records/${recordId}/lab-reports`, {
              testName: form.testName,
              values: {
                platelet_count: Number(form.plateletCount),
                wbc: form.wbc,
                crp: form.crp
              },
              summary: form.summary
            });
            setResult("Lab report uploaded");
          } catch (err) {
            setResult(err?.response?.data?.error || "Upload failed");
          }
        }}
      >
        Upload Report
      </button>

      {result ? <p className="success-text">{result}</p> : null}
    </section>
  );
}
