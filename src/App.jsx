import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { decodeToken } from './utils/auth';
import Header from './components/layout/Header';

function App() {
  useEffect(() => {
    const checkTokenExpiry = () => {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = decodeToken(token);
        const expiry = decoded.exp * 1000;
        const timeLeft = expiry - new Date().getTime();
        if (timeLeft < 300000 && timeLeft > 0) {
          toast.warn('Your session will expire soon. Please save your work.', {
            position: 'top-right',
            autoClose: 5000,
          });
        } else if (timeLeft <= 0) {
          localStorage.removeItem('token');
          localStorage.removeItem('tokenExpiry');
          if (window.location.pathname !== '/login') {
            toast.error('Session expired. Redirecting to login.');
            window.location.href = '/login';
          }
        }
      }
    };

    const interval = setInterval(checkTokenExpiry, 60000);
    checkTokenExpiry();

    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Header /> {/* Moved inside Router */}
        <AppRoutes />
      </Router>
      <ToastContainer />
    </ThemeProvider>
  );
}

export default App;