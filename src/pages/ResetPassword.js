import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Avatar,
  Divider,
  Link,
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { validateResetToken, resetPassword } from '../services/api';
import PasswordField from '../components/auth/PasswordField';
import PasswordStrengthMeter, { evaluatePassword } from '../components/auth/PasswordStrengthMeter';

/**
 * Reset-password page — SaaS-grade multi-state flow:
 *   1. Validating token spinner
 *   2. Invalid / expired link screen
 *   3. Reset form with strength meter, confirm field
 *   4. Success screen with countdown redirect
 */
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
  const [redirectIn, setRedirectIn] = useState(5);

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setError('This reset link is missing or invalid.');
        setIsValidating(false);
        return;
      }
      try {
        const res = await validateResetToken(token);
        if (res.data.valid) setTokenValid(true);
        else setError('This reset link has expired or has already been used.');
      } catch (err) {
        setError('We could not validate this reset link. Please request a new one.');
      } finally {
        setIsValidating(false);
      }
    };
    checkToken();
  }, [token]);

  useEffect(() => {
    if (!success) return;
    if (redirectIn <= 0) {
      navigate('/login');
      return;
    }
    const t = setTimeout(() => setRedirectIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [success, redirectIn, navigate]);

  const strength = useMemo(() => evaluatePassword(newPassword), [newPassword]);
  const passwordStrong =
    strength.rules.length &&
    strength.rules.upper &&
    strength.rules.lower &&
    strength.rules.digit &&
    strength.rules.special;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!passwordStrong) {
      setError('Password must be at least 8 characters and include an uppercase letter, lowercase letter, digit and special character.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await resetPassword({ token, newPassword });
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password. The link may have expired.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <Stack alignItems="center" spacing={2} sx={{ py: 6 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">Validating your reset link…</Typography>
      </Stack>
    );
  }

  if (success) {
    return (
      <Stack spacing={3} alignItems="center" textAlign="center" sx={{ width: '100%' }}>
        <Avatar sx={{ bgcolor: 'success.light', color: 'success.main', width: 64, height: 64 }}>
          <CheckCircleIcon fontSize="large" />
        </Avatar>
        <Stack spacing={1}>
          <Typography variant="h5" fontWeight={800}>Password updated</Typography>
          <Typography variant="body2" color="text.secondary">
            All active sessions have been signed out. You can now sign in with your new password.
          </Typography>
        </Stack>
        <Button
          variant="contained"
          onClick={() => navigate('/login')}
          fullWidth
          sx={{ py: 1.3, fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
        >
          Go to sign in ({redirectIn}s)
        </Button>
      </Stack>
    );
  }

  if (!tokenValid) {
    return (
      <Stack spacing={3} alignItems="center" textAlign="center" sx={{ width: '100%' }}>
        <Avatar sx={{ bgcolor: 'error.light', color: 'error.main', width: 64, height: 64 }}>
          <ErrorOutlineIcon fontSize="large" />
        </Avatar>
        <Stack spacing={1}>
          <Typography variant="h5" fontWeight={800}>Reset link unavailable</Typography>
          <Typography variant="body2" color="text.secondary">{error}</Typography>
        </Stack>
        <Stack spacing={1} sx={{ width: '100%' }}>
          <Button
            variant="contained"
            onClick={() => navigate('/login')}
            fullWidth
            sx={{ py: 1.3, fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
          >
            Request a new link
          </Button>
          <Button
            variant="text"
            onClick={() => navigate('/login')}
            sx={{ textTransform: 'none' }}
          >
            Back to sign in
          </Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack spacing={3} sx={{ width: '100%' }}>
      <Stack spacing={1.5}>
        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 48, height: 48 }}>
          <LockResetIcon />
        </Avatar>
        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
          Set a new password
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Choose a strong password. Signing all your other devices out is done automatically.
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" role="alert" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          <PasswordField
            label="New password"
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoComplete="new-password"
            autoFocus
            showStartIcon={false}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <PasswordStrengthMeter value={newPassword} />

          <PasswordField
            label="Confirm new password"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            error={confirmPassword.length > 0 && newPassword !== confirmPassword}
            helperText={
              confirmPassword.length > 0 && newPassword !== confirmPassword
                ? 'Passwords do not match'
                : ''
            }
            showStartIcon={false}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isSubmitting || !newPassword || newPassword !== confirmPassword || !passwordStrong}
            sx={{ py: 1.3, fontWeight: 700, borderRadius: 2, textTransform: 'none', fontSize: '1rem' }}
          >
            {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Update password'}
          </Button>
        </Stack>
      </Box>

      <Divider />

      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ color: 'text.secondary' }}>
        <ShieldOutlinedIcon fontSize="small" sx={{ mt: 0.3 }} />
        <Typography variant="caption">
          For your safety, we've temporarily blocked new sign-ins from unrecognised devices. You'll be asked to verify the next time you sign in on a new browser.
        </Typography>
      </Stack>

      <Box sx={{ textAlign: 'center' }}>
        <Link
          component="button"
          type="button"
          variant="body2"
          onClick={() => navigate('/login')}
          underline="hover"
          sx={{ fontWeight: 600 }}
        >
          Back to sign in
        </Link>
      </Box>
    </Stack>
  );
};

export default ResetPassword;
