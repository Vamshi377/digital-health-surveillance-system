import { useEffect, useState } from "react";
import api from "../services/api";
import StatCard from "../components/StatCard";

function evaluateVitals(vitals) {
  const checks = [
    {
      key: "temperature",
      label: "Temperature (F)",
      value: vitals?.temperature,
      abnormal: Number(vitals?.temperature) >= 103
    },
    {
      key: "bpSystolic",
      label: "BP Systolic",
      value: vitals?.bpSystolic,
      abnormal: Number(vitals?.bpSystolic) > 140 || Number(vitals?.bpSystolic) < 90
    },
    {
      key: "bpDiastolic",
      label: "BP Diastolic",
      value: vitals?.bpDiastolic,
      abnormal: Number(vitals?.bpDiastolic) > 90 || Number(vitals?.bpDiastolic) < 60
    },
    {
      key: "pulse",
      label: "Pulse",
      value: vitals?.pulse,
      abnormal: Number(vitals?.pulse) > 110 || Number(vitals?.pulse) < 55
    },
    {
      key: "spo2",
      label: "SpO2",
      value: vitals?.spo2,
      abnormal: Number(vitals?.spo2) < 94
    }
  ];
  return checks;
}

export default function DoctorPage() {
  const [records, setRecords] = useState([]);
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState({
    diseaseName: "Dengue",
    diagnosisNotes: "",
    medicines: [
      {
        medicineName: "Paracetamol",
        dosage: "650mg",
        frequency: "TID",
        durationDays: 5,
        instructions: "After food"
      }
    ]
  });
  const [message, setMessage] = useState("");

  const loadDashboard = async () => {
    const { data } = await api.get("/api/clinical/doctor/dashboard");
    setRecords(data.records || []);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!selectedRecordId) {
      setSummary(null);
      return;
    }

    const loadSummary = async () => {
      try {
        const { data } = await api.get(`/api/clinical/records/${selectedRecordId}/summary`);
        setSummary(data);
      } catch (err) {
        setMessage(err?.response?.data?.error || "Unable to load record summary");
      }
    };

    loadSummary();
  }, [selectedRecordId]);

  const pending = records.filter((item) => item.status === "in_review").length;
  const diagnosed = records.filter((item) => item.status === "diagnosed").length;
  const vitalsRows = evaluateVitals(summary?.record?.vitals || {});

  return (
    <section>
      <h2>Doctor Workspace</h2>
      <p>Use one unified patient summary with nurse vitals, lab findings, and previous diagnosis history.</p>

      <div className="stats-grid">
        <StatCard label="Open Cases" value={pending} />
        <StatCard label="Diagnosed Cases" value={diagnosed} />
        <StatCard label="Total Records" value={records.length} />
      </div>

      <div className="card">
        <h3>Current Queue</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Patient Code</th>
                <th>Status</th>
                <th>Record ID</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row) => (
                <tr key={row._id}>
                  <td>{row.patient?.fullName}</td>
                  <td>{row.patient?.patientCode}</td>
                  <td>{row.status}</td>
                  <td>{row._id}</td>
                  <td>
                    <button type="button" onClick={() => setSelectedRecordId(row._id)}>
                      Open Summary
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {summary ? (
        <div className="card">
          <h3>Patient Summary: {summary.record?.patient?.fullName}</h3>
          <p>
            Code: {summary.record?.patient?.patientCode} | Area: {summary.record?.patient?.district},{" "}
            {summary.record?.patient?.area}
          </p>

          <h4>Vitals Snapshot</h4>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {vitalsRows.map((row) => (
                  <tr key={row.key}>
                    <td>{row.label}</td>
                    <td>{row.value ?? "-"}</td>
                    <td className={row.abnormal ? "error" : "success-text"}>{row.abnormal ? "Abnormal" : "Normal"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4>Latest Lab Report</h4>
          {summary.latestLabReport ? (
            <div>
              <p>
                {summary.latestLabReport.testName} | Critical:{" "}
                {summary.latestLabReport.isCritical ? "Yes" : "No"}
              </p>
              <pre>{JSON.stringify(summary.latestLabReport.values || {}, null, 2)}</pre>
              {summary.latestLabReport.reportImageUrl ? (
                <a href={`${api.defaults.baseURL}${summary.latestLabReport.reportImageUrl}`} target="_blank" rel="noreferrer">
                  Open attached report
                </a>
              ) : null}
            </div>
          ) : (
            <p className="hint">No lab report uploaded yet for this visit.</p>
          )}

          <h4>Diagnosis History</h4>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Disease</th>
                  <th>Doctor Severity</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {summary.diagnosisHistory?.map((diag) => (
                  <tr key={diag._id}>
                    <td>{new Date(diag.createdAt).toLocaleString()}</td>
                    <td>{diag.diseaseName}</td>
                    <td>{diag.doctorSeverity || "-"}</td>
                    <td>{diag.diagnosisNotes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="card grid-2">
        <h3>Submit Diagnosis</h3>
        <input placeholder="Record ID (select from queue)" value={selectedRecordId} readOnly />
        <input placeholder="Disease name" value={form.diseaseName} onChange={(event) => setForm((prev) => ({ ...prev, diseaseName: event.target.value }))} />
        <input placeholder="Diagnosis notes" value={form.diagnosisNotes} onChange={(event) => setForm((prev) => ({ ...prev, diagnosisNotes: event.target.value }))} />

        <div className="field field-full">
          <label>Prescription Table (Drug, Dosage, Frequency)</label>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Drug</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Days</th>
                  <th>Instructions</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {form.medicines.map((med, idx) => (
                  <tr key={`med-${idx}`}>
                    <td>
                      <input
                        value={med.medicineName}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            medicines: prev.medicines.map((row, i) =>
                              i === idx ? { ...row, medicineName: event.target.value } : row
                            )
                          }))
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={med.dosage}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            medicines: prev.medicines.map((row, i) =>
                              i === idx ? { ...row, dosage: event.target.value } : row
                            )
                          }))
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={med.frequency}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            medicines: prev.medicines.map((row, i) =>
                              i === idx ? { ...row, frequency: event.target.value } : row
                            )
                          }))
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        value={med.durationDays}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            medicines: prev.medicines.map((row, i) =>
                              i === idx ? { ...row, durationDays: Number(event.target.value) } : row
                            )
                          }))
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={med.instructions}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            medicines: prev.medicines.map((row, i) =>
                              i === idx ? { ...row, instructions: event.target.value } : row
                            )
                          }))
                        }
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            medicines: prev.medicines.filter((_, i) => i !== idx)
                          }))
                        }
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                medicines: [
                  ...prev.medicines,
                  {
                    medicineName: "",
                    dosage: "",
                    frequency: "",
                    durationDays: 3,
                    instructions: ""
                  }
                ]
              }))
            }
          >
            Add Medicine
          </button>
        </div>

        <button
          type="button"
          className="primary"
          disabled={!selectedRecordId}
          onClick={async () => {
            try {
              setMessage("");
              const payload = {
                diseaseName: form.diseaseName,
                diagnosisNotes: form.diagnosisNotes,
                prescription: {
                  medicines: form.medicines.filter((item) => item.medicineName && item.dosage && item.frequency),
                  generalAdvice: "Hydration and rest"
                }
              };
              const { data } = await api.post(`/api/clinical/records/${selectedRecordId}/diagnosis`, payload);
              setMessage(
                `Diagnosis saved. ML: ${data.prediction.predictedSeverity} (${data.prediction.probability})`
              );
              setSelectedRecordId("");
              setSummary(null);
              await loadDashboard();
            } catch (err) {
              setMessage(err?.response?.data?.error || "Diagnosis failed");
            }
          }}
        >
          Submit
        </button>
      </div>
      {message ? <p className="success-text">{message}</p> : null}
    </section>
  );
}
