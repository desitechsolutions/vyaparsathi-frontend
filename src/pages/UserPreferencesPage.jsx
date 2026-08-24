import React, { useState } from 'react';
import {
  Box, Container, Typography, Paper, Grid, Stack, Switch, FormControlLabel,
  MenuItem, Select, FormControl, InputLabel, Button, Divider, Avatar, Alert,
  useTheme,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  ArrowBack as BackIcon,
  Language as LanguageIcon,
  Notifications as NotificationsIcon,
  BrightnessHigh,
  DarkMode,
  BrightnessAuto,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useThemeContext } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const UserPreferencesPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { colorPreference, cycleColorPreference } = useThemeContext();

  const [preferences, setPreferences] = useState({
    language: i18n.language || 'en',
    theme: colorPreference || 'auto',
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    lowStockAlerts: true,
    salesReminders: true,
    monthlyReports: true,
    autoSave: true,
    twentyFourHourFormat: false,
  });

  const [saved, setSaved] = useState(false);

  const handlePreferenceChange = (key, value) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSaved(false);
  };

  const handleSave = () => {
    // Save to localStorage and/or backend
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: <BrightnessHigh /> },
    { value: 'dark', label: 'Dark', icon: <DarkMode /> },
    { value: 'auto', label: 'Auto (System)', icon: <BrightnessAuto /> },
  ];

  const languageOptions = [
    { value: 'en', label: '🇺🇸 English' },
    { value: 'hi', label: '🇮🇳 हिन्दी' },
  ];

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

        {/* Title */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'primary.main',
              mx: 'auto',
              mb: 2,
            }}
          >
            <SettingsIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h4" fontWeight={900} gutterBottom>
            User Preferences
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Customize your experience and notification settings
          </Typography>
        </Box>

        {/* Saved Confirmation */}
        {saved && (
          <Alert severity="success" sx={{ mb: 4 }}>
            ✓ Your preferences have been saved successfully.
          </Alert>
        )}

        {/* Appearance Settings */}
        <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
            Appearance
          </Typography>

          {/* Language */}
          <Stack spacing={3}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <LanguageIcon sx={{ color: 'primary.main' }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Language
                </Typography>
              </Stack>
              <FormControl fullWidth size="small">
                <Select
                  value={preferences.language}
                  onChange={(e) => {
                    handlePreferenceChange('language', e.target.value);
                    i18n.changeLanguage(e.target.value);
                    localStorage.setItem('language', e.target.value);
                  }}
                  sx={{ borderRadius: 1 }}
                >
                  {languageOptions.map((lang) => (
                    <MenuItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Choose your preferred language for the interface
              </Typography>
            </Box>

            <Divider />

            {/* Theme */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <BrightnessHigh sx={{ color: 'primary.main' }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Theme
                </Typography>
              </Stack>
              <Grid container spacing={2}>
                {themeOptions.map((option) => (
                  <Grid item xs={6} sm={4} key={option.value}>
                    <Paper
                      elevation={preferences.theme === option.value ? 2 : 0}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        cursor: 'pointer',
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: preferences.theme === option.value ? 'primary.main' : 'divider',
                        transition: 'all 200ms',
                        '&:hover': {
                          borderColor: 'primary.main',
                        },
                      }}
                      onClick={() => handlePreferenceChange('theme', option.value)}
                    >
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: 'primary.light',
                          color: 'primary.main',
                          mx: 'auto',
                          mb: 1,
                        }}
                      >
                        {option.icon}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>
                        {option.label}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                Choose how the interface appears. "Auto" follows your system settings.
              </Typography>
            </Box>

            <Divider />

            {/* Time Format */}
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.twentyFourHourFormat}
                  onChange={(e) => handlePreferenceChange('twentyFourHourFormat', e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    24-Hour Time Format
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Show times as 14:30 instead of 2:30 PM
                  </Typography>
                </Box>
              }
            />
          </Stack>
        </Paper>

        {/* Notification Settings */}
        <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
            Notifications
          </Typography>

          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.emailNotifications}
                  onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Email Notifications
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Receive important updates via email
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.pushNotifications}
                  onChange={(e) => handlePreferenceChange('pushNotifications', e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Push Notifications
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Get instant alerts on your device
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.smsNotifications}
                  onChange={(e) => handlePreferenceChange('smsNotifications', e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    SMS Notifications
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Receive critical alerts via SMS
                  </Typography>
                </Box>
              }
            />

            <Divider />

            <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 2 }}>
              Alert Types
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.lowStockAlerts}
                  onChange={(e) => handlePreferenceChange('lowStockAlerts', e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Low Stock Alerts
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Notified when inventory runs low
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.salesReminders}
                  onChange={(e) => handlePreferenceChange('salesReminders', e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Sales Reminders
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Daily summary of sales activity
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.monthlyReports}
                  onChange={(e) => handlePreferenceChange('monthlyReports', e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Monthly Reports
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Receive monthly business insights
                  </Typography>
                </Box>
              }
            />
          </Stack>
        </Paper>

        {/* Behavior Settings */}
        <Paper elevation={0} sx={{ p: 4, mb: 6, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
            Behavior
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={preferences.autoSave}
                onChange={(e) => handlePreferenceChange('autoSave', e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  Auto-Save
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Automatically save changes as you work
                </Typography>
              </Box>
            }
          />
        </Paper>

        {/* Save Button */}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave}>
            Save Preferences
          </Button>
        </Stack>
      </Container>
    </Box>
  );
};

export default UserPreferencesPage;
