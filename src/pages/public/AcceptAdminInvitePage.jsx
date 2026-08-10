import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Alert, CircularProgress, Stack, Card
} from '@mui/material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ShieldIcon from '@mui/icons-material/Shield';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import superAdminApi from '../../services/superAdminApi';

export default function AcceptAdminInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [inviteData, setInviteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Missing invitation token.");
      setLoading(false);
      return;
    }

    superAdminApi.validateInvitationToken(token)
      .then((res) => setInviteData(res))
      .catch((err) => {
        console.error("Token validation error:", err);
        setError(err.response?.data?.message || "Invalid or expired invitation token.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setSubmitLoading(true);
    try {
      await superAdminApi.acceptInvitation(token, password, firstName, lastName);
      setSuccess(true);
    } catch (err) {
      console.error("Accept Invitation Failed:", err);
      alert(err.response?.data?.message || "Failed to setup admin account.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#0B0F19' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#0B0F19', p: 2 }}>
      <Card sx={{ maxWidth: 460, width: '100%', p: 4, borderRadius: 4, bgcolor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' }}>
        <Stack spacing={3} alignItems="center" textAlign="center">
          <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldIcon sx={{ fontSize: 32, color: '#FFFFFF' }} />
          </Box>

          <Box>
            <Typography variant="h5" fontWeight={900}>
              Setup Admin Account
            </Typography>
            <Typography variant="caption" color="#94A3B8">
              VyaparSathi Enterprise SaaS Control Center
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}

          {success ? (
            <Stack spacing={2} alignItems="center">
              <CheckCircleIcon sx={{ fontSize: 56, color: '#34D399' }} />
              <Typography variant="h6" fontWeight={800} color="#34D399">
                Account Created Successfully!
              </Typography>
              <Typography variant="body2" color="#94A3B8">
                Your platform operator account is now active.
              </Typography>
              <Button variant="contained" onClick={() => navigate('/login')} fullWidth sx={{ mt: 2, borderRadius: 2 }}>
                Go to Login Page
              </Button>
            </Stack>
          ) : inviteData ? (
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <Stack spacing={2}>
                <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#0B0F19', border: '1px solid #334155', borderRadius: 2 }}>
                  <Typography variant="caption" color="#94A3B8">ASSIGNED EMAIL:</Typography>
                  <Typography variant="body2" fontWeight={800}>{inviteData.email}</Typography>
                  <Typography variant="caption" color="#94A3B8" sx={{ display: 'block', mt: 0.5 }}>ROLE: {inviteData.role}</Typography>
                </Paper>

                <Stack direction="row" spacing={2}>
                  <TextField
                    label="First Name"
                    required
                    fullWidth
                    size="small"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    InputLabelProps={{ style: { color: '#94A3B8' } }}
                    InputProps={{ style: { color: '#FFF' } }}
                  />
                  <TextField
                    label="Last Name"
                    required
                    fullWidth
                    size="small"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    InputLabelProps={{ style: { color: '#94A3B8' } }}
                    InputProps={{ style: { color: '#FFF' } }}
                  />
                </Stack>

                <TextField
                  label="Master Password"
                  type="password"
                  required
                  fullWidth
                  size="small"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputLabelProps={{ style: { color: '#94A3B8' } }}
                  InputProps={{ style: { color: '#FFF' } }}
                />

                <TextField
                  label="Confirm Password"
                  type="password"
                  required
                  fullWidth
                  size="small"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  InputLabelProps={{ style: { color: '#94A3B8' } }}
                  InputProps={{ style: { color: '#FFF' } }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={submitLoading || !password || password !== confirmPassword}
                  sx={{ mt: 1, py: 1.2, borderRadius: 2, fontWeight: 900 }}
                >
                  {submitLoading ? <CircularProgress size={24} /> : 'Complete Account Setup'}
                </Button>
              </Stack>
            </Box>
          ) : null}
        </Stack>
      </Card>
    </Box>
  );
}
