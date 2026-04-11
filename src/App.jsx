import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './config/i18n';
import { SubscriptionProvider } from './context/SubscriptionContext';

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AuthProvider>
            <SubscriptionProvider>
              <AppRoutes />
            </SubscriptionProvider>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;