import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Stack, Switch, Button, TextField, CircularProgress,
  Snackbar, Alert, Typography, Divider, FormControlLabel
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import * as api from '../../services/api';

export default function ESSPreferences() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => { fetchPreferences(); }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const res = await api.getEssPreferences();
      setPreferences(res || {
        emailNotifications: true,
        whatsappNotifications: false,
        smsNotifications: false,
        autoTaxCalculation: true,
        payslipFormat: 'PDF',
        language: 'en'
      });
    } catch (err) {
      showToast('Failed to load preferences', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, severity = 'success') =>
    setToast({ open: true, message, severity });

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      await api.updateEssPreferences(preferences);
      showToast('Preferences saved successfully');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (field) => {
    setPreferences({ ...preferences, [field]: !preferences[field] });
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
      <CircularProgress />
    </Box>
  );

  if (!preferences) return null;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>ESS Preferences</Typography>

      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity} sx={{ width: '100%' }}>{toast.message}</Alert>
      </Snackbar>

      <Stack spacing={3}>
        {/* Notification Preferences */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Notification Preferences
            </Typography>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.emailNotifications}
                    onChange={() => handleToggle('emailNotifications')}
                  />
                }
                label="Email Notifications"
                labelPlacement="end"
              />
              <Typography variant="caption" color="text.secondary">
                Receive payslips and important updates via email
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.whatsappNotifications}
                    onChange={() => handleToggle('whatsappNotifications')}
                  />
                }
                label="WhatsApp Notifications"
                labelPlacement="end"
              />
              <Typography variant="caption" color="text.secondary">
                Get payslip alerts via WhatsApp
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.smsNotifications}
                    onChange={() => handleToggle('smsNotifications')}
                  />
                }
                label="SMS Notifications"
                labelPlacement="end"
              />
              <Typography variant="caption" color="text.secondary">
                Important alerts via SMS (charges may apply)
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* Payroll Preferences */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Payroll Settings
            </Typography>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.autoTaxCalculation}
                    onChange={() => handleToggle('autoTaxCalculation')}
                  />
                }
                label="Auto Tax Calculation"
                labelPlacement="end"
              />
              <Typography variant="caption" color="text.secondary">
                Allow automatic TDS/tax calculation based on tax regime
              </Typography>

              <TextField
                select
                label="Payslip Format"
                value={preferences.payslipFormat || 'PDF'}
                onChange={(e) => setPreferences({ ...preferences, payslipFormat: e.target.value })}
                fullWidth
                SelectProps={{
                  native: true,
                }}
              >
                <option value="PDF">PDF</option>
                <option value="EXCEL">Excel</option>
                <option value="JSON">JSON</option>
              </TextField>
            </Stack>
          </CardContent>
        </Card>

        {/* Language Preference */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Language & Locale
            </Typography>
            <TextField
              select
              label="Language"
              value={preferences.language || 'en'}
              onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
              fullWidth
              SelectProps={{
                native: true,
              }}
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
            </TextField>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={() => fetchPreferences()}>
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSavePreferences}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
