import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { initSocket, disconnectSocket } from '../utils/socket';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  const storeAuth = (userData, tokenStr) => {
    setUser(userData);
    setToken(tokenStr);
    localStorage.setItem('pdo_token', tokenStr);
    localStorage.setItem('pdo_user', JSON.stringify(userData));
    initSocket(tokenStr);
  };

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pdo_token');
    localStorage.removeItem('pdo_user');
    disconnectSocket();
  };

  // Verify token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('pdo_token');
    if (!savedToken) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then(res => {
        storeAuth(res.data.user, savedToken);
      })
      .catch(() => {
        clearAuth();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: userData, token: tokenStr } = res.data;
    storeAuth(userData, tokenStr);
    return userData;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearAuth();
  };

  const refreshUser = useCallback(async () => {
    const res = await api.get('/auth/me');
    setUser(res.data.user);
    localStorage.setItem('pdo_user', JSON.stringify(res.data.user));
    return res.data.user;
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    refreshUser,
    isAdmin: user?.role === 'admin',
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
