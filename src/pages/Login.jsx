import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Alert } from '@mui/material';
import API from '../services/api';
import { setToken } from '../utils/auth';
import endpoints from '../services/endpoints';

const Login = () => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post(endpoints.auth.login, { username, pin });
      setToken(response.data.token);
      window.location.href = '/';
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <Container maxWidth="xs" style={{ marginTop: '100px' }}>
      <Typography variant="h4" gutterBottom>Login</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField label="Username" fullWidth margin="normal" value={username} onChange={(e) => setUsername(e.target.value)} />
        <TextField label="PIN" type="password" fullWidth margin="normal" value={pin} onChange={(e) => setPin(e.target.value)} />
        <Button variant="contained" color="primary" type="submit" fullWidth>Login</Button>
      </form>
    </Container>
  );
};

export default Login;