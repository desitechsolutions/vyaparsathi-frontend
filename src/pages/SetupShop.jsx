import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Fade,
  FormControlLabel,
  Grid,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import API, { setupShop, checkShopCode, fetchIndustries } from '../services/api';
import { useAuthContext } from '../context/AuthContext';
import useShopConfig from '../hooks/useShopConfig';
import { GST_STATES } from '../utils/gstStates';
import { INDUSTRY_LABELS, industryLabel } from '../utils/industryConstants';

// Icons
import StorefrontIcon from '@mui/icons-material/Storefront';
import PersonIcon from '@mui/icons-material/Person';
import PlaceIcon from '@mui/icons-material/Place';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import NumbersIcon from '@mui/icons-material/Numbers';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CategoryIcon from '@mui/icons-material/Category';
import InventoryIcon from '@mui/icons-material/Inventory';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BrushIcon from '@mui/icons-material/Brush';
import ReviewsIcon from '@mui/icons-material/Reviews';
import PublicIcon from '@mui/icons-material/Public';
import CheckIcon from '@mui/icons-material/Check';
import ErrorIcon from '@mui/icons-material/Error';

// ─── Constants ─────────────────────────────────────────────────────────

const LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { value: 'ta', label: 'தமிழ் (Tamil)' },
  { value: 'te', label: 'తెలుగు (Telugu)' },
  { value: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
];

