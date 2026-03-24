import { useState } from "react";
import api from "../services/api";
import StatCard from "../components/StatCard";

function calculateAgeFromDob(dateValue) {
  if (!dateValue) return "";
  const dob = new Date(dateValue);
  if (Number.isNaN(dob.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDelta = now.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 0 ? String(age) : "";
}

export default function ReceptionPage() {
  const [form, setForm] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "male",
    district: "",
    area: "",
    addressLine: "",
    contactNumber: "",
    lat: "",
    lng: ""
  });
  const [created, setCreated] = useState(null);
  const [error, setError] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [appointmentForm, setAppointmentForm] = useState({
    scheduledAt: "",
    reason: ""
  });
  const [appointmentInfo, setAppointmentInfo] = useState(null);

  return (
    <section>
      <h2>Reception Desk</h2>
      <p>Register a patient and generate a unique patient ID.</p>

      <div className="stats-grid">
        <StatCard label="Workflow Stage" value="Registration" />
        <StatCard label="Patient Code" value={created?.patientCode || "Pending"} />
        <StatCard label="Age (Auto)" value={calculateAgeFromDob(form.dateOfBirth) || "Enter DOB"} />
        <StatCard label="Next Step" value={appointmentInfo ? "Nurse Queue" : "Schedule Appointment"} />
      </div>

      <div className="card grid-2">
        <input placeholder="Full name" value={form.fullName} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} />
        <div className="field">
          <label>Date of Birth</label>
          <input
            type="date"
            required
            value={form.dateOfBirth}
            onChange={(event) => setForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))}
          />
        </div>
        <select value={form.gender} onChange={(event) => setForm((prev) => ({ ...prev, gender: event.target.value }))}>
          <option value="male">male</option>
          <option value="female">female</option>
          <option value="other">other</option>
        </select>
        <input placeholder="District" value={form.district} onChange={(event) => setForm((prev) => ({ ...prev, district: event.target.value }))} />
        <input placeholder="Area" value={form.area} onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))} />
        <input placeholder="Address line" value={form.addressLine} onChange={(event) => setForm((prev) => ({ ...prev, addressLine: event.target.value }))} />
        <div className="inline">
          <input
            placeholder="Contact number"
            value={form.contactNumber}
            onChange={(event) => setForm((prev) => ({ ...prev, contactNumber: event.target.value }))}
          />
          <button
            type="button"
            onClick={async () => {
              try {
                setSearchStatus("");
                if (!form.contactNumber.trim()) {
                  setSearchStatus("Enter phone number first.");
                  return;
                }
                const { data } = await api.get(
                  `/api/clinical/patients/search-by-phone?phone=${encodeURIComponent(form.contactNumber.trim())}`
                );
                if (data.patient) {
                  setCreated(data.patient);
                  setSearchStatus(`Existing patient found: ${data.patient.patientCode}`);
                } else {
                  setSearchStatus("No patient found with this phone. Create new patient.");
                }
              } catch (err) {
                setSearchStatus(err?.response?.data?.error || "Search failed");
              }
            }}
          >
            Search Existing
          </button>
        </div>
        <input
          placeholder="Latitude (optional)"
          value={form.lat}
          onChange={(event) => setForm((prev) => ({ ...prev, lat: event.target.value }))}
        />
        <input
          placeholder="Longitude (optional)"
          value={form.lng}
          onChange={(event) => setForm((prev) => ({ ...prev, lng: event.target.value }))}
        />
      </div>
      {searchStatus ? <p className="hint">{searchStatus}</p> : null}
      <button
        type="button"
        className="primary"
        disabled={!form.dateOfBirth}
        onClick={async () => {
          setError("");
          try {
            const payload = {
              fullName: form.fullName,
              dateOfBirth: form.dateOfBirth || null,
              gender: form.gender,
              district: form.district,
              area: form.area,
              addressLine: form.addressLine,
              contactNumber: form.contactNumber || null,
              location: {
                lat: form.lat ? Number(form.lat) : null,
                lng: form.lng ? Number(form.lng) : null
              }
            };
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

      {created ? (
        <div className="card">
          <h3>Schedule Appointment</h3>
          <div className="grid-2">
            <div className="field">
              <label>Scheduled At</label>
              <input
                type="datetime-local"
                value={appointmentForm.scheduledAt}
                onChange={(event) => setAppointmentForm((prev) => ({ ...prev, scheduledAt: event.target.value }))}
              />
            </div>
            <div className="field">
              <label>Reason</label>
              <input
                placeholder="e.g. Fever and body pain"
                value={appointmentForm.reason}
                onChange={(event) => setAppointmentForm((prev) => ({ ...prev, reason: event.target.value }))}
              />
            </div>
          </div>
          <button
            type="button"
            className="primary"
            onClick={async () => {
              try {
                setError("");
                const payload = {
                  scheduledAt: appointmentForm.scheduledAt
                    ? new Date(appointmentForm.scheduledAt).toISOString()
                    : "",
                  reason: appointmentForm.reason
                };
                const { data } = await api.post(
                  `/api/clinical/patients/${created.patientCode}/appointments`,
                  payload
                );
                setAppointmentInfo(data.appointment);
              } catch (err) {
                setError(err?.response?.data?.error || "Appointment creation failed");
              }
            }}
          >
            Create Appointment
          </button>
          {appointmentInfo ? (
            <p className="success-text">
              Appointment Created: {appointmentInfo._id} | {new Date(appointmentInfo.scheduledAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
