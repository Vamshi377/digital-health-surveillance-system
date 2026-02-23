import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

const roleLinks = {
  admin: [{ label: "Admin", to: "/admin" }],
  receptionist: [{ label: "Reception", to: "/reception" }],
  nurse: [{ label: "Nurse", to: "/nurse" }],
  lab_technician: [{ label: "Lab", to: "/lab" }],
  doctor: [{ label: "Doctor", to: "/doctor" }],
  government_officer: [{ label: "DMO", to: "/dmo" }],
  patient: [{ label: "My Records", to: "/patient" }]
};

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = roleLinks[user?.role] || [];

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">DH</div>
          <div>
            <h1>Digital Health Platform</h1>
            <p>Clinical + Surveillance Command Center</p>
          </div>
        </div>
        <div className="meta">
          <span>{user?.fullName}</span>
          <span className="role-chip">{user?.role}</span>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="body-grid">
        <aside className="sidebar">
          {links.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "active-link" : "")}>
              {item.label}
            </NavLink>
          ))}
        </aside>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
