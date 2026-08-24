import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { useAuthContext } from '../context/AuthContext';

function PrivateRoute({ children, requiredRole = null }) {
  const { user, loading: authLoading } = useAuthContext();
  const location = useLocation();

  if (authLoading) {
    // Branded full-page loader replaces the plain "Loading..." — the
    // silent-refresh boot path can take a beat on cold cache and a
    // half-second of grey text looked broken.
    return (
      <Box
        role="status"
        aria-live="polite"
        sx={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          zIndex: (theme) => theme.zIndex.modal + 1,
        }}
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress size={44} thickness={4} />
          <Typography variant="body2" color="text.secondary">Signing you in…</Typography>
        </Stack>
      </Box>
    );
  }

  if (!user) {
    const redirectPath = location.pathname + location.search;
    if (location.pathname !== '/login') {
      sessionStorage.setItem('redirectAfterLogin', redirectPath);
    }
    return <Navigate to={`/login?expired=1&redirect=${encodeURIComponent(redirectPath)}`} replace />;
  }

  if (requiredRole && !requiredRole.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}

export default PrivateRoute;
