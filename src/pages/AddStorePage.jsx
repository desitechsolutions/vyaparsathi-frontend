import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Fade,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
  createAdditionalShop,
  checkShopCode,
  fetchIndustries,
} from '../services/api';
import { useAuthContext } from '../context/AuthContext';
import { clearPermissionsCache } from '../hooks/usePermissions';
import { GST_STATES } from '../utils/gstStates';
import { INDUSTRY_LABELS, industryLabel } from '../utils/industryConstants';

// Icons
import StorefrontIcon from '@mui/icons-material/Storefront';
import PlaceIcon from '@mui/icons-material/Place';
import CategoryIcon from '@mui/icons-material/Category';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BrushIcon from '@mui/icons-material/Brush';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import ErrorIcon from '@mui/icons-material/Error';

// ─── Constants ──────────────────────────────────────────────────────────────

const GSTIN_REGEX = /^$|^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX   = /^$|^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const CIN_REGEX   = /^$|^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
const CODE_REGEX  = /^[a-z0-9][a-z0-9-]{1,49}$/;

const STEP_FIELDS = [
  ['name', 'industryType', 'code'],  // 0 – identity
  ['state'],                          // 1 – GST & tax (state is @NotBlank on backend)
  ['phone', 'email'],                 // 2 – address & contact
  [],                                 // 3 – branding (all optional)
];

