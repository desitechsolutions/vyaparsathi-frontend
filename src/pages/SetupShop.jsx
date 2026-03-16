import React, { useState, useRef, useEffect } from 'react';
import {
  TextField, Button, Typography, Box, Alert, MenuItem,
  CircularProgress, Grid, InputAdornment, Fade, Stepper, Step, 
  StepLabel, IconButton, Tooltip, Stack, Avatar, Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { setupShop, checkShopCode } from '../services/api';
import { useAuthContext } from '../context/AuthContext';
import useShopConfig from '../hooks/useShopConfig';

// Icons
import StorefrontIcon from '@mui/icons-material/Storefront';
import PersonIcon from '@mui/icons-material/Person';
import PlaceIcon from '@mui/icons-material/Place';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import NumbersIcon from '@mui/icons-material/Numbers';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CategoryIcon from '@mui/icons-material/Category';
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

const INDUSTRIES = [
  { value: 'AUTOMOBILE', label: 'AUTOMOBILE' },
  { value: 'CLOTHING', label: 'Clothing & Apparel' },
  { value: 'ELECTRONICS', label: 'Electronics & Mobiles' },
  { value: 'FOOTWEAR', label: 'FOOTWEAR' },
  { value: 'FURNITURE', label: 'FURNITURE' },
  { value: 'GROCERY', label: 'GROCERY' },
  { value: 'GENERAL', label: 'General Store / Others' },
  { value: 'HARDWARE', label: 'Hardware & Electricals' },
  { value: 'JEWELLERY', label: 'JEWELLERY' },
  { value: 'PHARMACY', label: 'Medical Pharmacy' },
  { value: 'STATIONERY', label: 'STATIONERY' },
];

const SetupShop = () => {
  const { logout, silentRefresh } = useAuthContext();
  const navigate = useNavigate();
  const { refetchShop } = useShopConfig();
  const fileInputRef = useRef(null);

  const [activeStep, setActiveStep] = useState(0);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    ownerName: '',
    address: '',
    state: '',
    gstin: '',
    code: '',
    industryType: '',
    locale: 'en',
    logo: null,
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  const steps = ['Shop Basics', 'Branding', 'More Info'];

  // --- Auto-Slug Logic (The new feature) ---
  useEffect(() => {
    if (!isCodeManuallyEdited && form.name) {
      const slug = form.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') 
        .replace(/[\s_-]+/g, '-') 
        .replace(/^-+|-+$/g, ''); 
      
      setForm(prev => ({ ...prev, code: slug }));
    }
  }, [form.name, isCodeManuallyEdited]);

  const validateStep = () => {
    const newErrors = {};
    if (activeStep === 0) {
      if (!form.name.trim()) newErrors.name = 'Required';
      if (!form.code.trim()) newErrors.code = 'Required';
      if (!form.industryType) newErrors.industryType = 'Required';
      if (form.code && !/^[a-z0-9-]+$/.test(form.code)) {
        newErrors.code = 'Use lowercase, numbers, and hyphens only';
      }
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
    if (name === 'code') setIsCodeManuallyEdited(true);
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

  const handleNext = async () => {
    if (!validateStep()) return;

    if (activeStep === 0) {
      setIsLoading(true);
      try {
        await checkShopCode(form.code); // The new API check
        setActiveStep((prev) => prev + 1);
        setErrors({});
      } catch (err) {
        setErrors({ code: 'This Shop Code is already taken. Please try another.' });
      } finally {
        setIsLoading(false);
      }
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

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
      if (silentRefresh) {
      await silentRefresh(); 
    }
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
    <Fade in timeout={800}>
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', py: { xs: 2, md: 4 }, px: { xs: 2, md: 6 } }}>
        <Box sx={{ width: '100%', maxWidth: 600 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
            <Box>
              <Typography variant="h4" fontWeight={900} color="primary.main" gutterBottom sx={{ letterSpacing: '-0.5px' }}>
                Shop Onboarding
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Let's get your business set up quickly
              </Typography>
            </Box>
            <Tooltip title="Sign Out" arrow>
              <IconButton onClick={() => logout()} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                <LogoutIcon fontSize="small" color="action" />
              </IconButton>
            </Tooltip>
          </Box>

          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3, '& .MuiStepLabel-label': { fontWeight: 700, fontSize: '0.75rem' } }}>
            {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>

          {setupComplete ? (
            <Paper variant="outlined" sx={{ textAlign: 'center', py: 8, borderRadius: 4, bgcolor: 'rgba(76, 175, 80, 0.04)', borderColor: 'success.light' }}>
              <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" fontWeight={800} gutterBottom>Ready to go!</Typography>
              <Typography variant="body2" color="text.secondary">Your shop has been configured successfully.</Typography>
              <CircularProgress size={24} sx={{ mt: 4 }} />
            </Paper>
          ) : (
            <Box component="form" onSubmit={handleSubmit} noValidate>
              {errors.submit && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{errors.submit}</Alert>}

              {/* Step 1: Basics */}
              {activeStep === 0 && (
                <Grid container spacing={2.5}>
                  <Grid item xs={12}>
                    <TextField label="Shop Name" name="name" value={form.name} onChange={handleChange} fullWidth required error={!!errors.name} helperText={errors.name} InputProps={{ startAdornment: <InputAdornment position="start"><StorefrontIcon color="primary" /></InputAdornment> }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField select label="Industry Type" name="industryType" value={form.industryType} onChange={handleChange} fullWidth required error={!!errors.industryType} helperText={errors.industryType || "Tailors your categories"} InputProps={{ startAdornment: <InputAdornment position="start"><CategoryIcon color="primary" /></InputAdornment> }}>
                      {INDUSTRIES.map(i => <MenuItem key={i.value} value={i.value}>{i.label}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField 
                      label="Shop Slug / Code" 
                      name="code" 
                      value={form.code} 
                      onChange={handleChange} 
                      fullWidth 
                      required 
                      error={!!errors.code} 
                      helperText={errors.code || `URL: vyaparsathi.com/${form.code || 'your-shop'}`} 
                      InputProps={{ 
                        startAdornment: <InputAdornment position="start"><NumbersIcon color="primary" /></InputAdornment>,
                        endAdornment: isLoading && activeStep === 0 && <CircularProgress size={20} />
                      }} 
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Owner Name" name="ownerName" value={form.ownerName} onChange={handleChange} fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon color="primary" /></InputAdornment> }} />
                  </Grid>
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button variant="contained" size="large" onClick={handleNext} disabled={isLoading || !form.name.trim() || !form.code.trim() || !form.industryType} endIcon={<ChevronRightIcon />} sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}>
                      {isLoading ? 'Checking...' : 'Next Step'}
                    </Button>
                  </Grid>
                </Grid>
              )}

              {/* Step 2: Branding */}
              {activeStep === 1 && (
                <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 3, borderStyle: 'dashed', borderWidth: 2 }}>
                  <Typography variant="subtitle1" fontWeight={800} gutterBottom>Upload Store Logo</Typography>
                  <Stack alignItems="center" spacing={3} sx={{ mt: 2 }}>
                    <Avatar src={logoPreview} sx={{ width: 100, height: 100, border: '3px solid', borderColor: 'primary.light', bgcolor: 'grey.50' }}>
                      {!logoPreview && <StorefrontIcon sx={{ fontSize: 40, color: 'text.disabled' }} />}
                    </Avatar>
                    <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleLogoChange} />
                    <Stack direction="row" spacing={2}>
                      <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={() => fileInputRef.current?.click()} sx={{ fontWeight: 700 }}>{logoPreview ? 'Change Logo' : 'Choose Logo'}</Button>
                      {logoPreview && <Button variant="text" color="error" onClick={removeLogo} sx={{ fontWeight: 700 }}>Remove</Button>}
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ width: '100%', pt: 4 }}>
                      <Button variant="text" color="inherit" onClick={handleBack} startIcon={<ChevronLeftIcon />} sx={{ fontWeight: 700 }}>Back</Button>
                      <Box sx={{ flexGrow: 1 }} />
                      <Button variant="contained" size="large" onClick={handleNext} sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}>Continue</Button>
                    </Stack>
                  </Stack>
                </Paper>
              )}

              {/* Step 3: Details */}
              {activeStep === 2 && (
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField label="GSTIN (Optional)" name="gstin" value={form.gstin} onChange={handleChange} fullWidth placeholder="22AAAAA0000A1Z5" InputProps={{ startAdornment: <InputAdornment position="start"><FingerprintIcon color="primary" /></InputAdornment> }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField select label="State" name="state" value={form.state} onChange={handleChange} fullWidth required error={!!errors.state} helperText={errors.state}>
                      {STATES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Shop Address" name="address" value={form.address} onChange={handleChange} fullWidth multiline rows={2} InputProps={{ startAdornment: <InputAdornment position="start"><PlaceIcon color="primary" /></InputAdornment> }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField select label="System Language" name="locale" value={form.locale} onChange={handleChange} fullWidth>
                      {LOCALES.map(l => <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button variant="text" color="inherit" onClick={handleBack} startIcon={<ChevronLeftIcon />} sx={{ fontWeight: 700 }}>Back</Button>
                    <Button type="submit" variant="contained" size="large" onClick={handleSubmit} disabled={isLoading || !form.state} sx={{ borderRadius: 2, px: 6, fontWeight: 700, minWidth: 160 }}>
                      {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Complete Setup'}
                    </Button>
                  </Grid>
                </Grid>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Fade>
  );
};

export default SetupShop;