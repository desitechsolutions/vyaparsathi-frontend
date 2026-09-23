'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, useLocation } from 'react-router-dom';
import API, { logout as apiLogout, cancelAllRequests } from '../services/api';
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
  // Monotonically increasing counter that increments on every login and
  // logout. The 60-second auto-refresh interval captures this value at
  // creation time and bails out if it detects a different value, which
  // means a new session has started (or ended) since the interval was
  // set up. This prevents a stale tab's old-user interval from firing
  // silentRefresh with an invalidated refresh cookie after a new user
  // logs in, which was causing the new user to be booted out.
  const sessionVersionRef = useRef(0);
  // Latest activity signal — the idle modal's "Stay signed in" button
  // posts through here to reset the local timer without a full remount.
  const activitySignalRef = useRef(null);

  // ---------------- LOGOUT ----------------
  const logout = useCallback(async (message, isExpired = false, opts = {}) => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;
    // Increment the session version immediately. Any 60s intervals that
    // are currently queued in the event loop will see a stale version and
    // bail without calling silentRefresh.
    sessionVersionRef.current += 1;

    // Set the explicit-logout guard BEFORE calling the API.
    // This ensures that even if apiLogout() fails (network error, backend
    // down), the flag is already in localStorage. Any subsequent init()
    // will see it and skip silentRefresh(), preventing auto-login via the
    // surviving HttpOnly cookie. The flag persists until the user
    // intentionally logs back in (login() removes it).
    if (!opts.fromBroadcast) {
      localStorage.setItem('explicit_logout', '1');
    }

    try {
      await apiLogout().catch(() => {});
    } catch {}

    // Cancel every in-flight Axios request that was started under the
    // outgoing session. Without this, User A's pending requests survive
    // the logout/login boundary and can return 401 after User B's token
    // is written, causing the 401 interceptor to wipe User B's session.
    cancelAllRequests();

    clearAuthStorage();
    localStorage.removeItem('quick_payment_offline_queue_v1');
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

    // Release the guard immediately after all synchronous logout work is done
    // and navigation has been requested. The 2-second setTimeout it replaced
    // was arbitrary and created a window where a fast User B login could be
    // incorrectly blocked by a stale isLoggingOut=true from User A's logout.
    // Navigation is non-blocking in React Router — releasing the flag here is
    // safe because every stateful side-effect (clearAuthStorage, setUser(null),
    // BroadcastChannel) has already been executed above.
    isLoggingOut.current = false;

  }, [navigate, location.pathname]);

  // ---------------- SILENT REFRESH ----------------
  const silentRefresh = useCallback(async () => {
    if (isRefreshing.current || isLoggingOut.current) return null;
    isRefreshing.current = true;

    // Snapshot the token value present BEFORE the refresh request is sent.
    // After the request completes we compare against what's in localStorage
    // now. If a concurrent login wrote a DIFFERENT (newer) token while the
    // refresh was in-flight, we must not overwrite or clear it.
    const tokenBeforeRefresh = localStorage.getItem('token') || localStorage.getItem('accessToken');

    try {
      const res = await API.post('/api/auth/refresh', {});
      const { accessToken } = res.data;

      if (!accessToken) {
        // Only clear if no newer token appeared during the round-trip.
        const currentToken = localStorage.getItem('token') || localStorage.getItem('accessToken');
        if (!currentToken || currentToken === tokenBeforeRefresh) {
          clearAuthStorage();
        }
        return null;
      }

      localStorage.setItem('token', accessToken);
      API.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      const decoded = jwtDecode(accessToken);
      setUser(decoded);

      return accessToken;
    } catch (err) {
      // CRITICAL: Do NOT call clearAuthStorage() unconditionally.
      //
      // If this refresh request was in-flight when another tab logged in,
      // the request carried an old cookie and returned 401 — but the new
      // user's token is already sitting in localStorage. Wiping storage
      // here would delete the new session's token, causing the new user
      // to be silently booted on their very next API call.
      //
      // Only clear storage if the token in localStorage is still the same
      // stale one that existed when we sent the refresh request (i.e. no
      // concurrent login wrote a fresh token while we were waiting).
      const currentToken = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const isNewSessionEstablished = currentToken && currentToken !== tokenBeforeRefresh;

      if (!isNewSessionEstablished) {
        clearAuthStorage();
      }
      return null;
    } finally {
      isRefreshing.current = false;
    }
  }, []);

  // ---------------- INITIAL BOOT ----------------
  useEffect(() => {
    const init = async () => {
      // Explicit-logout guard: if the user previously logged out, DO NOT
      // attempt silentRefresh() even if a refreshToken cookie is still
      // present in the browser (e.g. backend was unreachable during logout,
      // or the cookie TTL outlived the logout event).
      //
      // IMPORTANT: We do NOT remove the flag here. It must persist across
      // every page reload and tab reopen until the user intentionally signs
      // back in. login() is the only place that removes it.
      if (localStorage.getItem('explicit_logout') === '1') {
        setUser(null);
        setLoading(false);
        return;
      }

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
  // When another tab logs in or logs out, the cleanest and most
  // bulletproof response is a full page reload. Any attempt to
  // surgically patch React state leaves stale closures: the old
  // user's 60-second interval, the open STOMP socket (which is
  // identified by the old JWT's shopId), and any in-flight Axios
  // requests can all continue to run with dead credentials.
  //
  // A reload unconditionally tears all of that down and lets
  // init() boot from whatever token/cookie the browser now holds —
  // which is exactly what the signing-in/out tab just wrote.
  useEffect(() => {
    if (!authChannel) return undefined;
    const handler = (event) => {
      const msg = event?.data;
      if (!msg || typeof msg !== 'object') return;

      if (msg.type === AUTH_EVENT_LOGIN || msg.type === AUTH_EVENT_LOGOUT) {
        // Give the broadcasting tab a moment to finish writing its
        // token to localStorage before we read it on reload.
        setTimeout(() => window.location.reload(), 100);
      }
    };
    authChannel.addEventListener('message', handler);
    return () => authChannel.removeEventListener('message', handler);
  }, []);

  // ---------------- TOKEN AUTO REFRESH ----------------
  useEffect(() => {
    if (!user || isLoggingOut.current) return;

    // Snapshot the session version when the interval is created. If login
    // or logout fires before the next tick (incrementing the version), the
    // interval will detect the mismatch and skip silentRefresh so it can't
    // accidentally call the backend with an invalidated refresh cookie.
    const capturedVersion = sessionVersionRef.current;

    const interval = setInterval(async () => {
      // Bail if the session changed since this interval was created.
      if (capturedVersion !== sessionVersionRef.current) return;
      if (isLoggingOut.current) return;

      const token = getValidToken();
      if (!token) {
        // Token expired between ticks. Guard again before calling refresh.
        if (capturedVersion !== sessionVersionRef.current) return;
        await silentRefresh();
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const timeLeft = decoded.exp * 1000 - Date.now();

        if (timeLeft < 2 * 60 * 1000) {
          if (capturedVersion !== sessionVersionRef.current) return;
          await silentRefresh();
        }
      } catch {
        if (capturedVersion !== sessionVersionRef.current) return;
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
      // Invalidate any stale 60-second intervals that belong to a
      // previous session. This fires before setUser(), so by the time
      // the old interval's callback runs it will see a version mismatch
      // and skip silentRefresh.
      sessionVersionRef.current += 1;
      localStorage.setItem('token', token);
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const decoded = jwtDecode(token);
      setUser(decoded);

      logoutToastShown.current = false;

      // Clear the explicit-logout guard so silentRefresh() works normally
      // for the remainder of this session. This is the only place the flag
      // is removed — not in init(), not in clearAuthStorage().
      localStorage.removeItem('explicit_logout');

      // Announce to sibling tabs so they pick up the same session.
      if (authChannel) {
        try { authChannel.postMessage({ type: AUTH_EVENT_LOGIN }); } catch {}
      }

      const queryParams = new URLSearchParams(window.location.search);
      const redirectParam = queryParams.get('redirect');
      const savedRedirect = redirectParam || sessionStorage.getItem('redirectAfterLogin');
      sessionStorage.removeItem('redirectAfterLogin');

      // SUPER_ADMIN users always land on the admin dashboard — they have no
      // shop context and the regular app would show a blank / setup-shop page.
      if (decoded.role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (savedRedirect && savedRedirect !== '/login' && savedRedirect !== '/') {
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
