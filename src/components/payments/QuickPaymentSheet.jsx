/**
 * QuickPaymentSheet.jsx  — Phase 4A: Mobile Quick-Entry
 *
 * Bottom-sheet form for field-sales reps to record a payment in under 20 s.
 *
 * Design principles:
 *   - 3 fields only: Customer · Amount · Method
 *   - 5 method buttons (no dropdown)
 *   - Large touch targets (min 44 px)
 *   - Recent-customer chips for one-tap selection
 *   - Pre-fill via ?customerId= URL param
 *   - Minimal validation — only required fields
 *   - Offline-safe: queues to localStorage if navigator.onLine === false
 *
 * Props:
 *   open             {boolean}
 *   onClose          {() => void}
 *   onSubmit         {(payload) => Promise<void>}  — caller handles API + toast
 *   recentCustomers  {Array<Customer>}            — already-resolved objects
 *   customers        {Array<Customer>}            — full list for autocomplete
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo, useContext,
} from 'react';
import {
  SwipeableDrawer, Box, Typography, Stack, Chip,
  TextField, InputAdornment, CircularProgress,
  Button, IconButton, Autocomplete, Alert, alpha,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

// Icons
import CloseIcon          from '@mui/icons-material/Close';
import LocalAtmIcon       from '@mui/icons-material/LocalAtm';
import CreditCardIcon     from '@mui/icons-material/CreditCard';
import PhoneAndroidIcon   from '@mui/icons-material/PhoneAndroid';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WifiOffIcon        from '@mui/icons-material/WifiOff';
import FlashOnIcon        from '@mui/icons-material/FlashOn';

import { useAppPalette } from '../../hooks/useAppPalette';

// ── Constants ─────────────────────────────────────────────────────────────────

const METHODS = [
  { value: 'CASH',        label: 'Cash',    Icon: LocalAtmIcon,           color: '#059669' },
  { value: 'UPI',         label: 'UPI',     Icon: PhoneAndroidIcon,       color: '#0f766e' },
  { value: 'CARD',        label: 'Card',    Icon: CreditCardIcon,         color: '#7c3aed' },
  { value: 'NET_BANKING', label: 'Net',     Icon: AccountBalanceIcon,     color: '#0369a1' },
  { value: 'CHEQUE',      label: 'Cheque',  Icon: CheckCircleOutlineIcon, color: '#b45309' },
];

import {
  enqueueQuickPaymentOffline,
  getOfflineQueue,
  clearOfflineQueue,
} from '../../services/offline/quickPaymentQueue';

export { getOfflineQueue, clearOfflineQueue };

function enqueueOffline(payload, authUser) {
  enqueueQuickPaymentOffline(payload, authUser);
}

// ── Component ─────────────────────────────────────────────────────────────────

const QuickPaymentSheet = ({
  open,
  onClose,
  onSubmit,
  recentCustomers = [],
  customers       = [],
}) => {
  const palette        = useAppPalette();
  const muiTheme       = useTheme();
  const isMobile       = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const [searchParams] = useSearchParams();
  const { user: authUser } = useContext(AuthContext) || {};

  // ── Form state ──────────────────────────────────────────────────────────────
  const [customer, setCustomer] = useState(null);
  const [amount,   setAmount]   = useState('');
  const [method,   setMethod]   = useState('CASH');
  const [errors,   setErrors]   = useState({});

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isOnline,   setIsOnline]   = useState(() => navigator.onLine);

  const amountRef = useRef(null);

  // ── Network awareness ────────────────────────────────────────────────────────
  useEffect(() => {
    const up   = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener('online',  up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  // ── Pre-fill from URL param ?customerId=X ───────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const urlCustomerId = searchParams.get('customerId');
    if (!urlCustomerId || !customers.length) return;

    const found = customers.find((c) => String(c.id) === String(urlCustomerId));
    if (found) {
      setCustomer(found);
      // Jump focus to amount
      setTimeout(() => amountRef.current?.focus(), 120);
    }
  }, [open, searchParams, customers]);

  // ── Auto-focus first empty field on open ────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (!customer) return; // Autocomplete manages its own focus
    setTimeout(() => amountRef.current?.focus(), 120);
  }, [open, customer]);

  // ── Reset on close ───────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setCustomer(null);
    setAmount('');
    setMethod('CASH');
    setErrors({});
    setSubmitError('');
    setSubmitting(false);
  }, []);

  useEffect(() => {
    if (!open) {
      // Small delay so the close animation finishes first
      const t = setTimeout(reset, 300);
      return () => clearTimeout(t);
    }
  }, [open, reset]);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const recentList = useMemo(() => {
    // Deduplicate and limit to 5 chips
    const seen = new Set();
    return recentCustomers.filter((c) => {
      if (!c?.id || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    }).slice(0, 5);
  }, [recentCustomers]);

  // All customers available in autocomplete, recent ones first
  const orderedCustomers = useMemo(() => {
    const recentIds = new Set(recentList.map((c) => c.id));
    const recent    = customers.filter((c) => recentIds.has(c.id));
    const rest      = customers.filter((c) => !recentIds.has(c.id));
    return [...recent, ...rest];
  }, [customers, recentList]);

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = useCallback(() => {
    const errs = {};
    if (!customer) errs.customer = 'Select a customer';
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) errs.amount = 'Enter a valid amount';
    return errs;
  }, [customer, amount]);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setErrors({});
    setSubmitError('');
    setSubmitting(true);

    const payload = {
      customerId:    customer.id,
      customerName:  customer.name,
      amount:        parseFloat(amount),
      paymentMethod: method,
      paymentDate:   new Date().toISOString(),
      isBulk:        true,  // Quick entry always does bulk/advance allocation
    };

    // Offline queue
    if (!isOnline) {
      enqueueOffline(payload, authUser);
      setSubmitting(false);
      onClose();
      return;
    }

    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Payment failed. Try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [validate, customer, amount, method, isOnline, onSubmit, onClose]);

  // ── Enter key submits ────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // ── Render ───────────────────────────────────────────────────────────────────

  const drawerBleeding = 0;
  const sheetRadius    = 20;

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onOpen={() => {}}
      onClose={onClose}
      disableBackdropTransition={!isMobile}
      disableDiscovery={isMobile}
      swipeAreaWidth={drawerBleeding}
      ModalProps={{ keepMounted: false }}
      PaperProps={{
        sx: {
          borderTopLeftRadius:  sheetRadius,
          borderTopRightRadius: sheetRadius,
          overflow: 'visible',
          maxHeight: '92dvh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      sx={{
        '& .MuiDrawer-paper': {
          borderTopLeftRadius:  sheetRadius,
          borderTopRightRadius: sheetRadius,
        },
      }}
    >
      {/* ── Drag handle ─────────────────────────────────────────────────────── */}
      <Box
        sx={{
          pt: 1.25,
          pb: 0.5,
          display: 'flex',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 4,
            bgcolor: 'divider',
            borderRadius: 4,
          }}
        />
      </Box>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2.5, pb: 1.5, flexShrink: 0 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              p: 0.75,
              borderRadius: 1.5,
              bgcolor: alpha(palette.primary, 0.12),
              display: 'flex',
            }}
          >
            <FlashOnIcon sx={{ fontSize: 18, color: palette.primary }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={900} sx={{ lineHeight: 1.2 }}>
              Quick Payment
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Bulk allocation — fastest entry
            </Typography>
          </Box>
        </Stack>

        <IconButton
          size="small"
          onClick={onClose}
          aria-label="Close quick payment"
          sx={{
            minWidth: 44,
            minHeight: 44,
            borderRadius: 2,
            color: 'text.secondary',
            '&:hover': { bgcolor: alpha(palette.danger, 0.08), color: palette.danger },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* ── Offline banner ──────────────────────────────────────────────────── */}
      {!isOnline && (
        <Box sx={{ px: 2.5, pb: 1, flexShrink: 0 }}>
          <Alert
            icon={<WifiOffIcon fontSize="inherit" />}
            severity="warning"
            sx={{ borderRadius: 2, py: 0.5, fontSize: '0.8rem', fontWeight: 700 }}
          >
            Offline — payment will be queued and synced when back online
          </Alert>
        </Box>
      )}

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          overflowY: 'auto',
          flex: 1,
          px: 2.5,
          pb: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
        }}
        onKeyDown={handleKeyDown}
      >

        {/* ── Field 1: Customer ──────────────────────────────────────────────── */}
        <Box>
          <Typography
            variant="caption"
            fontWeight={800}
            color="text.secondary"
            sx={{ mb: 0.75, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.68rem' }}
          >
            Customer
          </Typography>

          <Autocomplete
            options={orderedCustomers}
            getOptionLabel={(o) => o?.name || ''}
            isOptionEqualToValue={(o, v) => String(o.id) === String(v?.id)}
            value={customer}
            onChange={(_, v) => {
              setCustomer(v);
              setErrors((p) => ({ ...p, customer: undefined }));
              // Auto-focus amount after customer selected
              setTimeout(() => amountRef.current?.focus(), 60);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search customer…"
                error={!!errors.customer}
                helperText={errors.customer}
                size="medium"
                InputProps={{
                  ...params.InputProps,
                  sx: {
                    borderRadius: 2.5,
                    minHeight: 52,
                    fontSize: '1rem',
                    fontWeight: 700,
                  },
                }}
              />
            )}
            renderOption={(props, option) => {
              const isRecent = recentList.some((r) => String(r.id) === String(option.id));
              return (
                <li {...props} key={option.id}>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%', py: 0.25 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: isRecent ? alpha(palette.primary, 0.14) : 'action.hover',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        color: isRecent ? palette.primary : 'text.secondary',
                      }}
                    >
                      {(option.name || '?')[0].toUpperCase()}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700} noWrap>
                        {option.name}
                        {isRecent && (
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{
                              ml: 0.75,
                              px: 0.75,
                              py: 0.1,
                              borderRadius: 1,
                              bgcolor: alpha(palette.primary, 0.1),
                              color: palette.primary,
                              fontWeight: 800,
                              fontSize: '0.6rem',
                              verticalAlign: 'middle',
                            }}
                          >
                            Recent
                          </Typography>
                        )}
                      </Typography>
                      {option.phone && (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {option.phone}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </li>
              );
            }}
            noOptionsText="No customers found"
            autoHighlight
            openOnFocus
          />

          {/* Recent customer chips */}
          {recentList.length > 0 && !customer && (
            <Stack direction="row" spacing={0.75} sx={{ mt: 1.25, flexWrap: 'wrap', gap: 0.75 }}>
              {recentList.map((c) => (
                <Chip
                  key={c.id}
                  label={c.name}
                  size="small"
                  onClick={() => {
                    setCustomer(c);
                    setErrors((p) => ({ ...p, customer: undefined }));
                    setTimeout(() => amountRef.current?.focus(), 60);
                  }}
                  sx={{
                    height: 30,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    bgcolor: alpha(palette.primary, 0.08),
                    color: palette.primary,
                    border: `1px solid ${alpha(palette.primary, 0.2)}`,
                    '&:hover': {
                      bgcolor: alpha(palette.primary, 0.15),
                      borderColor: palette.primary,
                    },
                  }}
                />
              ))}
            </Stack>
          )}
        </Box>

        {/* ── Field 2: Amount ────────────────────────────────────────────────── */}
        <Box>
          <Typography
            variant="caption"
            fontWeight={800}
            color="text.secondary"
            sx={{ mb: 0.75, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.68rem' }}
          >
            Amount
          </Typography>
          <TextField
            inputRef={amountRef}
            fullWidth
            placeholder="0.00"
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setErrors((p) => ({ ...p, amount: undefined }));
            }}
            error={!!errors.amount}
            helperText={errors.amount}
            inputProps={{ min: 0, step: 'any' }}
            onKeyDown={(e) => {
              if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
              if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography
                    fontWeight={900}
                    sx={{ fontSize: '1.2rem', color: amount ? palette.primary : 'text.disabled' }}
                  >
                    ₹
                  </Typography>
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2.5,
                minHeight: 56,
                fontSize: '1.4rem',
                fontWeight: 900,
                letterSpacing: '-0.5px',
              },
            }}
          />
        </Box>

        {/* ── Field 3: Payment Method (5 buttons) ───────────────────────────── */}
        <Box>
          <Typography
            variant="caption"
            fontWeight={800}
            color="text.secondary"
            sx={{ mb: 0.75, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.68rem' }}
          >
            Payment Method
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {METHODS.map(({ value, label, Icon, color }) => {
              const selected = method === value;
              return (
                <Button
                  key={value}
                  variant={selected ? 'contained' : 'outlined'}
                  onClick={() => setMethod(value)}
                  startIcon={<Icon sx={{ fontSize: '1.1rem !important' }} />}
                  sx={{
                    minHeight: 46,
                    px: 1.5,
                    py: 0,
                    borderRadius: 2.5,
                    textTransform: 'none',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    flex: '1 1 auto',
                    minWidth: 72,
                    transition: 'all 0.18s ease',
                    ...(selected
                      ? {
                          bgcolor: color,
                          borderColor: color,
                          color: '#fff',
                          boxShadow: `0 4px 12px ${alpha(color, 0.35)}`,
                          '&:hover': { bgcolor: color, filter: 'brightness(0.92)' },
                        }
                      : {
                          borderColor: alpha(color, 0.35),
                          color: color,
                          bgcolor: alpha(color, 0.04),
                          '&:hover': {
                            bgcolor: alpha(color, 0.1),
                            borderColor: color,
                          },
                        }),
                  }}
                >
                  {label}
                </Button>
              );
            })}
          </Stack>
        </Box>

        {/* ── Submit error ─────────────────────────────────────────────────────── */}
        {submitError && (
          <Alert severity="error" sx={{ borderRadius: 2, fontSize: '0.85rem', fontWeight: 700 }}>
            {submitError}
          </Alert>
        )}
      </Box>

      {/* ── Submit button (sticky footer) ───────────────────────────────────── */}
      <Box
        sx={{
          px: 2.5,
          pt: 1.5,
          pb: `max(1.5rem, env(safe-area-inset-bottom))`,
          flexShrink: 0,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={submitting}
          sx={{
            minHeight: 54,
            borderRadius: 3,
            fontWeight: 900,
            fontSize: '1rem',
            textTransform: 'none',
            letterSpacing: '0.2px',
            background: submitting
              ? undefined
              : `linear-gradient(135deg, ${palette.primaryDark} 0%, ${palette.primary} 60%, ${palette.tealLight} 100%)`,
            boxShadow: submitting ? 'none' : `0 6px 20px ${alpha(palette.primary, 0.4)}`,
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: `0 10px 28px ${alpha(palette.primary, 0.5)}`,
            },
            '&:active': { transform: 'translateY(0)' },
          }}
        >
          {submitting ? (
            <Stack direction="row" alignItems="center" spacing={1}>
              <CircularProgress size={20} color="inherit" />
              <span>Processing…</span>
            </Stack>
          ) : !isOnline ? (
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <WifiOffIcon fontSize="small" />
              <span>
                Queue Payment
                {customer && amount ? ` — ₹${Number(amount).toLocaleString('en-IN')}` : ''}
              </span>
            </Stack>
          ) : (
            `Record Payment${customer && amount ? ` — ₹${Number(amount).toLocaleString('en-IN')}` : ''}`
          )}
        </Button>
      </Box>
    </SwipeableDrawer>
  );
};

export default QuickPaymentSheet;
