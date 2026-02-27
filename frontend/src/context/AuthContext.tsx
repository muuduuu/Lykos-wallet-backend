import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { auth, type User } from "../api";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  setToken: (t: string | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  const setToken = useCallback((t: string | null) => {
    setTokenState(t);
    if (t) localStorage.setItem("token", t);
    else localStorage.removeItem("token");
  }, []);

  const loadUser = useCallback(async () => {
    const t = localStorage.getItem("token");
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    // Skip fetch if we already have a user (e.g. just logged in)
    if (user) {
      setLoading(false);
      return;
    }
    try {
      const res = await auth.me();
      setUser(res.data);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setToken, user]);

  useEffect(() => {
    loadUser();
  }, [loadUser, token]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await auth.login(email, password);
      setToken(data.token);
      setUser(data.user);
    },
    [setToken]
  );

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      const { data } = await auth.register(email, password, name);
      setToken(data.token);
      setUser(data.user);
    },
    [setToken]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("user");
  }, [setToken]);

  const value: AuthContextValue = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    setToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
