import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import ErrorState from '../components/common/ErrorState';
import useDataLoading from '../hooks/useDataLoading';
import {
  Box, Paper, Typography, TextField, Button, Grid, Stack, Chip, Divider,
  Switch, FormControlLabel, CircularProgress, Snackbar, Alert, Container,
  IconButton, Tooltip, Avatar, Badge, MenuItem, InputAdornment, Slide,
  useMediaQuery, LinearProgress, ListItemButton, ListItemIcon, ListItemText,
  List,
} from '@mui/material';
import {
  Storefront as StorefrontIcon,
  Place as PlaceIcon,
  AccountBalanceWallet as BankIcon,
  ColorLens as BrandingIcon,
  Receipt as ReceiptIcon,
  VerifiedUser as ComplianceIcon,
  Gavel as ApprovalIcon,
  NotificationsActive as NotificationsIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  ArrowBack as BackIcon,
  CheckCircle as CheckIcon,
  ErrorOutline as WarnIcon,
  CloudUpload as UploadIcon,
  Person as PersonIcon,
  QrCode2 as QrIcon,
  Info as InfoIcon,
  History as HistoryIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

import { fetchShop, fetchFileBlob, fetchIndustries } from '../services/api';
import API from '../services/api';
import { useAuthContext } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { INDUSTRY_LABELS, industryLabel } from '../utils/industryConstants';
import BankAccountsPanel from '../components/BankAccountsPanel';

// ── Constants ───────────────────────────────────────────────────────
const MAX_LOGO_KB = 50;

// GST state codes (01–38, 97). Kept flat for a snappy dropdown UX.
const GST_STATES = [
  ['01', 'Jammu & Kashmir'], ['02', 'Himachal Pradesh'], ['03', 'Punjab'],
  ['04', 'Chandigarh'], ['05', 'Uttarakhand'], ['06', 'Haryana'],
  ['07', 'Delhi'], ['08', 'Rajasthan'], ['09', 'Uttar Pradesh'],
  ['10', 'Bihar'], ['11', 'Sikkim'], ['12', 'Arunachal Pradesh'],
  ['13', 'Nagaland'], ['14', 'Manipur'], ['15', 'Mizoram'],
  ['16', 'Tripura'], ['17', 'Meghalaya'], ['18', 'Assam'],
  ['19', 'West Bengal'], ['20', 'Jharkhand'], ['21', 'Odisha'],
  ['22', 'Chhattisgarh'], ['23', 'Madhya Pradesh'], ['24', 'Gujarat'],
  ['25', 'Daman & Diu'], ['26', 'Dadra & Nagar Haveli'],
  ['27', 'Maharashtra'], ['28', 'Andhra Pradesh (Old)'], ['29', 'Karnataka'],
  ['30', 'Goa'], ['31', 'Lakshadweep'], ['32', 'Kerala'],
  ['33', 'Tamil Nadu'], ['34', 'Puducherry'], ['35', 'Andaman & Nicobar'],
  ['36', 'Telangana'], ['37', 'Andhra Pradesh'], ['38', 'Ladakh'],
  ['97', 'Other Territory'],
];

const SECTIONS = [
  { id: 'identity',      label: 'Company identity',    icon: <BusinessIcon fontSize="small" />, subtitle: 'Legal, trade, PAN, GSTIN' },
  { id: 'address',       label: 'Address & contact',   icon: <PlaceIcon fontSize="small" />,     subtitle: 'Registered address, state code' },
  { id: 'signatory',     label: 'Signatory & branding',icon: <BrandingIcon fontSize="small" />,  subtitle: 'Signatory, logo, colour' },
  { id: 'banking',       label: 'Banking & UPI',       icon: <BankIcon fontSize="small" />,      subtitle: 'Bank account, UPI ID' },
  { id: 'invoicing',     label: 'Invoicing',           icon: <ReceiptIcon fontSize="small" />,   subtitle: 'Prefix, due days, footer, terms' },
  { id: 'compliance',    label: 'Tax compliance',      icon: <ComplianceIcon fontSize="small"/>, subtitle: 'E-invoicing, EWB, digital sig' },
  { id: 'approvals',     label: 'Approval policies',   icon: <ApprovalIcon fontSize="small" />,  subtitle: 'PO approval threshold' },
  { id: 'notifications', label: 'Notifications',       icon: <NotificationsIcon fontSize="small" />, subtitle: 'Low-stock email / SMS' },
];

// Compresses uploaded logo/signature. Same behavior as before.
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

// ── Small design-system helpers ─────────────────────────────────────

const SectionCard = ({ id, title, subtitle, action, children }) => {
  const theme = useTheme();
  return (
    <Paper id={id} elevation={0} sx={{
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider',
      overflow: 'hidden',
      scrollMarginTop: 96,
    }}>
      <Box sx={{
        px: { xs: 2, sm: 3 }, py: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: alpha(theme.palette.text.primary, 0.02),
        display: 'flex', alignItems: 'center', gap: 2,
      }}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: -0.2 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
      <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
        {children}
      </Box>
    </Paper>
  );
};

const InfoLabel = ({ children, tip }) => (
  <Stack direction="row" spacing={0.5} alignItems="center">
    <span>{children}</span>
    {tip && (
      <Tooltip title={tip} placement="top" arrow>
        <InfoIcon sx={{ fontSize: 14, color: 'text.disabled', cursor: 'help' }} />
      </Tooltip>
    )}
  </Stack>
);

// ── Main component ─────────────────────────────────────────────────

const inputSx = {
  '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'background.paper' },
};

const SettingsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { loading: loadError, error, executeLoad } = useDataLoading();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [activeSection, setActiveSection] = useState('identity');

  const initialDataRef = useRef(null);
  const containerRef = useRef(null);

  const [shopData, setShopData] = useState({
    // Legacy fields
    name: '', address: '', phone: '', email: '', gstin: '',
    isCompositionScheme: false, brandColor: '#2980b9',
    bankDetails: '', termsAndConditions: '', logoPath: '', signaturePath: '',
    industryType: '', upiId: '', invoicePrefix: '',
    companyWebsite: '', invoiceFooter: '', supportContact: '',
    invoiceDueDays: 30, state: '', stateCode: '',
    lowStockAlertsEnabled: false,
    lowStockSmsAlertsEnabled: false,
    poApprovalRequired: false,
    poApprovalThresholdAmount: 0,
    // V99 enterprise identity fields
    legalName: '', tradeName: '', pan: '', cin: '',
    signatoryName: '', signatoryDesignation: '',
    addressLine2: '', city: '', pincode: '', country: 'IN',
    eInvoicingEnabled: false,
    eWayBillEnabled: false,
    digitalSigningEnabled: false,
    // Phase 5 security policy — require MFA for OWNER + ADMIN.
    requireMfaForAdmins: false,
  });

  const { refreshShop } = useShop();
  const [industries, setIndustries] = useState([]);
  const [errors, setErrors] = useState({});
  const [previews, setPreviews] = useState({ logo: null, signature: null });
  const [secureUrls, setSecureUrls] = useState({ logo: '', signature: '' });

  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  useEffect(() => {
    fetchIndustries()
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : [];
        setIndustries(list.length ? list : Object.keys(INDUSTRY_LABELS));
      })
      .catch(() => {
        setIndustries(Object.keys(INDUSTRY_LABELS));
      });
  }, []);

  // ── Secure image loading (same behavior as before) ──────────────
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
    } catch { /* non-fatal */ }
  };

  useEffect(() => { if (shopData.logoPath) loadSecureImage(shopData.logoPath, 'logo'); }, [shopData.logoPath]);
  useEffect(() => { if (shopData.signaturePath) loadSecureImage(shopData.signaturePath, 'signature'); }, [shopData.signaturePath]);
  useEffect(() => () => {
    if (secureUrls.logo) URL.revokeObjectURL(secureUrls.logo);
    if (secureUrls.signature) URL.revokeObjectURL(secureUrls.signature);
  }, [secureUrls.logo, secureUrls.signature]);

  const getDisplayUrl = (type) => previews[type] || secureUrls[type];

  // ── Data load ───────────────────────────────────────────────────
  const loadShopDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchShop();
      if (res.data) {
        const data = {
          name: res.data.name || '',
          phone: res.data.phone || user?.phone || '',
          email: res.data.email || user?.email || '',
          isCompositionScheme: !!res.data.isCompositionScheme,
          lowStockAlertsEnabled: !!res.data.lowStockAlertsEnabled,
          lowStockSmsAlertsEnabled: !!res.data.lowStockSmsAlertsEnabled,
          poApprovalRequired: !!res.data.poApprovalRequired,
          poApprovalThresholdAmount: Number(res.data.poApprovalThresholdAmount) || 0,
          eInvoicingEnabled: !!res.data.eInvoicingEnabled,
          eWayBillEnabled: !!res.data.eWayBillEnabled,
          digitalSigningEnabled: !!res.data.digitalSigningEnabled,
          requireMfaForAdmins: !!res.data.requireMfaForAdmins,
          country: res.data.country || 'IN',
          brandColor: res.data.brandColor || '#2980b9',
          invoiceDueDays: res.data.invoiceDueDays ?? 30,
          // Preserve other fields from response
          address: res.data.address || '',
          gstin: res.data.gstin || '',
          industryType: res.data.industryType || '',
          upiId: res.data.upiId || '',
          invoicePrefix: res.data.invoicePrefix || '',
          companyWebsite: res.data.companyWebsite || '',
          invoiceFooter: res.data.invoiceFooter || '',
          supportContact: res.data.supportContact || '',
          state: res.data.state || '',
          stateCode: res.data.stateCode || '',
          termsAndConditions: res.data.termsAndConditions || '',
          logoPath: res.data.logoPath || '',
          signaturePath: res.data.signaturePath || '',
          bankDetails: res.data.bankDetails || '',
          legalName: res.data.legalName || '',
          tradeName: res.data.tradeName || '',
          pan: res.data.pan || '',
          cin: res.data.cin || '',
          signatoryName: res.data.signatoryName || '',
          signatoryDesignation: res.data.signatoryDesignation || '',
          addressLine2: res.data.addressLine2 || '',
          city: res.data.city || '',
          pincode: res.data.pincode || '',
        };
        setShopData(data);
        initialDataRef.current = data;
        setPreviews({ logo: null, signature: null });
        setSecureUrls({ logo: '', signature: '' });
        setIsDirty(false);
        setErrors({});
      }
    } catch {
      showSnackbar('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.phone, user?.email]);

  const handleLoadSettings = useCallback(async () => {
    await executeLoad(async () => {
      await loadShopDetails();
    });
  }, [executeLoad, loadShopDetails]);

  useEffect(() => {
    handleLoadSettings();
  }, [handleLoadSettings]);

  // ── Validation ──────────────────────────────────────────────────
  const validateField = (name, value) => {
    if (name === 'name' && !value?.trim()) return 'Shop name is required';
    if (name === 'email') {
      if (!value?.trim()) return 'Email is required';
      if (!/^\S+@\S+\.\S+$/.test(value)) return 'Invalid email format';
    }
    if (name === 'phone' && value?.trim() && !/^[6-9]\d{9}$/.test(value.trim()))
      return 'Invalid phone (10 digits required)';
    if (name === 'gstin' && value?.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[A-Z]{1}[0-9A-Z]{1}$/.test(value.trim()))
      return 'Invalid GSTIN — must be 15 characters in the CBIC format';
    if (name === 'pan' && value?.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value.trim()))
      return 'Invalid PAN — must be 10 characters, e.g. ABCDE1234F';
    if (name === 'pincode' && value?.trim() && !/^\d{6}$/.test(value.trim()))
      return 'Invalid pincode — must be 6 digits';
    return '';
  };

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

  // Convenience: pick state → set both state name + stateCode from the dropdown
  const handleStateChange = (e) => {
    const code = e.target.value;
    const match = GST_STATES.find(([c]) => c === code);
    setShopData((prev) => ({
      ...prev,
      stateCode: code,
      state: match ? match[1] : prev.state,
    }));
    setIsDirty(true);
  };

  const handleFileChange = async (e, type) => {
    let file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_LOGO_KB * 1024) {
      try {
        showSnackbar('Optimising image…', 'info');
        file = await compressImage(file);
        if (file.size > MAX_LOGO_KB * 1024) {
          showSnackbar(`Image too large — must be under ${MAX_LOGO_KB} KB after compression.`, 'error');
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
    const fieldsToCheck = ['name', 'email', 'phone', 'gstin', 'pan', 'pincode'];
    const nextErrors = { ...errors };
    let firstErrorSection = null;
    fieldsToCheck.forEach((f) => {
      const msg = validateField(f, shopData[f]);
      if (msg) {
        nextErrors[f] = msg;
        if (!firstErrorSection) firstErrorSection = f === 'pincode' ? 'address' : (f === 'pan' || f === 'gstin' ? 'identity' : 'identity');
      }
    });
    if (firstErrorSection) {
      setErrors(nextErrors);
      setActiveSection(firstErrorSection);
      showSnackbar('Please fix the highlighted fields before saving.', 'error');
      const el = document.getElementById(firstErrorSection);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      setLastSaved(new Date());
      await loadShopDetails();
      if (typeof refreshShop === 'function') {
        await refreshShop();
      }
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
      setErrors({});
      setIsDirty(false);
      showSnackbar('Changes discarded', 'info');
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // ── Completeness metrics per section (for left rail badges) ─────
  const completeness = useMemo(() => ({
    identity:
      !!shopData.legalName && !!shopData.gstin && !!shopData.pan,
    address:
      !!shopData.address && !!shopData.state && !!shopData.stateCode && !!shopData.pincode,
    signatory:
      !!shopData.signatoryName && !!shopData.signatoryDesignation,
    // Bank accounts live in shop_bank_account (managed independently by
    // BankAccountsPanel), so we don't gate completeness on shopData here.
    banking: true,
    invoicing:
      !!shopData.invoicePrefix,
    compliance: true, // opt-in booleans; nothing "incomplete"
    approvals: true,
    notifications: true,
  }), [shopData]);

  const completenessPct = useMemo(() => {
    const keys = Object.keys(completeness);
    const done = keys.filter((k) => completeness[k]).length;
    return Math.round((done / keys.length) * 100);
  }, [completeness]);

  // ── Section switching (single-section-at-a-time layout) ────────
  if (error) {
    return <ErrorState error={error} onRetry={handleLoadSettings} />;
  }

  const scrollToSection = (id) => {
    setActiveSection(id);
    // Reset scroll to the top so the section starts from the sticky bar,
    // never mid-page — the whole point of the redesign is to avoid the
    // long-scroll hunt for the Save button.
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeIndex = SECTIONS.findIndex((s) => s.id === activeSection);
  const prevSection = activeIndex > 0 ? SECTIONS[activeIndex - 1] : null;
  const nextSection = activeIndex < SECTIONS.length - 1 ? SECTIONS[activeIndex + 1] : null;

  // ── Keyboard shortcut: Cmd/Ctrl + S to save ─────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty && !saving) handleSave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, saving, shopData]);

  // ── Header + rail ───────────────────────────────────────────────
  const stickyBar = (
    <Box sx={{
      position: 'sticky',
      top: 0,
      zIndex: 10,
      bgcolor: 'background.default',
      borderBottom: '1px solid',
      borderColor: 'divider',
      pt: 2, pb: 1.5, mb: 3,
    }}>
      <Container maxWidth="xl">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1, minWidth: 0 }}>
            <IconButton onClick={() => navigate(-1)} size="small"><BackIcon /></IconButton>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.6 }}>
                ADMINISTRATION
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.4, lineHeight: 1.2 }}>
                Shop settings
              </Typography>
            </Box>
            <Chip
              size="small"
              icon={completenessPct === 100 ? <CheckIcon /> : <WarnIcon />}
              label={`${completenessPct}% complete`}
              color={completenessPct === 100 ? 'success' : completenessPct >= 60 ? 'warning' : 'default'}
              sx={{ fontWeight: 700, borderRadius: 1 }}
            />
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {lastSaved && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <HistoryIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                <Typography variant="caption" color="text.secondary">
                  Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Stack>
            )}
            <Button
              variant="outlined"
              size="medium"
              startIcon={<CloseIcon />}
              onClick={handleCancel}
              disabled={!isDirty || saving}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}
            >
              Discard
            </Button>
            <Button
              variant="contained"
              size="medium"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={!isDirty || saving}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, boxShadow: 'none',
                    '&:hover': { boxShadow: 'none' } }}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </Stack>
        </Stack>
        {isDirty && (
          <Box sx={{ mt: 1.5 }}>
            <LinearProgress
              variant="determinate"
              value={100}
              sx={{
                height: 3, borderRadius: 1,
                bgcolor: alpha(theme.palette.warning.main, 0.15),
                '& .MuiLinearProgress-bar': { bgcolor: theme.palette.warning.main },
              }}
            />
            <Typography variant="caption" color="warning.main" fontWeight={700} sx={{ mt: 0.5, display: 'inline-block' }}>
              You have unsaved changes.
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );

  const leftRail = (
    <Paper elevation={0} sx={{
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider',
      position: 'sticky', top: 130,
      overflow: 'hidden',
    }}>
      <Box sx={{
        px: 2, py: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: alpha(theme.palette.text.primary, 0.02),
      }}>
        <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ letterSpacing: 0.6 }}>
          NAVIGATE
        </Typography>
      </Box>
      <List dense disablePadding>
        {SECTIONS.map((s) => {
          const isActive = activeSection === s.id;
          const isDone = completeness[s.id];
          return (
            <ListItemButton
              key={s.id}
              selected={isActive}
              onClick={() => scrollToSection(s.id)}
              sx={{
                borderLeft: '3px solid',
                borderLeftColor: isActive ? theme.palette.primary.main : 'transparent',
                py: 1.25,
                '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
              }}
            >
              <ListItemIcon sx={{
                minWidth: 32,
                color: isActive ? 'primary.main' : 'text.secondary',
              }}>
                {s.icon}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight={isActive ? 700 : 600}
                    color={isActive ? 'text.primary' : 'text.secondary'}>
                    {s.label}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                    {s.subtitle}
                  </Typography>
                }
              />
              {isDone
                ? <CheckIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                : <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: theme.palette.warning.main }} />
              }
            </ListItemButton>
          );
        })}
      </List>
    </Paper>
  );

  // ── Section bodies ──────────────────────────────────────────────

  const identitySection = (
    <SectionCard
      id="identity"
      title="Company identity"
      subtitle="Statutory identifiers required on every invoice, receipt, and tax document."
    >
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
        <Grid item xs={12} sm={6} md={6}>
          <TextField fullWidth size="small" required
            label={<InfoLabel tip="The name registered with the Ministry of Corporate Affairs / GST. Appears at the top of every tax document.">Legal name</InfoLabel>}
            name="legalName" value={shopData.legalName || ''} onChange={handleTextChange}
            helperText="Registered legal / MCA name" sx={inputSx} />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <TextField fullWidth size="small"
            label={<InfoLabel tip="The customer-facing brand / DBA. Falls back to Legal name if blank.">Trade name</InfoLabel>}
            name="tradeName" value={shopData.tradeName || ''} onChange={handleTextChange}
            helperText="Brand / DBA (falls back to shop name)" sx={inputSx} />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <TextField fullWidth size="small" required
            label="Shop name (display)" name="name"
            value={shopData.name} onChange={handleTextChange}
            error={!!errors.name} helperText={errors.name || 'Short label used across the app'} sx={inputSx} />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <TextField fullWidth size="small" select
            label="Industry type" name="industryType" value={shopData.industryType || ''}
            onChange={handleTextChange} sx={inputSx}>
            <MenuItem value="">Select…</MenuItem>
            {(industries.length ? industries : Object.keys(INDUSTRY_LABELS)).map((o) => (
              <MenuItem key={o} value={o}>
                {industryLabel(o)}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth size="small"
            label={<InfoLabel tip="15-digit GSTIN. First 2 chars are your state code.">GSTIN</InfoLabel>}
            name="gstin" value={shopData.gstin || ''} onChange={handleTextChange}
            error={!!errors.gstin} helperText={errors.gstin || '15-char CBIC format'} sx={inputSx}
            inputProps={{ style: { textTransform: 'uppercase' }, maxLength: 15 }} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth size="small"
            label={<InfoLabel tip="10-char Permanent Account Number. Required on B2B invoices.">PAN</InfoLabel>}
            name="pan" value={shopData.pan || ''} onChange={handleTextChange}
            error={!!errors.pan} helperText={errors.pan || 'e.g. ABCDE1234F'} sx={inputSx}
            inputProps={{ style: { textTransform: 'uppercase' }, maxLength: 10 }} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth size="small"
            label={<InfoLabel tip="Corporate Identification Number for Pvt Ltd / LLP entities. Optional for proprietorships.">CIN / LLPIN</InfoLabel>}
            name="cin" value={shopData.cin || ''} onChange={handleTextChange}
            helperText="Optional for proprietors" sx={inputSx}
            inputProps={{ style: { textTransform: 'uppercase' }, maxLength: 21 }} />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={<Switch checked={!!shopData.isCompositionScheme}
              onChange={handleBooleanChange('isCompositionScheme')} />}
            label={<Typography variant="body2" fontWeight={600}>Registered under Composition Scheme</Typography>}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 5, mt: -0.5 }}>
            Composition-scheme dealers issue Bill of Supply instead of Tax Invoice.
          </Typography>
        </Grid>
      </Grid>
    </SectionCard>
  );

  const addressSection = (
    <SectionCard
      id="address"
      title="Address & contact"
      subtitle="Registered address of the business, with state code for GST determination."
    >
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
        <Grid item xs={12} sm={6} md={6}>
          <TextField fullWidth size="small" label="Address line 1" name="address" multiline rows={2}
            value={shopData.address || ''} onChange={handleTextChange} sx={inputSx} />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <TextField fullWidth size="small" label="Address line 2 (optional)" name="addressLine2" multiline rows={2}
            value={shopData.addressLine2 || ''} onChange={handleTextChange} sx={inputSx} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth size="small" label="City" name="city"
            value={shopData.city || ''} onChange={handleTextChange} sx={inputSx} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth size="small" select required
            label={<InfoLabel tip="Drives CGST+SGST vs IGST decisions on outgoing invoices.">State (GST code)</InfoLabel>}
            name="stateCode" value={shopData.stateCode || ''}
            onChange={handleStateChange} sx={inputSx}>
            <MenuItem value="">Select state…</MenuItem>
            {GST_STATES.map(([code, name]) => (
              <MenuItem key={code} value={code}>
                {code} — {name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <TextField fullWidth size="small" label="Pincode" name="pincode"
            value={shopData.pincode || ''} onChange={handleTextChange}
            error={!!errors.pincode} helperText={errors.pincode || ''}
            inputProps={{ maxLength: 6 }} sx={inputSx} />
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <TextField fullWidth size="small" label="Country" name="country"
            value={shopData.country || 'IN'} onChange={handleTextChange} sx={inputSx}
            inputProps={{ maxLength: 3, style: { textTransform: 'uppercase' } }} />
        </Grid>
        <Grid item xs={12}><Divider /></Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth size="small" required label="Business email" name="email"
            value={shopData.email || ''} onChange={handleTextChange}
            error={!!errors.email} helperText={errors.email || 'For alerts + customer emails'} sx={inputSx} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth size="small" label="Business phone" name="phone"
            value={shopData.phone || ''} onChange={handleTextChange}
            error={!!errors.phone} helperText={errors.phone || '10-digit mobile'}
            placeholder="9876543210" sx={inputSx} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth size="small" label="Support contact" name="supportContact"
            value={shopData.supportContact || ''} onChange={handleTextChange} sx={inputSx}
            helperText="Shown on invoice footer" />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <TextField fullWidth size="small" label="Website (optional)" name="companyWebsite"
            value={shopData.companyWebsite || ''} onChange={handleTextChange} sx={inputSx}
            InputProps={{ startAdornment: <InputAdornment position="start">🌐</InputAdornment> }} />
        </Grid>
      </Grid>
    </SectionCard>
  );

  const signatorySection = (
    <SectionCard
      id="signatory"
      title="Signatory & branding"
      subtitle="Authorised signatory name and brand assets — appear on the invoice signatory block and header."
    >
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Stack spacing={1.5} alignItems="center">
            <Typography variant="caption" fontWeight={700} color="text.secondary"
              sx={{ letterSpacing: 0.6, alignSelf: 'flex-start' }}>LOGO</Typography>
            <Avatar variant="rounded" src={getDisplayUrl('logo') || undefined}
              sx={{
                width: 140, height: 140,
                bgcolor: alpha(theme.palette.text.primary, 0.04),
                border: '1px dashed',
                borderColor: 'divider',
              }}>
              {!getDisplayUrl('logo') && <StorefrontIcon sx={{ fontSize: 40, color: 'text.disabled' }} />}
            </Avatar>
            <Button component="label" size="small" startIcon={<UploadIcon />}
              variant="outlined" sx={{ textTransform: 'none', fontWeight: 700 }}>
              Upload logo
              <input hidden type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
            </Button>
            <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'center' }}>
              Max {MAX_LOGO_KB} KB · Auto-compressed
            </Typography>
          </Stack>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Stack spacing={1.5} alignItems="center">
            <Typography variant="caption" fontWeight={700} color="text.secondary"
              sx={{ letterSpacing: 0.6, alignSelf: 'flex-start' }}>SIGNATURE</Typography>
            <Avatar variant="rounded" src={getDisplayUrl('signature') || undefined}
              sx={{
                width: 140, height: 140,
                bgcolor: alpha(theme.palette.text.primary, 0.04),
                border: '1px dashed',
                borderColor: 'divider',
              }}>
              {!getDisplayUrl('signature') && <PersonIcon sx={{ fontSize: 40, color: 'text.disabled' }} />}
            </Avatar>
            <Button component="label" size="small" startIcon={<UploadIcon />}
              variant="outlined" sx={{ textTransform: 'none', fontWeight: 700 }}>
              Upload signature
              <input hidden type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'signature')} />
            </Button>
            <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'center' }}>
              PNG with transparent background works best.
            </Typography>
          </Stack>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Stack spacing={2}>
            <TextField fullWidth size="small" label="Signatory name" name="signatoryName"
              value={shopData.signatoryName || ''} onChange={handleTextChange} sx={inputSx}
              helperText="e.g. R. Sharma" />
            <TextField fullWidth size="small" label="Signatory designation" name="signatoryDesignation"
              value={shopData.signatoryDesignation || ''} onChange={handleTextChange} sx={inputSx}
              helperText="e.g. Director / Proprietor" />
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary"
                sx={{ letterSpacing: 0.6, display: 'block', mb: 1 }}>BRAND COLOUR</Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box component="input" type="color"
                  value={shopData.brandColor || '#2980b9'}
                  onChange={(e) => { setShopData({ ...shopData, brandColor: e.target.value }); setIsDirty(true); }}
                  sx={{
                    width: 48, height: 48, border: '1px solid', borderColor: 'divider',
                    borderRadius: 1, p: 0, cursor: 'pointer', bgcolor: 'background.paper',
                  }} />
                <TextField fullWidth size="small" name="brandColor"
                  value={shopData.brandColor || '#2980b9'} onChange={handleTextChange} sx={inputSx} />
              </Stack>
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                Header rule + total row on every PDF.
              </Typography>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </SectionCard>
  );

  const bankingSection = (
    <SectionCard
      id="banking"
      title="Banking & UPI"
      subtitle="Structured bank accounts — one default per currency is rendered on outgoing tax invoices."
      action={<Chip icon={<QrIcon fontSize="small" />} size="small" label="Rendered on invoice"
                   sx={{ fontWeight: 700, borderRadius: 1 }} />}
    >
      <BankAccountsPanel />
    </SectionCard>
  );

  const invoicingSection = (
    <SectionCard
      id="invoicing"
      title="Invoicing preferences"
      subtitle="Doc numbering, due-date policy, and the fine-print rendered on every invoice."
    >
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth size="small" label="Invoice number prefix" name="invoicePrefix"
            value={shopData.invoicePrefix || ''} onChange={handleTextChange} sx={inputSx}
            helperText='e.g. "INV/25-26/"' />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth size="small" type="number" label="Default due days" name="invoiceDueDays"
            value={shopData.invoiceDueDays ?? 30} onChange={handleTextChange} sx={inputSx}
            inputProps={{ min: 0, max: 180 }}
            helperText="Auto-calculated as invoice date + N" />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth size="small" multiline rows={3}
            label="Invoice footer / disclaimer" name="invoiceFooter"
            value={shopData.invoiceFooter || ''} onChange={handleTextChange} sx={inputSx}
            helperText="Renders at the bottom of every invoice PDF" />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth size="small" multiline rows={5}
            label="Terms & conditions" name="termsAndConditions"
            value={shopData.termsAndConditions || ''} onChange={handleTextChange} sx={inputSx}
            helperText="One term per line. Rendered as a numbered list in the invoice T&C block." />
        </Grid>
      </Grid>
    </SectionCard>
  );

  const complianceSection = (
    <SectionCard
      id="compliance"
      title="Tax compliance"
      subtitle="Turn on statutory features. IRP / EWB integrations run in mock mode until real credentials are wired."
      action={<Chip label="CBIC compliant" size="small" color="success" variant="outlined"
                   sx={{ fontWeight: 700, borderRadius: 1 }} />}
    >
      <Stack spacing={2}>
        <Paper elevation={0} sx={{
          p: 2, borderRadius: 1.5,
          border: '1px solid', borderColor: 'divider',
        }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}
            alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700}>E-Invoicing (IRP)</Typography>
              <Typography variant="caption" color="text.secondary">
                Auto-request IRN + QR from the government IRP on every tax invoice.
                Mandatory for B2B when your annual turnover crosses ₹5 Cr.
              </Typography>
            </Box>
            <Switch checked={!!shopData.eInvoicingEnabled}
              onChange={handleBooleanChange('eInvoicingEnabled')} />
          </Stack>
        </Paper>
        <Paper elevation={0} sx={{
          p: 2, borderRadius: 1.5,
          border: '1px solid', borderColor: 'divider',
        }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}
            alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700}>E-Way Bill</Typography>
              <Typography variant="caption" color="text.secondary">
                Generate an EWB on interstate shipments above ₹50,000.
              </Typography>
            </Box>
            <Switch checked={!!shopData.eWayBillEnabled}
              onChange={handleBooleanChange('eWayBillEnabled')} />
          </Stack>
        </Paper>
        <Paper elevation={0} sx={{
          p: 2, borderRadius: 1.5,
          border: '1px solid', borderColor: 'divider',
        }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}
            alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700}>Digital signature (DSC)</Typography>
              <Typography variant="caption" color="text.secondary">
                Attach a Class-3 DSC to every generated PDF for tamper-evidence.
              </Typography>
            </Box>
            <Switch checked={!!shopData.digitalSigningEnabled}
              onChange={handleBooleanChange('digitalSigningEnabled')} />
          </Stack>
        </Paper>
      </Stack>
    </SectionCard>
  );

  const approvalsSection = (
    <SectionCard
      id="approvals"
      title="Approval policies"
      subtitle="Multi-level approval for purchase orders. Auto-routes above the threshold."
    >
      <Stack spacing={2}>
        <FormControlLabel
          control={<Switch checked={!!shopData.poApprovalRequired}
            onChange={handleBooleanChange('poApprovalRequired')} />}
          label={<Typography variant="body2" fontWeight={700}>Require approval on purchase orders</Typography>}
        />
        {shopData.poApprovalRequired && (
          <TextField
            size="small"
            label="Threshold amount (₹)"
            name="poApprovalThresholdAmount"
            type="number"
            value={shopData.poApprovalThresholdAmount ?? 0}
            onChange={(e) => { setShopData({ ...shopData, poApprovalThresholdAmount: Number(e.target.value) || 0 }); setIsDirty(true); }}
            helperText="POs with grand total ≥ this amount route to Pending Approval on submit. Set 0 to require approval on every PO."
            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            sx={{ maxWidth: 320, ...inputSx }}
          />
        )}

      </Stack>
    </SectionCard>
  );

  const notificationsSection = (
    <SectionCard
      id="notifications"
      title="Notifications"
      subtitle="Daily low-stock digest and inventory alerts."
    >
      <Stack spacing={1.5}>
        <FormControlLabel
          control={<Switch checked={!!shopData.lowStockAlertsEnabled}
            onChange={handleBooleanChange('lowStockAlertsEnabled')} />}
          label={
            <Box>
              <Typography variant="body2" fontWeight={700}>Low-stock email digest</Typography>
              <Typography variant="caption" color="text.secondary">
                Sent to the business email each morning when items drop below their reorder point.
              </Typography>
            </Box>
          }
        />
        <FormControlLabel
          control={<Switch checked={!!shopData.lowStockSmsAlertsEnabled}
            onChange={handleBooleanChange('lowStockSmsAlertsEnabled')} />}
          label={
            <Box>
              <Typography variant="body2" fontWeight={700}>Low-stock SMS alerts</Typography>
              <Typography variant="caption" color="text.secondary">
                SMS to the business phone when items drop below their safety-stock level.
              </Typography>
            </Box>
          }
        />
      </Stack>
    </SectionCard>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{
      bgcolor: 'background.default',
      minHeight: '100vh',
      // Extra bottom padding so the last section's Prev/Next
      // buttons don't sit behind the floating action bar.
      pb: isDirty ? { xs: 14, md: 12 } : 6,
    }} ref={containerRef}>
      {stickyBar}
      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2 } }}>
        <Snackbar open={snackbar.open} autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 1.5 }}>{snackbar.message}</Alert>
        </Snackbar>

        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
          {!isMobile && (
            <Grid item md={3}>
              {leftRail}
            </Grid>
          )}
          {isMobile && (
            <Grid item xs={12}>
              <TextField
                fullWidth size="small" select
                label="Section"
                value={activeSection}
                onChange={(e) => scrollToSection(e.target.value)}
                sx={inputSx}
              >
                {SECTIONS.map((s, i) => (
                  <MenuItem key={s.id} value={s.id}>
                    {i + 1}. {s.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}
          <Grid item xs={12} md={9}>
            {/* Single-section body — user picks a section from the left
                rail; the page never grows past one viewport height, so
                the Save bar stays reachable without scrolling. */}
            {activeSection === 'identity'      && identitySection}
            {activeSection === 'address'       && addressSection}
            {activeSection === 'signatory'     && signatorySection}
            {activeSection === 'banking'       && bankingSection}
            {activeSection === 'invoicing'     && invoicingSection}
            {activeSection === 'compliance'    && complianceSection}
            {activeSection === 'approvals'     && approvalsSection}
            {activeSection === 'notifications' && notificationsSection}

            {/* Prev / next section navigation — helps the user step
                through settings without going back to the rail. */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}
              justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}
              sx={{ mt: 3 }}>
              <Button variant="outlined" disabled={!prevSection}
                onClick={() => prevSection && scrollToSection(prevSection.id)}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}>
                {prevSection ? `← ${prevSection.label}` : '← Previous'}
              </Button>
              <Typography variant="caption" color="text.secondary" fontWeight={700}
                sx={{ letterSpacing: 0.5 }}>
                {activeIndex + 1} of {SECTIONS.length}
              </Typography>
              <Button variant="outlined" disabled={!nextSection}
                onClick={() => nextSection && scrollToSection(nextSection.id)}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}>
                {nextSection ? `${nextSection.label} →` : 'Finish →'}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Container>

      {/* Persistent bottom action bar — always visible while dirty,
          on desktop AND mobile. This is the primary Save affordance
          so the user never has to hunt for it. */}
      <Slide direction="up" in={isDirty} mountOnEnter unmountOnExit>
        <Paper elevation={8} sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: { xs: 1.5, md: 1.75 },
          px: { xs: 2, md: 4 },
          borderRadius: { xs: '16px 16px 0 0', md: 0 },
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          gap: 1.5,
          zIndex: 30,
          bgcolor: 'background.paper',
          alignItems: 'center',
          justifyContent: { xs: 'stretch', md: 'space-between' },
        }}>
          <Stack direction="row" spacing={1.5} alignItems="center"
            sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Box sx={{
              width: 10, height: 10, borderRadius: '50%',
              bgcolor: theme.palette.warning.main,
              animation: 'pulse 1.6s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                '50%':      { transform: 'scale(1.35)', opacity: 0.55 },
              },
            }} />
            <Typography variant="body2" fontWeight={700}>
              You have unsaved changes
            </Typography>
            <Typography variant="caption" color="text.secondary"
              sx={{ display: { xs: 'none', lg: 'inline' } }}>
              · Press ⌘S / Ctrl+S to save quickly
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1.5} sx={{ flexGrow: { xs: 1, md: 0 } }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={saving}
              sx={{
                textTransform: 'none', fontWeight: 700, borderRadius: 1.5,
                minWidth: { xs: 0, md: 120 },
                flexGrow: { xs: 1, md: 0 },
              }}
            >
              Discard
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              sx={{
                textTransform: 'none', fontWeight: 700, borderRadius: 1.5, boxShadow: 'none',
                minWidth: { xs: 0, md: 160 },
                flexGrow: { xs: 1, md: 0 },
                '&:hover': { boxShadow: 'none' },
              }}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </Stack>
        </Paper>
      </Slide>
    </Box>
  );
};

/**
 * The MFA-for-admins policy toggle. Peeks at the current user's MFA
 * status so we can tell them "you don't have MFA yet — enable it before
 * flipping this" instead of letting them save the policy and locking
 * themselves out. Backend also refuses the FALSE → TRUE transition when
 * any active OWNER/ADMIN lacks MFA (defense in depth).
 */
export default SettingsPage;
