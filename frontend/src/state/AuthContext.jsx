import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { setAuthToken } from "../services/api";

const AuthContext = createContext(null);

const STORAGE_KEY = "dhr_auth";

function loadAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { token: "", user: null };
    }
    return JSON.parse(raw);
  } catch {
    return { token: "", user: null };
  }
}

export function AuthProvider({ children }) {
  const initial = loadAuth();
  const [token, setToken] = useState(initial.token || "");
  const [user, setUser] = useState(initial.user || null);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const login = async (email, password, role) => {
    const { data } = await api.post("/api/auth/login", { email, password, role });
    setToken(data.token);
    setUser(data.user);
    setAuthToken(data.token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: data.token, user: data.user }));
    return data.user;
  };

  const logout = () => {
    setToken("");
    setUser(null);
    setAuthToken("");
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      login,
      logout,
      isAuthenticated: Boolean(token && user)
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
