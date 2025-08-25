import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  TextField,
  Button,
  Container,
  Typography,
  Alert,
  Box,
  CircularProgress,
  Paper,
  Link,
  IconButton,
  MenuItem,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { login as loginApi } from '../services/api'; // Use the login function from api.js
import endpoints from '../services/endpoints';
import API from '../services/api';

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'OWNER', label: 'Owner' },
  { value: 'STAFF', label: 'Staff' },
];

const Login = () => {
  const { login, user } = useAuthContext();
  const navigate = useNavigate();
  const [view, setView] = useState('login');
  const [role, setRole] = useState('STAFF');
  const [username, setUsername] = useState(localStorage.getItem('lastUsername') || '');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const usernameRef = useRef(null);
  const pinRef = useRef(null);

  // Effect to handle navigation after login
  const handleNavigation = useCallback(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    handleNavigation();
  }, [handleNavigation]);

  useEffect(() => {
    const handleAnimationStart = (e) => {
      if (e.animationName === 'mui-auto-fill' || e.animationName === 'mui-auto-fill-cancel') {
        if (usernameRef.current && usernameRef.current.value !== username) {
          setUsername(usernameRef.current.value);
          localStorage.setItem('lastUsername', usernameRef.current.value);
        }
        if (pinRef.current && pinRef.current.value !== pin) {
          setPin(pinRef.current.value);
        }
      }
    };

    const inputs = [usernameRef.current, pinRef.current].filter(ref => ref);
    inputs.forEach(input => {
      input?.addEventListener('animationstart', handleAnimationStart);
    });

    const checkAutofill = () => {
      if (usernameRef.current && usernameRef.current.value !== username) {
        setUsername(usernameRef.current.value);
        localStorage.setItem('lastUsername', usernameRef.current.value);
      }
      if (pinRef.current && pinRef.current.value !== pin) {
        setPin(pinRef.current.value);
      }
    };
    checkAutofill();

    return () => {
      inputs.forEach(input => {
        input?.removeEventListener('animationstart', handleAnimationStart);
      });
    };
  }, [username, pin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      if (view === 'login') {
        if (!username.trim() || !pin.trim()) {
          setError('Username and PIN are required.');
          setIsSubmitting(false);
          return;
        }
        // Use the loginApi function which skips refresh logic on 401
        const response = await loginApi({ username, pin });
        login(response.data.token, response.data.refreshToken);
        // Navigation will be handled by the useEffect when user state updates
      } else if (view === 'register') {
        if (!username.trim() || !pin.trim() || !confirmPin.trim() || !role) {
          setError('All fields are required.');
          setIsSubmitting(false);
          return;
        }
        if (pin !== confirmPin) {
          setError('Pins do not match.');
          setIsSubmitting(false);
          return;
        }
        // Registration does not need skipAuthRefresh
        const response = await API.post(endpoints.auth.register, { username, pin, role });
        setSuccessMessage('Registration successful! You can now log in.');
        setTimeout(() => setView('login'), 2000);
      } else if (view === 'forgotPin') {
        if (!username.trim()) {
          setError('Username is required.');
          setIsSubmitting(false);
          return;
        }
        // Forgot PIN does not need skipAuthRefresh
        const response = await API.post(endpoints.auth.forgetPin, { username });
        setSuccessMessage(response.data.message || 'PIN reset link sent.');
        setTimeout(() => setView('login'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderForm = () => {
    switch (view) {
      case 'login':
        return (
          <>
            <PersonOutlineIcon sx={{ fontSize: 60, color: 'primary.main' }} />
            <Typography variant="h5" component="h1" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
              Sign In
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
              <TextField
                label="Username"
                fullWidth
                margin="normal"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  localStorage.setItem('lastUsername', e.target.value);
                }}
                disabled={isSubmitting}
                required
                InputLabelProps={{ shrink: !!username }}
                inputRef={usernameRef}
              />
              <TextField
                label="PIN"
                type="password"
                fullWidth
                margin="normal"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                disabled={isSubmitting}
                required
                InputLabelProps={{ shrink: !!pin }}
                inputRef={pinRef}
              />
              <Button
                variant="contained"
                color="primary"
                type="submit"
                fullWidth
                disabled={isSubmitting}
                sx={{ mt: 3, height: '50px', fontWeight: 'bold', letterSpacing: '1px' }}
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => { setView('forgotPin'); setError(''); setSuccessMessage(''); }}
                sx={{ textDecoration: 'none', color: 'primary.main' }}
              >
                Forgot PIN?
              </Link>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => { setView('register'); setError(''); setSuccessMessage(''); }}
                  sx={{ textDecoration: 'none', fontWeight: 'bold' }}
                >
                  Sign Up
                </Link>
              </Typography>
            </Box>
          </>
        );

      case 'register':
        return (
          <>
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
              <IconButton onClick={() => setView('login')} aria-label="back to login">
                <ArrowBackIcon />
              </IconButton>
            </Box>
            <PersonAddAltOutlinedIcon sx={{ fontSize: 60, color: 'secondary.main' }} />
            <Typography variant="h5" component="h1" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
              Sign Up
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
              <TextField
                label="Username"
                fullWidth
                margin="normal"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                required
                InputLabelProps={{ shrink: !!username }}
              />
              <TextField
                label="Create PIN"
                type="password"
                fullWidth
                margin="normal"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                disabled={isSubmitting}
                required
                InputLabelProps={{ shrink: !!pin }}
              />
              <TextField
                label="Confirm PIN"
                type="password"
                fullWidth
                margin="normal"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                disabled={isSubmitting}
                required
                error={pin !== confirmPin && confirmPin.length > 0}
                helperText={pin !== confirmPin && confirmPin.length > 0 ? 'Pins do not match.' : ''}
                InputLabelProps={{ shrink: !!confirmPin }}
              />
              <TextField
                select
                label="Role"
                fullWidth
                margin="normal"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isSubmitting}
                required
                InputLabelProps={{ shrink: true }}
              >
                {ROLE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="contained"
                color="secondary"
                type="submit"
                fullWidth
                disabled={isSubmitting || pin !== confirmPin}
                sx={{ mt: 3, height: '50px', fontWeight: 'bold', letterSpacing: '1px' }}
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Register'}
              </Button>
            </Box>
          </>
        );

      case 'forgotPin':
        return (
          <>
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
              <IconButton onClick={() => setView('login')} aria-label="back to login">
                <ArrowBackIcon />
              </IconButton>
            </Box>
            <VpnKeyOutlinedIcon sx={{ fontSize: 60, color: 'error.main' }} />
            <Typography variant="h5" component="h1" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
              Forgot PIN?
            </Typography>
            <Typography variant="body2" align="center" sx={{ mb: 2, color: 'text.secondary' }}>
              Enter your username and we'll send you a link to reset your PIN.
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
              <TextField
                label="Username"
                fullWidth
                margin="normal"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                required
                InputLabelProps={{ shrink: !!username }}
              />
              <Button
                variant="contained"
                color="error"
                type="submit"
                fullWidth
                disabled={isSubmitting}
                sx={{ mt: 3, height: '50px', fontWeight: 'bold', letterSpacing: '1px' }}
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
              </Button>
            </Box>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        px: 2,
        backgroundColor: '#f0f2f5',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <Paper
        elevation={6}
        sx={{
          padding: { xs: 3, md: 5 },
          borderRadius: 3,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          transition: 'transform 0.3s, box-shadow 0.3s',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
          },
        }}
      >
        {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
        {successMessage && <Alert severity="success" sx={{ width: '100%' }}>{successMessage}</Alert>}
        {renderForm()}
      </Paper>
    </Container>
  );
};

export default Login;