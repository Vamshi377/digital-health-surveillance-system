import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

const presets = [
  { label: "Hospital Admin", email: "hospitaladmin@health.local", password: "HospitalAdmin@123", role: "hospital_admin" },
  { label: "Reception", email: "reception@health.local", password: "Reception@123", role: "receptionist" },
  { label: "Nurse", email: "nurse@health.local", password: "Nurse@123", role: "nurse" },
  { label: "Lab", email: "lab@health.local", password: "Lab@123", role: "lab_technician" },
  { label: "Doctor", email: "doctor@health.local", password: "Doctor@123", role: "doctor" },
  { label: "Medical Superintendent", email: "ms@health.local", password: "Superintendent@123", role: "medical_superintendent" },
  { label: "DMO", email: "dmo@health.local", password: "Dmo@123", role: "dmo" },
  { label: "Patient", email: "patient@health.local", password: "Patient@123", role: "patient" }
];

const roleOptions = [
  { value: "doctor", label: "Doctor" },
  { value: "nurse", label: "Nurse" },
  { value: "lab_technician", label: "Lab Technician" },
  { value: "receptionist", label: "Receptionist" },
  { value: "medical_superintendent", label: "Medical Superintendent" },
  { value: "hospital_admin", label: "Hospital Admin" },
  { value: "dmo", label: "DMO" },
  { value: "patient", label: "Patient" }
];

const rolePath = {
  hospital_admin: "/admin",
  receptionist: "/reception",
  nurse: "/nurse",
  lab_technician: "/lab",
  doctor: "/doctor",
  medical_superintendent: "/superintendent",
  dmo: "/dmo",
  patient: "/patient"
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", role: "doctor" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="login-wrap">
      <section className="login-card">
        <h2>Secure Sign-In</h2>
        <p>Digital Health Surveillance System</p>

        <div className="preset-row">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setForm({ email: preset.email, password: preset.password, role: preset.role })}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <label>Email</label>
        <input
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          placeholder="user@health.local"
        />
        <label>Password</label>
        <input
          type="password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          placeholder="********"
        />
        <label>Role</label>
        <select value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}>
          {roleOptions.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>

        {error ? <p className="error">{error}</p> : null}

        <button
          type="button"
          className="primary"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            setError("");
            try {
              const user = await login(form.email, form.password, form.role);
              navigate(rolePath[user.role] || "/");
            } catch (err) {
              setError(err?.response?.data?.error || "Login failed");
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <p className="hint">
          Need an account? <Link to="/register">Register here</Link>
        </p>
      </section>
    </div>
  );
}
