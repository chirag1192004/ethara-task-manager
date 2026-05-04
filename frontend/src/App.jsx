import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <h1 className="text-3xl font-bold text-white">Login Page</h1>
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
    </div>
  );
}

function MemberDashboard() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <h1 className="text-3xl font-bold text-white">Member Dashboard</h1>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/member-dashboard"
            element={
              <ProtectedRoute allowedRoles={["MEMBER"]}>
                <MemberDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
