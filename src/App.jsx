import React, { useMemo, useEffect } from 'react';
import * as Sentry from '@sentry/react';
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

import ErrorBoundary from './components/common/ErrorBoundary';

import { initSentry } from './services/sentry';

// Initialise Sentry as early as possible so every subsequent error is captured.
initSentry();

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

  // NOTE: The storage event listener that previously called clearAuthStorage()
  // and hard-redirected to /login on token removal has been intentionally
  // removed. It was causing User B to be immediately logged out after User A's
  // logout in a multi-tab scenario:
  //   1. User A logout in Tab 1 fires localStorage.removeItem('token').
  //   2. The storage event fires in Tab 2 with e.key='token', e.newValue=null.
  //   3. Tab 2 called clearAuthStorage() and redirected — wiping User B's
  //      just-written token and interrupting their login.
  //
  // Multi-tab auth sync is handled correctly by AuthContext's BroadcastChannel
  // ('vs-auth'), which triggers a full page reload in sibling tabs. That reload
  // re-runs init() from the current localStorage/cookie state, which is always
  // correct. No storage listener is needed or safe here.

  // Global safety nets for async errors that ErrorBoundary can't catch:
  // - `unhandledrejection` — an awaited/promised call that threw after any
  //   try/catch, or a fetch chain missing a `.catch`. Without this handler
  //   the page silently stays in a loading state; with it we at least log
  //   the failure and can wire in a toast or Sentry later.
  // - `error` — uncaught synchronous errors from event handlers (which
  //   also bypass ErrorBoundary). React logs them anyway; we forward to
  //   the same channel so the log site is one place, not two.
  useEffect(() => {
    const onRejection = (e) => {
      // eslint-disable-next-line no-console
      console.error('Unhandled promise rejection:', e.reason);
    };
    const onError = (e) => {
      // eslint-disable-next-line no-console
      console.error('Uncaught error:', e.error || e.message);
    };
    window.addEventListener('unhandledrejection', onRejection);
    window.addEventListener('error', onError);
    return () => {
      window.removeEventListener('unhandledrejection', onRejection);
      window.removeEventListener('error', onError);
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <SubscriptionProvider>
            <Sentry.ErrorBoundary>
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </Sentry.ErrorBoundary>
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

export default Sentry.withProfiler(App);