'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, useLocation } from 'react-router-dom';
import API, { logout as apiLogout } from '../services/api';
import { startSmartIdleTimer } from '../utils/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  const logout = useCallback(async (message) => {
    if (isLoggingOut.current) return; 
    isLoggingOut.current = true;

    try {
      await apiLogout().catch(() => {});
    } catch {}

    localStorage.removeItem('token');
    delete API.defaults.headers.common['Authorization'];
    setUser(null);

    if (message && !logoutToastShown.current) {
      logoutToastShown.current = true;

      // FIX: Instead of toast.dismiss() (which causes the crash), 
      // we just fire the error toast. The 'limit={1}' in the container 
      // ensures only one is visible.
      toast.error(message, {
        autoClose: 4000,
        pauseOnFocusLoss: false,
        onClose: () => {
          logoutToastShown.current = false;
        }
      });
    }

    if (location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }

    // Release lock
    setTimeout(() => {
      isLoggingOut.current = false;
    }, 2000);

  }, [navigate, location.pathname]);

  // ---------------- SILENT REFRESH ----------------
  const silentRefresh = useCallback(async () => {
    if (isRefreshing.current || isLoggingOut.current) return;
    isRefreshing.current = true;

    try {
      const res = await API.post('/api/auth/refresh', {});
      const { accessToken } = res.data;

      localStorage.setItem('token', accessToken);
      API.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      const decoded = jwtDecode(accessToken);
      setUser(decoded);

      return accessToken;
    } catch (err) {
      return null;
    } finally {
      isRefreshing.current = false;
    }
  }, []);

  // ---------------- INITIAL BOOT ----------------
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        try {
          const decoded = jwtDecode(token);
          if (decoded.exp * 1000 > Date.now()) {
            API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(decoded);
            setLoading(false);
            return;
          }
        } catch {
          localStorage.removeItem('token');
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
      const token = localStorage.getItem('token');
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
          logout('Logged out due to inactivity.');
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
      navigate('/', { replace: true });
    } catch {
      logout('Invalid session.');
    }
  };

  const value = { user, login, logout, loading, silentRefresh };

  return (
    <AuthContext.Provider value={value}>
      {/* FIX: limit={1} handles the "duplicate toast" issue naturally.
         standardizing the ToastContainer helps avoid the removalReason error.
      */}
      <ToastContainer
        position="top-center"
        autoClose={4000}
        limit={1}
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