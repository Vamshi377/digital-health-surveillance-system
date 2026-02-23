import { useState } from "react";
import api from "../services/api";
import StatCard from "../components/StatCard";

export default function NursePage() {
  const [patientIdentifier, setPatientIdentifier] = useState("");
  const [recordId, setRecordId] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    appointmentAt: "",
    symptoms: "fever,body_pain",
    temperature: "101",
    bpSystolic: "130",
    bpDiastolic: "86",
    pulse: "95",
    spo2: "97",
    nurseNotes: ""
  });

  return (
    <section>
      <h2>Nurse Station</h2>
      <p>Append visit vitals and symptoms to existing patient (use Patient ID or Patient Code).</p>

      <div className="stats-grid">
        <StatCard label="Current Draft Symptoms" value={form.symptoms.split(",").filter(Boolean).length} />
        <StatCard label="Record Status" value={recordId ? "Saved" : "Pending"} />
        <StatCard label="ML Trigger" value="After Doctor Diagnosis" />
      </div>

      <div className="card grid-2">
        <div className="field">
          <label>Patient Identifier</label>
          <input
            placeholder="Patient ID or Patient Code (PAT-XXXX)"
            value={patientIdentifier}
            onChange={(event) => setPatientIdentifier(event.target.value)}
          />
        </div>
        <div className="field">
          <label>Appointment Date & Time</label>
          <input type="datetime-local" value={form.appointmentAt} onChange={(event) => setForm((prev) => ({ ...prev, appointmentAt: event.target.value }))} />
        </div>
        <div className="field">
          <label>Symptoms</label>
          <input placeholder="Symptoms comma separated" value={form.symptoms} onChange={(event) => setForm((prev) => ({ ...prev, symptoms: event.target.value }))} />
        </div>
        <div className="field">
          <label>Temperature (F)</label>
          <input placeholder="Temperature" value={form.temperature} onChange={(event) => setForm((prev) => ({ ...prev, temperature: event.target.value }))} />
        </div>
        <div className="field">
          <label>BP Systolic</label>
          <input placeholder="BP Systolic" value={form.bpSystolic} onChange={(event) => setForm((prev) => ({ ...prev, bpSystolic: event.target.value }))} />
        </div>
        <div className="field">
          <label>BP Diastolic</label>
          <input placeholder="BP Diastolic" value={form.bpDiastolic} onChange={(event) => setForm((prev) => ({ ...prev, bpDiastolic: event.target.value }))} />
        </div>
        <div className="field">
          <label>Pulse</label>
          <input placeholder="Pulse" value={form.pulse} onChange={(event) => setForm((prev) => ({ ...prev, pulse: event.target.value }))} />
        </div>
        <div className="field">
          <label>SpO2</label>
          <input placeholder="SpO2" value={form.spo2} onChange={(event) => setForm((prev) => ({ ...prev, spo2: event.target.value }))} />
        </div>
        <div className="field field-full">
          <label>Nurse Notes</label>
          <input placeholder="Nurse notes" value={form.nurseNotes} onChange={(event) => setForm((prev) => ({ ...prev, nurseNotes: event.target.value }))} />
        </div>
      </div>
      <p className="hint">
        Example identifier: `PAT-XXXXXXX`. Symptoms format: `fever,body_pain,headache`
      </p>

      <button
        type="button"
        className="primary"
        onClick={async () => {
          try {
            setError("");
            const payload = {
              appointmentAt: form.appointmentAt ? new Date(form.appointmentAt).toISOString() : "",
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
            const { data } = await api.post(`/api/clinical/patients/${patientIdentifier}/records`, payload);
            setRecordId(data.medicalRecord._id);
          } catch (err) {
            setError(err?.response?.data?.error || "Save failed");
          }
        }}
      >
        Save Medical Record
      </button>

      {error ? <p className="error">{error}</p> : null}
      {recordId ? <p className="success-text">Created Record ID: {recordId}</p> : null}
    </section>
  );
}
