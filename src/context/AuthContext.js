import React, { createContext, useContext, useState, useEffect } from 'react';
import { decodeToken } from '../utils/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const userInfo = decodeToken(token);
    return { ...userInfo, token };
  });

  // Listen for tokenUpdated event to sync context after refresh
  useEffect(() => {
    const updateUser = () => {
      const token = localStorage.getItem('token');
      if (!token) return setUser(null);
      const userInfo = decodeToken(token);
      setUser({ ...userInfo, token });
    };
    window.addEventListener('tokenUpdated', updateUser);
    window.addEventListener('storage', updateUser); // For cross-tab logout/login
    return () => {
      window.removeEventListener('tokenUpdated', updateUser);
      window.removeEventListener('storage', updateUser);
    };
  }, []);

  const login = (token, refreshToken) => {
    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    const userInfo = decodeToken(token);
    setUser({ ...userInfo, token });
    window.dispatchEvent(new Event('tokenUpdated'));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');
    setUser(null);
    window.dispatchEvent(new Event('tokenUpdated'));
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);