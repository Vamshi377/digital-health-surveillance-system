import { useEffect, useState } from "react";
import api from "../services/api";
import StatCard from "../components/StatCard";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "receptionist",
    patientCode: ""
  });

  const loadUsers = async () => {
    const { data } = await api.get("/api/admin/users");
    setUsers(data.users || []);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const activeUsers = users.filter((item) => item.isActive).length;
  const doctors = users.filter((item) => item.role === "doctor").length;
  const dmoUsers = users.filter((item) => item.role === "government_officer").length;

  return (
    <section>
      <h2>Admin Console</h2>
      <p>Manage all platform accounts and role assignments.</p>

      <div className="stats-grid">
        <StatCard label="Total Users" value={users.length} />
        <StatCard label="Active Accounts" value={activeUsers} />
        <StatCard label="Doctors / DMO" value={`${doctors} / ${dmoUsers}`} />
      </div>

      <div className="card">
        <h3>Create User</h3>
        <div className="grid-2">
          <input placeholder="Full name" value={form.fullName} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} />
          <input placeholder="Email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
          <input placeholder="Password" type="password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} />
          <select value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}>
            <option value="receptionist">receptionist</option>
            <option value="nurse">nurse</option>
            <option value="doctor">doctor</option>
            <option value="lab_technician">lab_technician</option>
            <option value="government_officer">government_officer</option>
            <option value="patient">patient</option>
            <option value="admin">admin</option>
          </select>
          <input placeholder="Patient code (only for patient role)" value={form.patientCode} onChange={(event) => setForm((prev) => ({ ...prev, patientCode: event.target.value }))} />
        </div>
        <button
          type="button"
          className="primary"
          onClick={async () => {
            try {
              await api.post("/api/admin/users", form);
              setMessage("User created");
              setForm({ fullName: "", email: "", password: "", role: "receptionist", patientCode: "" });
              await loadUsers();
            } catch (error) {
              setMessage(error?.response?.data?.error || "Create failed");
            }
          }}
        >
          Create User
        </button>
        {message ? <p>{message}</p> : null}
      </div>

      <div className="card">
        <h3>Users</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.isActive ? "Active" : "Suspended"}</td>
                  <td>
                    <button
                      type="button"
                      onClick={async () => {
                        await api.patch(`/api/admin/users/${user._id}/status`, { isActive: !user.isActive });
                        await loadUsers();
                      }}
                    >
                      {user.isActive ? "Suspend" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
