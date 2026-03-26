import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import StatCard from "../components/StatCard";
import { useAuth } from "../state/AuthContext";

const APPROVER_LABELS = {
  hospital_admin: "Hospital Admin Approval Desk",
  medical_superintendent: "Medical Superintendent Approval Desk",
  dmo: "DMO Approval Desk"
};

const FILTER_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "doctor", label: "Doctor" },
  { value: "nurse", label: "Nurse" },
  { value: "lab_technician", label: "Lab Technician" },
  { value: "receptionist", label: "Receptionist" },
  { value: "medical_superintendent", label: "Medical Superintendent" },
  { value: "hospital_admin", label: "Hospital Admin" }
];

export default function ApprovalPage() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [roleFilter, setRoleFilter] = useState("");
  const [remarks, setRemarks] = useState({});
  const [message, setMessage] = useState("");

  const allowedRoleSet = useMemo(() => {
    if (user?.role === "medical_superintendent") return new Set(["doctor", "nurse", "lab_technician"]);
    if (user?.role === "hospital_admin") return new Set(["receptionist"]);
    if (user?.role === "dmo") return new Set(["medical_superintendent", "hospital_admin"]);
    return new Set();
  }, [user?.role]);

  const loadRegistrations = async () => {
    const params = new URLSearchParams({ approvalStatus: "PENDING" });
    if (roleFilter) params.set("role", roleFilter);
    const { data } = await api.get(`/api/admin/users?${params.toString()}`);
    setRegistrations((data.users || []).filter((item) => allowedRoleSet.has(item.role)));
  };

  useEffect(() => {
    loadRegistrations();
  }, [roleFilter, user?.role]);

  const counts = registrations.reduce(
    (acc, item) => {
      acc.total += 1;
      acc[item.role] = (acc[item.role] || 0) + 1;
      return acc;
    },
    { total: 0 }
  );

  async function review(userId, status) {
    try {
      setMessage("");
      await api.patch(`/api/admin/users/${userId}/approval`, {
        status,
        remarks: remarks[userId] || ""
      });
      setMessage(`Registration ${status.toLowerCase()} successfully.`);
      await loadRegistrations();
    } catch (err) {
      setMessage(err?.response?.data?.error || "Review failed");
    }
  }

  return (
    <section>
      <h2>{APPROVER_LABELS[user?.role] || "Approval Dashboard"}</h2>
      <p>Review pending registrations, verify validity, and approve or reject accounts.</p>

      <div className="stats-grid">
        <StatCard label="Pending Requests" value={counts.total || 0} />
        <StatCard label="Doctors / Nurses" value={`${counts.doctor || 0} / ${counts.nurse || 0}`} />
        <StatCard label="Lab / Reception" value={`${counts.lab_technician || 0} / ${counts.receptionist || 0}`} />
      </div>

      <div className="card">
        <div className="inline">
          <div className="field">
            <label>Filter by Role</label>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              {FILTER_OPTIONS.filter((item) => item.value === "" || allowedRoleSet.has(item.value)).map((item) => (
                <option key={item.value || "all"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {message ? <p className={message.toLowerCase().includes("failed") || message.toLowerCase().includes("only") ? "error" : "success-text"}>{message}</p> : null}
      </div>

      <div className="card">
        <h3>Pending Registrations</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Hospital</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Details</th>
                <th>Remarks</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((item) => (
                <tr key={item._id}>
                  <td>{item.fullName}</td>
                  <td>{item.role}</td>
                  <td>
                    {item.hospitalName}
                    <br />
                    <span className="hint">{item.hospitalId}</span>
                  </td>
                  <td>{item.email}</td>
                  <td>{item.phoneNumber || "-"}</td>
                  <td>
                    <div className="detail-stack">
                      {item.roleProfile?.registrationNumber ? <span>Reg: {item.roleProfile.registrationNumber}</span> : null}
                      {item.roleProfile?.nursingRegistrationNumber ? <span>Nursing Reg: {item.roleProfile.nursingRegistrationNumber}</span> : null}
                      {item.roleProfile?.certificationId ? <span>Cert: {item.roleProfile.certificationId}</span> : null}
                      {item.roleProfile?.qualification ? <span>Qual: {item.roleProfile.qualification}</span> : null}
                      {item.roleProfile?.specialization ? <span>Spec: {item.roleProfile.specialization}</span> : null}
                      {item.roleProfile?.labType ? <span>Lab: {item.roleProfile.labType}</span> : null}
                      {item.roleProfile?.highestQualification ? <span>Highest: {item.roleProfile.highestQualification}</span> : null}
                      {item.roleProfile?.employeeId ? <span>Emp ID: {item.roleProfile.employeeId}</span> : null}
                      {item.roleProfile?.officialEmail ? <span>Official: {item.roleProfile.officialEmail}</span> : null}
                      {item.roleProfile?.departmentAuthority ? <span>Dept: {item.roleProfile.departmentAuthority}</span> : null}
                    </div>
                  </td>
                  <td>
                    <input
                      placeholder="Optional remarks"
                      value={remarks[item._id] || ""}
                      onChange={(event) => setRemarks((prev) => ({ ...prev, [item._id]: event.target.value }))}
                    />
                  </td>
                  <td>
                    <div className="action-stack">
                      <button type="button" className="primary" onClick={() => review(item._id, "APPROVED")}>
                        Approve
                      </button>
                      <button type="button" onClick={() => review(item._id, "REJECTED")}>
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan="8">No pending registrations for your approval scope.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
