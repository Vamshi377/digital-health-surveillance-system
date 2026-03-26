import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import ApprovalPage from "./pages/ApprovalPage";
import DMOPage from "./pages/DMOPage";
import DoctorPage from "./pages/DoctorPage";
import LabPage from "./pages/LabPage";
import LoginPage from "./pages/LoginPage";
import NursePage from "./pages/NursePage";
import PatientPage from "./pages/PatientPage";
import RegisterPage from "./pages/RegisterPage";
import ReceptionPage from "./pages/ReceptionPage";
import RoleHome from "./pages/RoleHome";
import { useAuth } from "./state/AuthContext";

function PrivateApp() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<RoleHome />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["hospital_admin"]}>
              <ApprovalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reception"
          element={
            <ProtectedRoute roles={["receptionist", "hospital_admin"]}>
              <ReceptionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/nurse"
          element={
            <ProtectedRoute roles={["nurse", "hospital_admin"]}>
              <NursePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lab"
          element={
            <ProtectedRoute roles={["lab_technician", "hospital_admin"]}>
              <LabPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor"
          element={
            <ProtectedRoute roles={["doctor", "hospital_admin"]}>
              <DoctorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superintendent"
          element={
            <ProtectedRoute roles={["medical_superintendent"]}>
              <ApprovalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dmo"
          element={
            <ProtectedRoute roles={["dmo", "hospital_admin"]}>
              <DMOPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dmo/approvals"
          element={
            <ProtectedRoute roles={["dmo"]}>
              <ApprovalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient"
          element={
            <ProtectedRoute roles={["patient"]}>
              <PatientPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return <PrivateApp />;
}
