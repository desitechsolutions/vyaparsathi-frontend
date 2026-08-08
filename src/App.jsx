import React, { useMemo, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getAppTheme } from './theme';
import { AuthProvider } from './context/AuthContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './config/i18n';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { ThemeContextProvider, useThemeContext } from './context/ThemeContext';

/**
 * Inner component — consumes ThemeContext (provided above it).
 * Rebuilds the MUI theme only when effectiveMode changes.
 * Also syncs `data-theme` on <html> so CSS custom properties activate.
 */
function ThemedApp() {
  const { effectiveMode } = useThemeContext();
  const theme = useMemo(() => getAppTheme(effectiveMode), [effectiveMode]);

  // Keep CSS variables in sync with the MUI theme mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effectiveMode);
  }, [effectiveMode]);

  return (
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
  );
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeContextProvider>
        <ThemedApp />
      </ThemeContextProvider>
    </I18nextProvider>
  );
}

export default App;