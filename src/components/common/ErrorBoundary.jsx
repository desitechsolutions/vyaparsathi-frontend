import React from 'react';
import { Box, Typography, Button, Paper, Stack, Alert } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import { captureException } from '../../services/sentry';

/**
 * Class-based error boundary — catches render-phase and lifecycle errors
 * in its subtree, keeping the surrounding shell (sidebar, header, nav)
 * usable. Does NOT catch async errors thrown inside effects or event
 * handlers; those are handled by the global `unhandledrejection` listener
 * in App.jsx.
 *
 * <p>Reset options:
 * <ul>
 *   <li>"Try again" — clears local state; useful when the error was
 *       transient (a data race, a stale prop).</li>
 *   <li>"Go home" — router-level navigation; keeps the SPA session alive.</li>
 *   <li>"Reload page" — nuclear; drops the tab.</li>
 * </ul>
 *
 * <p>Auto-reset via {@code resetKey} prop: pass e.g. `location.pathname`
 * so that navigating to a different route re-mounts the subtree with a
 * clean slate. Without this, a user stuck on a crashed page would see
 * the fallback linger after switching pages.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  static getDerivedStateFromProps(props, state) {
    // When the parent passes a new resetKey (typically location.pathname),
    // drop the error state so the fresh subtree gets a chance to render.
    if (state.hasError && props.resetKey !== state.resetKey) {
      return { hasError: false, error: null, resetKey: props.resetKey };
    }
    // Track the current resetKey either way so getDerivedStateFromError
    // above can compare on the next crash.
    if (state.resetKey !== props.resetKey) {
      return { resetKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, errorInfo);
    captureException(error, { componentStack: errorInfo?.componentStack });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    // Router-level navigation via native history — avoids importing
    // useNavigate here (class component). Keeps the SPA session alive.
    this.setState({ hasError: false, error: null }, () => {
      window.history.pushState({}, '', '/dashboard');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const message = this.state.error?.message
      || 'An unexpected error occurred while rendering this page.';

    return (
      <Box sx={{
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        pt: { xs: 4, md: 8 }, px: 2,
      }}>
        <Paper elevation={0} sx={{
          p: 4, maxWidth: 520, width: '100%', textAlign: 'center',
          borderRadius: 2, border: '1px solid', borderColor: 'divider',
        }}>
          <ErrorOutlineIcon color="error" sx={{ fontSize: 56, mb: 2 }} />
          <Typography variant="h6" gutterBottom fontWeight={700}>
            This page hit an unexpected error
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The rest of the app is still usable — pick a page from the
            sidebar, retry this one, or reload if the problem persists.
          </Typography>
          <Alert severity="error" variant="outlined" sx={{
            textAlign: 'left', borderRadius: 1.5, mb: 3,
            '& .MuiAlert-message': { wordBreak: 'break-word' },
          }}>
            {message}
          </Alert>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}
            justifyContent="center">
            <Button variant="contained" size="small" startIcon={<RefreshIcon />}
              onClick={this.handleRetry}
              sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none' }}>
              Try again
            </Button>
            <Button variant="outlined" size="small" startIcon={<HomeIcon />}
              onClick={this.handleGoHome}
              sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none' }}>
              Go to dashboard
            </Button>
            <Button variant="text" size="small"
              onClick={this.handleReload}
              sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none', color: 'text.secondary' }}>
              Reload page
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }
}

export default ErrorBoundary;
