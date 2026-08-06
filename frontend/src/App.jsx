import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AuthProvider, homePathFor, useAuth } from "./auth";
import { Spinner } from "./ui";
import Landing from "./pages/Landing";
import { ForgotPassword, Login, Signup, VerifyOTP } from "./pages/Auth";
import { MyRequests, ShipperDashboard } from "./pages/Shipper";
import { MyTrips, TransporterDashboard } from "./pages/Transporter";
import Profile from "./pages/Profile";

function LanguageToggle() {
  const { t, i18n } = useTranslation();
  const next = i18n.resolvedLanguage === "ar" ? "en" : "ar";
  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(next)}
      lang={next}
      className="rounded-xl border border-gray-300 px-3.5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
    >
      {t("nav.language")}
    </button>
  );
}

function Header() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  function handleSignOut() {
    // Drop cached queries first — otherwise a background refetch fires without a
    // token, 401s, and the api interceptor bounces the user to /login.
    queryClient.clear();
    signOut();
    navigate("/", { replace: true });
  }

  const links = user
    ? [
        { to: homePathFor(user), label: t("nav.dashboard") },
        user.role === "shipper"
          ? { to: "/requests", label: t("nav.requests") }
          : { to: "/trips", label: t("nav.trips") },
        { to: "/profile", label: t("nav.profile") },
      ]
    : [];

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <Link to={user ? homePathFor(user) : "/"} className="flex flex-col">
          <span className="text-lg font-bold text-sa-800">{t("app.name")}</span>
          <span className="text-xs text-gray-600">{t("app.tagline")}</span>
        </Link>

        <nav aria-label={t("nav.menu")} className="flex flex-1 flex-wrap items-center gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? "bg-sa-50 text-sa-800" : "text-gray-900 hover:bg-sa-50"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          {user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-xl border border-gray-300 px-3.5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              {t("nav.logout")}
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl px-3.5 py-2 text-sm font-semibold text-sa-800 hover:bg-sa-50"
              >
                {t("nav.login")}
              </Link>
              <Link
                to="/signup"
                className="rounded-xl bg-sa-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-sa-800"
              >
                {t("nav.signup")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function RequireAuth({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  // The landing page is the signed-out home, so send visitors there rather than
  // straight to the login form — it also wins the race against `handleSignOut`,
  // which would otherwise be overridden by this redirect on logout.
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to={homePathFor(user)} replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <Navigate to={homePathFor(user)} replace /> : children;
}

function Shell() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-xl focus:bg-sa-800 focus:px-4 focus:py-2 focus:text-white"
      >
        {t("nav.skipToContent")}
      </a>
      <Header />
      <main id="main" className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <PublicOnly>
                <Landing />
              </PublicOnly>
            }
          />
          <Route
            path="/login"
            element={
              <PublicOnly>
                <Login />
              </PublicOnly>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnly>
                <Signup />
              </PublicOnly>
            }
          />
          <Route path="/verify" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/shipper"
            element={
              <RequireAuth role="shipper">
                <ShipperDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/requests"
            element={
              <RequireAuth role="shipper">
                <MyRequests />
              </RequireAuth>
            }
          />
          <Route
            path="/transporter"
            element={
              <RequireAuth role="transporter">
                <TransporterDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/trips"
            element={
              <RequireAuth role="transporter">
                <MyTrips />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {/* Shares the near-black surface of the page headers, with a gold rule
          drawn from the identity palette in كود المنصات v1.0. */}
      <footer className="mt-12 border-t-4 border-gold-500 bg-gray-950 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-center">
          <p className="text-base font-bold text-white">{t("app.name")}</p>
          <p className="text-sm text-gray-300">{t("app.tagline")}</p>
          <p className="mt-3 text-xs text-gray-400">{t("app.compliance")}</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  );
}
