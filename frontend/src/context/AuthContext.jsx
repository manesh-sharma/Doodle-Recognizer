import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ high_score: 0, total_games: 0, avg_score: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = api.getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      setStats(data.stats || { high_score: 0, total_games: 0, avg_score: 0 });
    } catch (err) {
      console.warn('Session expired or invalid:', err);
      api.setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const res = await api.login(username, password);
    setUser(res.user);
    await checkAuth();
    return res;
  };

  const register = async (username, password, email) => {
    const res = await api.register(username, password, email);
    setUser(res.user);
    await checkAuth();
    return res;
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
    setStats({ high_score: 0, total_games: 0, avg_score: 0 });
  };

  const refreshUser = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setStats(data.stats || { high_score: 0, total_games: 0, avg_score: 0 });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, stats, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
