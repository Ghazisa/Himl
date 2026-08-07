import { Navigate, Route, Routes } from "react-router-dom";
import { LandingPage } from "@/features/landing/LandingPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { SignupPage } from "@/features/auth/SignupPage";
import { VerifyOtpPage } from "@/features/auth/VerifyOtpPage";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";
import { ShipperDashboardPage } from "@/features/shipper/ShipperDashboardPage";
import { MyRequestsPage } from "@/features/shipper/MyRequestsPage";
import { TransporterDashboardPage } from "@/features/transporter/TransporterDashboardPage";
import { MyTripsPage } from "@/features/transporter/MyTripsPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { PublicOnly, RequireAuth } from "./guards";

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicOnly>
            <LandingPage />
          </PublicOnly>
        }
      />
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnly>
            <SignupPage />
          </PublicOnly>
        }
      />
      <Route path="/verify" element={<VerifyOtpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route
        path="/shipper"
        element={
          <RequireAuth role="shipper">
            <ShipperDashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/requests"
        element={
          <RequireAuth role="shipper">
            <MyRequestsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/transporter"
        element={
          <RequireAuth role="transporter">
            <TransporterDashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/trips"
        element={
          <RequireAuth role="transporter">
            <MyTripsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
