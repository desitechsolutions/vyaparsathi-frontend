import React, { useState } from 'react';
import {
  Box, Container, Avatar, Typography, TextField, Button, Stack, Paper,
  CircularProgress, Alert, useTheme, Fade,
} from '@mui/material';
import { Lock as LockIcon, LogoutOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

const LockScreenPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unlocked, setUnlocked] = useState(false);

  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.sub || 'User' : 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const userEmail = user?.sub || 'user@example.com';

  const handleUnlock = async (e) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    if (password.length < 6) {
      setError('Password is incorrect');
      return;
    }

    // Simulate authentication validation
    // In production, verify password against backend
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setUnlocked(true);

      // Auto-redirect after successful unlock
      setTimeout(() => {
        navigate(-1);
      }, 500);
    }, 800);
  };

  const handleSignOut = () => {
    logout();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleUnlock(e);
    }
    if (e.key === 'Escape') {
      handleSignOut();
    }
  };

  return (
    <Fade in={true} timeout={300}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          backdropFilter: 'blur(10px)',
          zIndex: (theme) => theme.zIndex.modal + 1,
        }}
      >
        <Container maxWidth="xs">
          <Paper
            elevation={unlocked ? 0 : 8}
            sx={{
              p: { xs: 3, sm: 6 },
              textAlign: 'center',
              borderRadius: 3,
              opacity: unlocked ? 0.5 : 1,
              transform: unlocked ? 'scale(0.95)' : 'scale(1)',
              transition: 'all 200ms ease',
            }}
          >
            {/* Lock Icon */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: 3,
              }}
            >
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'primary.main',
                  color: 'white',
                }}
              >
                <LockIcon sx={{ fontSize: 40 }} />
              </Avatar>
            </Box>

            {/* Title */}
            <Typography variant="h5" fontWeight={800} gutterBottom>
              Session Locked
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter your password to unlock your session
            </Typography>

            {/* User Info */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 3,
                bgcolor: 'action.hover',
                borderRadius: 2,
              }}
            >
              <Stack spacing={1}>
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: 'secondary.main',
                    mx: 'auto',
                    fontSize: '1.5rem',
                    fontWeight: 800,
                  }}
                >
                  {avatarLetter}
                </Avatar>
                <Typography variant="subtitle1" fontWeight={700}>
                  {displayName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {userEmail}
                </Typography>
              </Stack>
            </Paper>

            {/* Error Message */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Password Form */}
            <form onSubmit={handleUnlock}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading || unlocked}
                  autoFocus
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                  slotProps={{
                    input: {
                      'aria-label': 'Enter password to unlock',
                    },
                  }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleUnlock}
                  disabled={loading || unlocked || !password}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 700,
                    textTransform: 'none',
                    position: 'relative',
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  ) : unlocked ? (
                    'Unlocking...'
                  ) : (
                    'Unlock'
                  )}
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<LogoutOutlined />}
                  onClick={handleSignOut}
                  disabled={loading}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 700,
                    textTransform: 'none',
                    color: 'error.main',
                    borderColor: 'error.main',
                    '&:hover': {
                      borderColor: 'error.dark',
                      bgcolor: 'error.light',
                    },
                  }}
                >
                  Sign Out
                </Button>
              </Stack>
            </form>

            {/* Keyboard Hints */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 3 }}
            >
              <strong>Keyboard:</strong> Enter to unlock · Esc to sign out
            </Typography>
          </Paper>
        </Container>
      </Box>
    </Fade>
  );
};

export default LockScreenPage;
