import React, { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { getToken } from "../lib/auth";
import { setAuthToken } from "../lib/api";
import LoginPage from "./LoginPage";
import Shell from "./Shell";
import DashboardPage from "./DashboardPage";
import TriagePage from "./TriagePage";
import ServiceRequestsPage from "./ServiceRequestsPage";
import AssetsPage from "./AssetsPage";
import SurveysPage from "./SurveysPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  useEffect(() => setAuthToken(getToken()), []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Shell />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="triage" element={<TriagePage />} />
        <Route path="service-requests" element={<ServiceRequestsPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="surveys" element={<SurveysPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
