import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { startInactivityTimer } from '../utils/auth';
import i18n from '../config/i18n';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback((message) => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete API.defaults.headers.common['Authorization'];
    setUser(null);
    if (message) {
      // You can replace this with a toast notification
      console.log("Logout reason:", message);
    }
    navigate('/login', { replace: true });
  }, [navigate]);

  // Initialize user from token on initial load
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decodedUser = jwtDecode(token);
        // Check if token is expired
        if (decodedUser.exp * 1000 < Date.now()) {
          logout(i18n.t('auth.sessionExpired'));
        } else {
          API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser(decodedUser);
        }
      }
    } catch (error) {
      logout(i18n.t('auth.invalidToken'));
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // Inactivity timer logic
  useEffect(() => {
    let cleanupTimer;
    if (user) {
      const onTimeout = () => logout(i18n.t('auth.inactivityLogout'));
      cleanupTimer = startInactivityTimer(onTimeout);
    }
    // Cleanup function to remove event listeners when component unmounts or user logs out
    return () => {
      if (cleanupTimer) {
        cleanupTimer();
      }
    };
  }, [user, logout]);


  const login = (token, refreshToken) => {
    try {
      // 1. Set tokens in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);

      // 2. Set the authorization header for all future requests
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // 3. Decode user info and set state
      const decodedUser = jwtDecode(token);
      setUser(decodedUser);

      // 4. Navigate AFTER everything is set. This fixes the race condition.
      navigate('/', { replace: true });
    } catch (error) {
      console.error("Failed to process login:", error);
      logout(i18n.t('auth.invalidToken'));
    }
  };

  const value = { user, login, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};