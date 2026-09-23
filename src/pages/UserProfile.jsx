import React, { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Google as GoogleIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Save as SaveIcon,
  Security as SecurityIcon,
  ShieldOutlined as ShieldIcon,
  Devices as DevicesIcon,
  ArrowForward as ArrowForwardIcon,
  Mail as MailIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { fetchMyProfile, updateMyProfile } from '../services/api';
import TwoFactorAuthenticationPage from './security/TwoFactorAuthenticationPage';

const UserProfile = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user: jwtUser } = useAuthContext();

  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Full profile from the server (includes authProvider, email, phone, etc.)
  const [profile, setProfile] = useState(null);

  // Editable form state, kept separate so Cancel works properly
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Load full profile on mount (and after save)
  useEffect(() => {
    let cancelled = false;
    setProfileLoading(true);
    fetchMyProfile()
      .then((res) => {
        if (cancelled) return;
        const data = res.data;
        setProfile(data);
        setForm({ firstName: data.firstName || '', lastName: data.lastName || '', phone: data.phone || '' });
      })
      .catch(() => {
        if (cancelled) return;
        // Fall back to JWT claims if the API fails
        setProfile({
          username: jwtUser?.sub || '',
          email:    jwtUser?.email || jwtUser?.sub || '',
          firstName: jwtUser?.firstName || '',
          lastName:  jwtUser?.lastName  || '',
          phone: '',
          role: jwtUser?.role || 'User',
          authProvider: jwtUser?.authProvider || 'LOCAL',
          emailVerified: false,
          lastLoginAt: null,
          lastPasswordChangeAt: null,
        });
        setForm({
          firstName: jwtUser?.firstName || '',
          lastName:  jwtUser?.lastName  || '',
          phone: '',
        });
      })
      .finally(() => { if (!cancelled) setProfileLoading(false); });
    return () => { cancelled = true; };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const isOAuthUser = profile?.authProvider && profile.authProvider !== 'LOCAL';
  const displayName = `${form.firstName} ${form.lastName}`.trim() || profile?.username || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await updateMyProfile({
        firstName: form.firstName.trim() || null,
        lastName:  form.lastName.trim()  || null,
        phone:     form.phone.trim()     || null,
      });
      setProfile(res.data);
      setIsEditing(false);
      setSnackbar({ open: true, message: 'Profile updated.', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Could not save profile.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setForm({ firstName: profile?.firstName || '', lastName: profile?.lastName || '', phone: profile?.phone || '' });
  };

  return (
    <Box sx={{ flexGrow: 1, py: { xs: 3, md: 6 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="md">

        {/* Back */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <Button startIcon={<BackIcon />} onClick={() => navigate(-1)} sx={{ textTransform: 'none' }}>
            Back
          </Button>
        </Stack>

        {/* Profile header */}
        <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'center', sm: 'flex-start' }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem', fontWeight: 700 }}>
              {profileLoading ? '…' : avatarLetter}
            </Avatar>

            <Stack sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mb: 0.5 }}>
                <Typography variant="h5" fontWeight={900}>
                  {profileLoading ? '…' : displayName}
                </Typography>
                {/* Auth-provider badge */}
                {!profileLoading && isOAuthUser && (
                  <Chip
                    size="small"
                    icon={<GoogleIcon sx={{ fontSize: '1rem !important' }} />}
                    label="Google account"
                    variant="outlined"
                    sx={{ fontWeight: 600, borderColor: '#4285F4', color: '#4285F4', fontSize: '0.72rem' }}
                  />
                )}
                {!profileLoading && !isOAuthUser && profile?.emailVerified && (
                  <Chip size="small" label="Verified" color="success" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.72rem' }} />
                )}
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {profile?.email || ''}
              </Typography>

              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant={isEditing ? 'contained' : 'outlined'}
                  startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
                  onClick={() => { if (isEditing) handleSaveProfile(); else setIsEditing(true); }}
                  disabled={saving || profileLoading}
                  sx={{ textTransform: 'none' }}
                >
                  {isEditing ? (saving ? 'Saving…' : 'Save changes') : 'Edit profile'}
                </Button>
                {isEditing && (
                  <Button size="small" variant="outlined" onClick={handleCancelEdit} sx={{ textTransform: 'none' }}>
                    Cancel
                  </Button>
                )}
              </Stack>
            </Stack>
          </Stack>
        </Paper>

        {/* Tabs */}
        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}
          >
            <Tab label="Profile" icon={<PersonIcon />} iconPosition="start" sx={{ textTransform: 'none', fontWeight: 600 }} />
            <Tab label="Security" icon={<SecurityIcon />} iconPosition="start" sx={{ textTransform: 'none', fontWeight: 600 }} />
          </Tabs>

          {/* ── Profile Tab ── */}
          {activeTab === 0 && (
            <Box sx={{ p: { xs: 2, sm: 4 } }}>
              {profileLoading ? (
                <Stack alignItems="center" py={4}><CircularProgress /></Stack>
              ) : (
                <Stack spacing={3}>
                  {/* Personal info */}
                  <Typography variant="h6" fontWeight={700}>Personal information</Typography>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      fullWidth label="First name" size="small"
                      value={form.firstName}
                      onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                      disabled={!isEditing}
                    />
                    <TextField
                      fullWidth label="Last name" size="small"
                      value={form.lastName}
                      onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </Stack>

                  <TextField
                    fullWidth label="Email" type="email" size="small"
                    value={profile?.email || ''}
                    disabled
                    helperText="Email address cannot be changed here."
                  />

                  <TextField
                    fullWidth label="Phone (optional)" size="small"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    disabled={!isEditing}
                    inputProps={{ maxLength: 20 }}
                  />

                  <Divider />

                  {/* Account info */}
                  <Typography variant="subtitle2" fontWeight={700}>Account information</Typography>
                  <Card elevation={0} sx={{ bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <CardContent>
                      <Stack spacing={1.25}>
                        <InfoRow label="Username"   value={profile?.username} mono />
                        <InfoRow label="Role"        value={profile?.role} />
                        <InfoRow label="Sign-in method" value={
                          isOAuthUser
                            ? `Google (${profile?.email})`
                            : 'Email & password'
                        } />
                        <InfoRow label="Email verified" value={profile?.emailVerified ? 'Yes' : 'No'} />
                        {profile?.lastLoginAt && (
                          <InfoRow label="Last sign-in"
                            value={new Date(profile.lastLoginAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} />
                        )}
                        {!isOAuthUser && profile?.lastPasswordChangeAt && (
                          <InfoRow label="Password last changed"
                            value={new Date(profile.lastPasswordChangeAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} />
                        )}
                      </Stack>
                    </CardContent>
                  </Card>

                  <Divider />

                  {/* Security shortcuts */}
                  <Typography variant="subtitle2" fontWeight={700}>Security</Typography>

                  {/* Change / Set password card — behaviour differs for OAuth vs LOCAL */}
                  {isOAuthUser ? (
                    <Card
                      elevation={0}
                      sx={{ borderRadius: 2, border: '1px solid', borderColor: 'info.main', bgcolor: 'info.light' }}
                    >
                      <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'info.main', color: 'white', width: 44, height: 44, flexShrink: 0 }}>
                          <GoogleIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight={700} color="info.dark">
                            Signed in with Google
                          </Typography>
                          <Typography variant="body2" color="info.dark" sx={{ mt: 0.5 }}>
                            Your account uses Google for authentication — you don't have a VyaparSathi password.
                            To set one (so you can also sign in with email), use <strong>Forgot Password</strong> from the login page.
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<MailIcon />}
                            onClick={() => navigate('/forgot-password')}
                            sx={{ mt: 1.5, textTransform: 'none', fontWeight: 700, borderColor: 'info.main', color: 'info.dark' }}
                          >
                            Set a password via email
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card
                      elevation={0}
                      sx={{
                        borderRadius: 2, border: '1px solid', borderColor: 'divider',
                        cursor: 'pointer', transition: 'all 200ms',
                        '&:hover': { borderColor: 'primary.main', boxShadow: 2 },
                      }}
                      onClick={() => navigate('/account/security/change-password')}
                    >
                      <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                          <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 44, height: 44 }}>
                            <LockIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700}>Change password</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {profile?.lastPasswordChangeAt
                                ? `Last changed ${new Date(profile.lastPasswordChangeAt).toLocaleDateString()}`
                                : 'Keep your account secure with a strong password'}
                            </Typography>
                          </Box>
                        </Stack>
                        <ArrowForwardIcon sx={{ color: 'primary.main' }} />
                      </CardContent>
                    </Card>
                  )}

                  {/* Active sessions shortcut */}
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 2, border: '1px solid', borderColor: 'divider',
                      cursor: 'pointer', transition: 'all 200ms',
                      '&:hover': { borderColor: 'primary.main', boxShadow: 2 },
                    }}
                    onClick={() => navigate('/account/security/sessions')}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                        <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.dark', width: 44, height: 44 }}>
                          <DevicesIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700}>Active sessions</Typography>
                          <Typography variant="caption" color="text.secondary">
                            See and manage where you're signed in
                          </Typography>
                        </Box>
                      </Stack>
                      <ArrowForwardIcon sx={{ color: 'text.secondary' }} />
                    </CardContent>
                  </Card>
                </Stack>
              )}
            </Box>
          )}

          {/* ── Security Tab ── */}
          {activeTab === 1 && (
            <Box sx={{ p: { xs: 2, sm: 4 } }}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>Two-factor authentication</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add a second layer of security to protect your account with an authenticator app.
                  </Typography>
                </Box>
                <TwoFactorAuthenticationPage embedded />

                <Divider />

                <Box>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>Other security options</Typography>
                  <Stack spacing={1.5}>
                    {/* Only show Change Password for non-OAuth users */}
                    {!isOAuthUser && (
                      <Card
                        elevation={0}
                        sx={{
                          borderRadius: 2, border: '1px solid', borderColor: 'divider',
                          cursor: 'pointer', '&:hover': { borderColor: 'primary.main', boxShadow: 1 },
                        }}
                        onClick={() => navigate('/account/security/change-password')}
                      >
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: '12px !important' }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <LockIcon fontSize="small" color="primary" />
                            <Typography variant="body2" fontWeight={600}>Change password</Typography>
                          </Stack>
                          <ArrowForwardIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        </CardContent>
                      </Card>
                    )}

                    <Card
                      elevation={0}
                      sx={{
                        borderRadius: 2, border: '1px solid', borderColor: 'divider',
                        cursor: 'pointer', '&:hover': { borderColor: 'primary.main', boxShadow: 1 },
                      }}
                      onClick={() => navigate('/account/security/sessions')}
                    >
                      <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: '12px !important' }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <DevicesIcon fontSize="small" color="action" />
                          <Typography variant="body2" fontWeight={600}>Active sessions</Typography>
                        </Stack>
                        <ArrowForwardIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      </CardContent>
                    </Card>

                    {isOAuthUser && (
                      <Card
                        elevation={0}
                        sx={{
                          borderRadius: 2, border: '1px solid', borderColor: 'info.light',
                          cursor: 'pointer', '&:hover': { borderColor: 'info.main', boxShadow: 1 },
                        }}
                        onClick={() => navigate('/forgot-password')}
                      >
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: '12px !important' }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <MailIcon fontSize="small" sx={{ color: 'info.main' }} />
                            <Box>
                              <Typography variant="body2" fontWeight={600}>Set a password</Typography>
                              <Typography variant="caption" color="text.secondary">For Google accounts — lets you also sign in with email</Typography>
                            </Box>
                          </Stack>
                          <ArrowForwardIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        </CardContent>
                      </Card>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </Box>
          )}
        </Paper>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Small helper row for the Account Information card
function InfoRow({ label, value, mono = false }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography variant="body2" color="text.secondary">{label}:</Typography>
      <Typography
        variant="body2"
        fontWeight={600}
        sx={mono ? { fontFamily: 'monospace' } : {}}
        noWrap
      >
        {value ?? '—'}
      </Typography>
    </Stack>
  );
}

export default UserProfile;
