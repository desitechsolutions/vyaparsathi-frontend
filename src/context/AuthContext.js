import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { decodeToken, logout as utilsLogout, startInactivityTimer } from '../utils/auth';
import { refreshToken as refreshTokenApi } from '../services/api';

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
        logout('Logged out due to inactivity.');
      }
    };
    inactivityTimerRef.current = startInactivityTimer(onInactivityLogout);

    return () => {
      if (inactivityTimerRef.current) inactivityTimerRef.current();
    };
  }, [user]);

  // Token refresh logic
  useEffect(() => {
     if (!user) return;
    let refreshInterval;
    const checkTokenExpiry = async () => {
      if (!user) return;
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      if (!token || !refreshToken) {
        logout('Session expired due to missing tokens.');
        return;
      }

      const decoded = decodeToken(token);
      const expiry = decoded.exp * 1000;
      const timeLeft = expiry - new Date().getTime();

      if (timeLeft <= 0) {
        try {
          const res = await refreshTokenApi(refreshToken);
          if (res.data && res.data.token) {
            setToken(res.data.token, res.data.refreshToken);
            // Reset inactivity timer on successful refresh
            if (inactivityTimerRef.current) inactivityTimerRef.current();
          } else {
            logout('Failed to refresh session.');
          }
        } catch (err) {
          logout('Session refresh failed. Please log in again.');
        }
      } else if (timeLeft < 300000) { // 5 minutes warning
        // Optionally show a toast warning here
      }
    };

    refreshInterval = setInterval(checkTokenExpiry, 60000); // Check every minute
    if(user) checkTokenExpiry();

    return () => clearInterval(refreshInterval);
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
      // Assuming toast is available, adjust as per your setup
      // toast.info(message, { position: 'top-right', autoClose: 5000 });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);