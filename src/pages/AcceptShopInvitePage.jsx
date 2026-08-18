import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { lookupShopInvitation, acceptShopInvitation } from '../services/api';
import { useAuthContext } from '../context/AuthContext';
import PasswordField from '../components/auth/PasswordField';
import PasswordStrengthMeter, { evaluatePassword } from '../components/auth/PasswordStrengthMeter';

/**
 * Landing page for the shop-invitation link (emailed to the invitee).
 *
 * Four states:
 *   1. validating — hitting /api/shop/invitations/lookup with the token
 *   2. invalid    — token missing / expired / already accepted
 *   3. form       — preview + form (password required only for new users)
 *   4. success    — auto-login done, brief moment before redirect
 */
export default function AcceptShopInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthContext();
  const token = searchParams.get('token');

  const [state, setState] = useState('validating'); // 'validating' | 'invalid' | 'form' | 'success'
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setError('This invitation link is missing a token.');
      setState('invalid');
      return () => { cancelled = true; };
    }
    lookupShopInvitation(token)
      .then((res) => {
        if (cancelled) return;
        setPreview(res.data);
        setState('form');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.data?.message || 'This invitation link is invalid or has expired.');
        setState('invalid');
      });
    return () => { cancelled = true; };
  }, [token]);

  const strength = evaluatePassword(password);
  const passwordStrong =
    strength.rules.length &&
    strength.rules.upper &&
    strength.rules.lower &&
    strength.rules.digit &&
    strength.rules.special;

  const handleAccept = async (e) => {
    e.preventDefault();
    setError('');
    if (!preview?.userExists) {
      if (!firstName.trim()) { setError('First name is required.'); return; }
      if (!passwordStrong) {
        setError('Password must be at least 8 characters and include an uppercase letter, lowercase letter, digit and special character.');
        return;
      }
    }
    setBusy(true);
    try {
      const res = await acceptShopInvitation({
        token,
        firstName: firstName || null,
        lastName: lastName || null,
        password: preview?.userExists ? undefined : password,
      });
      login(res.data.accessToken);
      setState('success');
      setTimeout(() => navigate('/', { replace: true }), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not accept the invitation. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (state === 'validating') {
    return (
      <Stack alignItems="center" spacing={2} sx={{ py: 6 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">Loading your invitation…</Typography>
      </Stack>
    );
  }

  if (state === 'invalid') {
    return (
      <Stack spacing={3} alignItems="center" textAlign="center" sx={{ width: '100%' }}>
        <Avatar sx={{ bgcolor: 'error.light', color: 'error.main', width: 64, height: 64 }}>
          <ErrorOutlineIcon fontSize="large" />
        </Avatar>
        <Stack spacing={1}>
          <Typography variant="h5" fontWeight={800}>Invitation unavailable</Typography>
          <Typography variant="body2" color="text.secondary">{error}</Typography>
        </Stack>
        <Button variant="contained" onClick={() => navigate('/login')} fullWidth
          sx={{ py: 1.3, fontWeight: 700, borderRadius: 2, textTransform: 'none' }}>
          Back to sign in
        </Button>
      </Stack>
    );
  }

  if (state === 'success') {
    return (
      <Stack spacing={3} alignItems="center" textAlign="center" sx={{ width: '100%' }}>
        <Avatar sx={{ bgcolor: 'success.light', color: 'success.main', width: 64, height: 64 }}>
          <CheckCircleIcon fontSize="large" />
        </Avatar>
        <Typography variant="h5" fontWeight={800}>You're in!</Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome to <strong>{preview?.shopName}</strong>. Taking you to the dashboard…
        </Typography>
      </Stack>
    );
  }

  // state === 'form'
  return (
    <Stack spacing={3} sx={{ width: '100%' }}>
      <Stack spacing={1.5}>
        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 48, height: 48 }}>
          <GroupAddIcon />
        </Avatar>
        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
          Join {preview?.shopName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>{preview?.inviterName}</strong> invited you to join <strong>{preview?.shopName}</strong> as{' '}
          <Chip label={preview?.roleName} size="small" variant="outlined" sx={{ fontWeight: 700, ml: 0.5 }} />
        </Typography>
      </Stack>

      {preview?.message && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>Message from {preview.inviterName}:</Typography>
          <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>"{preview.message}"</Typography>
        </Paper>
      )}

      {error && <Alert severity="error" sx={{ borderRadius: 2 }} role="alert">{error}</Alert>}

      <Box component="form" onSubmit={handleAccept} noValidate>
        <Stack spacing={2}>
          <TextField
            label="Email"
            value={preview?.email || ''}
            fullWidth
            disabled
            InputProps={{ readOnly: true }}
            helperText="You were invited to this address; it can't be changed here."
          />

          {preview?.userExists ? (
            <Alert severity="info" variant="outlined">
              You already have a VyaparSathi account for this email. Accepting the invitation will just add this shop to your account.
            </Alert>
          ) : (
            <>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  fullWidth
                  required
                  autoFocus
                  autoComplete="given-name"
                />
                <TextField
                  label="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  fullWidth
                  autoComplete="family-name"
                />
              </Stack>
              <PasswordField
                label="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                required
                autoComplete="new-password"
                showStartIcon={false}
              />
              <PasswordStrengthMeter value={password} />
            </>
          )}

          <Divider />

          <Button
            type="submit"
            variant="contained"
            disabled={busy || (!preview?.userExists && (!firstName.trim() || !passwordStrong))}
            fullWidth
            sx={{ py: 1.3, fontWeight: 700, borderRadius: 2, textTransform: 'none', fontSize: '1rem' }}
          >
            {busy ? <CircularProgress size={22} color="inherit" /> : `Join ${preview?.shopName}`}
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}
