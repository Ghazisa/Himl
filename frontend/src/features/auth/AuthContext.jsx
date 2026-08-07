import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { tokenStore } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenStore.access) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me/")
      .then(({ data }) => setUser(data))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(({ user: nextUser, tokens }) => {
    tokenStore.save(tokens);
    setUser(nextUser);
    return nextUser;
  }, []);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, setUser, loading, signIn, signOut }),
    [user, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function homePathFor(user) {
  if (!user) return "/login";
  return user.role === "shipper" ? "/shipper" : "/transporter";
}
