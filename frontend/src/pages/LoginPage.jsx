import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

const presets = [
  { label: "Admin", email: "admin@health.local", password: "Admin@123" },
  { label: "Reception", email: "reception@health.local", password: "Reception@123" },
  { label: "Nurse", email: "nurse@health.local", password: "Nurse@123" },
  { label: "Lab", email: "lab@health.local", password: "Lab@123" },
  { label: "Doctor", email: "doctor@health.local", password: "Doctor@123" },
  { label: "DMO", email: "dmo@health.local", password: "Dmo@123" },
  { label: "Patient", email: "patient@health.local", password: "Patient@123" }
];

const rolePath = {
  admin: "/admin",
  receptionist: "/reception",
  nurse: "/nurse",
  lab_technician: "/lab",
  doctor: "/doctor",
  government_officer: "/dmo",
  patient: "/patient"
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="login-wrap">
      <section className="login-card">
        <h2>Secure Sign-In</h2>
        <p>Digital Health Record and Disease Surveillance System</p>

        <div className="preset-row">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setForm({ email: preset.email, password: preset.password })}
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

        {error ? <p className="error">{error}</p> : null}

        <button
          type="button"
          className="primary"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            setError("");
            try {
              const user = await login(form.email, form.password);
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
      </section>
    </div>
  );
}
