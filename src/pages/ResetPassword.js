import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert, CircularProgress, Paper, Stack, Avatar } from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import { validateResetToken, resetPassword } from '../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isValidating, setIsValidating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setError("Invalid or missing reset token.");
        setIsValidating(false);
        return;
      }
      try {
        const res = await validateResetToken(token);
        if (res.data.valid) {
          setTokenValid(true);
        } else {
          setError("This reset link has expired or is invalid.");
        }
      } catch (err) {
        setError("Failed to validate reset link.");
      } finally {
        setIsValidating(false);
      }
    };
    checkToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("PINs do not match.");
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    try {
      // Backend DTO: { token, newPassword }
      await resetPassword({ token, newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset PIN.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress />
    </Box>
  );

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" p={2}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400, borderRadius: 3 }}>
        <Stack spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: 'primary.main', mb: 1 }}>
            <LockResetIcon />
          </Avatar>
          <Typography variant="h5" fontWeight="bold">Reset Your PIN</Typography>
          
          {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ width: '100%' }}>PIN reset successfully! Redirecting to login...</Alert>}

          {tokenValid && !success && (
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                label="New PIN"
                type="password"
                fullWidth
                margin="normal"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <TextField
                label="Confirm New PIN"
                type="password"
                fullWidth
                margin="normal"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={isSubmitting}
                sx={{ mt: 3 }}
              >
                {isSubmitting ? <CircularProgress size={24} /> : "Update PIN"}
              </Button>
            </Box>
          )}
          
          {!tokenValid && !isValidating && (
            <Button onClick={() => navigate('/login')} sx={{ mt: 2 }}>
              Back to Login
            </Button>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default ResetPassword;
