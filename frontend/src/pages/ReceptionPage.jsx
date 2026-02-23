import { useState } from "react";
import api from "../services/api";
import StatCard from "../components/StatCard";

export default function ReceptionPage() {
  const [form, setForm] = useState({
    fullName: "",
    age: "",
    gender: "male",
    district: "",
    area: "",
    addressLine: "",
    contactNumber: ""
  });
  const [created, setCreated] = useState(null);
  const [error, setError] = useState("");

  return (
    <section>
      <h2>Reception Desk</h2>
      <p>Register a patient and generate a unique patient ID.</p>

      <div className="stats-grid">
        <StatCard label="Workflow Stage" value="Registration" />
        <StatCard label="Patient Code" value={created?.patientCode || "Pending"} />
        <StatCard label="Next Step" value="Nurse Vitals" />
      </div>

      <div className="card grid-2">
        <input placeholder="Full name" value={form.fullName} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} />
        <input placeholder="Age" value={form.age} onChange={(event) => setForm((prev) => ({ ...prev, age: event.target.value }))} />
        <select value={form.gender} onChange={(event) => setForm((prev) => ({ ...prev, gender: event.target.value }))}>
          <option value="male">male</option>
          <option value="female">female</option>
          <option value="other">other</option>
        </select>
        <input placeholder="District" value={form.district} onChange={(event) => setForm((prev) => ({ ...prev, district: event.target.value }))} />
        <input placeholder="Area" value={form.area} onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))} />
        <input placeholder="Address line" value={form.addressLine} onChange={(event) => setForm((prev) => ({ ...prev, addressLine: event.target.value }))} />
        <input placeholder="Contact number" value={form.contactNumber} onChange={(event) => setForm((prev) => ({ ...prev, contactNumber: event.target.value }))} />
      </div>
      <button
        type="button"
        className="primary"
        onClick={async () => {
          setError("");
          try {
            const payload = { ...form, age: Number(form.age) };
            const { data } = await api.post("/api/clinical/patients", payload);
            setCreated(data.patient);
          } catch (err) {
            setError(err?.response?.data?.error || "Registration failed");
          }
        }}
      >
        Register Patient
      </button>
      {error ? <p className="error">{error}</p> : null}
      {created ? (
        <div className="card success">
          <h3>Patient Created</h3>
          <p>Patient ID: {created._id}</p>
          <p>Patient Code: {created.patientCode}</p>
        </div>
      ) : null}
    </section>
  );
}
