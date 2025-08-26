import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { decodeToken, logout as utilsLogout, startInactivityTimer } from '../utils/auth';
import { refreshToken as refreshTokenApi } from '../services/api';
import i18n from '../config/i18n';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    return token ? { ...decodeToken(token), token } : null;
  });
  const inactivityTimerRef = useRef(null);

  // Start inactivity timer
  useEffect(() => {
    const onInactivityLogout = () => {
      if (user) {
        logout(i18n.t('auth.inactivityLogout'));
      }
    };
    inactivityTimerRef.current = startInactivityTimer(onInactivityLogout);

    return () => {
      if (inactivityTimerRef.current) inactivityTimerRef.current();
    };
  }, [user]);

  const refreshToken = async () => {
    const currentRefreshToken = localStorage.getItem('refreshToken');
    if (!currentRefreshToken) {
      return logout(i18n.t('auth.sessionExpired'));
    }
    try {
      const res = await refreshTokenApi(currentRefreshToken);
      if (res.data && res.data.token) {
        setToken(res.data.token, res.data.refreshToken);
        // Reset inactivity timer on successful refresh
        if (inactivityTimerRef.current) inactivityTimerRef.current();
      } else {
        logout(i18n.t('auth.refreshFailed'));
      }
    } catch (err) {
      logout(i18n.t('auth.refreshFailedLogin'));
    }
  };

  // Token refresh logic
  useEffect(() => {
    if (!user || !user.token) return;

    const decoded = decodeToken(user.token);
    if (!decoded) {
      return logout(i18n.t('auth.invalidToken'));
    }

    const expiresIn = decoded.exp * 1000 - Date.now() - 60 * 1000; // 1 minute buffer

    if (expiresIn <= 0) {
      refreshToken();
      return;
    }

    const timeoutId = setTimeout(refreshToken, expiresIn);
    return () => clearTimeout(timeoutId);
  }, [user]);

  // Sync with localStorage and events
  useEffect(() => {
    const updateUser = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
      } else {
        setUser({ ...decodeToken(token), token });
      }
    };
    window.addEventListener('tokenUpdated', updateUser);
    window.addEventListener('storage', updateUser);
    return () => {
      window.removeEventListener('tokenUpdated', updateUser);
      window.removeEventListener('storage', updateUser);
    };
  }, []);

  const setToken = (token, refreshToken) => {
    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    const userInfo = decodeToken(token);
    console.log('Setting user info from token:', userInfo);
    setUser({ ...userInfo, token });
    window.dispatchEvent(new Event('tokenUpdated'));
  };

  const login = (token, refreshToken) => setToken(token, refreshToken);

  const logout = (message) => {
    utilsLogout();
    setUser(null);
    if (message) {
      console.log(message); // Replace with a toast notification if you have one
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);