import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import API, { logout as apiLogout } from '../services/api';
import { startSmartIdleTimer } from '../utils/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isRefreshing = useRef(false);

  // ---------------- LOGOUT ----------------
  const logout = useCallback(async (message) => {
    try {
      await apiLogout();
    } catch (err) {
      // ignore backend errors
    }

    localStorage.removeItem('token');
    delete API.defaults.headers.common['Authorization'];

    setUser(null);

    if (message) {
      toast.error(message);
    }

    navigate('/login', { replace: true });
  }, [navigate]);

  // ---------------- SILENT REFRESH ----------------
  const silentRefresh = useCallback(async () => {
    if (isRefreshing.current) return;
    isRefreshing.current = true;

    try {
      const res = await API.post('/api/auth/refresh', {});
      const { accessToken } = res.data;

      localStorage.setItem('token', accessToken);
      API.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      const decoded = jwtDecode(accessToken);
      /*setUser(decoded);*/

      return accessToken;
    } catch (err) {
      // DO NOT auto logout here
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
        } catch (e) {
          localStorage.removeItem('token');
        }
      }

      // try recover via cookie
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
    if (!user) return;

    const interval = setInterval(async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const decoded = jwtDecode(token);
        const timeLeft = decoded.exp * 1000 - Date.now();

        if (timeLeft < 2 * 60 * 1000) {
          await silentRefresh();
        }
      } catch (e) {
        await silentRefresh();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [user, silentRefresh]);

  // ---------------- IDLE TIMER ----------------
  useEffect(() => {
    if (!user) return;

    const cleanup = startSmartIdleTimer({
      onTimeout: () => logout('Logged out due to inactivity.')
    });

    return cleanup;
  }, [user, logout]);

  // ---------------- LOGIN ----------------
  const login = (token) => {
    try {
      localStorage.setItem('token', token);
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const decoded = jwtDecode(token);
      setUser(decoded);

      navigate('/', { replace: true });
    } catch (err) {
      logout('Invalid session.');
    }
  };

  const value = { user, login, logout, loading, silentRefresh };

  return (
    <AuthContext.Provider value={value}>
      <ToastContainer position="top-center" autoClose={3000} />
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};