const STEPS = [
  { id: 'identity',  label: 'Business identity', icon: <StorefrontIcon />   },
  { id: 'tax',       label: 'GST & tax',          icon: <AccountBalanceIcon /> },
  { id: 'address',   label: 'Address & contact',  icon: <PlaceIcon />        },
  { id: 'branding',  label: 'Branding',            icon: <BrushIcon />        },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function AddStorePage() {
  const { login } = useAuthContext();
  const navigate  = useNavigate();

  const [activeStep, setActiveStep]         = useState(0);
  const [industries, setIndustries]         = useState([]);
  const [industriesLoading, setIndustriesLoading] = useState(true);
  const [codeStatus, setCodeStatus]         = useState({ status: 'idle', message: '' });
  const [isCodeManual, setIsCodeManual]     = useState(false);
  const [logo, setLogo]                     = useState(null);
  const [logoPreview, setLogoPreview]       = useState(null);
  const [logoError, setLogoError]           = useState('');
  const [busy, setBusy]                     = useState(false);
  const [submitError, setSubmitError]       = useState('');
  const [done, setDone]                     = useState(false);
  const [createdName, setCreatedName]       = useState('');
  const fileRef = useRef(null);

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
      name: '', code: '', industryType: '',
      gstin: '', pan: '', cin: '', state: '', stateCode: '',
      address: '', addressLine2: '', city: '', pincode: '', phone: '', email: '', companyWebsite: '',
      signatoryName: '', signatoryDesignation: 'Proprietor', invoicePrefix: 'INV', brandColor: '#1E40AF', locale: 'en',
      legalName: '', tradeName: '', ownerName: '',
    },
  });

  const watchedName  = watch('name');
  const watchedCode  = watch('code');
  const watchedState = watch('state');

  // ── Load industry list from API ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
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
        if (!cancelled)
          setIndustries(Object.keys(INDUSTRY_LABELS).map((v) => ({ value: v, label: INDUSTRY_LABELS[v] })));
      })
      .finally(() => { if (!cancelled) setIndustriesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // ── Auto-slug from name ──────────────────────────────────────────────────
  useEffect(() => {
    if (isCodeManual || !watchedName) return;
    setValue(
      'code',
      watchedName.toLowerCase().trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50),
      { shouldValidate: true }
    );
  }, [watchedName, isCodeManual, setValue]);

  // ── Auto-derive stateCode from state ────────────────────────────────────
  useEffect(() => {
    if (!watchedState) return;
    const match = GST_STATES.find(([, name]) => name.toLowerCase() === watchedState.toLowerCase());
    if (match && getValues('stateCode') !== match[0]) setValue('stateCode', match[0]);
  }, [watchedState, setValue, getValues]);

  // ── Debounced code availability check ───────────────────────────────────
  useEffect(() => {
    if (activeStep !== 0) return;
    const v = watchedCode?.trim();
    if (!v) { setCodeStatus({ status: 'idle', message: '' }); return; }
    if (!CODE_REGEX.test(v)) {
      setCodeStatus({ status: 'invalid', message: 'Use lowercase letters, digits or hyphens (2–50 chars).' });
      return;
    }
    setCodeStatus({ status: 'checking', message: 'Checking availability…' });
    const t = setTimeout(async () => {
      try {
        await checkShopCode(v);
        setCodeStatus({ status: 'available', message: 'Shop code is available.' });
      } catch (err) {
        setCodeStatus(err?.response?.status === 409
          ? { status: 'taken', message: 'That shop code is already taken.' }
          : { status: 'idle', message: '' });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [watchedCode, activeStep]);

  // ── Logo handling ─────────────────────────────────────────────────────────
  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setLogoError('Logo must be under 2 MB.'); return; }
    if (!file.type.startsWith('image/')) { setLogoError('Only image files are accepted.'); return; }
    setLogo(file);
    setLogoError('');
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // ── Step navigation ───────────────────────────────────────────────────────
  const handleNext = async () => {
    const fields = STEP_FIELDS[activeStep];
    if (fields.length > 0 && !(await trigger(fields))) return;

    if (activeStep === 0) {
      if (codeStatus.status === 'taken') {
        setError('code', { type: 'manual', message: 'That shop code is already taken.' });
        return;
      }
      if (codeStatus.status === 'checking') return;
      setBusy(true);
      try {
        await checkShopCode(watchedCode);
        setActiveStep((s) => s + 1);
      } catch (err) {
        if (err?.response?.status === 409) {
          setError('code', { type: 'manual', message: 'That shop code is already taken.' });
          setCodeStatus({ status: 'taken', message: 'That shop code is already taken.' });
        } else {
          setError('code', { type: 'manual', message: 'Could not verify shop code — please try again.' });
        }
      } finally {
        setBusy(false);
      }
    } else {
      setActiveStep((s) => s + 1);
    }
  };

  const handleBack = () => setActiveStep((s) => Math.max(0, s - 1));

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setBusy(true);
    setSubmitError('');
    const fd = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value === null || value === '' || value === undefined) return;
      fd.append(key, typeof value === 'boolean' ? String(value) : value);
    });
    if (logo) fd.append('logo', logo);
    try {
      const res = await createAdditionalShop(fd);
      const token = res.data?.accessToken ?? null;
      setCreatedName(data.name);
      setDone(true);
      if (token) {
        clearPermissionsCache();
        login(token);
        // login() navigates away — give it a moment then hard-reload to flush
        // ShopContext / permission set against the new shopId claim.
        setTimeout(() => window.location.assign('/'), 200);
      }
    } catch (err) {
      setSubmitError(err?.response?.data?.message || 'Could not create store. Please try again.');
      setBusy(false);
    }
  };

  const handleFinish = async () => {
    const allFields = STEP_FIELDS.flat();
    if (allFields.length && !(await trigger(allFields))) {
      for (let i = 0; i < STEP_FIELDS.length; i++) {
        if (STEP_FIELDS[i].some((f) => !!errors[f])) { setActiveStep(i); return; }
      }
    }
    handleSubmit(onSubmit)();
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (done) {
    return (
      <Fade in timeout={400}>
        <Box sx={{ maxWidth: 560, mx: 'auto', mt: 6, px: 2, textAlign: 'center' }}>
          <Avatar sx={{ bgcolor: 'success.light', color: 'success.main', width: 72, height: 72, mx: 'auto', mb: 2 }}>
            <CheckCircleIcon sx={{ fontSize: 44 }} />
          </Avatar>
          <Typography variant="h5" fontWeight={800} gutterBottom>
            {createdName} is live!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your new store has been created. Switching you over now…
          </Typography>
          <CircularProgress size={28} />
        </Box>
      </Fade>
    );
  }

  // ── Step renderers ─────────────────────────────────────────────────────────

  const codeAdornment = () => {
    if (codeStatus.status === 'checking') return <CircularProgress size={16} />;
    if (codeStatus.status === 'available') return <CheckIcon color="success" fontSize="small" />;
    if (codeStatus.status === 'taken' || codeStatus.status === 'invalid')
      return <ErrorIcon color="error" fontSize="small" />;
    return null;
  };

  const renderIdentity = () => (
    <Stack spacing={2.5}>
      <Typography variant="overline" color="text.secondary" fontWeight={700}>Business identity</Typography>

      <Controller name="name" control={control} rules={{ required: 'Store name is required.' }}
        render={({ field, fieldState: { error } }) => (
          <TextField {...field} label="Store name" required fullWidth autoFocus
            error={!!error} helperText={error?.message || 'The name customers will see on invoices.'}
            InputProps={{ startAdornment: <InputAdornment position="start"><StorefrontIcon fontSize="small" color="disabled" /></InputAdornment> }}
          />
        )}
      />

      <Controller name="industryType" control={control} rules={{ required: 'Please pick an industry.' }}
        render={({ field, fieldState: { error } }) => (
          <TextField {...field} select label="Industry" required fullWidth
            error={!!error} helperText={error?.message || (industriesLoading ? 'Loading…' : 'Pre-seeds category structure and item fields.')}
            InputProps={{ startAdornment: <InputAdornment position="start"><CategoryIcon fontSize="small" color="disabled" /></InputAdornment> }}
          >
            {industriesLoading
              ? <MenuItem value=""><em>Loading…</em></MenuItem>
              : industries.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)
            }
          </TextField>
        )}
      />

      <Controller name="code" control={control}
        rules={{
          required: 'Store code is required.',
          pattern: { value: CODE_REGEX, message: 'Use lowercase letters, digits or hyphens (2–50 chars).' },
        }}
        render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
          <TextField
            value={value}
            onChange={(e) => { setIsCodeManual(true); onChange(e.target.value); }}
            inputRef={ref}
            label="Store code (URL slug)" required fullWidth
            error={!!error || codeStatus.status === 'taken' || codeStatus.status === 'invalid'}
            helperText={
              error?.message
                || (codeStatus.status !== 'idle' ? codeStatus.message : 'Unique identifier used in invoice numbers. 2–50 lowercase chars.')
            }
            inputProps={{ maxLength: 50 }}
            InputProps={{ endAdornment: <InputAdornment position="end">{codeAdornment()}</InputAdornment> }}
          />
        )}
      />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Controller name="ownerName" control={control}
            render={({ field }) => (
              <TextField {...field} label="Owner / contact name" fullWidth
                helperText="Appears on invoices as signatory (optional)." />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="legalName" control={control}
            render={({ field }) => (
              <TextField {...field} label="Legal / registered name" fullWidth
                helperText="If different from store name. Required for e-invoicing." />
            )}
          />
        </Grid>
      </Grid>
    </Stack>
  );

  const renderTax = () => (
    <Stack spacing={2.5}>
      <Typography variant="overline" color="text.secondary" fontWeight={700}>GST & tax details</Typography>

      <Controller name="state" control={control} rules={{ required: 'State is required for GST place-of-supply.' }}
        render={({ field, fieldState: { error } }) => (
          <TextField {...field} select label="State" required fullWidth
            error={!!error} helperText={error?.message || 'Determines the GST state code and place-of-supply split.'}>
            {GST_STATES.map(([code, name]) => (
              <MenuItem key={code} value={name}>{name}</MenuItem>
            ))}
          </TextField>
        )}
      />

      {/* Hidden field — populated automatically from state selection */}
      <Controller name="stateCode" control={control} render={({ field }) => <input type="hidden" {...field} />} />

      <Controller name="gstin" control={control}
        rules={{ pattern: { value: GSTIN_REGEX, message: 'Enter a valid 15-character GSTIN or leave blank.' } }}
        render={({ field, fieldState: { error } }) => (
          <TextField {...field} label="GSTIN" fullWidth
            error={!!error} helperText={error?.message || "Leave blank if you're not GST-registered (Bill of Supply will be issued)."}
            inputProps={{ maxLength: 15, style: { textTransform: 'uppercase' } }}
            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
          />
        )}
      />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Controller name="pan" control={control}
            rules={{ pattern: { value: PAN_REGEX, message: 'Enter a valid 10-character PAN or leave blank.' } }}
            render={({ field, fieldState: { error } }) => (
              <TextField {...field} label="PAN" fullWidth
                error={!!error} helperText={error?.message || 'Required for e-invoicing and returns.'}
                inputProps={{ maxLength: 10, style: { textTransform: 'uppercase' } }}
                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="cin" control={control}
            rules={{ pattern: { value: CIN_REGEX, message: 'Enter a valid 21-character CIN or leave blank.' } }}
            render={({ field, fieldState: { error } }) => (
              <TextField {...field} label="CIN" fullWidth
                error={!!error} helperText={error?.message || 'For Private Ltd / LLP entities only.'}
                inputProps={{ maxLength: 21, style: { textTransform: 'uppercase' } }}
                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
              />
            )}
          />
        </Grid>
      </Grid>
    </Stack>
  );

  const renderAddress = () => (
    <Stack spacing={2.5}>
      <Typography variant="overline" color="text.secondary" fontWeight={700}>Address & contact</Typography>

      <Controller name="address" control={control}
        render={({ field }) => (
          <TextField {...field} label="Address line 1" fullWidth multiline rows={2}
            helperText="Street address. Prints on every invoice and delivery challan." />
        )}
      />
      <Controller name="addressLine2" control={control}
        render={({ field }) => (
          <TextField {...field} label="Address line 2" fullWidth helperText="Building, floor, landmark (optional)." />
        )}
      />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Controller name="city" control={control}
            render={({ field }) => <TextField {...field} label="City" fullWidth />}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="pincode" control={control}
            rules={{ pattern: { value: /^$|^[1-9][0-9]{5}$/, message: 'Enter a valid 6-digit PIN code.' } }}
            render={({ field, fieldState: { error } }) => (
              <TextField {...field} label="PIN code" fullWidth
                error={!!error} helperText={error?.message}
                inputProps={{ maxLength: 6 }} />
            )}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Controller name="phone" control={control}
            rules={{ pattern: { value: /^$|^[6-9][0-9]{9}$/, message: 'Enter a valid 10-digit mobile number.' } }}
            render={({ field, fieldState: { error } }) => (
              <TextField {...field} label="Phone" fullWidth type="tel"
                error={!!error} helperText={error?.message || 'Used for OTP delivery confirmations.'}
                inputProps={{ maxLength: 10 }} />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="email" control={control}
            rules={{ pattern: { value: /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address.' } }}
            render={({ field, fieldState: { error } }) => (
              <TextField {...field} label="Business email" fullWidth type="email"
                error={!!error} helperText={error?.message || 'Printed on invoices as the contact email.'} />
            )}
          />
        </Grid>
      </Grid>

      <Controller name="companyWebsite" control={control}
        render={({ field }) => (
          <TextField {...field} label="Website" fullWidth type="url"
            helperText="Optional. Shown on invoice footer." />
        )}
      />
    </Stack>
  );

  const renderBranding = () => (
    <Stack spacing={2.5}>
      <Typography variant="overline" color="text.secondary" fontWeight={700}>Branding (optional)</Typography>

      {/* Logo upload */}
      <Box>
        <Typography variant="body2" fontWeight={600} gutterBottom>Store logo</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            variant="rounded"
            src={logoPreview || undefined}
            sx={{ width: 72, height: 72, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}
          >
            <StorefrontIcon color="disabled" />
          </Avatar>
          <Stack spacing={0.5}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CloudUploadIcon />}
              onClick={() => fileRef.current?.click()}
              sx={{ textTransform: 'none', width: 'fit-content' }}
            >
              {logo ? 'Change logo' : 'Upload logo'}
            </Button>
            {logo && (
              <Button size="small" color="error" sx={{ textTransform: 'none', width: 'fit-content', p: 0 }}
                onClick={() => { setLogo(null); setLogoPreview(null); if (fileRef.current) fileRef.current.value = ''; }}>
                Remove
              </Button>
            )}
            <Typography variant="caption" color="text.secondary">Square PNG/JPG, max 2 MB.</Typography>
            {logoError && <Typography variant="caption" color="error">{logoError}</Typography>}
          </Stack>
        </Stack>
        <input type="file" accept="image/*" hidden ref={fileRef} onChange={handleLogo} />
      </Box>

      <Divider />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Controller name="invoicePrefix" control={control}
            render={({ field }) => (
              <TextField {...field} label="Invoice prefix" fullWidth
                helperText="e.g. INV → INV/2026/0001"
                inputProps={{ maxLength: 10 }} />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="brandColor" control={control}
            render={({ field }) => (
              <TextField {...field} label="Brand colour" fullWidth type="color"
                helperText="Used as the accent colour on invoice headers."
                InputLabelProps={{ shrink: true }}
                sx={{ '& input[type=color]': { height: 40, cursor: 'pointer', p: 0.5 } }}
              />
            )}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Controller name="signatoryName" control={control}
            render={({ field }) => (
              <TextField {...field} label="Signatory name" fullWidth
                helperText="Appears above the signature block on invoices." />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="signatoryDesignation" control={control}
            render={({ field }) => (
              <TextField {...field} label="Signatory designation" fullWidth
                helperText="e.g. Proprietor, Director, Manager." />
            )}
          />
        </Grid>
      </Grid>

      <Controller name="locale" control={control}
        render={({ field }) => (
          <TextField {...field} select label="Interface language" fullWidth helperText="Sets the default language for this store's UI.">
            {[
              { value: 'en', label: 'English' },
              { value: 'hi', label: 'हिन्दी (Hindi)' },
              { value: 'gu', label: 'ગુજરાતી (Gujarati)' },
              { value: 'ta', label: 'தமிழ் (Tamil)' },
              { value: 'te', label: 'తెలుగు (Telugu)' },
              { value: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
            ].map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </TextField>
        )}
      />
    </Stack>
  );

  const stepContent = [renderIdentity, renderTax, renderAddress, renderBranding];
  const isLastStep  = activeStep === STEPS.length - 1;

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
      {/* Page header */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/settings')}
          sx={{ textTransform: 'none', color: 'text.secondary', minWidth: 0 }}
        >
          Back to Settings
        </Button>
      </Stack>

      <Typography variant="h5" fontWeight={800} gutterBottom>Add a new store</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Creates a second (or subsequent) shop under your account. You'll be switched to the new store automatically after creation.
      </Typography>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }} alternativeLabel>
        {STEPS.map((s) => (
          <Step key={s.id}>
            <StepLabel>{s.label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Form card */}
      <Paper variant="outlined" sx={{ borderRadius: 2.5, p: { xs: 2.5, md: 4 } }}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{submitError}</Alert>
        )}

        {stepContent[activeStep]()}

        {/* Navigation buttons */}
        <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 4 }}>
          {activeStep > 0 && (
            <Button onClick={handleBack} disabled={busy} sx={{ textTransform: 'none' }}>
              Back
            </Button>
          )}
          {!isLastStep ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={busy}
              sx={{ textTransform: 'none', fontWeight: 700, minWidth: 120 }}
            >
              {busy ? <CircularProgress size={20} color="inherit" /> : 'Continue'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={handleFinish}
              disabled={busy}
              sx={{ textTransform: 'none', fontWeight: 700, minWidth: 160 }}
            >
              {busy ? <CircularProgress size={20} color="inherit" /> : 'Create store'}
            </Button>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
