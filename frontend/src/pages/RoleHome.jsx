import { Navigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

const pathByRole = {
  admin: "/admin",
  receptionist: "/reception",
  nurse: "/nurse",
  lab_technician: "/lab",
  doctor: "/doctor",
  government_officer: "/dmo",
  patient: "/patient"
};

export default function RoleHome() {
  const { user } = useAuth();
  return <Navigate to={pathByRole[user?.role] || "/login"} replace />;
}
