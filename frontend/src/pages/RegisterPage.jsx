import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const ROLE_OPTIONS = [
  { value: "doctor", label: "Doctor" },
  { value: "nurse", label: "Nurse" },
  { value: "lab_technician", label: "Lab Technician" },
  { value: "receptionist", label: "Receptionist" },
  { value: "medical_superintendent", label: "Medical Superintendent" },
  { value: "hospital_admin", label: "Hospital Admin" },
  { value: "dmo", label: "DMO" }
];

const EMPTY_FORM = {
  fullName: "",
  email: "",
  phoneNumber: "",
  password: "",
  hospitalId: "",
  hospitalName: "",
  role: "doctor",
  registrationNumber: "",
  qualification: "",
  specialization: "",
  yearsOfExperience: "",
  nursingRegistrationNumber: "",
  experience: "",
  certificationId: "",
  labType: "",
  highestQualification: "",
  basicExperience: "",
  employeeId: "",
  officialEmail: "",
  departmentAuthority: ""
};

function DynamicFields({ role, form, setForm }) {
  if (role === "doctor") {
    return (
      <div className="grid-2">
        <input placeholder="Registration Number" value={form.registrationNumber} onChange={(event) => setForm((prev) => ({ ...prev, registrationNumber: event.target.value }))} />
        <input placeholder="Qualification" value={form.qualification} onChange={(event) => setForm((prev) => ({ ...prev, qualification: event.target.value }))} />
        <input placeholder="Specialization" value={form.specialization} onChange={(event) => setForm((prev) => ({ ...prev, specialization: event.target.value }))} />
        <input placeholder="Years of Experience" type="number" min="0" value={form.yearsOfExperience} onChange={(event) => setForm((prev) => ({ ...prev, yearsOfExperience: event.target.value }))} />
      </div>
    );
  }

  if (role === "nurse") {
    return (
      <div className="grid-2">
        <input placeholder="Nursing Registration Number" value={form.nursingRegistrationNumber} onChange={(event) => setForm((prev) => ({ ...prev, nursingRegistrationNumber: event.target.value }))} />
        <input placeholder="Qualification" value={form.qualification} onChange={(event) => setForm((prev) => ({ ...prev, qualification: event.target.value }))} />
        <input placeholder="Experience" type="number" min="0" value={form.experience} onChange={(event) => setForm((prev) => ({ ...prev, experience: event.target.value }))} />
      </div>
    );
  }

  if (role === "lab_technician") {
    return (
      <div className="grid-2">
        <input placeholder="Certification ID" value={form.certificationId} onChange={(event) => setForm((prev) => ({ ...prev, certificationId: event.target.value }))} />
        <input placeholder="Lab Type" value={form.labType} onChange={(event) => setForm((prev) => ({ ...prev, labType: event.target.value }))} />
        <input placeholder="Experience" type="number" min="0" value={form.experience} onChange={(event) => setForm((prev) => ({ ...prev, experience: event.target.value }))} />
      </div>
    );
  }

  if (role === "receptionist") {
    return (
      <div className="grid-2">
        <input placeholder="Highest Qualification" value={form.highestQualification} onChange={(event) => setForm((prev) => ({ ...prev, highestQualification: event.target.value }))} />
        <input placeholder="Basic Experience (optional)" type="number" min="0" value={form.basicExperience} onChange={(event) => setForm((prev) => ({ ...prev, basicExperience: event.target.value }))} />
      </div>
    );
  }

  return (
    <div className="grid-2">
      <input placeholder="Employee ID" value={form.employeeId} onChange={(event) => setForm((prev) => ({ ...prev, employeeId: event.target.value }))} />
      <input placeholder="Official Email" value={form.officialEmail} onChange={(event) => setForm((prev) => ({ ...prev, officialEmail: event.target.value }))} />
      <input className="field-full" placeholder="Department / Authority" value={form.departmentAuthority} onChange={(event) => setForm((prev) => ({ ...prev, departmentAuthority: event.target.value }))} />
    </div>
  );
}

export default function RegisterPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requiredApprover = useMemo(() => {
    if (["doctor", "nurse", "lab_technician"].includes(form.role)) return "Medical Superintendent";
    if (form.role === "receptionist") return "Hospital Admin";
    if (["medical_superintendent", "hospital_admin"].includes(form.role)) return "DMO";
    if (form.role === "dmo") return "Pre-approved / system-created";
    return "Approver";
  }, [form.role]);

  return (
    <div className="login-wrap">
      <section className="login-card register-card">
        <h2>Register Staff Account</h2>
        <p>New registrations are created in pending status and must be approved before login.</p>

        <div className="grid-2">
          <input placeholder="Full Name" value={form.fullName} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} />
          <input placeholder="Email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
          <input placeholder="Phone Number" value={form.phoneNumber} onChange={(event) => setForm((prev) => ({ ...prev, phoneNumber: event.target.value }))} />
          <input type="password" placeholder="Password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} />
          <input placeholder="Hospital ID" value={form.hospitalId} onChange={(event) => setForm((prev) => ({ ...prev, hospitalId: event.target.value }))} />
          <input placeholder="Hospital Name" value={form.hospitalName} onChange={(event) => setForm((prev) => ({ ...prev, hospitalName: event.target.value }))} />
        </div>

        <label>Role</label>
        <select value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}>
          {ROLE_OPTIONS.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>

        <div className="card inset-card">
          <h3>Role-Specific Details</h3>
          <DynamicFields role={form.role} form={form} setForm={setForm} />
          <p className="hint">Approver for this role: {requiredApprover}</p>
        </div>

        {error ? <p className="error">{error}</p> : null}
        {message ? <p className="success-text">{message}</p> : null}

        <button
          type="button"
          className="primary"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            setError("");
            setMessage("");
            try {
              const { data } = await api.post("/api/auth/register", form);
              setMessage(data.message || "Registration submitted");
              setForm(EMPTY_FORM);
            } catch (err) {
              setError(err?.response?.data?.error || "Registration failed");
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Submitting..." : "Submit Registration"}
        </button>

        <p className="hint">
          Already approved? <Link to="/login">Go to login</Link>
        </p>
      </section>
    </div>
  );
}
