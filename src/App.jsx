import React, { useEffect, Suspense, useRef } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { decodeToken } from './utils/auth';
import Header from './components/layout/Header';
import { I18nextProvider } from 'react-i18next';
import i18n from './config/i18n';
import { refreshToken as refreshTokenApi } from './services/api';

// 1. Import AuthProvider
import { AuthProvider } from './context/AuthContext';

const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

function App() {
  const inactivityTimeout = useRef(null);
  const isLoggingOut = useRef(false);

  // Unified logout function to avoid duplicate code
  const doLogout = (msg, type = "info") => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('refreshToken');
    if (msg) toast[type](msg);
    if (window.location.pathname !== '/login') {
      setTimeout(() => { window.location.href = '/login'; }, 100); // let toast show
    }
  };

  // Inactivity logout logic
  useEffect(() => {
    const resetTimer = () => {
      if (inactivityTimeout.current) clearTimeout(inactivityTimeout.current);
      inactivityTimeout.current = setTimeout(() => {
        doLogout('Logged out due to inactivity.', 'info');
      }, INACTIVITY_LIMIT);
    };

    ['mousemove', 'keydown', 'scroll', 'click'].forEach(event =>
      window.addEventListener(event, resetTimer)
    );
    resetTimer();

    return () => {
      if (inactivityTimeout.current) clearTimeout(inactivityTimeout.current);
      ['mousemove', 'keydown', 'scroll', 'click'].forEach(event =>
        window.removeEventListener(event, resetTimer)
      );
    };
    // eslint-disable-next-line
  }, []);

  // Token expiry and refresh logic
  useEffect(() => {
    let refreshing = false; // to prevent multiple overlapping refreshes

    const checkTokenExpiry = async () => {
      if (isLoggingOut.current) return;
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      if (token) {
        const decoded = decodeToken(token);
        const expiry = decoded.exp * 1000;
        const timeLeft = expiry - new Date().getTime();

        if (timeLeft < 300000 && timeLeft > 0) {
          toast.warn('Your session will expire soon. Please save your work.', {
            position: 'top-right',
            autoClose: 5000,
          });
        } else if (timeLeft <= 0 && refreshToken && !refreshing) {
          refreshing = true;
          try {
            const res = await refreshTokenApi(refreshToken);
            if (res.data && res.data.token) {
              localStorage.setItem('token', res.data.token);
              if (res.data.refreshToken) {
                localStorage.setItem('refreshToken', res.data.refreshToken);
              }
              toast.success('Session refreshed.');
              refreshing = false;
              return; // Do not logout, just refreshed!
            }
          } catch (err) {
            // Refresh failed, logout below
          }
          doLogout('Session expired. Redirecting to login.', 'error');
        } else if (timeLeft <= 0) {
          doLogout('Session expired. Redirecting to login.', 'error');
        }
      }
    };

    const interval = setInterval(checkTokenExpiry, 60000);
    checkTokenExpiry();

    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* 2. Wrap everything in AuthProvider */}
        <AuthProvider>
          <Router>
            <Header />
            <Suspense fallback={<div>Loading...</div>}>
              <AppRoutes />
            </Suspense>
          </Router>
          <ToastContainer />
        </AuthProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;