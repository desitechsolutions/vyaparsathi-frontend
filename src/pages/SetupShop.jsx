import React, { useState } from 'react';
import {
  TextField,
  Button,
  Paper,
  Typography,
  Box,
  Alert,
  MenuItem,
  CircularProgress,
  Grid,
  InputAdornment,
} from '@mui/material';
import { styled } from '@mui/system';
import { useNavigate } from 'react-router-dom';
import { setupShop } from '../services/api';

import StorefrontIcon from '@mui/icons-material/Storefront';
import PersonIcon from '@mui/icons-material/Person';
import PlaceIcon from '@mui/icons-material/Place';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import NumbersIcon from '@mui/icons-material/Numbers';
import LanguageIcon from '@mui/icons-material/Language';

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh'
];

const LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'gu', label: 'Gujarati' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'kn', label: 'Kannada' },
];

const FormContainer = styled(Box)({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(45deg, #f0f2f5 30%, #e9ebee 90%)',
});

const StyledPaper = styled(Paper)({
  padding: '2.5rem',
  minWidth: 350,
  maxWidth: 500,
  width: '100%',
  borderRadius: '12px',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  backdropFilter: 'blur(4px)',
});

const SetupShop = () => {
  const [form, setForm] = useState({
    name: '',
    ownerName: '',
    address: '',
    state: '',
    gstin: '',
    code: '',
    locale: 'en'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setTouched({ ...touched, [name]: true });
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        return value.trim() ? '' : "Shop name is required.";
      case 'state':
        return value.trim() ? '' : "State is required.";
      case 'code':
        return /^[a-zA-Z0-9]+$/.test(value) ? '' : "Shop code must be alphanumeric.";
      case 'gstin':
        if (value && value.length > 0 && !/^[0-9a-zA-Z]{15}$/.test(value)) {
          return "GSTIN must be 15 alphanumeric characters.";
        }
        return '';
      default:
        return '';
    }
  };

  const validateForm = () => {
    const newTouched = {};
    Object.keys(form).forEach(key => newTouched[key] = true);
    setTouched(newTouched);

    const errors = Object.keys(form).map(key => validateField(key, form[key])).filter(Boolean);
    if (errors.length > 0) {
      setError(errors[0]);
      return false;
    }
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await setupShop(form);
      setSuccess('Shop setup complete! Redirecting to dashboard...');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to setup shop. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormContainer>
      <StyledPaper>
        <Typography variant="h4" align="center" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
          Welcome to Vyaparsathi!
        </Typography>
        <Typography variant="subtitle1" align="center" sx={{ mb: 3, color: 'text.secondary' }}>
          Let's set up your shop to get started.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <form onSubmit={handleSubmit} autoComplete="off">
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Shop Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                fullWidth
                required
                error={!!touched.name && !!validateField('name', form.name)}
                helperText={touched.name && validateField('name', form.name)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <StorefrontIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Shop Code"
                name="code"
                value={form.code}
                onChange={handleChange}
                fullWidth
                required
                error={!!touched.code && !!validateField('code', form.code)}
                helperText={touched.code && validateField('code', form.code)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <NumbersIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Owner Name"
                name="ownerName"
                value={form.ownerName}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="GSTIN"
                name="gstin"
                value={form.gstin}
                onChange={handleChange}
                fullWidth
                error={!!touched.gstin && !!validateField('gstin', form.gstin)}
                helperText={touched.gstin && validateField('gstin', form.gstin)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FingerprintIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address"
                name="address"
                value={form.address}
                onChange={handleChange}
                fullWidth
                multiline
                minRows={2}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PlaceIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="State"
                name="state"
                value={form.state}
                onChange={handleChange}
                fullWidth
                required
                error={!!touched.state && !!validateField('state', form.state)}
                helperText={touched.state && validateField('state', form.state)}
              >
                {STATES.map(state => (
                  <MenuItem key={state} value={state}>{state}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Preferred Language"
                name="locale"
                value={form.locale}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LanguageIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              >
                {LOCALES.map(locale => (
                  <MenuItem key={locale.value} value={locale.value}>{locale.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={isLoading}
            sx={{
              mt: 3,
              fontWeight: 'bold',
              letterSpacing: 1,
              py: 1.2,
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.01)' }
            }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Save & Continue'}
          </Button>
        </form>
      </StyledPaper>
    </FormContainer>
  );
};

export default SetupShop;