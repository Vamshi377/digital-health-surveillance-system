import { useState } from "react";
import api from "../services/api";
import StatCard from "../components/StatCard";
import { useEffect } from "react";

export default function NursePage() {
  const [queue, setQueue] = useState([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [recordId, setRecordId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    symptoms: "fever,body_pain",
    temperature: "101",
    bpSystolic: "130",
    bpDiastolic: "86",
    pulse: "95",
    spo2: "97",
    nurseNotes: ""
  });

  const loadQueue = async () => {
    const { data } = await api.get("/api/clinical/nurse/queue");
    setQueue(data.queue || []);
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const spo2Value = Number(form.spo2);
  const isCriticalSpo2 = !Number.isNaN(spo2Value) && spo2Value > 0 && spo2Value < 90;
  const isInvalidSpo2 = !Number.isNaN(spo2Value) && spo2Value > 100;

  return (
    <section>
      <h2>Nurse Station</h2>
      <p>Open queue appointments and record vitals once per appointment.</p>

      <div className="stats-grid">
        <StatCard label="Queued Patients" value={queue.length} />
        <StatCard label="Record Status" value={recordId ? "Saved" : "Pending"} />
        <StatCard label="SpO2 State" value={isCriticalSpo2 ? "Critical" : "Stable"} />
        <StatCard label="ML Trigger" value="After Doctor Diagnosis" />
      </div>

      <div className="card">
        <h3>Today Queue</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Appointment ID</th>
                <th>Patient Code</th>
                <th>Patient Name</th>
                <th>Scheduled At</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item) => (
                <tr key={item._id}>
                  <td>{item._id}</td>
                  <td>{item.patient?.patientCode}</td>
                  <td>{item.patient?.fullName}</td>
                  <td>{new Date(item.scheduledAt).toLocaleString()}</td>
                  <td>{item.reason || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card grid-2">
        <div className="field">
          <label>Appointment ID</label>
          <input
            placeholder="Paste appointment ID from queue"
            value={selectedAppointmentId}
            onChange={(event) => setSelectedAppointmentId(event.target.value)}
          />
        </div>
        <div className="field">
          <label>Symptoms</label>
          <input placeholder="Symptoms comma separated" value={form.symptoms} onChange={(event) => setForm((prev) => ({ ...prev, symptoms: event.target.value }))} />
        </div>
        <div className="field">
          <label>Temperature (F)</label>
          <input type="number" min="90" max="115" placeholder="Temperature" value={form.temperature} onChange={(event) => setForm((prev) => ({ ...prev, temperature: event.target.value }))} />
        </div>
        <div className="field">
          <label>BP Systolic</label>
          <input type="number" min="40" max="260" placeholder="BP Systolic" value={form.bpSystolic} onChange={(event) => setForm((prev) => ({ ...prev, bpSystolic: event.target.value }))} />
        </div>
        <div className="field">
          <label>BP Diastolic</label>
          <input type="number" min="20" max="180" placeholder="BP Diastolic" value={form.bpDiastolic} onChange={(event) => setForm((prev) => ({ ...prev, bpDiastolic: event.target.value }))} />
        </div>
        <div className="field">
          <label>Pulse</label>
          <input type="number" min="20" max="250" placeholder="Pulse" value={form.pulse} onChange={(event) => setForm((prev) => ({ ...prev, pulse: event.target.value }))} />
        </div>
        <div className="field">
          <label>SpO2</label>
          <input type="number" min="0" max="100" placeholder="SpO2" value={form.spo2} onChange={(event) => setForm((prev) => ({ ...prev, spo2: event.target.value }))} />
        </div>
        <div className="field field-full">
          <label>Nurse Notes</label>
          <input placeholder="Nurse notes" value={form.nurseNotes} onChange={(event) => setForm((prev) => ({ ...prev, nurseNotes: event.target.value }))} />
        </div>
      </div>
      {isCriticalSpo2 ? <p className="critical-text">Critical Alert: SpO2 is below 90. Escalate immediately.</p> : null}
      {isInvalidSpo2 ? <p className="error">SpO2 cannot be greater than 100.</p> : null}
      <p className="hint">
        Nurse should select appointment from queue. A record can only be saved once per appointment.
      </p>

      <button
        type="button"
        className="primary"
        disabled={!selectedAppointmentId || !!recordId || isInvalidSpo2}
        onClick={async () => {
          try {
            setError("");
            setMessage("");
            const payload = {
              symptoms: form.symptoms.split(",").map((x) => x.trim()).filter(Boolean),
              vitals: {
                temperature: Number(form.temperature),
                bpSystolic: Number(form.bpSystolic),
                bpDiastolic: Number(form.bpDiastolic),
                pulse: Number(form.pulse),
                spo2: Number(form.spo2)
              },
              nurseNotes: form.nurseNotes
            };
            const { data } = await api.post(
              `/api/clinical/appointments/${selectedAppointmentId}/records`,
              payload
            );
            setRecordId(data.medicalRecord._id);
            setMessage("Vitals saved successfully. This appointment is moved out of nurse queue.");
            await loadQueue();
          } catch (err) {
            setError(err?.response?.data?.error || "Save failed");
          }
        }}
      >
        Save Medical Record
      </button>

      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success-text">{message}</p> : null}
      {recordId ? <p className="success-text">Created Record ID: {recordId}</p> : null}
    </section>
  );
}
