import { Navigate } from "react-router-dom";
import { homePathFor, useAuth } from "@/features/auth/AuthContext";
import { Spinner } from "@/components/ui";

/** Gates a route behind sign-in, and optionally behind a specific role. */
export function RequireAuth({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  // The landing page is the signed-out home, so send visitors there rather than
  // straight to the login form — it also wins the race against sign-out, which
  // would otherwise be overridden by this redirect.
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to={homePathFor(user)} replace />;
  return children;
}

/** Keeps signed-in users out of the landing and authentication screens. */
export function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <Navigate to={homePathFor(user)} replace /> : children;
}
