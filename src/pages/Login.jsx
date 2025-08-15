import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Button,
  Container,
  Typography,
  Alert,
  Box,
  CircularProgress,
  Paper,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

// This code assumes you have the following files and functions.
import API from '../services/api';
import { setToken } from '../utils/auth';
import endpoints from '../services/endpoints';

const Login = () => {
  // Initialize state with potential saved values from localStorage or empty
  const [username, setUsername] = useState(localStorage.getItem('lastUsername') || '');
  const [pin, setPin] = useState(localStorage.getItem('lastPin') || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs to access input elements
  const usernameRef = useRef(null);
  const pinRef = useRef(null);

  // Detect autofill using animation start event
  useEffect(() => {
    const handleAnimationStart = (e) => {
      if (e.animationName === 'mui-auto-fill' || e.animationName === 'mui-auto-fill-cancel') {
        if (usernameRef.current && usernameRef.current.value !== username) {
          setUsername(usernameRef.current.value);
          localStorage.setItem('lastUsername', usernameRef.current.value);
        }
        if (pinRef.current && pinRef.current.value !== pin) {
          setPin(pinRef.current.value);
          localStorage.setItem('lastPin', pinRef.current.value);
        }
      }
    };

    const inputs = [usernameRef.current, pinRef.current].filter(ref => ref);
    inputs.forEach(input => {
      input?.addEventListener('animationstart', handleAnimationStart);
    });

    // Fallback check for initial autofill
    const checkAutofill = () => {
      if (usernameRef.current && usernameRef.current.value !== username) {
        setUsername(usernameRef.current.value);
        localStorage.setItem('lastUsername', usernameRef.current.value);
      }
      if (pinRef.current && pinRef.current.value !== pin) {
        setPin(pinRef.current.value);
        localStorage.setItem('lastPin', pinRef.current.value);
      }
    };
    checkAutofill(); // Immediate check

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
    try {
      const response = await API.post(endpoints.auth.login, { username, pin });
      setToken(response.data.token);
      window.location.href = '/';
    } catch (err) {
      setError('Invalid credentials. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
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
        backgroundColor: '#f5f5f5',
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
        }}
      >
        <PersonOutlineIcon sx={{ fontSize: 60, color: 'primary.main' }} />
        <Typography
          variant="h5"
          component="h1"
          align="center"
          gutterBottom
          sx={{ fontWeight: 'bold' }}
        >
          Login
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
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
            InputLabelProps={{
              shrink: !!username || (usernameRef.current && usernameRef.current.value !== ''),
            }}
            inputRef={usernameRef}
          />
          <TextField
            label="PIN"
            type="password"
            fullWidth
            margin="normal"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              localStorage.setItem('lastPin', e.target.value);
            }}
            disabled={isSubmitting}
            required
            InputLabelProps={{
              shrink: !!pin || (pinRef.current && pinRef.current.value !== ''),
            }}
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
      </Paper>
    </Container>
  );
};

export default Login;
