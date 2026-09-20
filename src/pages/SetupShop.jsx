import React, { useState, useRef, useEffect } from 'react';
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
import { useForm, Controller } from 'react-hook-form';
import API, { setupShop, checkShopCode, fetchIndustries } from '../services/api';
import { captureMessage, captureException } from '../services/sentry';
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

// Fields that must pass validation before advancing past each step
const STEP_FIELDS = [
  ['name', 'industryType', 'code'],   // step 0 – business identity
  ['gstin', 'pan', 'cin', 'state'],   // step 1 – tax
  ['pincode', 'phone', 'email'],      // step 2 – address
  [],                                  // step 3 – branding (all optional)
];

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
      "Not GST-registered? Leave GSTIN blank — you'll issue Bill of Supply instead of tax invoices.",
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
      "Upload a square PNG/JPG under 2 MB — bigger is fine, we'll compress.",
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
      "You can edit any of this from Settings later — nothing is permanent.",
      'Category tree and default item fields are pre-seeded based on your industry.',
      'Your first 14 days include full PRO features so you can try before you buy.',
    ],
  },
];

// ─── Component ─────────────────────────────────────────────────────────

const SetupShop = () => {
  const { silentRefresh, user } = useAuthContext();
  const navigate = useNavigate();
  const { refetchShop } = useShopConfig();
  const fileInputRef = useRef(null);

  const [activeStep, setActiveStep] = useState(0);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logo, setLogo] = useState(null);
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
  const [industries, setIndustries] = useState([]);
  const [industriesLoading, setIndustriesLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [codeCheckState, setCodeCheckState] = useState({ status: 'idle', message: '' });
  const [submitError, setSubmitError] = useState('');
  const [logoError, setLogoError] = useState('');

  const {
    control,
    trigger,
    setValue,
    getValues,
    watch,
    setError,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
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
      signatoryName: '',
      signatoryDesignation: 'Proprietor',
      brandColor: '#1E40AF',
      invoicePrefix: 'INV',
      locale: 'en',
    },
  });

  // Watched values used for derived computations and review summary
  const watchedName = watch('name');
  const watchedCode = watch('code');
  const watchedState = watch('state');
  const watchedStoreValues = watch(); // all fields for review summary

  // ─── Fetch industries from API ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setIndustriesLoading(true);
    fetchIndustries()
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res?.data) ? res.data : [];
        setIndustries(
          list.length
            ? list.map((v) => ({ value: v, label: industryLabel(v) }))
            : Object.keys(INDUSTRY_LABELS).map((v) => ({ value: v, label: INDUSTRY_LABELS[v] }))
        );
      })
      .catch(() => {
        if (!cancelled) {
          setIndustries(Object.keys(INDUSTRY_LABELS).map((v) => ({ value: v, label: INDUSTRY_LABELS[v] })));
        }
      })
      .finally(() => { if (!cancelled) setIndustriesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // ─── Auto-slug: shop name → code ─────────────────────────────────────────
  useEffect(() => {
    if (!isCodeManuallyEdited && watchedName) {
      const slug = watchedName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('code', slug, { shouldValidate: true });
    }
  }, [watchedName, isCodeManuallyEdited, setValue]);

  // ─── Auto-derive stateCode from state ────────────────────────────────────
  useEffect(() => {
    if (!watchedState) return;
    const match = GST_STATES.find(([, name]) => name.toLowerCase() === watchedState.toLowerCase());
    if (match) {
      const current = getValues('stateCode');
      if (current !== match[0]) setValue('stateCode', match[0]);
    }
  }, [watchedState, setValue, getValues]);

  // ─── Debounced shop-code availability check ───────────────────────────────
  useEffect(() => {
    if (activeStep !== 0) return;
    const value = watchedCode?.trim();
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
  }, [watchedCode, activeStep]);

  // ─── Step navigation ──────────────────────────────────────────────────────

  const handleNext = async () => {
    const fields = STEP_FIELDS[activeStep];
    if (fields.length > 0) {
      const isValid = await trigger(fields);
      if (!isValid) return;
    }

    if (activeStep === 0) {
      if (codeCheckState.status === 'taken') {
        setError('code', { type: 'manual', message: 'That shop code is already taken.' });
        return;
      }
      if (codeCheckState.status === 'checking') return; // wait for debounce
      // Final sync check
      setIsLoading(true);
      try {
        await checkShopCode(watchedCode);
        setActiveStep((s) => s + 1);
      } catch (err) {
        if (err?.response?.status === 409) {
          setError('code', { type: 'manual', message: 'That shop code is already taken.' });
          setCodeCheckState({ status: 'taken', message: 'That shop code is already taken.' });
        } else {
          setError('code', { type: 'manual', message: 'Could not verify shop code — please try again.' });
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setActiveStep((s) => s + 1);
    }
  };

  const handleBack = () => setActiveStep((s) => Math.max(0, s - 1));

  // ─── Logo handling ────────────────────────────────────────────────────────

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Logo must be smaller than 2 MB.');
      return;
    }
    setLogo(file);
    setLogoError('');
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogo(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Final submission ─────────────────────────────────────────────────────

  const onSubmit = async (data) => {
    setIsLoading(true);
    setSubmitError('');

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value === null || value === '' || value === undefined) return;
      if (typeof value === 'boolean') formData.append(key, value ? 'true' : 'false');
      else formData.append(key, value);
    });
    if (logo) formData.append('logo', logo);

    try {
      const res = await setupShop(formData);
      const resData = res?.data;
      const accessToken = resData?.accessToken || resData?.token || resData?.shop?.accessToken || resData?.shop?.token;
      const newShopId = resData?.id || resData?.shop?.id;

      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('token', accessToken);
        API.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      }
      // Refresh token is set server-side as an HttpOnly cookie (Set-Cookie header).
      // Do NOT write it to localStorage — that would expose it to JavaScript and XSS.

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

      captureMessage('Shop setup submitted', 'info');
      setSetupComplete(true);
    } catch (err) {
      console.error('Setup shop error:', err);
      captureException(err, { form: 'setup_shop' });
      setSubmitError(err?.response?.data?.message || 'Setup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Validate all steps then submit; if any step has errors, navigate to that step
  const handleFinish = async () => {
    const allStepFields = STEP_FIELDS.flat();
    if (allStepFields.length > 0) {
      const isValid = await trigger(allStepFields);
      if (!isValid) {
        // Navigate to the first step that has errors
        for (let i = 0; i < STEP_FIELDS.length; i++) {
          const stepHasError = STEP_FIELDS[i].some((field) => !!errors[field]);
          if (stepHasError) {
            setActiveStep(i);
            return;
          }
        }
        // If errors exist but not found in step fields, stay on review
        return;
      }
    }
    handleSubmit(onSubmit)();
  };

  // ─── Success screen ───────────────────────────────────────────────────────

  if (setupComplete) {
    const shopName = getValues('name');
    return (
      <Fade in timeout={500}>
        <Paper elevation={0} sx={{ maxWidth: 620, mx: 'auto', p: { xs: 3, md: 5 }, textAlign: 'center', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Avatar sx={{ bgcolor: 'success.light', color: 'success.main', width: 72, height: 72, mx: 'auto', mb: 2 }}>
            <CheckCircleIcon sx={{ fontSize: 44 }} />
          </Avatar>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            {shopName} is live!
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

  // ─── Step renderers ───────────────────────────────────────────────────────

  const renderBusiness = () => (
    <Stack spacing={2}>
      <Typography variant="overline" color="text.secondary" fontWeight={700}>Tell us about your business</Typography>

      <Controller
        name="name"
        control={control}
        rules={{ required: 'Shop name is required.' }}
        render={({ field, fieldState: { error } }) => (
          <TextField
            {...field}
            label="Shop name"
            required
            fullWidth
            autoFocus
            error={!!error}
            helperText={error?.message || 'The name customers will see on invoices.'}
            inputProps={{
              'aria-required': 'true',
              'aria-invalid': !!error,
              'aria-describedby': error ? 'setup-name-error' : 'setup-name-hint',
            }}
            FormHelperTextProps={error ? { id: 'setup-name-error', role: 'alert' } : { id: 'setup-name-hint' }}
            InputProps={{ startAdornment: <InputAdornment position="start"><StorefrontIcon fontSize="small" color="disabled" /></InputAdornment> }}
          />
        )}
      />

      <Controller
        name="industryType"
        control={control}
        rules={{ required: 'Please pick an industry.' }}
        render={({ field, fieldState: { error } }) => (
          <TextField
            {...field}
            select
            label="Industry"
            required
            fullWidth
            error={!!error}
            helperText={error?.message || (industriesLoading ? 'Loading industry list…' : 'We use this to pre-seed categories and item fields.')}
            inputProps={{
              'aria-required': 'true',
              'aria-invalid': !!error,
              'aria-describedby': error ? 'setup-industry-error' : undefined,
            }}
            FormHelperTextProps={error ? { id: 'setup-industry-error', role: 'alert' } : undefined}
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
        )}
      />

      <Controller
        name="code"
        control={control}
        rules={{
          required: 'Shop code is required.',
          pattern: {
            value: CODE_REGEX,
            message: 'Use lowercase letters, digits or hyphens (2-50 chars).',
          },
        }}
        render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
          <TextField
            value={value}
            onChange={(e) => {
              setIsCodeManuallyEdited(true);
              onChange(e.target.value);
            }}
            inputRef={ref}
            label="Shop code (URL slug)"
            required
            fullWidth
            error={!!error || codeCheckState.status === 'taken' || codeCheckState.status === 'invalid'}
            helperText={
              error?.message ||
              codeCheckState.message ||
              'Auto-generated from name. Used in URLs & invoice numbers.'
            }
            inputProps={{
              'aria-required': 'true',
              'aria-invalid': !!error || codeCheckState.status === 'taken' || codeCheckState.status === 'invalid',
              'aria-describedby': (error || codeCheckState.message) ? 'setup-code-hint' : undefined,
            }}
            FormHelperTextProps={{ id: 'setup-code-hint' }}
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
        )}
      />

      <Divider sx={{ my: 1 }}><Typography variant="caption" color="text.secondary">Optional company details</Typography></Divider>

      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
        <Grid item xs={12} sm={6}>
          <Controller
            name="businessType"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Business type"
                fullWidth
                helperText="How your business is registered."
              >
                <MenuItem value=""><em>Not specified</em></MenuItem>
                {BUSINESS_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="ownerName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Owner / proprietor name"
                fullWidth
                InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" color="disabled" /></InputAdornment> }}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="legalName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Legal / registered name"
                fullWidth
                helperText="As per your PAN / GST certificate."
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="tradeName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Trade name"
                fullWidth
                helperText="If different from shop name."
              />
            )}
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
          <Controller
            name="gstin"
            control={control}
            rules={{
              validate: (val) =>
                !val || GSTIN_REGEX.test(val) || 'Enter a valid 15-character GSTIN.',
            }}
            render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
              <TextField
                value={value}
                onChange={(e) => onChange(e.target.value.toUpperCase())}
                inputRef={ref}
                label="GSTIN"
                fullWidth
                inputProps={{
                  maxLength: 15,
                  'aria-invalid': !!error,
                  'aria-describedby': error ? 'setup-gstin-error' : 'setup-gstin-hint',
                }}
                FormHelperTextProps={error ? { id: 'setup-gstin-error', role: 'alert' } : { id: 'setup-gstin-hint' }}
                placeholder="22AAAAA0000A1Z5"
                error={!!error}
                helperText={error?.message || '15-character GST identification number.'}
                InputProps={{ startAdornment: <InputAdornment position="start"><FingerprintIcon fontSize="small" color="disabled" /></InputAdornment> }}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={5}>
          <Controller
            name="isCompositionScheme"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                }
                label={<Typography variant="body2">Composition scheme</Typography>}
                sx={{ mt: { sm: 1.5 } }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="state"
            control={control}
            rules={{ required: 'State is required.' }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                select
                label="State of business"
                required
                fullWidth
                error={!!error}
                helperText={error?.message || 'Determines your default place of supply.'}
                inputProps={{
                  'aria-required': 'true',
                  'aria-invalid': !!error,
                  'aria-describedby': error ? 'setup-state-error' : undefined,
                }}
                FormHelperTextProps={error ? { id: 'setup-state-error', role: 'alert' } : undefined}
                InputProps={{ startAdornment: <InputAdornment position="start"><PlaceIcon fontSize="small" color="disabled" /></InputAdornment> }}
              >
                <MenuItem value=""><em>Select state</em></MenuItem>
                {GST_STATES.map(([code, name]) => (
                  <MenuItem key={code} value={name}>{code} — {name}</MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="stateCode"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="GST state code"
                fullWidth
                InputProps={{ readOnly: true }}
                helperText="Auto-derived from the state you pick."
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="pan"
            control={control}
            rules={{
              validate: (val) => !val || PAN_REGEX.test(val) || 'Enter a valid 10-character PAN.',
            }}
            render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
              <TextField
                value={value}
                onChange={(e) => onChange(e.target.value.toUpperCase())}
                inputRef={ref}
                label="PAN"
                fullWidth
                inputProps={{
                  maxLength: 10,
                  'aria-invalid': !!error,
                  'aria-describedby': error ? 'setup-pan-error' : 'setup-pan-hint',
                }}
                FormHelperTextProps={error ? { id: 'setup-pan-error', role: 'alert' } : { id: 'setup-pan-hint' }}
                placeholder="AAAAA0000A"
                error={!!error}
                helperText={error?.message || '10-character Permanent Account Number.'}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="cin"
            control={control}
            rules={{
              validate: (val) => !val || CIN_REGEX.test(val) || 'Enter a valid 21-character CIN.',
            }}
            render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
              <TextField
                value={value}
                onChange={(e) => onChange(e.target.value.toUpperCase())}
                inputRef={ref}
                label="CIN (companies only)"
                fullWidth
                inputProps={{
                  maxLength: 21,
                  'aria-invalid': !!error,
                  'aria-describedby': error ? 'setup-cin-error' : 'setup-cin-hint',
                }}
                FormHelperTextProps={error ? { id: 'setup-cin-error', role: 'alert' } : { id: 'setup-cin-hint' }}
                placeholder="U74999MH2020PTC300000"
                error={!!error}
                helperText={error?.message || '21-character Corporate Identity Number.'}
              />
            )}
          />
        </Grid>
      </Grid>
    </Stack>
  );

  const renderAddress = () => (
    <Stack spacing={2}>
      <Typography variant="overline" color="text.secondary" fontWeight={700}>How can we reach you?</Typography>

      <Controller
        name="address"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Address line 1" fullWidth placeholder="Shop number, street" />
        )}
      />
      <Controller
        name="addressLine2"
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Address line 2" fullWidth placeholder="Area, landmark" />
        )}
      />
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
        <Grid item xs={12} sm={6}>
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="City" fullWidth />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="pincode"
            control={control}
            rules={{
              validate: (val) => !val || PINCODE_REGEX.test(val) || 'Enter a valid 6-digit pincode.',
            }}
            render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
              <TextField
                value={value}
                onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputRef={ref}
                label="Pincode"
                fullWidth
                error={!!error}
                helperText={error?.message}
                inputProps={{
                  'aria-invalid': !!error,
                  'aria-describedby': error ? 'setup-pincode-error' : undefined,
                }}
                FormHelperTextProps={error ? { id: 'setup-pincode-error', role: 'alert' } : undefined}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="phone"
            control={control}
            rules={{
              validate: (val) => !val || val.length >= 10 || 'Enter a valid mobile number.',
            }}
            render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
              <TextField
                value={value}
                onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 15))}
                inputRef={ref}
                label="Business phone"
                fullWidth
                error={!!error}
                helperText={error?.message}
                inputProps={{
                  'aria-invalid': !!error,
                  'aria-describedby': error ? 'setup-phone-error' : undefined,
                }}
                FormHelperTextProps={error ? { id: 'setup-phone-error', role: 'alert' } : undefined}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="email"
            control={control}
            rules={{
              validate: (val) =>
                !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Enter a valid email address.',
            }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Business email"
                fullWidth
                type="email"
                error={!!error}
                helperText={error?.message}
                inputProps={{
                  'aria-invalid': !!error,
                  'aria-describedby': error ? 'setup-email-error' : undefined,
                }}
                FormHelperTextProps={error ? { id: 'setup-email-error', role: 'alert' } : undefined}
              />
            )}
          />
        </Grid>
        <Grid item xs={12}>
          <Controller
            name="companyWebsite"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Company website (optional)"
                fullWidth
                placeholder="https://your-shop.com"
                InputProps={{ startAdornment: <InputAdornment position="start"><PublicIcon fontSize="small" color="disabled" /></InputAdornment> }}
              />
            )}
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
              <Typography variant="body2" fontWeight={600}>{logo?.name || 'Logo uploaded'}</Typography>
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
            {logoError && <Alert severity="error" variant="outlined">{logoError}</Alert>}
          </Stack>
        )}
      </Paper>

      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
        <Grid item xs={12} sm={6}>
          <Controller
            name="signatoryName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Signatory name"
                fullWidth
                helperText="Printed on invoice signature block."
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="signatoryDesignation"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Signatory designation" fullWidth />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Controller
            name="invoicePrefix"
            control={control}
            render={({ field: { onChange, value, ref } }) => (
              <TextField
                value={value}
                onChange={(e) => onChange(e.target.value.toUpperCase().slice(0, 6))}
                inputRef={ref}
                label="Invoice prefix"
                fullWidth
                helperText="e.g. INV → INV/2026/0001"
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Controller
            name="brandColor"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Brand color"
                type="color"
                fullWidth
                helperText="Accent color on invoices."
                InputProps={{ sx: { height: 56 } }}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Controller
            name="locale"
            control={control}
            render={({ field }) => (
              <TextField {...field} select label="System language" fullWidth>
                {LOCALES.map((l) => <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>)}
              </TextField>
            )}
          />
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

  const renderReview = () => {
    const v = watchedStoreValues;
    return (
      <Stack spacing={2.5}>
        <Typography variant="overline" color="text.secondary" fontWeight={700}>Review your details</Typography>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
            <Avatar src={logoPreview} variant="rounded" sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 48, height: 48 }}>
              <StorefrontIcon />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={800}>{v.name || 'Your shop'}</Typography>
              <Typography variant="caption" color="text.secondary">{industryLabel(v.industryType)} · @{v.code}</Typography>
            </Box>
          </Stack>
          <Divider sx={{ my: 1 }} />
          {summaryRow('Owner', v.ownerName)}
          {summaryRow('Business type', v.businessType)}
          {summaryRow('Legal name', v.legalName)}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>GST &amp; tax</Typography>
          {summaryRow('GSTIN', v.gstin)}
          {summaryRow('State', v.state ? `${v.state} (${v.stateCode || '—'})` : '')}
          {summaryRow('PAN', v.pan)}
          {summaryRow('Scheme', v.isCompositionScheme ? 'Composition' : 'Regular')}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Contact</Typography>
          {summaryRow('Address', [v.address, v.addressLine2].filter(Boolean).join(', '))}
          {summaryRow('City & pincode', [v.city, v.pincode].filter(Boolean).join(' — '))}
          {summaryRow('Phone', v.phone)}
          {summaryRow('Email', v.email)}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Branding</Typography>
          {summaryRow('Signatory', [v.signatoryName, v.signatoryDesignation].filter(Boolean).join(' · '))}
          {summaryRow('Invoice prefix', v.invoicePrefix)}
          {summaryRow('Brand color', <Chip size="small" label={v.brandColor} sx={{ bgcolor: v.brandColor, color: '#fff', fontWeight: 700 }} />)}
        </Paper>

        <Alert severity="info" variant="outlined">
          You'll start on the free plan. Upgrading, team invites and additional shops become available from the Settings screen after you're in.
        </Alert>

        {submitError && (
          <Alert severity="error" variant="filled" role="alert">{submitError}</Alert>
        )}
      </Stack>
    );
  };

  const stepRenderers = [renderBusiness, renderTax, renderAddress, renderBranding, renderReview];
  const progressPct = (activeStep / (STEPS.length - 1)) * 100;
  const currentStep = STEPS[activeStep];

  // ─── Layout ───────────────────────────────────────────────────────────────

  return (
    <Fade in timeout={400}>
      <Box sx={{ width: '100%' }}>

        {/* Page heading + linear progress */}
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

        {/* Two-column body */}
        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} alignItems="flex-start">

          {/* ─── Left rail ──────────────────────────────────── */}
          <Grid item xs={12} md={4} lg={4}>
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                position: { md: 'sticky' },
                top: { md: 96 },
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

          {/* ─── Right pane (form) ───────────────────────────── */}
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
                    disabled={
                      isLoading ||
                      (activeStep === 0 && (
                        codeCheckState.status === 'checking' ||
                        codeCheckState.status === 'taken' ||
                        codeCheckState.status === 'invalid'
                      ))
                    }
                    endIcon={<ChevronRightIcon />}
                    sx={{ textTransform: 'none', fontWeight: 700, minWidth: 140, width: { xs: '100%', sm: 'auto' } }}
                  >
                    {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Continue'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleFinish}
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
