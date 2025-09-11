import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { startSmartIdleTimer } from '../utils/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [warningActive, setWarningActive] = useState(false);
  const navigate = useNavigate();
  const isRefreshing = useRef(false); // prevent concurrent refreshes
  const idleWarningToastIdRef = useRef(null);

  // --- Logout function ---
  const hasNavigatedRef = useRef(false);
  const logout = useCallback((message) => {
    console.log('[AuthContext] logout called', { message });
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete API.defaults.headers.common['Authorization'];
    setUser(null);
    setWarningActive(false);

    if (!hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      if (message) {
        toast.error(message, {
          position: 'top-center',
          autoClose: 3000,
          onClose: () => {
            navigate('/login', { replace: true });
          }
        });
      } else {
        navigate('/login', { replace: true });
      }
    }
  }, [navigate]);
  // --- Silent refresh logic ---
  const silentRefresh = useCallback(async () => {
    console.log('[AuthContext] silentRefresh called');
    if (isRefreshing.current) return; // Prevent multiple refreshes
    isRefreshing.current = true;
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return;
      const res = await API.post('/api/auth/refresh', { refreshToken });
      const { token, refreshToken: newRefreshToken } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', newRefreshToken);
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const decoded = jwtDecode(token);
      setUser((prevUser) => {
        if (!prevUser || prevUser.sub !== decoded.sub || prevUser.exp !== decoded.exp) {
          return decoded;
        }
        return prevUser;
      });
  toast.success("Session extended due to activity.", { position: 'top-center', autoClose: 3000 }); // No onClose
    } catch (err) {
      logout('Session expired. Please log in again.');
    } finally {
      isRefreshing.current = false;
    }
  }, [logout]);

  // --- Check and refresh token if expiring soon ---
  const checkAndRefreshTokenIfNeeded = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const decoded = jwtDecode(token);
    const now = Date.now();
    const timeLeft = decoded.exp * 1000 - now;
    if (timeLeft < (2 * 60 * 1000)) {
      silentRefresh();
    }
  }, [silentRefresh]);

  // --- Idle timer ---
  useEffect(() => {
    let cleanupTimer;
    if (user) {
      cleanupTimer = startSmartIdleTimer({
        onTimeout: () => logout('Logged out due to inactivity.'),
        onWarning: () => {
          setWarningActive(true);
          // Show warning only if not already active
          if (!idleWarningToastIdRef.current || !toast.isActive(idleWarningToastIdRef.current)) {
            idleWarningToastIdRef.current = toast.warn(
              <span>
                You have been inactive for a while.<br />
                Session will expire soon.<br />
                <b>Interact with the app to continue.</b>
              </span>,
              {
                position: 'top-center',
                autoClose: 10000,
                toastId: 'idle-warning',
                closeOnClick: true
              }
            );
          }
        },
        onExtend: () => {
          checkAndRefreshTokenIfNeeded();
          if (
            warningActive &&
            idleWarningToastIdRef.current &&
            toast.isActive(idleWarningToastIdRef.current)
          ) {
            toast.dismiss(idleWarningToastIdRef.current);
            idleWarningToastIdRef.current = null;
            setWarningActive(false);
          }
        }
      });
    }
    return () => {
      if (cleanupTimer) cleanupTimer();
      // Defensive: only dismiss if toast is active
      if (
        idleWarningToastIdRef.current &&
        toast.isActive(idleWarningToastIdRef.current)
      ) {
        toast.dismiss(idleWarningToastIdRef.current);
        idleWarningToastIdRef.current = null;
      }
    };
  }, [user, logout, silentRefresh, checkAndRefreshTokenIfNeeded, warningActive]);

  // --- Initial token check ---
  useEffect(() => {
    console.log('[AuthContext] Initial token check useEffect');
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decodedUser = jwtDecode(token);
        if (decodedUser.exp * 1000 < Date.now()) {
          console.log('[AuthContext] Token expired, calling logout');
          logout('Session expired');
        } else {
          API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser((prevUser) => {
            if (!prevUser || prevUser.sub !== decodedUser.sub || prevUser.exp !== decodedUser.exp) {
              console.log('[AuthContext] Setting user from token', decodedUser);
              return decodedUser;
            }
            return prevUser;
          });
        }
      }
    } catch (error) {
      console.log('[AuthContext] Invalid token, calling logout');
      logout('Invalid token');
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // --- Login function ---
  const login = (token, refreshToken) => {
    console.log('[AuthContext] login called');
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const decodedUser = jwtDecode(token);
      setUser((prevUser) => {
        if (!prevUser || prevUser.sub !== decodedUser.sub || prevUser.exp !== decodedUser.exp) {
          console.log('[AuthContext] Setting user from login', decodedUser);
          return decodedUser;
        }
        return prevUser;
      });
      setLoading(false);
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        console.log('[AuthContext] Navigating to / after login');
        navigate('/', { replace: true });
      }
  toast.success("Login successful!", { position: 'top-center', autoClose: 3000, closeOnClick: true }); // No onClose
    } catch (error) {
      console.log('[AuthContext] Invalid token in login, calling logout');
      logout('Invalid token');
    }
  };

  const value = { user, login, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      <ToastContainer position="top-center" newestOnTop closeOnClick draggable />
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