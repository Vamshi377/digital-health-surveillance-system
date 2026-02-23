import { useEffect, useState } from "react";
import api from "../services/api";

export default function PatientPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await api.get("/api/clinical/patient/me/history");
        setData(response.data);
      } catch (err) {
        setError(err?.response?.data?.error || "Unable to load records");
      }
    }
    load();
  }, []);

  if (error) {
    return <p className="error">{error}</p>;
  }
  if (!data) {
    return <p>Loading records...</p>;
  }

  const latestPrediction = data.predictions?.[0];

  return (
    <section>
      <h2>My Health Records</h2>
      <p>
        {data.patient.fullName} | Patient Code: {data.patient.patientCode}
      </p>
      <div className="stats-grid">
        <article className="stat-card">
          <span>Total Visits</span>
          <strong>{data.medicalRecords.length}</strong>
        </article>
        <article className="stat-card">
          <span>Total Diagnoses</span>
          <strong>{data.diagnoses.length}</strong>
        </article>
        <article className="stat-card">
          <span>Latest Predicted Severity</span>
          <strong>{latestPrediction?.predictedSeverity || "N/A"}</strong>
        </article>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Disease</th>
              <th>Doctor Severity</th>
              <th>ML Severity</th>
              <th>Probability</th>
            </tr>
          </thead>
          <tbody>
            {data.diagnoses.map((diagnosis) => {
              const prediction = data.predictions.find((item) => item.diagnosis === diagnosis._id);
              return (
                <tr key={diagnosis._id}>
                  <td>{new Date(diagnosis.createdAt).toLocaleString()}</td>
                  <td>{diagnosis.diseaseName}</td>
                  <td>{diagnosis.doctorSeverity || "-"}</td>
                  <td>{prediction?.predictedSeverity || "-"}</td>
                  <td>{prediction?.probability ?? "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
