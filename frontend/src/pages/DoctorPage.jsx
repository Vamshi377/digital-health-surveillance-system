import { useEffect, useState } from "react";
import api from "../services/api";
import StatCard from "../components/StatCard";

export default function DoctorPage() {
  const [records, setRecords] = useState([]);
  const [patientCode, setPatientCode] = useState("");
  const [history, setHistory] = useState(null);
  const [form, setForm] = useState({
    recordId: "",
    diseaseName: "Dengue",
    diagnosisNotes: ""
  });
  const [message, setMessage] = useState("");

  const loadDashboard = async () => {
    const { data } = await api.get("/api/clinical/doctor/dashboard");
    setRecords(data.records || []);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const pending = records.filter((item) => item.status === "in_review").length;
  const diagnosed = records.filter((item) => item.status === "diagnosed").length;

  return (
    <section>
      <h2>Doctor Workspace</h2>
      <p>Review all visit records, fetch patient history, and submit diagnosis.</p>

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
              </tr>
            </thead>
            <tbody>
              {records.map((row) => (
                <tr key={row._id}>
                  <td>{row.patient?.fullName}</td>
                  <td>{row.patient?.patientCode}</td>
                  <td>{row.status}</td>
                  <td>{row._id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>Fetch Patient History</h3>
        <div className="inline">
          <input placeholder="Patient Code (PAT-XXXX)" value={patientCode} onChange={(event) => setPatientCode(event.target.value)} />
          <button
            type="button"
            onClick={async () => {
              const { data } = await api.get(`/api/clinical/patients/by-code/${patientCode}/history`);
              setHistory(data);
            }}
          >
            Load History
          </button>
        </div>
        {history ? (
          <p>
            {history.patient.fullName} | Records: {history.medicalRecords.length} | Diagnoses: {history.diagnoses.length}
          </p>
        ) : null}
      </div>

      <div className="card grid-2">
        <h3>Submit Diagnosis</h3>
        <input placeholder="Record ID" value={form.recordId} onChange={(event) => setForm((prev) => ({ ...prev, recordId: event.target.value }))} />
        <input placeholder="Disease name" value={form.diseaseName} onChange={(event) => setForm((prev) => ({ ...prev, diseaseName: event.target.value }))} />
        <input placeholder="Diagnosis notes" value={form.diagnosisNotes} onChange={(event) => setForm((prev) => ({ ...prev, diagnosisNotes: event.target.value }))} />
        <button
          type="button"
          className="primary"
          onClick={async () => {
            try {
              const payload = {
                diseaseName: form.diseaseName,
                diagnosisNotes: form.diagnosisNotes,
                prescription: {
                  medicines: [
                    {
                      medicineName: "Paracetamol",
                      dosage: "650mg",
                      frequency: "TID",
                      durationDays: 5,
                      instructions: "After food"
                    }
                  ],
                  generalAdvice: "Hydration and rest"
                }
              };
              const { data } = await api.post(`/api/clinical/records/${form.recordId}/diagnosis`, payload);
              setMessage(
                `Diagnosis saved. ML: ${data.prediction.predictedSeverity} (${data.prediction.probability})`
              );
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
