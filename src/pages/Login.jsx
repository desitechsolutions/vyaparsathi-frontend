import React, { useState } from 'react';
import {
  TextField,
  Button,
  Container,
  Typography,
  Alert,
  Box,
  CircularProgress,
  Paper
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

// This code assumes you have the following files and functions.
import API from '../services/api';
import { setToken } from '../utils/auth';
import endpoints from '../services/endpoints';

const Login = () => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      // Calling the original API endpoint
      const response = await API.post(endpoints.auth.login, { username, pin });
      setToken(response.data.token);
      // Redirect to the home page on successful login
      window.location.href = '/';
    } catch (err) {
      // Handle login errors
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
        backgroundColor: '#f5f5f5', // Subtle background color
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
            onChange={(e) => setUsername(e.target.value)}
            disabled={isSubmitting}
            required
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
