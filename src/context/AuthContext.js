import React, { createContext, useContext, useState } from 'react';
import { decodeToken } from '../utils/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Try to restore user from localStorage on page reload
    const token = localStorage.getItem('token');
    if (!token) return null;
    const userInfo = decodeToken(token);
    return { ...userInfo, token };
  });

  const login = (token, refreshToken) => {
    // Implement login logic
    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    const userInfo = decodeToken(token);
    setUser({ ...userInfo, token });
  };

  const logout = () => {
    // Implement logout logic
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);