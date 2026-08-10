'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, useLocation } from 'react-router-dom';
import API, { logout as apiLogout } from '../services/api';
import { startSmartIdleTimer } from '../utils/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { getValidToken, clearAuthStorage } from '../utils/authStorage';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const isRefreshing = useRef(false);
  const isLoggingOut = useRef(false);
  const logoutToastShown = useRef(false);

  // ---------------- LOGOUT ----------------
  const logout = useCallback(async (message, isExpired = false) => {
    if (isLoggingOut.current) return; 
    isLoggingOut.current = true;

    try {
      await apiLogout().catch(() => {});
    } catch {}

    clearAuthStorage();
    delete API.defaults.headers.common['Authorization'];
    setUser(null);

    let redirectUrl = '/login';
    if (isExpired && window.location.pathname !== '/login') {
      const currentRoute = window.location.pathname + window.location.search;
      sessionStorage.setItem('redirectAfterLogin', currentRoute);
      redirectUrl = `/login?expired=1&redirect=${encodeURIComponent(currentRoute)}`;
    } else if (!isExpired) {
      sessionStorage.removeItem('redirectAfterLogin');
    }

    if (message && !logoutToastShown.current) {
      logoutToastShown.current = true;
      toast.error(message, {
        toastId: 'logout-notification',
        autoClose: 4000,
        pauseOnFocusLoss: false,
        onClose: () => {
          logoutToastShown.current = false;
        }
      });
    }

    if (location.pathname !== '/login') {
      navigate(redirectUrl, { replace: true });
    }

    // Release lock
    setTimeout(() => {
      isLoggingOut.current = false;
    }, 2000);

  }, [navigate, location.pathname]);

  // ---------------- SILENT REFRESH ----------------
  const silentRefresh = useCallback(async () => {
    if (isRefreshing.current || isLoggingOut.current) return null;
    isRefreshing.current = true;

    try {
      const res = await API.post('/api/auth/refresh', {});
      const { accessToken } = res.data;

      if (!accessToken) {
        clearAuthStorage();
        return null;
      }

      localStorage.setItem('token', accessToken);
      API.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      const decoded = jwtDecode(accessToken);
      setUser(decoded);

      return accessToken;
    } catch (err) {
      clearAuthStorage();
      return null;
    } finally {
      isRefreshing.current = false;
    }
  }, []);

  // ---------------- INITIAL BOOT ----------------
  useEffect(() => {
    const init = async () => {
      const token = getValidToken();

      if (token) {
        try {
          const decoded = jwtDecode(token);
          if (decoded && decoded.exp * 1000 > Date.now()) {
            API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(decoded);
            setLoading(false);
            return;
          }
        } catch {
          clearAuthStorage();
        }
      }

      const refreshed = await silentRefresh();
      if (!refreshed) {
        setUser(null);
      }

      setLoading(false);
    };

    init();
  }, [silentRefresh]);

  // ---------------- TOKEN AUTO REFRESH ----------------
  useEffect(() => {
    if (!user || isLoggingOut.current) return;

    const interval = setInterval(async () => {
      const token = getValidToken();
      if (!token || isLoggingOut.current) return;

      try {
        const decoded = jwtDecode(token);
        const timeLeft = decoded.exp * 1000 - Date.now();

        if (timeLeft < 2 * 60 * 1000) {
          await silentRefresh();
        }
      } catch {
        await silentRefresh();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [user, silentRefresh]);

  // ---------------- IDLE TIMER ----------------
  useEffect(() => {
    if (!user || isLoggingOut.current) return;

    const cleanup = startSmartIdleTimer({
      onTimeout: () => {
        if (!isLoggingOut.current) {
          logout('Logged out due to inactivity.', true);
        }
      },
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [user, logout]);

  // ---------------- LOGIN ----------------
  const login = (token) => {
    try {
      localStorage.setItem('token', token);
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const decoded = jwtDecode(token);
      setUser(decoded);

      logoutToastShown.current = false; 

      const queryParams = new URLSearchParams(window.location.search);
      const redirectParam = queryParams.get('redirect');
      const savedRedirect = redirectParam || sessionStorage.getItem('redirectAfterLogin');
      sessionStorage.removeItem('redirectAfterLogin');

      if (savedRedirect && savedRedirect !== '/login' && savedRedirect !== '/') {
        navigate(savedRedirect, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch {
      logout('Invalid session.', true);
    }
  };

  const value = { user, login, logout, loading, silentRefresh };

  return (
    <AuthContext.Provider value={value}>
      <ToastContainer
        position="top-center"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="colored"
      />
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};