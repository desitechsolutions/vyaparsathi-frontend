import React from 'react';
import { AppBar, Toolbar, Box, Button, Tooltip } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * Lightweight error boundary for header only — shows minimal fallback
 * that preserves layout instead of breaking it. Allows user to retry
 * without reloading the entire page.
 */
class HeaderErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Header error:', error);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar
          sx={{
            justifyContent: 'space-between',
            minHeight: { xs: 60, sm: 70 },
            gap: { xs: 1, sm: 2 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ErrorOutlineIcon sx={{ fontSize: 20, color: 'white' }} />
            <Box sx={{ fontSize: '0.9rem', color: 'white', fontWeight: 500 }}>
              Header error — retry to restore
            </Box>
          </Box>

          <Tooltip title="Retry header">
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={this.handleRetry}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Retry
            </Button>
          </Tooltip>
        </Toolbar>
      </AppBar>
    );
  }
}

export default HeaderErrorBoundary;
