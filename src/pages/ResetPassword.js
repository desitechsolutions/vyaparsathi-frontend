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
    <Box display="flex" justifyContent="center" alignItems="center" py={4}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Stack spacing={3} alignItems="center">
        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, mb: 1 }}>
          <LockResetIcon sx={{ fontSize: 36 }} />
        </Avatar>
        <Typography variant="h5" fontWeight="900" sx={{ color: '#0f172a' }}>Reset Your PIN</Typography>
        
        {error && <Alert severity="error" sx={{ width: '100%', borderRadius: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ width: '100%', borderRadius: 2 }}>PIN reset successfully! Redirecting to login...</Alert>}

        {tokenValid && !success && (
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <Stack spacing={2}>
              <TextField
                label="New PIN"
                type="password"
                fullWidth
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                variant="outlined"
                size="medium"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
              <TextField
                label="Confirm New PIN"
                type="password"
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                variant="outlined"
                size="medium"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={isSubmitting}
                sx={{ 
                  py: 1.3, 
                  fontWeight: 900, 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  '&:hover:not(:disabled)': {
                    boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s'
                }}
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Update PIN"}
              </Button>
            </Stack>
          </Box>
        )}
        
        {!tokenValid && !isValidating && (
          <Button 
            onClick={() => navigate('/login')} 
            sx={{ 
              mt: 2,
              fontWeight: 600,
              textTransform: 'none',
            }}
          >
            Back to Login
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default ResetPassword;
