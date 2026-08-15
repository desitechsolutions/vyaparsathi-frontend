import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Box, Paper, Typography, TextField, Button, Grid, Stack, Tab, Tabs,
  Switch, FormControlLabel, CircularProgress, Chip, Snackbar, Alert,
  Container, Divider, InputAdornment, IconButton, Tooltip, Skeleton,
} from '@mui/material';
import {
  Storefront as StorefrontIcon,
  CloudUpload as CloudUploadIcon,
  AccountBalance as AccountBalanceIcon,
  ReceiptLong as ReceiptLongIcon,
  ColorLens as ColorLensIcon,
  Description as DescriptionIcon,
  NotificationsActive as NotificationsIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckIcon,
  Sms as SmsIcon,
  Email as EmailIcon,
  RestartAlt as RestartAltIcon,
} from '@mui/icons-material';

import { fetchShop, fetchFileBlob } from '../services/api';
import API from '../services/api';
import { useAuthContext } from '../context/AuthContext';

// ── Constants ───────────────────────────────────────────────────────
const MAX_LOGO_KB = 50;

const TABS = [
  { id: 'general',       label: 'General',       icon: <StorefrontIcon fontSize="small" /> },
  { id: 'branding',      label: 'Branding',      icon: <ColorLensIcon fontSize="small" /> },
  { id: 'tax',           label: 'Tax & Banking', icon: <AccountBalanceIcon fontSize="small" /> },
  { id: 'terms',         label: 'Terms & Signatory', icon: <ReceiptLongIcon fontSize="small" /> },
  { id: 'invoicing',     label: 'Invoicing',     icon: <DescriptionIcon fontSize="small" /> },
  { id: 'notifications', label: 'Notifications', icon: <NotificationsIcon fontSize="small" /> },
];

// Compress an image blob to a target width + JPEG quality. Used to keep
// logo/signature under MAX_LOGO_KB before upload — matches the pre-redesign
// behavior; only the surrounding UX has changed.
const compressImage = (file, maxWidth = 500, quality = 0.7) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => blob
            ? resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }))
            : reject(new Error('Compression failed')),
          'image/jpeg', quality,
        );
      };
    };
    reader.onerror = reject;
  });

const SettingsPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const initialDataRef = useRef(null);

  const [shopData, setShopData] = useState({
    name: '', address: '', phone: '', email: '', gstin: '',
    isCompositionScheme: false, brandColor: '#2980b9',
    bankDetails: '', termsAndConditions: '', logoPath: '', signaturePath: '',
    industryType: '', upiId: '', invoicePrefix: '',
    companyWebsite: '', invoiceFooter: '', supportContact: '',
    invoiceDueDays: 30,
    lowStockAlertsEnabled: false,
    lowStockSmsAlertsEnabled: false,
    // V85 Phase 3: purchase-order approval policy. When required is true,
    // any PO whose total ≥ threshold routes into PENDING_APPROVAL on submit.
    // Threshold of 0 means "every PO regardless of amount".
    poApprovalRequired: false,
    poApprovalThresholdAmount: 0,
  });

  const [errors, setErrors] = useState({});
  const [previews, setPreviews] = useState({ logo: null, signature: null });
  const [secureUrls, setSecureUrls] = useState({ logo: '', signature: '' });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // ── Secure image loading (unchanged behavior) ─────────────────────
  const loadSecureImage = async (path, type) => {
    if (!path || path.startsWith('blob')) return;
    let cleanPath = path;
    if (path.startsWith('http')) {
      if (path.includes('/uploads/')) cleanPath = path.split('/uploads/')[1];
      else return;
    }
    try {
      const response = await fetchFileBlob(cleanPath);
      const url = URL.createObjectURL(response.data);
      setSecureUrls((prev) => ({ ...prev, [type]: url }));
    } catch (err) {
      // Non-fatal; the placeholder image will render.
    }
  };

  useEffect(() => { if (shopData.logoPath) loadSecureImage(shopData.logoPath, 'logo'); }, [shopData.logoPath]);
  useEffect(() => { if (shopData.signaturePath) loadSecureImage(shopData.signaturePath, 'signature'); }, [shopData.signaturePath]);
  useEffect(() => () => {
    if (secureUrls.logo) URL.revokeObjectURL(secureUrls.logo);
    if (secureUrls.signature) URL.revokeObjectURL(secureUrls.signature);
  }, [secureUrls]);

  const getDisplayUrl = (type) => previews[type] || secureUrls[type];

  // ── Data load ─────────────────────────────────────────────────────
  useEffect(() => { loadShopDetails(); }, []);

  const loadShopDetails = async () => {
    try {
      setLoading(true);
      const res = await fetchShop();
      if (res.data) {
        const data = {
          ...res.data,
          name: res.data.name || '',
          address: res.data.address || '',
          phone: res.data.phone || user?.phone || '',
          email: res.data.email || user?.email || '',
          gstin: res.data.gstin || '',
          isCompositionScheme: !!res.data.isCompositionScheme,
          bankDetails: res.data.bankDetails || '',
          termsAndConditions: res.data.termsAndConditions || '',
          brandColor: res.data.brandColor || '#2980b9',
          logoPath: res.data.logoPath || '',
          signaturePath: res.data.signaturePath || '',
          industryType: res.data.industryType || '',
          upiId: res.data.upiId || '',
          invoicePrefix: res.data.invoicePrefix || '',
          companyWebsite: res.data.companyWebsite || '',
          invoiceFooter: res.data.invoiceFooter || '',
          supportContact: res.data.supportContact || '',
          invoiceDueDays: res.data.invoiceDueDays ?? 30,
          lowStockAlertsEnabled: !!res.data.lowStockAlertsEnabled,
          lowStockSmsAlertsEnabled: !!res.data.lowStockSmsAlertsEnabled,
          poApprovalRequired: !!res.data.poApprovalRequired,
          poApprovalThresholdAmount: Number(res.data.poApprovalThresholdAmount) || 0,
        };
        setShopData(data);
        initialDataRef.current = data;
        setPreviews({ logo: null, signature: null });
        setSecureUrls({ logo: '', signature: '' });
        setIsDirty(false);
        setErrors({});
      }
    } catch (err) {
      showSnackbar('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Validation ────────────────────────────────────────────────────
  const validateField = (name, value) => {
    if (name === 'name' && !value?.trim()) return 'Shop name is required';
    if (name === 'email') {
      if (!value?.trim()) return 'Email is required';
      if (!/^\S+@\S+\.\S+$/.test(value)) return 'Invalid email format';
    }
    if (name === 'phone' && value?.trim()) {
      if (!/^[6-9]\d{9}$/.test(value.trim())) return 'Invalid phone (10 digits required)';
    }
    return '';
  };

  // ── Handlers ──────────────────────────────────────────────────────
  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setShopData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleBooleanChange = (name) => (e) => {
    setShopData((prev) => ({ ...prev, [name]: e.target.checked }));
    setIsDirty(true);
  };

  const handleFileChange = async (e, type) => {
    let file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_LOGO_KB * 1024) {
      try {
        showSnackbar('Optimizing image size…', 'info');
        file = await compressImage(file);
        if (file.size > MAX_LOGO_KB * 1024) {
          showSnackbar(`Image is too large — must be under ${MAX_LOGO_KB} KB after compression.`, 'error');
          return;
        }
      } catch {
        showSnackbar('Compression failed. Please upload a smaller image.', 'error');
        return;
      }
    }
    setPreviews((prev) => ({ ...prev, [type]: URL.createObjectURL(file) }));
    setShopData((prev) => ({ ...prev, [`${type}File`]: file }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    const nameErr = validateField('name', shopData.name);
    const emailErr = validateField('email', shopData.email);
    if (nameErr || emailErr) {
      setErrors({ ...errors, name: nameErr, email: emailErr });
      setActiveTab('general');
      showSnackbar('Please fix required fields in General.', 'error');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      const { logoFile, signatureFile, ...rest } = shopData;
      const jsonPayload = Object.keys(rest).reduce((acc, key) => {
        acc[key] = rest[key] === null ? '' : rest[key];
        return acc;
      }, {});
      formData.append('shop', new Blob([JSON.stringify(jsonPayload)], { type: 'application/json' }));
      if (shopData.logoFile) formData.append('logo', shopData.logoFile);
      if (shopData.signatureFile) formData.append('signature', shopData.signatureFile);
      await API.put('/api/shop', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      showSnackbar('Settings saved.');
      setLastSaved(new Date().toLocaleTimeString());
      await loadShopDetails();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (initialDataRef.current) {
      setShopData(initialDataRef.current);
      setPreviews({ logo: null, signature: null });
      setSecureUrls({ logo: '', signature: '' });
      setErrors({});
      setIsDirty(false);
    }
  };

  // Warn on tab close / navigate if there are unsaved changes.
  useEffect(() => {
    const handler = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // ── Shared input style — matches ItemsPage / Stock / LowStockAlerts ─
  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 1.5, bgcolor: 'background.paper',
    },
  };

  // ── Sections ──────────────────────────────────────────────────────

  const generalSection = (
    <Stack spacing={2.5}>
      <SectionHeader title="Basic identity" subtitle="These fields appear on invoices, receipts, and every customer-facing document." />
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField fullWidth size="small" label="Shop name" name="name" required
            value={shopData.name} onChange={handleTextChange}
            error={!!errors.name} helperText={errors.name} sx={inputSx} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth size="small" label="GSTIN" name="gstin"
            value={shopData.gstin} onChange={handleTextChange} sx={inputSx}
            helperText="15-digit GST registration number" />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth size="small" label="Address" name="address" multiline rows={2}
            value={shopData.address} onChange={handleTextChange} sx={inputSx} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth size="small" label="Business email" name="email" required
            value={shopData.email} onChange={handleTextChange}
            error={!!errors.email} helperText={errors.email || 'Used for alerts and shop-to-customer email'}
            sx={inputSx} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth size="small" label="Business phone" name="phone"
            value={shopData.phone} onChange={handleTextChange}
            error={!!errors.phone} helperText={errors.phone || '10-digit mobile number'}
            placeholder="9876543210" sx={inputSx} />
        </Grid>
      </Grid>
    </Stack>
  );

  const brandingSection = (
    <Stack spacing={3}>
      <SectionHeader title="Visual branding" subtitle="Displayed on every invoice, quotation, and PDF export." />
      <Box>
        <Typography variant="caption" fontWeight={700} color="text.secondary"
          sx={{ letterSpacing: 0.6, fontSize: '0.65rem', display: 'block', mb: 1 }}>
          PRIMARY THEME COLOR
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box component="input" type="color" name="brandColor"
            value={shopData.brandColor} onChange={handleTextChange}
            sx={{
              width: 56, height: 40, border: '1px solid', borderColor: 'divider',
              borderRadius: 1, cursor: 'pointer', p: 0,
            }} />
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {shopData.brandColor?.toUpperCase()}
          </Typography>
        </Stack>
      </Box>

      <UploadCard
        label="Business logo"
        helperText={`Under ${MAX_LOGO_KB} KB, auto-optimized. Ideal aspect ratio 2:1.`}
        preview={getDisplayUrl('logo')}
        emptyText="No logo uploaded"
        onFile={(e) => handleFileChange(e, 'logo')}
        theme={theme}
      />

      <UploadCard
        label="Authorized signature"
        helperText="Rendered on quotations and invoices with a signatory."
        preview={getDisplayUrl('signature')}
        emptyText="No signature uploaded"
        onFile={(e) => handleFileChange(e, 'signature')}
        theme={theme}
        dashed
      />
    </Stack>
  );

  const taxSection = (
    <Stack spacing={2.5}>
      <SectionHeader title="Tax registration" subtitle="Affects how GST is calculated on your invoices." />
      <Paper variant="outlined" sx={{
        p: 2, borderRadius: 1.5,
        bgcolor: alpha(theme.palette.info.main, 0.05),
        borderColor: alpha(theme.palette.info.main, 0.35),
      }}>
        <FormControlLabel
          control={<Switch checked={!!shopData.isCompositionScheme}
            onChange={handleBooleanChange('isCompositionScheme')} />}
          label={<Typography variant="body2" fontWeight={700}>Composition Scheme taxpayer</Typography>}
        />
        <Typography variant="caption" color="text.secondary" display="block">
          When enabled, GST is not charged on invoices and a "Bill of Supply" is generated instead.
        </Typography>
      </Paper>
      <SectionHeader title="Bank details" subtitle="Included on invoices so customers can pay by transfer." />
      <TextField fullWidth size="small" label="Bank details" name="bankDetails"
        multiline rows={4} value={shopData.bankDetails} onChange={handleTextChange}
        placeholder={"Bank: HDFC Bank\nA/C: 50100123456\nIFSC: HDFC0001234"}
        sx={inputSx} />
    </Stack>
  );

  const termsSection = (
    <Stack spacing={2.5}>
      <SectionHeader title="Terms & conditions" subtitle="Printed at the bottom of every invoice and quotation." />
      <TextField fullWidth size="small" label="Terms and conditions"
        name="termsAndConditions" multiline rows={6}
        value={shopData.termsAndConditions} onChange={handleTextChange} sx={inputSx} />
    </Stack>
  );

  const invoicingSection = (
    <Stack spacing={2.5}>
      <SectionHeader title="Invoicing defaults" subtitle="Set once here, applied to every new invoice." />
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField fullWidth size="small" label="Invoice prefix" name="invoicePrefix"
            value={shopData.invoicePrefix} onChange={handleTextChange}
            placeholder="e.g. INV-" helperText="Leave blank to use the shop code."
            sx={inputSx} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth size="small" label="Default due days"
            name="invoiceDueDays" type="number"
            value={shopData.invoiceDueDays} onChange={handleTextChange}
            helperText="Days until the invoice is due after issue."
            sx={inputSx} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth size="small" label="Support contact" name="supportContact"
            value={shopData.supportContact} onChange={handleTextChange}
            placeholder="e.g. support@company.com or 1800-123"
            helperText="Printed on invoices for customer queries."
            sx={inputSx} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth size="small" label="Company website" name="companyWebsite"
            value={shopData.companyWebsite} onChange={handleTextChange}
            placeholder="e.g. www.mycompany.com" sx={inputSx} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth size="small" label="UPI ID" name="upiId"
            value={shopData.upiId} onChange={handleTextChange}
            placeholder="e.g. name@bank" helperText="Renders a payment QR code on invoices."
            sx={inputSx} />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth size="small" label="Custom invoice footer"
            name="invoiceFooter" multiline rows={3}
            value={shopData.invoiceFooter} onChange={handleTextChange}
            placeholder="e.g. Thank you for your business!" sx={inputSx} />
        </Grid>
      </Grid>
    </Stack>
  );

  const notificationsSection = (
    <Stack spacing={2.5}>
      <SectionHeader
        title="Alert preferences"
        subtitle="Choose where the low-stock digest goes. Recipient is your business email or phone above."
      />
      <NotificationToggle
        icon={<EmailIcon />}
        color={theme.palette.primary.main}
        title="Email alerts"
        subtitle={shopData.email
          ? `A daily digest of critical low-stock variants goes to ${shopData.email} at 9 AM.`
          : 'Add a business email in General before enabling.'}
        checked={!!shopData.lowStockAlertsEnabled}
        onChange={handleBooleanChange('lowStockAlertsEnabled')}
        disabled={!shopData.email}
        theme={theme}
      />
      <NotificationToggle
        icon={<SmsIcon />}
        color={theme.palette.success.main}
        title="SMS alerts"
        subtitle="Send a critical-stock digest to your registered mobile number."
        badge="Coming soon"
        checked={!!shopData.lowStockSmsAlertsEnabled}
        onChange={handleBooleanChange('lowStockSmsAlertsEnabled')}
        theme={theme}
      />
      <Alert severity="info" sx={{ borderRadius: 1.5 }}>
        Alerts trigger only for <strong>CRITICAL</strong> variants (on-hand ≤ 0 or below the configured reorder point).
        Each variant is only re-emailed once per 24 hours to prevent inbox fatigue.
      </Alert>

      {/* V85 Phase 3: purchase-order approval policy. Toggle + threshold live
          under Notifications for now since they share the "alert-vs-permit"
          mental model; a dedicated Procurement tab is a Phase 6 concern. */}
      <SectionHeader
        title="Purchase order approvals"
        subtitle="Route high-value POs to an OWNER/ADMIN before they commit to the supplier."
      />
      <NotificationToggle
        icon={<NotificationsIcon />}
        color={theme.palette.warning.main}
        title="Require approval for purchase orders"
        subtitle="When ON, submitting a PO at or above the threshold routes it into PENDING APPROVAL. Below the threshold, submit works as usual."
        checked={!!shopData.poApprovalRequired}
        onChange={handleBooleanChange('poApprovalRequired')}
        theme={theme}
      />
      {shopData.poApprovalRequired && (
        <Box sx={{ pl: { xs: 0, sm: 5 } }}>
          <TextField
            fullWidth size="small" type="number"
            label="Approval threshold amount (₹)"
            name="poApprovalThresholdAmount"
            value={shopData.poApprovalThresholdAmount}
            onChange={handleTextChange}
            inputProps={{ min: 0, step: 0.01 }}
            helperText="POs at or above this amount need approval. Set 0 to require approval on every PO."
            sx={inputSx}
          />
        </Box>
      )}
    </Stack>
  );

  const sectionFor = (tabId) => {
    switch (tabId) {
      case 'general':       return generalSection;
      case 'branding':      return brandingSection;
      case 'tax':           return taxSection;
      case 'terms':         return termsSection;
      case 'invoicing':     return invoicingSection;
      case 'notifications': return notificationsSection;
      default:              return null;
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 4 }}>
      <Container maxWidth="xl" sx={{ pt: 3 }}>

        {/* ── Header ────────────────────────────────────── */}
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between"
          alignItems={{ md: 'center' }} mb={2.5} spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={700} color="text.primary"
              sx={{ letterSpacing: -0.4 }}>
              Shop Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure branding, tax, invoicing, and notifications for your shop.
              {isDirty && <> · <Box component="span" sx={{ color: 'warning.main', fontWeight: 700 }}>Unsaved changes</Box></>}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button variant="outlined" size="small" startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/dashboard')}
              sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none' }}>
              Back
            </Button>
            {isDirty && (
              <Button variant="outlined" size="small" startIcon={<RestartAltIcon />}
                onClick={handleCancel}
                sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none', color: 'text.secondary' }}>
                Discard
              </Button>
            )}
            <Button variant="contained" size="small"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              disabled={saving || !isDirty}
              onClick={handleSave}
              sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none' }}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </Stack>
        </Stack>

        {loading ? (
          <Skeleton variant="rectangular" height={520} sx={{ borderRadius: 2 }} />
        ) : (
          <Grid container spacing={2.5}>
            {/* Left rail — tab list */}
            <Grid item xs={12} md={3}>
              <Paper elevation={0} sx={{
                borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden',
              }}>
                <Tabs
                  orientation="vertical"
                  value={activeTab}
                  onChange={(e, v) => setActiveTab(v)}
                  sx={{
                    '& .MuiTabs-indicator': { display: 'none' },
                    '& .MuiTab-root': {
                      alignItems: 'flex-start', textAlign: 'left', textTransform: 'none',
                      fontWeight: 600, fontSize: '0.875rem', minHeight: 44, px: 2,
                      borderLeft: '3px solid transparent',
                      color: 'text.secondary',
                    },
                    '& .Mui-selected': {
                      color: 'primary.main',
                      bgcolor: alpha(theme.palette.primary.main, 0.06),
                      borderLeftColor: theme.palette.primary.main,
                    },
                  }}
                >
                  {TABS.map((tab) => (
                    <Tab key={tab.id} value={tab.id} icon={tab.icon}
                      iconPosition="start" label={tab.label} />
                  ))}
                </Tabs>
              </Paper>
              {lastSaved && !isDirty && (
                <Chip icon={<CheckIcon fontSize="small" />}
                  size="small" color="success" variant="outlined"
                  label={`Saved at ${lastSaved}`}
                  sx={{ mt: 1.5, fontWeight: 600, borderRadius: 1 }} />
              )}
            </Grid>

            {/* Right — section content */}
            <Grid item xs={12} md={9}>
              <Paper elevation={0} sx={{
                p: { xs: 2.5, md: 3 }, borderRadius: 2,
                border: '1px solid', borderColor: 'divider', minHeight: 480,
              }}>
                {sectionFor(activeTab)}
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>

      <Snackbar
        open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity} variant="filled"
          sx={{ borderRadius: 1.5 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// ── Small helpers (kept local per project convention) ────────────────

const SectionHeader = ({ title, subtitle }) => (
  <Box>
    <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
    {subtitle && (
      <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
    )}
  </Box>
);

const UploadCard = ({ label, helperText, preview, emptyText, onFile, theme, dashed }) => (
  <Box>
    <Typography variant="caption" fontWeight={700} color="text.secondary"
      sx={{ letterSpacing: 0.6, fontSize: '0.65rem', display: 'block', mb: 1 }}>
      {label.toUpperCase()}
    </Typography>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
      <Box sx={{
        width: 220, height: 100, borderRadius: 1.5,
        border: dashed ? '1px dashed' : '1px solid',
        borderColor: 'divider',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: alpha(theme.palette.text.primary, 0.02),
        overflow: 'hidden', p: 1,
      }}>
        {preview
          ? <img src={preview} alt={label}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          : <Typography variant="caption" color="text.disabled">{emptyText}</Typography>}
      </Box>
      <Stack spacing={0.5}>
        <Button variant="outlined" size="small" component="label" startIcon={<CloudUploadIcon />}
          sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none', alignSelf: 'flex-start' }}>
          Upload
          <input hidden accept="image/*" type="file" onChange={onFile} />
        </Button>
        {helperText && (
          <Typography variant="caption" color="text.secondary">{helperText}</Typography>
        )}
      </Stack>
    </Stack>
  </Box>
);

const NotificationToggle = ({
  icon, color, title, subtitle, checked, onChange, disabled, badge, theme,
}) => (
  <Paper variant="outlined" sx={{
    p: 2, borderRadius: 1.5,
    bgcolor: disabled ? alpha(theme.palette.action.disabled, 0.03) : 'background.paper',
    borderColor: 'divider',
  }}>
    <Stack direction="row" spacing={2} alignItems="center">
      <Box sx={{
        display: 'inline-flex', p: 1.25, borderRadius: 1.5,
        bgcolor: alpha(color, disabled ? 0.06 : 0.12),
        color, alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" fontWeight={700}>{title}</Typography>
          {badge && (
            <Chip size="small" label={badge} sx={{
              height: 18, fontSize: '0.65rem', fontWeight: 700, borderRadius: 0.75,
              bgcolor: alpha(theme.palette.warning.main, 0.15),
              color: theme.palette.warning.dark,
              '& .MuiChip-label': { px: 0.75 },
            }} />
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
      </Box>
      <Switch checked={checked} onChange={onChange} disabled={disabled} />
    </Stack>
  </Paper>
);

export default SettingsPage;
