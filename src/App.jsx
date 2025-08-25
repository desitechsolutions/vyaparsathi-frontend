import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import { I18nextProvider } from 'react-i18next';
import i18n from './config/i18n';

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Header />
            <AppRoutes />
          </Router>
          <ToastContainer />
        </AuthProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;