import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const DEMO_CREDENTIALS = {
  admin: { email: 'admin@college.edu', password: 'admin123', label: 'Head of Placement (Admin)', role: 'admin', name: 'Dr. Rajesh Kumar' },
  manager: { email: 'manager@college.edu', password: 'manager123', label: 'Placement Manager', role: 'manager', name: 'Dr. Meenakshi Sundaram' },
  team_member: { email: 'team@college.edu', password: 'team123', label: 'Placement Team Member', role: 'team_member', name: 'Prof. Ananya Sen' },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('placement_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.post('/auth/login', { email, password });
      setUser(res.data);
      localStorage.setItem('placement_user', JSON.stringify(res.data));
      return { success: true };
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Invalid email or password.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (roleKey) => {
    const cred = DEMO_CREDENTIALS[roleKey];
    if (cred) {
      return await login(cred.email, cred.password);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('placement_user');
  };

  const hasPermission = (permKey) => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admin has all permissions
    return !!user[permKey];
  };

  return (
    <AuthContext.Provider value={{ user, login, quickLogin, logout, hasPermission, loading, error, DEMO_CREDENTIALS }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
