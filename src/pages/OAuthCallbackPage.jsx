import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import { useAuthContext as useAuth } from '../context/AuthContext';

/**
 * Landing page for the OAuth2 redirect from the backend.
 *
 * The backend success handler redirects the browser here with:
 *   /auth/oauth2/callback?token=<JWT>&new=true|false
 *
 * - token: our short-lived access JWT (15 min)
 * - new:   "true" if the user has no shop yet → forward to /setup-shop
 *
 * On failure the backend redirects to /login?oauth2Error=<message>.
 * That error is handled in Login.jsx itself; this page only deals with success.
 */
const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const processed = useRef(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = searchParams.get('token');
    const isNew = searchParams.get('new') === 'true';

    if (!token) {
      setErrorMsg('Sign-in failed: no access token was returned. Please try again.');
      return;
    }

    // Clear the token from the URL immediately so it isn't visible in browser
    // history or logged by browser extensions.
    window.history.replaceState({}, '', '/auth/oauth2/callback');

    // New users who haven't set up a shop yet go to /setup-shop.
    // AuthContext.login() respects sessionStorage.redirectAfterLogin, so
    // we plant the destination before calling it.
    if (isNew) {
      sessionStorage.setItem('redirectAfterLogin', '/setup-shop');
    }

    try {
      // login() stores the token, updates the API default header, decodes the
      // user, and navigates to redirectAfterLogin or '/' automatically.
      login(token);
    } catch {
      setErrorMsg('Session setup failed. Please try signing in again.');
    }
  }, [searchParams, login, navigate]);

  if (errorMsg) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center"
        justifyContent="center" minHeight="100vh" gap={2} px={2}>
        <Alert severity="error" sx={{ maxWidth: 480, width: '100%', borderRadius: 2 }}>
          {errorMsg}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/login', { replace: true })}
          sx={{ textTransform: 'none', fontWeight: 700 }}>
          Back to sign in
        </Button>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center"
      justifyContent="center" minHeight="100vh" gap={2}>
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        Completing sign-in…
      </Typography>
    </Box>
  );
};

export default OAuthCallbackPage;
