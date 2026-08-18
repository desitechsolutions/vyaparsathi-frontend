'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, useLocation } from 'react-router-dom';
import API, { logout as apiLogout } from '../services/api';
import { startSmartIdleTimer } from '../utils/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { getValidToken, clearAuthStorage } from '../utils/authStorage';
import { clearPermissionsCache } from '../hooks/usePermissions';
import IdleWarningModal from '../components/auth/IdleWarningModal';

export const AuthContext = createContext(null);

// Multi-tab sync channel. When one tab logs the user out (or logs them
// in), it posts on this channel so sibling tabs redirect too — the
// alternative is a stale tab silently making requests with a token that
// was revoked in another tab, which is confusing and (in the logout
// case) briefly insecure.
const AUTH_CHANNEL_NAME = 'vs-auth';
const AUTH_EVENT_LOGOUT = 'logout';
const AUTH_EVENT_LOGIN = 'login';
const authChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(AUTH_CHANNEL_NAME) : null;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Idle-warning state — populated from utils/auth.js's onWarning callback.
  const [idleWarning, setIdleWarning] = useState({ open: false, ms: 0 });

  const navigate = useNavigate();
  const location = useLocation();

  const isRefreshing = useRef(false);
  const isLoggingOut = useRef(false);
  const logoutToastShown = useRef(false);
  // Latest activity signal — the idle modal's "Stay signed in" button
  // posts through here to reset the local timer without a full remount.
  const activitySignalRef = useRef(null);

  // ---------------- LOGOUT ----------------
  const logout = useCallback(async (message, isExpired = false, opts = {}) => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;

    try {
      await apiLogout().catch(() => {});
    } catch {}

    clearAuthStorage();
    clearPermissionsCache();
    delete API.defaults.headers.common['Authorization'];
    setUser(null);
    setIdleWarning({ open: false, ms: 0 });

    // Broadcast to sibling tabs so they redirect too. Suppress when the
    // event was itself triggered by a sibling tab, to avoid infinite
    // ping-pong.
    if (authChannel && !opts.fromBroadcast) {
      try {
        authChannel.postMessage({ type: AUTH_EVENT_LOGOUT, isExpired });
      } catch {}
    }

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

  // ---------------- MULTI-TAB SYNC ----------------
  // Listen for auth events posted by sibling tabs. On logout, mirror
  // the sign-out here so the whole browser stays in one auth state.
  // On login, silent-refresh so this tab picks up the same token.
  useEffect(() => {
    if (!authChannel) return undefined;
    const handler = (event) => {
      const msg = event?.data;
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === AUTH_EVENT_LOGOUT) {
        // fromBroadcast=true keeps logout() from re-broadcasting.
        logout(msg.isExpired ? 'Signed out from another tab.' : null, !!msg.isExpired, { fromBroadcast: true });
      } else if (msg.type === AUTH_EVENT_LOGIN) {
        // Another tab just signed in — pull the token they wrote to
        // localStorage. Storage events also fire, but that's a
        // different sync path; either arrives first, both are idempotent.
        const token = getValidToken();
        if (token && !user) {
          try {
            const decoded = jwtDecode(token);
            API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(decoded);
          } catch {}
        }
      }
    };
    authChannel.addEventListener('message', handler);
    return () => authChannel.removeEventListener('message', handler);
  }, [logout, user]);

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
      onWarning: (msLeft) => {
        // Only show the modal if the user is actually here — a truly
        // idle browser tab shouldn't spawn hidden dialogs.
        setIdleWarning({ open: true, ms: msLeft });
      },
      onExtend: () => {
        // Fires when the user proves they're still active. Clear the
        // warning modal if it happens to be up.
        setIdleWarning((prev) => (prev.open ? { open: false, ms: 0 } : prev));
      },
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [user, logout]);

  const dismissIdleWarning = useCallback(() => {
    // Simulate a user activity event so utils/auth.js resets its
    // internal lastActivity timestamp — cleaner than piercing that
    // module's state directly.
    setIdleWarning({ open: false, ms: 0 });
    try {
      window.dispatchEvent(new Event('mousemove'));
    } catch {}
  }, []);

  // ---------------- LOGIN ----------------
  const login = (token) => {
    try {
      localStorage.setItem('token', token);
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const decoded = jwtDecode(token);
      setUser(decoded);

      logoutToastShown.current = false;

      // Announce to sibling tabs so they pick up the same session.
      if (authChannel) {
        try { authChannel.postMessage({ type: AUTH_EVENT_LOGIN }); } catch {}
      }

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
      {user && (
        <IdleWarningModal
          open={idleWarning.open}
          initialMs={idleWarning.ms}
          onStay={dismissIdleWarning}
          onLogout={() => logout('Signed out.', false)}
        />
      )}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
