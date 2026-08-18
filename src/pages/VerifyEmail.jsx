import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Button,
  CircularProgress,
  Alert,
  TextField,
} from '@mui/material';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { verifyEmail, resendVerification } from '../services/api';

/**
 * Handles the /auth/verify-email?token=... link the user clicks in their
 * email. Four visual states: validating → success → invalid/expired
 * (with "resend" flow) → resend-sent confirmation.
 */
const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [state, setState] = useState('validating'); // 'validating' | 'success' | 'error' | 'resendSent'
  const [error, setError] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!token) {
        setError('This verification link is missing a token. Please use the link from your email.');
        setState('error');
        return;
      }
      try {
        await verifyEmail(token);
        if (!cancelled) setState('success');
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || 'This verification link is invalid or has expired.');
        setState('error');
      }
    };
    run();
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    if (state !== 'success') return;
    if (countdown <= 0) { navigate('/login'); return; }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [state, countdown, navigate]);

  const handleResend = async () => {
    if (!/\S+@\S+\.\S+/.test(resendEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    setIsResending(true);
    setError('');
    try {
      await resendVerification(resendEmail);
      setState('resendSent');
    } catch {
      // Backend responds success regardless to avoid enumeration; we mirror.
      setState('resendSent');
    } finally {
      setIsResending(false);
    }
  };

  if (state === 'validating') {
    return (
      <Stack alignItems="center" spacing={2} sx={{ py: 6 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">Verifying your email…</Typography>
      </Stack>
    );
  }

  if (state === 'success') {
    return (
      <Stack spacing={3} alignItems="center" textAlign="center" sx={{ width: '100%' }}>
        <Avatar sx={{ bgcolor: 'success.light', color: 'success.main', width: 64, height: 64 }}>
          <MarkEmailReadIcon fontSize="large" />
        </Avatar>
        <Stack spacing={1}>
          <Typography variant="h5" fontWeight={800}>You're all verified</Typography>
          <Typography variant="body2" color="text.secondary">
            Your email is confirmed. Sign in to continue setting up your business.
          </Typography>
        </Stack>
        <Button
          variant="contained"
          onClick={() => navigate('/login')}
          fullWidth
          sx={{ py: 1.3, fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
        >
          Continue to sign in ({countdown}s)
        </Button>
      </Stack>
    );
  }

  if (state === 'resendSent') {
    return (
      <Stack spacing={3} alignItems="center" textAlign="center" sx={{ width: '100%' }}>
        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 64, height: 64 }}>
          <MailOutlineIcon fontSize="large" />
        </Avatar>
        <Stack spacing={1}>
          <Typography variant="h5" fontWeight={800}>Check your inbox</Typography>
          <Typography variant="body2" color="text.secondary">
            If <strong>{resendEmail}</strong> is registered and unverified, a fresh verification link is on its way. The link expires in 24 hours.
          </Typography>
        </Stack>
        <Button variant="contained" onClick={() => navigate('/login')} fullWidth
          sx={{ py: 1.3, fontWeight: 700, borderRadius: 2, textTransform: 'none' }}>
          Back to sign in
        </Button>
      </Stack>
    );
  }

  // state === 'error' — invalid or expired link, offer a resend
  return (
    <Stack spacing={3} alignItems="center" textAlign="center" sx={{ width: '100%' }}>
      <Avatar sx={{ bgcolor: 'error.light', color: 'error.main', width: 64, height: 64 }}>
        <ErrorOutlineIcon fontSize="large" />
      </Avatar>
      <Stack spacing={1}>
        <Typography variant="h5" fontWeight={800}>Verification link unavailable</Typography>
        <Typography variant="body2" color="text.secondary">{error}</Typography>
      </Stack>

      <Box sx={{ width: '100%' }}>
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary" textAlign="left">
            Enter the email you used at sign-up and we'll send a new verification link:
          </Typography>
          <TextField
            label="Email address"
            type="email"
            fullWidth
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            autoComplete="email"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          {error && !resendEmail && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
          )}
          <Button
            variant="contained"
            onClick={handleResend}
            disabled={isResending}
            fullWidth
            sx={{ py: 1.3, fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
          >
            {isResending ? <CircularProgress size={22} color="inherit" /> : 'Send new verification link'}
          </Button>
          <Button
            variant="text"
            onClick={() => navigate('/login')}
            sx={{ textTransform: 'none' }}
          >
            Back to sign in
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
};

export default VerifyEmail;
