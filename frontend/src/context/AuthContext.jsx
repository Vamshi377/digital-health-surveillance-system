import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);
const STORAGE_KEY = 'dhr_auth';

function loadStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: '', user: null };
    return JSON.parse(raw);
  } catch {
    return { token: '', user: null };
  }
}

export function AuthProvider({ children }) {
  const initial = loadStoredAuth();
  const [user, setUser] = useState(initial.user || null);
  const [token, setToken] = useState(initial.token || '');
  const [loading, setLoading] = useState(Boolean(initial.token));
  const [error, setError] = useState(null);

  const hydrateUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await authService.getMe();
      const nextUser = data?.user || null;
      setUser(nextUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user: nextUser }));
    } catch {
      setToken('');
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    hydrateUser();
  }, [hydrateUser]);

  const login = useCallback(async (credentials) => {
    setError(null);
    const data = await authService.login(credentials);
    const nextToken = data?.token || '';
    const nextUser = data?.user || null;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: nextToken, user: nextUser }));
    setToken(nextToken);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken('');
    setUser(null);
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      const nextUser = { ...(prev || {}), ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user: nextUser }));
      return nextUser;
    });
  }, [token]);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    error,
    setError,
    login,
    logout,
    updateUser,
    isAuthenticated: Boolean(token && user),
    role: user?.role || null
  }), [user, token, loading, error, login, logout, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
