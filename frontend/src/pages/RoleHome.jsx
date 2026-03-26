import { Navigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

const pathByRole = {
  hospital_admin: "/admin",
  receptionist: "/reception",
  nurse: "/nurse",
  lab_technician: "/lab",
  doctor: "/doctor",
  medical_superintendent: "/superintendent",
  dmo: "/dmo",
  patient: "/patient"
};

export default function RoleHome() {
  const { user } = useAuth();
  return <Navigate to={pathByRole[user?.role] || "/login"} replace />;
}