const BUSINESS_TYPES = ['Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'Public Limited', 'Other'];

// ─── Regex mirrors of backend validators ───────────────────────────────

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const CIN_REGEX = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
const CODE_REGEX = /^[a-z0-9][a-z0-9-]{1,49}$/;
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

// Steps in the 5-step wizard. Kept as a constant so both the Stepper and the
// per-step render function stay in sync. `description` and `tips` power the
// contextual help panel shown in the left rail of the two-column layout.
const STEPS = [
  {
    id: 'business',
    label: 'Business identity',
    icon: <StorefrontIcon />,
    description: 'What your customers will see on invoices and the URL slug we use for links.',
    tips: [
      'Pick the industry closest to what you sell — we pre-seed category structures and item fields for it.',
      'The shop code becomes part of every invoice number. Short + memorable works best.',
      'Legal name and business type are optional now, but required if you plan to e-invoice later.',
    ],
  },
  {
    id: 'tax',
    label: 'GST & tax',
    icon: <AccountBalanceIcon />,
    description: 'Your GST registration, PAN and the state that decides your place of supply.',
    tips: [
      'Not GST-registered? Leave GSTIN blank — you\'ll issue Bill of Supply instead of tax invoices.',
      'The GST state code is derived from the state you pick.',
      'PAN and CIN are optional; add them if you plan to e-invoice or file returns from here.',
    ],
  },
  {
    id: 'address',
    label: 'Address & contact',
    icon: <PlaceIcon />,
    description: 'How customers, delivery partners and support reach you.',
    tips: [
      'Address prints on every invoice and delivery challan.',
      'Phone is used for OTP-based delivery confirmations (coming soon).',
      'Website is optional but boosts brand recall on printed docs.',
    ],
  },
  {
    id: 'branding',
    label: 'Branding',
    icon: <BrushIcon />,
    description: 'Personalise invoices with your logo, brand colour and signatory details.',
    tips: [
      'Upload a square PNG/JPG under 2 MB — bigger is fine, we\'ll compress.',
      'Signatory name appears above the signature block on invoices.',
      'Invoice prefix combined with the fiscal year forms the invoice number (INV/2026/0001).',
    ],
  },
  {
    id: 'review',
    label: 'Review & finish',
    icon: <ReviewsIcon />,
    description: 'One last look before we activate your shop.',
    tips: [
      'You can edit any of this from Settings later — nothing is permanent.',
      'Category tree and default item fields are pre-seeded based on your industry.',
      'Your first 14 days include full PRO features so you can try before you buy.',
    ],
  },
];

// ─── Component ─────────────────────────────────────────────────────────

const SetupShop = () => {
  // logout button moved to OnboardingLayout's top bar
  const { silentRefresh, user } = useAuthContext();
  const navigate = useNavigate();
  const { refetchShop } = useShopConfig();
  const fileInputRef = useRef(null);

  const [activeStep, setActiveStep] = useState(0);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
  const [industries, setIndustries] = useState([]);
  const [industriesLoading, setIndustriesLoading] = useState(true);

  const [form, setForm] = useState({
    // Business identity
    name: '',
    ownerName: '',
    industryType: '',
    code: '',
    businessType: '',
    legalName: '',
    tradeName: '',
    // GST & tax
    gstin: '',
    pan: '',
    cin: '',
    state: '',
    stateCode: '',
    isCompositionScheme: false,
    // Address & contact
    address: '',
    addressLine2: '',
    city: '',
    pincode: '',
    phone: user?.phone || '',
    email: user?.email || '',
    companyWebsite: '',
    // Branding
    logo: null,
    signatoryName: '',
    signatoryDesignation: 'Proprietor',
    brandColor: '#1E40AF',
    invoicePrefix: 'INV',
    locale: 'en',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [codeCheckState, setCodeCheckState] = useState({ status: 'idle', message: '' }); // 'idle' | 'checking' | 'available' | 'taken'

  // ─── Fetch industries from API ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setIndustriesLoading(true);
    fetchIndustries()
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res?.data) ? res.data : [];
        setIndustries(list.length
          ? list.map((v) => ({ value: v, label: industryLabel(v) }))
          : Object.keys(INDUSTRY_LABELS).map((v) => ({ value: v, label: INDUSTRY_LABELS[v] })));
      })
      .catch(() => {
        // API failure — fall back to the local label map so the wizard still works.
        if (!cancelled) {
          setIndustries(Object.keys(INDUSTRY_LABELS).map((v) => ({ value: v, label: INDUSTRY_LABELS[v] })));
        }
      })
      .finally(() => { if (!cancelled) setIndustriesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // ─── Auto-slug: shop name → code ──────────────────────────────────
  useEffect(() => {
    if (!isCodeManuallyEdited && form.name) {
      const slug = form.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setForm((prev) => ({ ...prev, code: slug }));
    }
  }, [form.name, isCodeManuallyEdited]);

  // ─── Auto-derive stateCode from state ─────────────────────────────
  useEffect(() => {
    if (!form.state) return;
    const match = GST_STATES.find(([, name]) => name.toLowerCase() === form.state.toLowerCase());
    if (match && form.stateCode !== match[0]) {
      setForm((prev) => ({ ...prev, stateCode: match[0] }));
    }
  }, [form.state, form.stateCode]);

  // ─── Debounced shop-code availability check ────────────────────────
  useEffect(() => {
    if (activeStep !== 0) return;
    const value = form.code?.trim();
    if (!value) { setCodeCheckState({ status: 'idle', message: '' }); return; }
    if (!CODE_REGEX.test(value)) {
      setCodeCheckState({ status: 'invalid', message: 'Use lowercase letters, digits or hyphens (2-50 chars).' });
      return;
    }
    setCodeCheckState({ status: 'checking', message: 'Checking availability…' });
    const handle = setTimeout(async () => {
      try {
        await checkShopCode(value);
        setCodeCheckState({ status: 'available', message: 'That shop code is available.' });
      } catch (err) {
        if (err?.response?.status === 409) {
          setCodeCheckState({ status: 'taken', message: 'That shop code is already taken.' });
        } else {
          setCodeCheckState({ status: 'idle', message: '' });
        }
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [form.code, activeStep]);

  // ─── Validation ────────────────────────────────────────────────────

  const validateStep = useCallback(() => {
    const e = {};
    if (activeStep === 0) {
      if (!form.name.trim()) e.name = 'Shop name is required.';
      if (!form.industryType) e.industryType = 'Please pick an industry.';
      if (!form.code.trim()) e.code = 'Shop code is required.';
      else if (!CODE_REGEX.test(form.code)) e.code = 'Use lowercase letters, digits or hyphens (2-50 chars).';
    } else if (activeStep === 1) {
      if (form.gstin && !GSTIN_REGEX.test(form.gstin)) e.gstin = 'Enter a valid 15-character GSTIN.';
      if (form.pan && !PAN_REGEX.test(form.pan)) e.pan = 'Enter a valid 10-character PAN.';
      if (form.cin && !CIN_REGEX.test(form.cin)) e.cin = 'Enter a valid 21-character CIN.';
      if (!form.state.trim()) e.state = 'State is required.';
    } else if (activeStep === 2) {
      if (form.pincode && !PINCODE_REGEX.test(form.pincode)) e.pincode = 'Enter a valid 6-digit pincode.';
      if (form.phone && form.phone.length < 10) e.phone = 'Enter a valid mobile number.';
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [activeStep, form]);

  // ─── Field change handlers ─────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === 'checkbox' ? checked : value;
    setForm((prev) => ({ ...prev, [name]: nextValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (name === 'code') setIsCodeManuallyEdited(true);
    // Enforce uppercase on GSTIN/PAN/CIN as user types.
    if (name === 'gstin' || name === 'pan' || name === 'cin') {
      setForm((prev) => ({ ...prev, [name]: String(nextValue).toUpperCase() }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrors({ logo: 'Logo must be smaller than 2 MB.' });
      return;
    }
    setForm((prev) => ({ ...prev, logo: file }));
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
    setErrors((prev) => ({ ...prev, logo: '' }));
  };

  const removeLogo = () => {
    setForm((prev) => ({ ...prev, logo: null }));
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    if (activeStep === 0) {
      if (codeCheckState.status === 'taken') {
        setErrors((e) => ({ ...e, code: 'That shop code is already taken.' }));
        return;
      }
      if (codeCheckState.status === 'checking') return; // wait
      // Also do a final synchronous check in case debounced check didn't fire
      setIsLoading(true);
      try {
        await checkShopCode(form.code);
        setActiveStep((s) => s + 1);
        setErrors({});
      } catch (err) {
        if (err?.response?.status === 409) {
          setErrors({ code: 'That shop code is already taken.' });
          setCodeCheckState({ status: 'taken', message: 'That shop code is already taken.' });
        } else {
          setErrors({ code: 'Could not verify shop code — please try again.' });
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setActiveStep((s) => s + 1);
    }
  };

  const handleBack = () => setActiveStep((s) => Math.max(0, s - 1));

  const handleSubmit = async () => {
    // Run every step's validation before submitting.
    for (let i = 0; i <= 3; i++) {
      const originalStep = activeStep;
      setActiveStep(i);
      // eslint-disable-next-line no-await-in-loop
      const ok = validateStep();
      setActiveStep(originalStep);
      if (!ok) { setActiveStep(i); return; }
    }

    setIsLoading(true);
    setErrors({});

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value === null || value === '' || value === undefined) return;
      if (typeof value === 'boolean') formData.append(key, value ? 'true' : 'false');
      else formData.append(key, value);
    });

    try {
      const res = await setupShop(formData);
      const data = res?.data;
      const accessToken = data?.accessToken || data?.token || data?.shop?.accessToken || data?.shop?.token;
      const refreshToken = data?.refreshToken || data?.shop?.refreshToken;
      const newShopId = data?.id || data?.shop?.id;

      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('token', accessToken);
        API.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      if (silentRefresh) {
        try { await silentRefresh(); } catch (e) { console.warn('silentRefresh post-onboarding:', e); }
      }
      if (refetchShop) {
        try { await refetchShop(); } catch (e) { console.warn('refetchShop post-onboarding:', e); }
      }

      if (newShopId) {
        localStorage.setItem(
          `onboarding_checklist_${newShopId}`,
          JSON.stringify({ productAdded: false, stockAdded: false, saleMade: false, shopSetup: true })
        );
      }

      setSetupComplete(true);
    } catch (err) {
      console.error('Setup shop error:', err);
      setErrors({ submit: err?.response?.data?.message || 'Setup failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Success screen ───────────────────────────────────────────────

  if (setupComplete) {
    return (
      <Fade in timeout={500}>
        <Paper elevation={0} sx={{ maxWidth: 620, mx: 'auto', p: { xs: 3, md: 5 }, textAlign: 'center', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Avatar sx={{ bgcolor: 'success.light', color: 'success.main', width: 72, height: 72, mx: 'auto', mb: 2 }}>
            <CheckCircleIcon sx={{ fontSize: 44 }} />
          </Avatar>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            {form.name} is live!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Your shop is set up. Pick what to do next — or head straight to your dashboard.
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { icon: <CategoryIcon />, title: 'Add products', desc: 'Build your catalogue', to: '/items' },
              { icon: <InventoryIcon />, title: 'Stock levels', desc: 'Track your inventory', to: '/stock' },
              { icon: <StorefrontIcon />, title: 'First sale', desc: 'Create an invoice', to: '/sales' },
            ].map((card) => (
              <Grid item xs={12} sm={4} key={card.title}>
                <Paper
                  variant="outlined"
                  onClick={() => navigate(card.to)}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 200ms',
                    '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)', boxShadow: 2 },
                  }}
                >
                  <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', mx: 'auto', mb: 1 }}>{card.icon}</Avatar>
                  <Typography variant="subtitle2" fontWeight={700}>{card.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{card.desc}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Button variant="text" onClick={() => navigate('/')} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Skip &amp; go to dashboard →
          </Button>
        </Paper>
      </Fade>
    );
  }

  // ─── Step renderers ───────────────────────────────────────────────

  const renderBusiness = () => (
    <Stack spacing={2}>
      <Typography variant="overline" color="text.secondary" fontWeight={700}>Tell us about your business</Typography>

      <TextField
        label="Shop name"
        name="name"
        value={form.name}
        onChange={handleChange}
        required
        fullWidth
        autoFocus
        error={!!errors.name}
        helperText={errors.name || 'The name customers will see on invoices.'}
        InputProps={{ startAdornment: <InputAdornment position="start"><StorefrontIcon fontSize="small" color="disabled" /></InputAdornment> }}
      />

      <TextField
        select
        label="Industry"
        name="industryType"
        value={form.industryType}
        onChange={handleChange}
        required
        fullWidth
        error={!!errors.industryType}
        helperText={errors.industryType || (industriesLoading ? 'Loading industry list…' : 'We use this to pre-seed categories and item fields.')}
        InputProps={{ startAdornment: <InputAdornment position="start"><CategoryIcon fontSize="small" color="disabled" /></InputAdornment> }}
      >
        {industriesLoading ? (
          <MenuItem value=""><em>Loading…</em></MenuItem>
        ) : (
          industries.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))
        )}
      </TextField>

      <TextField
        label="Shop code (URL slug)"
        name="code"
        value={form.code}
        onChange={handleChange}
        required
        fullWidth
        error={!!errors.code || codeCheckState.status === 'taken' || codeCheckState.status === 'invalid'}
        helperText={
          errors.code ||
          codeCheckState.message ||
          'Auto-generated from name. Used in URLs & invoice numbers.'
        }
        InputProps={{
          startAdornment: <InputAdornment position="start"><NumbersIcon fontSize="small" color="disabled" /></InputAdornment>,
          endAdornment: codeCheckState.status === 'checking' ? (
            <InputAdornment position="end"><CircularProgress size={16} /></InputAdornment>
          ) : codeCheckState.status === 'available' ? (
            <InputAdornment position="end"><CheckIcon fontSize="small" color="success" /></InputAdornment>
          ) : (codeCheckState.status === 'taken' || codeCheckState.status === 'invalid') ? (
            <InputAdornment position="end"><ErrorIcon fontSize="small" color="error" /></InputAdornment>
          ) : null,
        }}
      />

      <Divider sx={{ my: 1 }}><Typography variant="caption" color="text.secondary">Optional company details</Typography></Divider>

      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Business type"
            name="businessType"
            value={form.businessType}
            onChange={handleChange}
            fullWidth
            helperText="How your business is registered."
          >
            <MenuItem value=""><em>Not specified</em></MenuItem>
            {BUSINESS_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Owner / proprietor name"
            name="ownerName"
            value={form.ownerName}
            onChange={handleChange}
            fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" color="disabled" /></InputAdornment> }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Legal / registered name"
            name="legalName"
            value={form.legalName}
            onChange={handleChange}
            fullWidth
            helperText="As per your PAN / GST certificate."
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Trade name"
            name="tradeName"
            value={form.tradeName}
            onChange={handleChange}
            fullWidth
            helperText="If different from shop name."
          />
        </Grid>
      </Grid>
    </Stack>
  );

  const renderTax = () => (
    <Stack spacing={2}>
      <Typography variant="overline" color="text.secondary" fontWeight={700}>Tax registration</Typography>
      <Alert severity="info" variant="outlined">
        Not GST-registered yet? Leave GSTIN blank and we'll issue Bill of Supply instead of tax invoices — you can add it later from Settings.
      </Alert>

      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
        <Grid item xs={12} sm={7}>
          <TextField
            label="GSTIN"
            name="gstin"
            value={form.gstin}
            onChange={handleChange}
            fullWidth
            inputProps={{ maxLength: 15 }}
            placeholder="22AAAAA0000A1Z5"
            error={!!errors.gstin}
            helperText={errors.gstin || '15-character GST identification number.'}
            InputProps={{ startAdornment: <InputAdornment position="start"><FingerprintIcon fontSize="small" color="disabled" /></InputAdornment> }}
          />
        </Grid>
        <Grid item xs={12} sm={5}>
          <FormControlLabel
            control={<Switch name="isCompositionScheme" checked={!!form.isCompositionScheme} onChange={handleChange} />}
            label={<Typography variant="body2">Composition scheme</Typography>}
            sx={{ mt: { sm: 1.5 } }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="State of business"
            name="state"
            value={form.state}
            onChange={handleChange}
            required
            fullWidth
            error={!!errors.state}
            helperText={errors.state || 'Determines your default place of supply.'}
            InputProps={{ startAdornment: <InputAdornment position="start"><PlaceIcon fontSize="small" color="disabled" /></InputAdornment> }}
          >
            <MenuItem value=""><em>Select state</em></MenuItem>
            {GST_STATES.map(([code, name]) => (
              <MenuItem key={code} value={name}>{code} — {name}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="GST state code"
            name="stateCode"
            value={form.stateCode}
            fullWidth
            InputProps={{ readOnly: true }}
            helperText="Auto-derived from the state you pick."
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="PAN"
            name="pan"
            value={form.pan}
            onChange={handleChange}
            fullWidth
            inputProps={{ maxLength: 10 }}
            placeholder="AAAAA0000A"
            error={!!errors.pan}
            helperText={errors.pan || '10-character Permanent Account Number.'}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="CIN (companies only)"
            name="cin"
            value={form.cin}
            onChange={handleChange}
            fullWidth
            inputProps={{ maxLength: 21 }}
            placeholder="U74999MH2020PTC300000"
            error={!!errors.cin}
            helperText={errors.cin || '21-character Corporate Identity Number.'}
          />
        </Grid>
      </Grid>
    </Stack>
  );

  const renderAddress = () => (
    <Stack spacing={2}>
      <Typography variant="overline" color="text.secondary" fontWeight={700}>How can we reach you?</Typography>

      <TextField
        label="Address line 1"
        name="address"
        value={form.address}
        onChange={handleChange}
        fullWidth
        placeholder="Shop number, street"
      />
      <TextField
        label="Address line 2"
        name="addressLine2"
        value={form.addressLine2}
        onChange={handleChange}
        fullWidth
        placeholder="Area, landmark"
      />
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="City"
            name="city"
            value={form.city}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Pincode"
            name="pincode"
            value={form.pincode}
            onChange={(e) => handleChange({ target: { name: 'pincode', value: e.target.value.replace(/\D/g, '').slice(0, 6) } })}
            fullWidth
            error={!!errors.pincode}
            helperText={errors.pincode}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Business phone"
            name="phone"
            value={form.phone}
            onChange={(e) => handleChange({ target: { name: 'phone', value: e.target.value.replace(/\D/g, '').slice(0, 15) } })}
            fullWidth
            error={!!errors.phone}
            helperText={errors.phone}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Business email"
            name="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
            type="email"
            error={!!errors.email}
            helperText={errors.email}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Company website (optional)"
            name="companyWebsite"
            value={form.companyWebsite}
            onChange={handleChange}
            fullWidth
            placeholder="https://your-shop.com"
            InputProps={{ startAdornment: <InputAdornment position="start"><PublicIcon fontSize="small" color="disabled" /></InputAdornment> }}
          />
        </Grid>
      </Grid>
    </Stack>
  );

  const renderBranding = () => (
    <Stack spacing={2}>
      <Typography variant="overline" color="text.secondary" fontWeight={700}>Personalise your invoices</Typography>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, borderStyle: 'dashed', textAlign: 'center' }}>
        <input
          hidden
          accept="image/*"
          type="file"
          ref={fileInputRef}
          onChange={handleLogoChange}
        />
        {logoPreview ? (
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
            <Avatar src={logoPreview} sx={{ width: 72, height: 72 }} variant="rounded" />
            <Stack>
              <Typography variant="body2" fontWeight={600}>{form.logo?.name || 'Logo uploaded'}</Typography>
              <Typography variant="caption" color="text.secondary">Appears on invoices, receipts and emails.</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button size="small" onClick={() => fileInputRef.current?.click()} sx={{ textTransform: 'none' }}>Replace</Button>
                <Button size="small" onClick={removeLogo} color="error" sx={{ textTransform: 'none' }}>Remove</Button>
              </Stack>
            </Stack>
          </Stack>
        ) : (
          <Stack alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 48, height: 48 }}>
              <CloudUploadIcon />
            </Avatar>
            <Typography variant="body2" fontWeight={600}>Add your shop logo</Typography>
            <Typography variant="caption" color="text.secondary">PNG / JPG · max 2 MB · square recommended</Typography>
            <Button variant="outlined" onClick={() => fileInputRef.current?.click()} sx={{ textTransform: 'none' }}>
              Choose file
            </Button>
            {errors.logo && <Alert severity="error" variant="outlined">{errors.logo}</Alert>}
          </Stack>
        )}
      </Paper>

      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Signatory name"
            name="signatoryName"
            value={form.signatoryName}
            onChange={handleChange}
            fullWidth
            helperText="Printed on invoice signature block."
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Signatory designation"
            name="signatoryDesignation"
            value={form.signatoryDesignation}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            label="Invoice prefix"
            name="invoicePrefix"
            value={form.invoicePrefix}
            onChange={(e) => handleChange({ target: { name: 'invoicePrefix', value: e.target.value.toUpperCase().slice(0, 6) } })}
            fullWidth
            helperText="e.g. INV → INV/2026/0001"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            label="Brand color"
            name="brandColor"
            type="color"
            value={form.brandColor}
            onChange={handleChange}
            fullWidth
            helperText="Accent color on invoices."
            InputProps={{ sx: { height: 56 } }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            select
            label="System language"
            name="locale"
            value={form.locale}
            onChange={handleChange}
            fullWidth
          >
            {LOCALES.map((l) => <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>)}
          </TextField>
        </Grid>
      </Grid>
    </Stack>
  );

  const summaryRow = (label, value) => (
    <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ py: 0.75 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160 }}>{label}</Typography>
      <Typography variant="body2" fontWeight={600} textAlign="right" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value || <em style={{ opacity: 0.6 }}>Not provided</em>}
      </Typography>
    </Stack>
  );

  const renderReview = () => (
    <Stack spacing={2.5}>
      <Typography variant="overline" color="text.secondary" fontWeight={700}>Review your details</Typography>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
          <Avatar src={logoPreview} variant="rounded" sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 48, height: 48 }}>
            <StorefrontIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={800}>{form.name || 'Your shop'}</Typography>
            <Typography variant="caption" color="text.secondary">{industryLabel(form.industryType)} · @{form.code}</Typography>
          </Box>
        </Stack>
        <Divider sx={{ my: 1 }} />
        {summaryRow('Owner', form.ownerName)}
        {summaryRow('Business type', form.businessType)}
        {summaryRow('Legal name', form.legalName)}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>GST &amp; tax</Typography>
        {summaryRow('GSTIN', form.gstin)}
        {summaryRow('State', form.state ? `${form.state} (${form.stateCode || '—'})` : '')}
        {summaryRow('PAN', form.pan)}
        {summaryRow('Scheme', form.isCompositionScheme ? 'Composition' : 'Regular')}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Contact</Typography>
        {summaryRow('Address', [form.address, form.addressLine2].filter(Boolean).join(', '))}
        {summaryRow('City & pincode', [form.city, form.pincode].filter(Boolean).join(' — '))}
        {summaryRow('Phone', form.phone)}
        {summaryRow('Email', form.email)}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Branding</Typography>
        {summaryRow('Signatory', [form.signatoryName, form.signatoryDesignation].filter(Boolean).join(' · '))}
        {summaryRow('Invoice prefix', form.invoicePrefix)}
        {summaryRow('Brand color', <Chip size="small" label={form.brandColor} sx={{ bgcolor: form.brandColor, color: '#fff', fontWeight: 700 }} />)}
      </Paper>

      <Alert severity="info" variant="outlined">
        You'll start on the free plan. Upgrading, team invites and additional shops become available from the Settings screen after you're in.
      </Alert>

      {errors.submit && (
        <Alert severity="error" variant="filled" role="alert">{errors.submit}</Alert>
      )}
    </Stack>
  );

  const stepRenderers = [renderBusiness, renderTax, renderAddress, renderBranding, renderReview];
  const progressPct = ((activeStep) / (STEPS.length - 1)) * 100;
  const currentStep = STEPS[activeStep];

  // ─── Layout ───────────────────────────────────────────────────────

  return (
    <Fade in timeout={400}>
      <Box sx={{ width: '100%' }}>

        {/* Page heading + linear progress span the full container width */}
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Typography variant="overline" color="text.secondary" fontWeight={700}>
            Shop onboarding
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-end' }} spacing={1}>
            <Box>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
                Set up your shop
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Takes about 3 minutes. You can edit everything later from Settings.
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Step {activeStep + 1} of {STEPS.length} · {Math.round(progressPct)}% complete
            </Typography>
          </Stack>
          <LinearProgress variant="determinate" value={progressPct} sx={{ height: 6, borderRadius: 3, mt: 1 }} />
        </Stack>

        {/* Two-column body: left rail (steps + tips), right pane (form) */}
        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} alignItems="flex-start">

          {/* ─── Left rail ────────────────────────────────────────── */}
          <Grid item xs={12} md={4} lg={4}>
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                position: { md: 'sticky' },
                top: { md: 96 }, // sits below the sticky top bar
              }}
            >
              <Stepper activeStep={activeStep} orientation="vertical" nonLinear>
                {STEPS.map((s, idx) => {
                  const completed = idx < activeStep;
                  const active = idx === activeStep;
                  return (
                    <Step key={s.id} completed={completed} active={active}>
                      <StepLabel
                        StepIconComponent={() => (
                          <Avatar
                            sx={{
                              width: 32, height: 32,
                              bgcolor: completed ? 'success.main' : active ? 'primary.main' : 'action.disabledBackground',
                              color: (completed || active) ? '#fff' : 'text.disabled',
                              fontSize: '0.85rem',
                            }}
                          >
                            {completed ? <CheckIcon fontSize="small" /> : s.icon}
                          </Avatar>
                        )}
                        sx={{
                          '& .MuiStepLabel-label': {
                            fontWeight: active ? 700 : 600,
                            fontSize: '0.9rem',
                          },
                        }}
                      >
                        {s.label}
                        {active && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontWeight: 500 }}>
                            {s.description}
                          </Typography>
                        )}
                      </StepLabel>
                    </Step>
                  );
                })}
              </Stepper>

              {/* Contextual tips for the currently active step */}
              <Divider sx={{ my: 2 }} />
              <Typography variant="overline" color="text.secondary" fontWeight={700}>
                Tips for this step
              </Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                {currentStep.tips.map((tip, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                    <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main', mt: 0.4 }} />
                    <Typography variant="caption" color="text.secondary">{tip}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </Grid>

          {/* ─── Right pane (form) ────────────────────────────────── */}
          <Grid item xs={12} md={8} lg={8}>
            <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 2 }}>
              {stepRenderers[activeStep]()}

              <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5} justifyContent="space-between" sx={{ mt: 4 }}>
                <Button
                  onClick={handleBack}
                  disabled={activeStep === 0 || isLoading}
                  startIcon={<ChevronLeftIcon />}
                  sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
                >
                  Back
                </Button>

                {activeStep < STEPS.length - 1 ? (
                  <Button
                    onClick={handleNext}
                    variant="contained"
                    disabled={isLoading || (activeStep === 0 && (codeCheckState.status === 'checking' || codeCheckState.status === 'taken' || codeCheckState.status === 'invalid'))}
                    endIcon={<ChevronRightIcon />}
                    sx={{ textTransform: 'none', fontWeight: 700, minWidth: 140, width: { xs: '100%', sm: 'auto' } }}
                  >
                    {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Continue'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    disabled={isLoading}
                    endIcon={isLoading ? null : <CheckIcon />}
                    sx={{ textTransform: 'none', fontWeight: 700, minWidth: 180, width: { xs: '100%', sm: 'auto' } }}
                  >
                    {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Finish setup'}
                  </Button>
                )}
              </Stack>
            </Paper>
          </Grid>

        </Grid>
      </Box>
    </Fade>
  );
};

export default SetupShop;
