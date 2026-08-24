import React, { useState } from 'react';
import {
  Box, Container, Typography, Paper, Tabs, Tab, Stack, Avatar, Button,
  TextField, Divider, Card, CardContent, Alert, CircularProgress, useTheme,
} from '@mui/material';
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Lock as LockIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import TwoFactorAuthenticationPage from './security/TwoFactorAuthenticationPage';

const UserProfile = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || user?.sub || '',
    phone: user?.phone || '',
  });
  const [saving, setSaving] = useState(false);

  const displayName = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // TODO: Call API to save profile data
      // await updateUserProfile(profileData);
      // For now, just simulate save
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, py: { xs: 3, md: 6 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="md">
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate(-1)}
            sx={{ textTransform: 'none' }}
          >
            Back
          </Button>
        </Stack>

        {/* Profile Header Card */}
        <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'center', sm: 'flex-start' }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                fontSize: '2rem',
                fontWeight: 700,
              }}
            >
              {avatarLetter}
            </Avatar>

            <Stack sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={900} gutterBottom>
                {displayName || 'User Profile'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {profileData.email}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant={isEditing ? 'contained' : 'outlined'}
                  startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
                  onClick={() => {
                    if (isEditing) {
                      handleSaveProfile();
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  disabled={saving}
                >
                  {isEditing ? (saving ? 'Saving...' : 'Save Changes') : 'Edit Profile'}
                </Button>
                {isEditing && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setIsEditing(false);
                      setProfileData({
                        firstName: user?.firstName || '',
                        lastName: user?.lastName || '',
                        email: user?.email || user?.sub || '',
                        phone: user?.phone || '',
                      });
                    }}
                  >
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
            onChange={handleTabChange}
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'action.hover',
            }}
          >
            <Tab
              label="Profile Information"
              icon={<PersonIcon />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
            <Tab
              label="Security Settings"
              icon={<SecurityIcon />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
          </Tabs>

          {/* Profile Tab */}
          {activeTab === 0 && (
            <Box sx={{ p: 4 }}>
              <Stack spacing={3}>
                <Typography variant="h6" fontWeight={700}>
                  Personal Information
                </Typography>

                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={profileData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    disabled={!isEditing}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={profileData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    disabled={!isEditing}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={profileData.email}
                    disabled
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="Phone (Optional)"
                    value={profileData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    size="small"
                  />
                </Stack>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                    Account Information
                  </Typography>
                  <Card elevation={0} sx={{ bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
                    <CardContent>
                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            User ID:
                          </Typography>
                          <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                            {user?.sub || 'N/A'}
                          </Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Role:
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {user?.role || 'User'}
                          </Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Shop ID:
                          </Typography>
                          <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                            {user?.shopId || 'N/A'}
                          </Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Account Created:
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                    Security
                  </Typography>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      cursor: 'pointer',
                      transition: 'all 200ms',
                      '&:hover': { borderColor: 'primary.main', boxShadow: 2 },
                    }}
                    onClick={() => navigate('/account/security/change-password')}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 48, height: 48 }}>
                          <LockIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700}>
                            Change Password
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Update your account password
                          </Typography>
                        </Box>
                      </Stack>
                      <ArrowForwardIcon sx={{ color: 'primary.main' }} />
                    </CardContent>
                  </Card>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Security Tab */}
          {activeTab === 1 && (
            <Box sx={{ p: 4 }}>
              <TwoFactorAuthenticationPage embedded />
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default UserProfile;
