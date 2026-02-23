import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminPage from "./pages/AdminPage";
import DMOPage from "./pages/DMOPage";
import DoctorPage from "./pages/DoctorPage";
import LabPage from "./pages/LabPage";
import LoginPage from "./pages/LoginPage";
import NursePage from "./pages/NursePage";
import PatientPage from "./pages/PatientPage";
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
            <ProtectedRoute roles={["admin"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reception"
          element={
            <ProtectedRoute roles={["receptionist", "admin"]}>
              <ReceptionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/nurse"
          element={
            <ProtectedRoute roles={["nurse", "admin"]}>
              <NursePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lab"
          element={
            <ProtectedRoute roles={["lab_technician", "admin"]}>
              <LabPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor"
          element={
            <ProtectedRoute roles={["doctor", "admin"]}>
              <DoctorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dmo"
          element={
            <ProtectedRoute roles={["government_officer", "admin"]}>
              <DMOPage />
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
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return <PrivateApp />;
}
