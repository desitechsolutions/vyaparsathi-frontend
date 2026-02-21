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
  const [warningActive, setWarningActive] = useState(false);
  const navigate = useNavigate();
  
  const isRefreshing = useRef(false); 
  const idleWarningToastIdRef = useRef(null);
  const lastCheckRef = useRef(0); 
  const hasNavigatedRef = useRef(false);

  // --- Logout function ---
  const logout = useCallback(async (message) => {
    // If we are already mid-logout, don't trigger again
    if (hasNavigatedRef.current && !message) return;
    
    console.log('[AuthContext] logout called', { message });
    
    try {
      // Call backend to clear the HttpOnly cookie and DB token
      await apiLogout();
    } catch (err) {
      console.warn("Backend logout failed (likely already unauthorized)");
    }

    // Clear local credentials
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken'); 
    delete API.defaults.headers.common['Authorization'];
    
    setUser(null);
    setWarningActive(false);

    if (!hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      
      if (message && typeof message === 'string') {
        toast.error(message, {
          position: 'top-center',
          autoClose: 3000,
          onClose: () => {
            navigate('/login', { replace: true });
            hasNavigatedRef.current = false; 
          }
        });
      } else {
        navigate('/login', { replace: true });
        hasNavigatedRef.current = false;
      }
    }
  }, [navigate]);

  // --- Silent refresh logic ---
  const silentRefresh = useCallback(async () => {
    if (isRefreshing.current) return null;
    console.log('[AuthContext] Attempting silentRefresh...');
    isRefreshing.current = true;

    try {
      const res = await API.post('/api/auth/refresh', {}, { meta: { background: true } });
      const { accessToken } = res.data;
      
      localStorage.setItem('token', accessToken);
      API.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      const decoded = jwtDecode(accessToken);
      setUser(decoded);
      console.log('[AuthContext] Refresh successful');
      return accessToken;
    } catch (err) {
      console.error('[AuthContext] Refresh failed');
      // If refresh fails (cookie expired), then we truly logout
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        logout('Session expired. Please log in again.');
      }
      throw err;
    } finally {
      isRefreshing.current = false;
    }
  }, [logout]);

  // --- Check and refresh token if expiring soon ---
  const checkAndRefreshTokenIfNeeded = useCallback(async () => {
    const now = Date.now();
    if (now - lastCheckRef.current < 30000) return;
    lastCheckRef.current = now;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const timeLeft = decoded.exp * 1000 - now;
      
      // If expired or expiring in < 2 mins, refresh
      if (timeLeft < (2 * 60 * 1000)) {
        await silentRefresh();
      }
    } catch (e) {
      // If token is tampered with (jwtDecode fails), try recovery via silentRefresh
      console.warn("[AuthContext] Token corrupted, attempting recovery via cookie...");
      try {
        await silentRefresh();
      } catch (refreshErr) {
        logout("Invalid session. Please log in again.");
      }
    }
  }, [silentRefresh, logout]);

  // --- Initial Boot Logic (Self-Healing) ---
  useEffect(() => {
    const initAuth = async () => {
      console.log('[AuthContext] Initializing Auth State');
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const decodedUser = jwtDecode(token);
          // If valid and has > 10s left, use it
          if (decodedUser.exp * 1000 > Date.now() + 10000) {
            API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(decodedUser);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.warn('[AuthContext] Local token invalid/tampered');
        }
      }

      // If no token or token invalid, try to recover session from HttpOnly Cookie
      try {
        await silentRefresh();
      } catch (err) {
        console.log('[AuthContext] No valid session cookie found on boot');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [silentRefresh]);

  // --- Idle timer setup ---
  useEffect(() => {
    let cleanupTimer;
    if (user) {
      cleanupTimer = startSmartIdleTimer({
        onTimeout: () => logout('Logged out due to inactivity.'),
        onWarning: () => {
          setWarningActive(true);
          if (!toast.isActive('idle-warning')) {
            idleWarningToastIdRef.current = toast.warn(
              "Inactivity detected. Session will expire soon.",
              { position: 'top-center', autoClose: 10000, toastId: 'idle-warning' }
            );
          }
        },
        onExtend: () => {
          checkAndRefreshTokenIfNeeded();
          if (warningActive) {
            toast.dismiss('idle-warning');
            setWarningActive(false);
          }
        }
      });
    }
    return () => {
      if (cleanupTimer) cleanupTimer();
      toast.dismiss('idle-warning');
    };
  }, [user, logout, checkAndRefreshTokenIfNeeded, warningActive]);

  // --- Login function ---
  const login = (token) => {
    console.log('[AuthContext] login called');
    try {
      localStorage.setItem('token', token);
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const decodedUser = jwtDecode(token);
      setUser(decodedUser);
      setLoading(false);

      setTimeout(() => {
        if (!hasNavigatedRef.current) {
          hasNavigatedRef.current = true;
          navigate('/', { replace: true });
          setTimeout(() => { hasNavigatedRef.current = false; }, 1000);
        }
      }, 100);
    } catch (error) {
      logout('Invalid session data.');
    }
  };

  const value = { user, login, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} />
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};