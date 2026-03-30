import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const hydrateUser = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const data = await authService.getMe(token);
      setUser(data);
    } catch {
      setToken(null);
      localStorage.removeItem('access_token');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { hydrateUser(); }, [hydrateUser]);

  const login = useCallback(async (credentials) => {
    setError(null);
    const data = await authService.login(credentials);
    const { access_token, user: userData } = data;
    localStorage.setItem('access_token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(token); } catch { /* ignore */ }
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
  }, [token]);

  const updateUser = useCallback((patch) => {
    setUser((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = {
    user,
    token,
    loading,
    error,
    setError,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    role: user?.role ?? null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
