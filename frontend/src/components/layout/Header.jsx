import { Link, NavLink, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LogOut } from "lucide-react";
import { homePathFor, useAuth } from "@/features/auth/AuthContext";
import { LanguageToggle } from "./LanguageToggle";

export function Header() {
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
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3.5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
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
