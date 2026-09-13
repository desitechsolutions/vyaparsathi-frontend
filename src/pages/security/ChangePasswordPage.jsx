import React, { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Stack, Typography, Alert,
  CircularProgress, InputAdornment, IconButton, Divider, Paper,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';

const ChangePasswordPage = ({ embedded = false }) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('One number');
    if (!/[!@#$%^&*]/.test(password)) errors.push('One special character (!@#$%^&*)');
    return errors;
  };

  const passwordErrors = newPassword ? validatePassword(newPassword) : [];
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const isValid = !passwordErrors.length && passwordsMatch && currentPassword && newPassword;

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isValid) {
      setError('Please fix all validation errors');
      return;
    }

    setLoading(true);
    try {
      // TODO: Call API to change password
      // const response = await API.post('/api/auth/change-password', {
      //   currentPassword,
      //   newPassword,
      // });

      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password. Please check your current password and try again.');
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          Current Password
        </Typography>
        <TextField
          fullWidth
          type={showCurrentPassword ? 'text' : 'password'}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={loading}
          size="small"
          placeholder="Enter your current password"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  edge="end"
                >
                  {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          New Password
        </Typography>
        <TextField
          fullWidth
          type={showNewPassword ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={loading}
          size="small"
          placeholder="Enter a new password"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  edge="end"
                >
                  {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        {newPassword && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 1 }}>
              Password must contain:
            </Typography>
            <Stack spacing={0.5}>
              {[
                { check: newPassword.length >= 8, text: '8+ characters' },
                { check: /[A-Z]/.test(newPassword), text: 'Uppercase letter (A-Z)' },
                { check: /[a-z]/.test(newPassword), text: 'Lowercase letter (a-z)' },
                { check: /[0-9]/.test(newPassword), text: 'Number (0-9)' },
                { check: /[!@#$%^&*]/.test(newPassword), text: 'Special character (!@#$%^&*)' },
              ].map((req, idx) => (
                <Typography
                  key={idx}
                  variant="caption"
                  sx={{
                    color: req.check ? 'success.main' : 'text.secondary',
                    textDecoration: req.check ? 'line-through' : 'none',
                  }}
                >
                  ✓ {req.text}
                </Typography>
              ))}
            </Stack>
          </Box>
        )}
      </Box>

      <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          Confirm Password
        </Typography>
        <TextField
          fullWidth
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
          size="small"
          placeholder="Re-enter your new password"
          error={confirmPassword && !passwordsMatch}
          helperText={confirmPassword && !passwordsMatch ? 'Passwords do not match' : ''}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  edge="end"
                >
                  {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        {confirmPassword && passwordsMatch && (
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'success.main', fontWeight: 600 }}>
            ✓ Passwords match
          </Typography>
        )}
      </Box>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          onClick={handleChangePassword}
          disabled={!isValid || loading}
          fullWidth
          startIcon={loading ? <CircularProgress size={20} /> : <LockIcon />}
        >
          {loading ? 'Changing Password...' : 'Change Password'}
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ p: 2, bgcolor: 'info.light', border: '1px solid', borderColor: 'info.main', borderRadius: 1 }}>
        <Typography variant="body2" color="info.dark">
          <strong>💡 Security Tip:</strong> Choose a strong, unique password. Never share it with anyone, including support staff.
        </Typography>
      </Paper>
    </Stack>
  );

  if (embedded) {
    return content;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 500, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(-1)}
          sx={{ textTransform: 'none' }}
        >
          Back
        </Button>
      </Stack>
      <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            Change Password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Update your password to keep your account secure
          </Typography>
          <Divider sx={{ mb: 3 }} />
          {content}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChangePasswordPage;
