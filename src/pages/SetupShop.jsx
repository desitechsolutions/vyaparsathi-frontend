import React, { useState, useRef } from 'react';
import {
  TextField, Button, Paper, Typography, Box, Alert, MenuItem,
  CircularProgress, Grid, InputAdornment, Fade, Stepper, Step, 
  StepLabel, IconButton, Tooltip, Stack, Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { setupShop } from '../services/api';
import { useAuthContext } from '../context/AuthContext';
import useShopConfig from '../hooks/useShopConfig';

// Icons
import StorefrontIcon from '@mui/icons-material/Storefront';
import PersonIcon from '@mui/icons-material/Person';
import PlaceIcon from '@mui/icons-material/Place';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import NumbersIcon from '@mui/icons-material/Numbers';
import LanguageIcon from '@mui/icons-material/Language';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh'
];

const LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { value: 'ta', label: 'தமிழ் (Tamil)' },
  { value: 'te', label: 'తెలుగు (Telugu)' },
  { value: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
];

const SetupShop = () => {
  const { logout } = useAuthContext();
  const navigate = useNavigate();
  const { refetchShop } = useShopConfig();
  const fileInputRef = useRef(null);

  const [activeStep, setActiveStep] = useState(0);
  const [logoPreview, setLogoPreview] = useState(null);
  const [form, setForm] = useState({
    name: '',
    ownerName: '',
    address: '',
    state: '',
    gstin: '',
    code: '',
    locale: 'en',
    logo: null,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  const steps = ['Shop Basics', 'Branding', 'More Info'];

  const validateStep = () => {
    const newErrors = {};
    if (activeStep === 0) {
      if (!form.name.trim()) newErrors.name = 'Required';
      if (!form.code.trim()) newErrors.code = 'Required';
    }
    if (activeStep === 2 && !form.state) {
      newErrors.state = 'Required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrors({ logo: 'Max 2MB allowed' });
      return;
    }

    setForm(prev => ({ ...prev, logo: file }));
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
    setErrors(prev => ({ ...prev, logo: '' }));
  };

  const removeLogo = () => {
    setForm(prev => ({ ...prev, logo: null }));
    setLogoPreview(null);
  };

  const handleNext = () => {
    if (validateStep()) setActiveStep(prev => prev + 1);
  };

  const handleBack = () => setActiveStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    setIsLoading(true);
    setErrors({});

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== '') formData.append(key, value);
    });

    try {
      await setupShop(formData);
      await refetchShop();
      setSetupComplete(true);
      setTimeout(() => navigate('/', { replace: true }), 1600);
    } catch (err) {
      setErrors({ submit: err?.response?.data?.message || 'Setup failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Fade in timeout={600}>
      <Paper
        elevation={4}
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          maxWidth: 680,
          mx: 'auto',
          mt: { xs: 3, md: 5 },
          mb: 6,
          bgcolor: 'background.paper',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
      >
        {/* Header with Logout */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={800} color="primary.main">
              Shop Onboarding
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Let's get your business set up quickly
            </Typography>
          </Box>

          <Tooltip title="Sign out and return to login" arrow placement="left">
            <IconButton 
              size="small" 
              color="inherit" 
              onClick={() => logout()}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Compact Stepper */}
        <Stepper 
          activeStep={activeStep} 
          alternativeLabel 
          sx={{ mb: 3 }}
        >
          {steps.map(label => (
            <Step key={label}>
              <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.85rem', fontWeight: 600 } }}>
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {setupComplete ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" fontWeight={700} color="success.main">
              Setup Complete!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Taking you to the dashboard...
            </Typography>
            <CircularProgress size={32} sx={{ mt: 3 }} />
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            {errors.submit && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontSize: '0.9rem' }}>
                {errors.submit}
              </Alert>
            )}

            {/* Step 1 */}
            {activeStep === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    size="small"
                    label="Shop Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    fullWidth
                    required
                    error={!!errors.name}
                    helperText={errors.name}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><StorefrontIcon fontSize="small" color="primary" /></InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    size="small"
                    label="Shop Code"
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    fullWidth
                    required
                    error={!!errors.code}
                    helperText={errors.code || "Used for identification"}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><NumbersIcon fontSize="small" color="primary" /></InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    size="small"
                    label="Owner Name"
                    name="ownerName"
                    value={form.ownerName}
                    onChange={handleChange}
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" color="primary" /></InputAdornment>,
                    }}
                  />
                </Grid>

                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    size="medium"
                    onClick={handleNext}
                    disabled={!form.name.trim() || !form.code.trim()}
                    endIcon={<ChevronRightIcon />}
                  >
                    Next
                  </Button>
                </Grid>
              </Grid>
            )}

            {/* Step 2 - Branding */}
            {activeStep === 1 && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Shop Logo (Optional)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  Will appear on bills & dashboard
                </Typography>

                <Stack alignItems="center" spacing={2}>
                  <Avatar
                    src={logoPreview}
                    sx={{
                      width: 90,
                      height: 90,
                      border: '2px solid',
                      borderColor: logoPreview ? 'primary.main' : 'grey.300',
                      bgcolor: 'grey.100',
                    }}
                  >
                    {!logoPreview && <StorefrontIcon sx={{ fontSize: 40, color: 'text.disabled' }} />}
                  </Avatar>

                  <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleLogoChange} />

                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<CloudUploadIcon fontSize="small" />}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {logoPreview ? 'Change' : 'Upload'}
                    </Button>

                    {logoPreview && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<DeleteIcon fontSize="small" />}
                        onClick={removeLogo}
                      >
                        Remove
                      </Button>
                    )}
                  </Stack>

                  <Stack direction="row" spacing={3} sx={{ mt: 3, width: '100%', justifyContent: 'space-between' }}>
                    <Button variant="outlined" size="medium" onClick={handleBack} startIcon={<ChevronLeftIcon />}>
                      Back
                    </Button>
                    <Button variant="contained" size="medium" onClick={handleNext}>
                      Continue
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            )}

            {/* Step 3 */}
            {activeStep === 2 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    size="small"
                    label="GSTIN (Optional)"
                    name="gstin"
                    value={form.gstin}
                    onChange={handleChange}
                    fullWidth
                    placeholder="22AAAAA0000A1Z5"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><FingerprintIcon fontSize="small" color="primary" /></InputAdornment>,
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    size="small"
                    select
                    label="State"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    fullWidth
                    required
                    error={!!errors.state}
                    helperText={errors.state}
                  >
                    {STATES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    size="small"
                    label="Shop Address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={2}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><PlaceIcon fontSize="small" color="primary" /></InputAdornment>,
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    size="small"
                    select
                    label="Language"
                    name="locale"
                    value={form.locale}
                    onChange={handleChange}
                    fullWidth
                    helperText="App default language"
                  >
                    {LOCALES.map(l => (
                      <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mt: 3 }}>
                    <Button
                      variant="outlined"
                      size="medium"
                      onClick={handleBack}
                      startIcon={<ChevronLeftIcon />}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      size="medium"
                      disabled={isLoading || !form.state}
                      sx={{ minWidth: 140 }}
                    >
                      {isLoading ? <CircularProgress size={22} /> : 'Finish Setup'}
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            )}
          </form>
        )}
      </Paper>
    </Fade>
  );
};

export default SetupShop;