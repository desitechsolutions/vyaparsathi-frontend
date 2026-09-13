/**
 * PaymentWizard.jsx
 *
 * Production-grade 3-step linear wizard for recording customer payments.
 *
 * Step 1 — Customer
 *   Autocomplete search + "Recent customers" quick-pick row
 *
 * Step 2 — Invoice & Amount
 *   Invoice card grid for selected customer
 *   "Pay in Full" quick-fill + amount input
 *   Due amount display with live balance indicator
 *
 * Step 3 — Method & Confirm
 *   Payment method chip-selector
 *   Transaction / UTR ID (when required)
 *   Date + optional notes
 *   Summary card + submit button
 *
 * Design:
 *   Mobile-first (375px+) · MUI v5 · useAppPalette() for theme tokens
 *   Accessible: ARIA labels, keyboard navigation, 44px min touch targets
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box, Button, Stepper, Step, StepLabel, StepConnector,
  Typography, Stack, Card, CardContent, CardActionArea,
  Autocomplete, TextField, Chip, Paper, Divider,
  InputAdornment, alpha, Skeleton, Alert, Grid,
  IconButton, Tooltip, LinearProgress, CircularProgress,
  Collapse, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Icons
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaymentsIcon from '@mui/icons-material/Payments';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import EventIcon from '@mui/icons-material/Event';
import NotesIcon from '@mui/icons-material/Notes';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LayersIcon from '@mui/icons-material/Layers';

import { useAppPalette }            from '../../hooks/useAppPalette';
import useDuplicateCheck            from '../../hooks/useDuplicateCheck';
import DuplicatePaymentWarning      from './DuplicatePaymentWarning';
import PaymentAllocationGrid from './PaymentAllocationGrid';

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Customer',  icon: PersonSearchIcon },
  { label: 'Invoice',   icon: ReceiptLongIcon },
  { label: 'Confirm',   icon: PaymentsIcon },
];

const METHOD_META = {
  CASH:        { label: 'Cash',        color: '#059669', bg: '#dcfce7', darkBg: '#065f46', Icon: LocalAtmIcon },
  CARD:        { label: 'Card',        color: '#7c3aed', bg: '#ede9fe', darkBg: '#4c1d95', Icon: CreditCardIcon },
  UPI:         { label: 'UPI',         color: '#0f766e', bg: '#ccfbf1', darkBg: '#134e4a', Icon: PhoneAndroidIcon },
  NET_BANKING: { label: 'Net Banking', color: '#2563eb', bg: '#dbeafe', darkBg: '#1e3a8a', Icon: AccountBalanceIcon },
  CHEQUE:      { label: 'Cheque',      color: '#b45309', bg: '#fef3c7', darkBg: '#78350f', Icon: CheckBoxOutlineBlankIcon },
};

const PAYMENT_METHOD_OPTIONS = ['CASH', 'CARD', 'UPI', 'NET_BANKING', 'CHEQUE'];
const NEEDS_TXID = new Set(['CARD', 'UPI', 'NET_BANKING', 'CHEQUE']);

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const today = () => new Date().toISOString().slice(0, 16);

// ── Styled: Custom step connector ─────────────────────────────────────────────

const WizardConnector = styled(StepConnector)(({ theme }) => ({
  '&.Mui-active .MuiStepConnector-line': {
    backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
  },
  '&.Mui-completed .MuiStepConnector-line': {
    backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
  },
  '& .MuiStepConnector-line': {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.divider,
    borderRadius: 4,
  },
}));

// ── Styled: Step icon ─────────────────────────────────────────────────────────

const StepIconRoot = styled('div')(({ theme, ownerState }) => ({
  width: 40,
  height: 40,
  display: 'flex',
  borderRadius: '50%',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.3s ease',
  ...(ownerState.active && {
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
    boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
    color: '#fff',
  }),
  ...(ownerState.completed && {
    background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, #34d399 100%)`,
    color: '#fff',
  }),
  ...(!ownerState.active && !ownerState.completed && {
    backgroundColor: theme.palette.mode === 'dark' ? '#2d3748' : '#e2e8f0',
    color: theme.palette.text.secondary,
  }),
}));

const WizardStepIcon = ({ active, completed, icon }) => {
  const StepConfig = STEPS[icon - 1];
  const Icon = StepConfig?.icon;
  return (
    <StepIconRoot ownerState={{ active, completed }}>
      {completed ? (
        <CheckCircleIcon sx={{ fontSize: 20 }} />
      ) : (
        Icon ? <Icon sx={{ fontSize: 20 }} /> : <span>{icon}</span>
      )}
    </StepIconRoot>
  );
};

// ── Sub-component: Invoice card ───────────────────────────────────────────────

const InvoiceCard = ({ sale, selected, onSelect, formatAmount }) => {
  const theme = useAppPalette();
  const paidPct = sale.totalAmount > 0
    ? Math.min(100, ((sale.totalAmount - sale.dueAmount) / sale.totalAmount) * 100)
    : 0;
  const isFullyPaid = sale.dueAmount <= 0;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2.5,
        border: `2px solid`,
        borderColor: selected
          ? theme.primary
          : isFullyPaid
            ? alpha('#059669', 0.3)
            : alpha(theme.primary, 0.15),
        bgcolor: selected
          ? alpha(theme.primary, 0.05)
          : 'background.paper',
        cursor: isFullyPaid ? 'default' : 'pointer',
        opacity: isFullyPaid ? 0.65 : 1,
        transition: 'all 0.2s ease',
        '&:hover': !isFullyPaid ? {
          borderColor: theme.primary,
          bgcolor: alpha(theme.primary, 0.04),
          transform: 'translateY(-1px)',
          boxShadow: `0 4px 12px ${alpha(theme.primary, 0.12)}`,
        } : {},
      }}
      onClick={() => !isFullyPaid && onSelect(sale.saleId)}
      role="radio"
      aria-checked={selected}
      aria-label={`Invoice ${sale.invoiceNo}, due ${formatAmount(sale.dueAmount)}`}
      tabIndex={isFullyPaid ? -1 : 0}
      onKeyDown={(e) => { if (!isFullyPaid && (e.key === 'Enter' || e.key === ' ')) onSelect(sale.saleId); }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={800} noWrap sx={{ fontSize: '0.85rem' }}>
              {sale.invoiceNo}
            </Typography>
            {sale.saleDate && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                {new Date(sale.saleDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Typography>
            )}
          </Box>

          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
            {isFullyPaid ? (
              <Chip
                label="Paid"
                size="small"
                icon={<CheckCircleIcon style={{ fontSize: 12, color: '#059669' }} />}
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#dcfce7', color: '#059669', border: '1px solid #a7f3d0' }}
              />
            ) : (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>
                  Due
                </Typography>
                <Typography
                  variant="subtitle2"
                  fontWeight={900}
                  sx={{ color: '#dc2626', fontSize: '0.9rem', lineHeight: 1.2 }}
                >
                  {formatAmount(sale.dueAmount)}
                </Typography>
              </>
            )}
          </Box>
        </Stack>

        {/* Progress bar */}
        {!isFullyPaid && (
          <Box sx={{ mt: 1.5 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                Total {formatAmount(sale.totalAmount)}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 700, color: theme.primary }}>
                {Math.round(paidPct)}% collected
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={paidPct}
              sx={{
                height: 5,
                borderRadius: 3,
                bgcolor: alpha(theme.primary, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  bgcolor: theme.primary,
                },
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// ── Sub-component: Bulk payment option ───────────────────────────────────────

const BulkOption = ({ selected, onSelect, totalDue, formatAmount }) => {
  const theme = useAppPalette();
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2.5,
        border: `2px solid`,
        borderColor: selected ? '#d97706' : alpha('#d97706', 0.25),
        bgcolor: selected ? alpha('#d97706', 0.06) : 'background.paper',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: '#d97706',
          bgcolor: alpha('#d97706', 0.04),
          transform: 'translateY(-1px)',
          boxShadow: `0 4px 12px ${alpha('#d97706', 0.12)}`,
        },
      }}
      onClick={() => onSelect('BULK')}
      role="radio"
      aria-checked={selected}
      aria-label="Pay all pending invoices in bulk"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect('BULK'); }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{
            p: 1, borderRadius: 1.5, bgcolor: alpha('#d97706', 0.12),
            display: 'flex', alignItems: 'center', flexShrink: 0
          }}>
            <FlashOnIcon sx={{ fontSize: 20, color: '#d97706' }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ fontSize: '0.85rem', color: '#d97706' }}>
              All Pending Invoices (Bulk)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
              FIFO settlement · Excess held as advance credit
            </Typography>
          </Box>
          {totalDue > 0 && (
            <Typography variant="subtitle2" fontWeight={900} sx={{ color: '#dc2626', fontSize: '0.9rem', flexShrink: 0 }}>
              {formatAmount(totalDue)}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

/**
 * PaymentWizard
 *
 * Props:
 *   customers         {Array}    Full customer list
 *   allSales          {Array}    All sales with dueAmount
 *   submitting        {boolean}  true while API call in flight
 *   onSubmit          {Function(payload)} called with { customerId, saleId, amount, paymentMethod, transactionId, paymentDate, notes }
 *   recentCustomerIds {number[]} IDs of recently used customers (for quick-pick)
 *   onCustomerChange  {Function(customer|null)} called whenever the wizard's selected customer changes
 */
const PaymentWizard = ({
  customers = [],
  allSales = [],
  submitting = false,
  onSubmit,
  recentCustomerIds = [],
  initialCustomer = null,
  initialSaleId = null,
  onCustomerChange,
}) => {
  const theme = useAppPalette();

  // ── Wizard state ─────────────────────────────────────────────────────────

  const [step, setStep] = useState(
    initialCustomer ? (initialSaleId ? 2 : 1) : 0
  );

  // Step 1
  const [selectedCustomer, setSelectedCustomer] = useState(initialCustomer || null);

  // Step 2 — mode toggle
  // 'single' uses the existing single-invoice picker
  // 'multi'  uses PaymentAllocationGrid
  const [invoiceMode, setInvoiceMode] = useState('single');

  // Step 2 — single invoice
  const [selectedSaleId, setSelectedSaleId] = useState(initialSaleId || null);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');

  // Step 2 — multi invoice allocations
  // allocations: [{ saleId, amount }]
  const [multiAllocations, setMultiAllocations] = useState([]);
  const [multiAmountError, setMultiAmountError] = useState('');

  // Step 3
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [transactionId, setTransactionId] = useState('');
  const [txError, setTxError] = useState('');
  const [paymentDate, setPaymentDate] = useState(today);
  const [notes, setNotes] = useState('');

  // Duplicate-check acknowledgement — reset whenever the key payment fields change
  const [duplicateAcknowledged, setDuplicateAcknowledged] = useState(false);

  // ── Duplicate payment detection (Step 3) ─────────────────────────────────

  const { isDuplicate, previousPayment, loading: dupLoading, error: dupError } =
    useDuplicateCheck({
      customerId:    selectedCustomer?.id,
      // Pass raw amount string — the hook parses it internally.
      // Using the string avoids a temporal dead zone: parsedAmount is
      // declared further down in the same function body.
      amount:        amount,
      method:        paymentMethod,
      transactionId: transactionId || undefined,
      date:          paymentDate,
    });

  // Reset acknowledged flag whenever the payment details the user enters change.
  useEffect(() => {
    setDuplicateAcknowledged(false);
  }, [selectedCustomer?.id, amount, paymentMethod, transactionId]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const customerSales = useMemo(() => {
    if (!selectedCustomer) return [];
    return allSales.filter((s) => String(s.customerId) === String(selectedCustomer.id));
  }, [selectedCustomer, allSales]);

  const pendingSales = useMemo(
    () => customerSales.filter((s) => (s.dueAmount || 0) > 0),
    [customerSales]
  );

  const totalDue = useMemo(
    () => customerSales.reduce((sum, s) => sum + (s.dueAmount || 0), 0),
    [customerSales]
  );

  const selectedSaleObj = useMemo(
    () => customerSales.find((s) => String(s.saleId) === String(selectedSaleId)),
    [customerSales, selectedSaleId]
  );

  const isBulk = selectedSaleId === 'BULK';
  const dueForSelected = isBulk ? totalDue : (selectedSaleObj?.dueAmount || 0);
  const parsedAmount = parseFloat(amount) || 0;
  const remaining = isBulk ? 0 : dueForSelected - parsedAmount;
  const isOverpaid = !isBulk && parsedAmount > 0 && remaining < -0.001;

  const recentCustomers = useMemo(() => {
    if (!recentCustomerIds?.length) return [];
    return recentCustomerIds
      .map((id) => customers.find((c) => String(c.id) === String(id)))
      .filter(Boolean)
      .slice(0, 4);
  }, [customers, recentCustomerIds]);

  // ── Navigation ────────────────────────────────────────────────────────────

  const canGoToStep2 = !!selectedCustomer;

  // Total allocated in multi mode
  const multiTotalAllocated = useMemo(
    () => multiAllocations.reduce((sum, a) => sum + (a.amount || 0), 0),
    [multiAllocations]
  );

  const canGoToStep3 = invoiceMode === 'multi'
    ? multiAllocations.length > 0 && multiTotalAllocated > 0 && !multiAmountError
    : !!selectedSaleId && parsedAmount > 0 && !amountError;

  const handleStep1Next = useCallback(() => {
    if (!selectedCustomer) return;
    setStep(1);
  }, [selectedCustomer]);

  const handleStep2Next = useCallback(() => {
    if (invoiceMode === 'multi') {
      if (multiAllocations.length === 0 || multiTotalAllocated <= 0) {
        setMultiAmountError('Select at least one invoice and enter an allocation amount');
        return;
      }
      if (multiTotalAllocated > parsedAmount + 0.001) {
        setMultiAmountError(
          `Total allocated (${formatCurrency(multiTotalAllocated)}) exceeds payment amount (${formatCurrency(parsedAmount)})`
        );
        return;
      }
      setMultiAmountError('');
      setStep(2);
      return;
    }
    // single mode
    if (!selectedSaleId) return;
    if (parsedAmount <= 0) {
      setAmountError('Enter an amount greater than 0');
      return;
    }
    setAmountError('');
    setStep(2);
  }, [invoiceMode, selectedSaleId, parsedAmount, multiAllocations, multiTotalAllocated]);

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  // ── Submission ────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    // Validate txid
    if (NEEDS_TXID.has(paymentMethod) && !transactionId.trim()) {
      setTxError('Transaction / UTR ID is required for this payment method');
      return;
    }
    setTxError('');

    if (invoiceMode === 'multi') {
      const payload = {
        customerId:        selectedCustomer.id,
        isMultiAllocation: true,
        allocations:       multiAllocations,
        amount:            parsedAmount,
        paymentMethod,
        transactionId:     transactionId.trim() || undefined,
        paymentDate,
        notes:             notes.trim() || undefined,
        // Audit trail — user explicitly acknowledged a possible duplicate.
        ...(duplicateAcknowledged ? { duplicateOverride: true } : {}),
      };
      await onSubmit(payload);
      return;
    }

    const payload = {
      customerId:    selectedCustomer.id,
      saleId:        isBulk ? null : selectedSaleId,
      isBulk,
      amount:        parsedAmount,
      paymentMethod,
      transactionId: transactionId.trim() || undefined,
      paymentDate,
      notes:         notes.trim() || undefined,
      // Audit trail — user explicitly acknowledged a possible duplicate.
      ...(duplicateAcknowledged ? { duplicateOverride: true } : {}),
    };
    await onSubmit(payload);
  }, [
    invoiceMode, selectedCustomer, selectedSaleId, isBulk, parsedAmount,
    multiAllocations, paymentMethod, transactionId, paymentDate, notes,
    duplicateAcknowledged, onSubmit,
  ]);

  // ── Reset (called after successful submit from parent) ────────────────────

  // ── Render helpers ────────────────────────────────────────────────────────

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      bgcolor: 'background.paper',
      '& fieldset': { borderColor: 'divider' },
      '&:hover fieldset': { borderColor: theme.primary },
      '&.Mui-focused fieldset': { borderColor: theme.primary, borderWidth: 2 },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: theme.primary },
  };

  // ── Step 1: Customer ──────────────────────────────────────────────────────

  const renderStep1 = () => (
    <Box>
      <Typography variant="h6" fontWeight={800} gutterBottom sx={{ mb: 0.5, fontSize: '1rem' }}>
        Who is paying?
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, fontSize: '0.88rem' }}>
        Search by name or phone number
      </Typography>

      <Autocomplete
        options={customers}
        getOptionLabel={(o) => `${o.name}${o.phone ? ` · ${o.phone}` : ''}`}
        value={selectedCustomer}
        onChange={(_, v) => {
          setSelectedCustomer(v);
          setSelectedSaleId(null);
          setAmount('');
          if (typeof onCustomerChange === 'function') onCustomerChange(v);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search customer"
            placeholder="Type a name or phone…"
            sx={inputSx}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="start">
                    <PersonSearchIcon sx={{ color: theme.primary, fontSize: 20 }} />
                  </InputAdornment>
                  {params.InputProps.startAdornment}
                </>
              ),
            }}
            inputProps={{
              ...params.inputProps,
              'aria-label': 'Search customer by name or phone',
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props} sx={{ py: 1, px: 1.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{
                width: 32, height: 32, borderRadius: '50%',
                bgcolor: alpha(theme.primary, 0.12),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <PersonIcon sx={{ fontSize: 16, color: theme.primary }} />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.88rem' }}>
                  {option.name}
                </Typography>
                {option.phone && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                    {option.phone}
                  </Typography>
                )}
              </Box>
            </Stack>
          </Box>
        )}
        isOptionEqualToValue={(opt, val) => String(opt.id) === String(val?.id)}
        noOptionsText="No customers found"
        fullWidth
      />

      {/* Recent customers quick-pick */}
      {recentCustomers.length > 0 && !selectedCustomer && (
        <Box sx={{ mt: 2.5 }}>
          <Typography
            id="recent-customers-label"
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: '0.6px', fontSize: '0.68rem', display: 'block', mb: 1 }}
          >
            Recent
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            role="group"
            aria-labelledby="recent-customers-label"
          >
            {recentCustomers.map((c) => (
              <Chip
                key={c.id}
                icon={<StarIcon style={{ fontSize: 13 }} aria-hidden="true" />}
                label={c.name}
                size="small"
                aria-label={`Select recent customer: ${c.name}`}
                onClick={() => {
                  setSelectedCustomer(c);
                  if (typeof onCustomerChange === 'function') onCustomerChange(c);
                }}
                sx={{
                  height: 32,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  bgcolor: alpha(theme.primary, 0.08),
                  color: theme.primary,
                  border: `1px solid ${alpha(theme.primary, 0.2)}`,
                  '&:hover': { bgcolor: alpha(theme.primary, 0.15) },
                  '& .MuiChip-icon': { color: theme.primary },
                }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Selected customer summary */}
      {selectedCustomer && (
        <Collapse in={!!selectedCustomer}>
          <Paper
            elevation={0}
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.primary, 0.05),
              border: `1.5px solid ${alpha(theme.primary, 0.2)}`,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{
                width: 40, height: 40, borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <PersonIcon sx={{ fontSize: 20, color: '#fff' }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={800} noWrap>
                  {selectedCustomer.name}
                </Typography>
                {selectedCustomer.phone && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {selectedCustomer.phone}
                  </Typography>
                )}
              </Box>
              {totalDue > 0 && (
                <Chip
                  label={`Due: ${formatCurrency(totalDue)}`}
                  size="small"
                  sx={{
                    height: 24, fontSize: '0.72rem', fontWeight: 800,
                    bgcolor: alpha('#dc2626', 0.1), color: '#dc2626',
                    border: `1px solid ${alpha('#dc2626', 0.2)}`
                  }}
                />
              )}
            </Stack>
          </Paper>
        </Collapse>
      )}
    </Box>
  );

  // ── Step 2: Invoice + Amount ──────────────────────────────────────────────

  const renderStep2 = () => (
    <Box>
      <Typography variant="h6" fontWeight={800} gutterBottom sx={{ mb: 0.5, fontSize: '1rem' }}>
        Select invoice & amount
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.88rem' }}>
        {selectedCustomer?.name} · {pendingSales.length} pending invoice{pendingSales.length !== 1 ? 's' : ''}
      </Typography>

      {/* ── Mode toggle: Single vs Multi ────────────────────────────── */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{
          textTransform: 'uppercase', letterSpacing: '0.6px', fontSize: '0.68rem', display: 'block', mb: 1,
        }}>
          Payment Type
        </Typography>
        <ToggleButtonGroup
          value={invoiceMode}
          exclusive
          onChange={(_, v) => {
            if (!v) return; // prevent deselect
            setInvoiceMode(v);
            // Clear the other mode's state
            setMultiAllocations([]);
            setMultiAmountError('');
            setSelectedSaleId(null);
            setAmount('');
            setAmountError('');
          }}
          aria-label="Invoice payment mode"
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              border: `1.5px solid ${alpha(theme.primary, 0.25)}`,
              borderRadius: '10px !important',
              px: 2,
              minHeight: 44,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              color: 'text.secondary',
              gap: 0.75,
              '&.Mui-selected': {
                bgcolor: alpha(theme.primary, 0.1),
                color: theme.primary,
                borderColor: `${theme.primary} !important`,
              },
              '&:hover': { bgcolor: alpha(theme.primary, 0.05) },
            },
            gap: 1,
          }}
        >
          <ToggleButton value="single" aria-label="Pay single invoice">
            <ReceiptIcon sx={{ fontSize: 17 }} />
            Single Invoice
          </ToggleButton>
          <ToggleButton value="multi" aria-label="Pay multiple invoices">
            <LayersIcon sx={{ fontSize: 17 }} />
            Multiple Invoices
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* ── Multi-invoice mode ───────────────────────────────────────── */}
      {invoiceMode === 'multi' && (
        <Box>
          {/* Total payment amount input appears first in multi mode */}
          <Box sx={{ mb: 2.5 }}>
            <TextField
              fullWidth
              id="payment-amount-multi"
              label="Total Payment Amount (₹)"
              type="number"
              value={amount}
              error={!!amountError}
              helperText={amountError || 'Enter the total amount received — then allocate below'}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9.]/g, '');
                const val = parseFloat(raw);
                setAmount(isNaN(val) ? '' : String(Math.max(0, val)));
                setAmountError('');
                setMultiAmountError('');
              }}
              onKeyDown={(e) => {
                if (['-', 'e', 'E'].includes(e.key)) e.preventDefault();
              }}
              inputProps={{
                min: 0,
                step: 'any',
                'aria-label': 'Total payment amount in rupees',
                'aria-required': 'true',
                'aria-invalid': !!amountError,
                'aria-describedby': 'payment-amount-multi-helper-text',
              }}
              FormHelperTextProps={{ id: 'payment-amount-multi-helper-text' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography aria-hidden="true" fontWeight={800} sx={{ color: theme.primary, fontSize: '1.1rem' }}>₹</Typography>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  '& fieldset': { borderColor: amountError ? 'error.main' : 'divider' },
                  '&:hover fieldset': { borderColor: amountError ? 'error.main' : theme.primary },
                  '&.Mui-focused fieldset': { borderColor: amountError ? 'error.main' : theme.primary, borderWidth: 2 },
                },
              }}
            />
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{
            textTransform: 'uppercase', letterSpacing: '0.6px', fontSize: '0.68rem', display: 'block', mb: 1.5,
          }}>
            Allocate across invoices
          </Typography>

          <PaymentAllocationGrid
            customerSales={pendingSales}
            totalPayment={parsedAmount}
            onAllocationChange={(allocs) => {
              setMultiAllocations(allocs);
              setMultiAmountError('');
            }}
          />

          {multiAmountError && (
            <Alert
              severity="error"
              role="alert"
              icon={<WarningAmberIcon fontSize="small" aria-hidden="true" />}
              sx={{ mt: 1.5, borderRadius: 2, fontSize: '0.8rem', py: 0.75 }}
            >
              {multiAmountError}
            </Alert>
          )}
        </Box>
      )}

      {/* ── Single-invoice mode (original UI) ───────────────────────── */}
      {invoiceMode === 'single' && (
        <Box>
          {/* Invoice card grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1.5,
              mb: 2.5,
              maxHeight: { xs: 260, sm: 320 },
              overflowY: 'auto',
              pr: 0.5,
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
              '&::-webkit-scrollbar-thumb': { bgcolor: alpha(theme.primary, 0.3), borderRadius: 4 },
            }}
            role="radiogroup"
            aria-label="Select invoice"
          >
            <BulkOption
              selected={selectedSaleId === 'BULK'}
              onSelect={setSelectedSaleId}
              totalDue={totalDue}
              formatAmount={formatCurrency}
            />
            {customerSales.map((sale) => (
              <InvoiceCard
                key={sale.saleId}
                sale={sale}
                selected={String(selectedSaleId) === String(sale.saleId)}
                onSelect={setSelectedSaleId}
                formatAmount={formatCurrency}
              />
            ))}
          </Box>

          {/* Amount input */}
          {selectedSaleId && (
            <Collapse in={!!selectedSaleId}>
              <Divider sx={{ mb: 2.5 }} />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start">
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    id="payment-amount-single"
                    label="Payment Amount (₹)"
                    type="number"
                    value={amount}
                    error={!!amountError || isOverpaid}
                    helperText={
                      amountError ||
                      (isOverpaid ? `Overpaying by ${formatCurrency(Math.abs(remaining))}` : null)
                    }
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9.]/g, '');
                      const val = parseFloat(raw);
                      setAmount(isNaN(val) ? '' : String(Math.max(0, val)));
                      setAmountError('');
                    }}
                    onKeyDown={(e) => {
                      if (['-', 'e', 'E'].includes(e.key)) e.preventDefault();
                    }}
                    inputProps={{
                      min: 0,
                      step: 'any',
                      'aria-label': 'Payment amount in rupees',
                      'aria-required': 'true',
                      'aria-invalid': !!(amountError || isOverpaid),
                      'aria-describedby': (amountError || isOverpaid) ? 'payment-amount-single-helper-text' : undefined,
                    }}
                    FormHelperTextProps={{ id: 'payment-amount-single-helper-text' }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography aria-hidden="true" fontWeight={800} sx={{ color: theme.primary, fontSize: '1.1rem' }}>₹</Typography>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        '& fieldset': { borderColor: amountError || isOverpaid ? 'error.main' : 'divider' },
                        '&:hover fieldset': { borderColor: amountError || isOverpaid ? 'error.main' : theme.primary },
                        '&.Mui-focused fieldset': { borderColor: amountError || isOverpaid ? 'error.main' : theme.primary, borderWidth: 2 },
                      },
                    }}
                  />
                </Box>

                {/* Quick fill chips */}
                {!isBulk && dueForSelected > 0 && (
                  <Stack
                    direction="column"
                    spacing={0.75}
                    sx={{ flexShrink: 0, pt: { xs: 0, sm: 0.75 } }}
                  >
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => setAmount(String(dueForSelected.toFixed(2)))}
                      aria-label={`Pay full amount ${formatCurrency(dueForSelected)}`}
                      sx={{
                        borderRadius: 2,
                        fontWeight: 800,
                        textTransform: 'none',
                        fontSize: '0.8rem',
                        minHeight: 44,
                        px: 2,
                        bgcolor: theme.primary,
                        boxShadow: 'none',
                        whiteSpace: 'nowrap',
                        '&:hover': { boxShadow: `0 4px 12px ${alpha(theme.primary, 0.35)}` },
                      }}
                    >
                      Pay Full
                    </Button>
                    <Stack direction="row" spacing={0.5}>
                      {[50, 25].map((pct) => (
                        <Chip
                          key={pct}
                          label={`${pct}%`}
                          size="small"
                          onClick={() => setAmount(String((dueForSelected * pct / 100).toFixed(2)))}
                          aria-label={`Fill ${pct}% of due amount: ${formatCurrency(dueForSelected * pct / 100)}`}
                          sx={{
                            height: 28,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            flex: 1,
                            bgcolor: alpha(theme.primary, 0.08),
                            color: theme.primary,
                            border: `1px solid ${alpha(theme.primary, 0.2)}`,
                            '&:hover': { bgcolor: alpha(theme.primary, 0.16) },
                          }}
                        />
                      ))}
                    </Stack>
                  </Stack>
                )}
              </Stack>

              {/* Balance indicator */}
              {!isBulk && parsedAmount > 0 && !isOverpaid && (
                <Paper
                  elevation={0}
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  aria-label={`Balance after this payment: ${formatCurrency(Math.max(0, remaining))}`}
                  sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: alpha('#059669', 0.06), border: `1px solid ${alpha('#059669', 0.2)}` }}
                >
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" fontWeight={600} color="text.secondary" aria-hidden="true">
                      Balance after this payment
                    </Typography>
                    <Typography variant="caption" fontWeight={800} sx={{ color: '#059669' }} aria-hidden="true">
                      {formatCurrency(Math.max(0, remaining))}
                    </Typography>
                  </Stack>
                </Paper>
              )}

              {isOverpaid && (
                <Alert
                  severity="warning"
                  role="alert"
                  icon={<WarningAmberIcon fontSize="small" aria-hidden="true" />}
                  sx={{ mt: 1.5, borderRadius: 2, fontSize: '0.8rem', py: 0.75 }}
                >
                  Overpaying by {formatCurrency(Math.abs(remaining))}. Excess will be held as advance credit.
                </Alert>
              )}
            </Collapse>
          )}
        </Box>
      )}
    </Box>
  );

  // ── Step 3: Method + Confirm ──────────────────────────────────────────────

  const renderStep3 = () => {
    const meta = METHOD_META[paymentMethod] || METHOD_META['CASH'];
    const needsTxId = NEEDS_TXID.has(paymentMethod);

    return (
      <Box
        onKeyDown={(e) => {
          // Ctrl+Enter (or Cmd+Enter) submits from anywhere in step 3
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !submitting && parsedAmount > 0) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      >
        <Typography variant="h6" fontWeight={800} gutterBottom sx={{ mb: 0.5, fontSize: '1rem' }}>
          Payment method & confirm
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, fontSize: '0.88rem' }}>
          Choose how the payment was made
        </Typography>

        {/* Method selector */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{
            textTransform: 'uppercase', letterSpacing: '0.6px', fontSize: '0.68rem', display: 'block', mb: 1
          }}>
            Payment Method
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap role="radiogroup" aria-label="Payment method">
            {PAYMENT_METHOD_OPTIONS.map((key) => {
              const m = METHOD_META[key];
              const isSelected = paymentMethod === key;
              return (
                <Button
                  key={key}
                  variant={isSelected ? 'contained' : 'outlined'}
                  size="medium"
                  startIcon={<m.Icon sx={{ fontSize: 18 }} />}
                  onClick={() => {
                    setPaymentMethod(key);
                    setTransactionId('');
                    setTxError('');
                  }}
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`${m.label} payment method`}
                  sx={{
                    minHeight: 44,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    px: 1.75,
                    transition: 'all 0.2s ease',
                    ...(isSelected
                      ? {
                          bgcolor: m.color,
                          borderColor: m.color,
                          color: '#fff',
                          boxShadow: `0 4px 14px ${alpha(m.color, 0.4)}`,
                          '&:hover': { bgcolor: m.color, boxShadow: `0 6px 18px ${alpha(m.color, 0.5)}` },
                        }
                      : {
                          borderColor: alpha(m.color, 0.35),
                          color: m.color,
                          bgcolor: m.bg,
                          '&:hover': {
                            borderColor: m.color,
                            bgcolor: alpha(m.color, 0.12),
                          },
                        }),
                  }}
                >
                  {m.label}
                </Button>
              );
            })}
          </Stack>
        </Box>

        {/* Transaction ID */}
        <Collapse in={needsTxId || true}>
          <TextField
            fullWidth
            id="payment-transaction-id"
            label={needsTxId ? 'Transaction / UTR ID *' : 'Reference (optional)'}
            value={transactionId}
            required={needsTxId}
            error={!!txError}
            helperText={txError || (needsTxId ? 'Required for this payment method' : null)}
            onChange={(e) => { setTransactionId(e.target.value); setTxError(''); }}
            placeholder={needsTxId ? 'e.g. UTR/RRN or reference number' : 'Optional reference'}
            sx={{ ...inputSx, mb: 2 }}
            inputProps={{
              'aria-label': needsTxId ? 'Transaction or UTR ID (required)' : 'Reference number (optional)',
              'aria-required': needsTxId,
              'aria-invalid': !!txError,
              'aria-describedby': txError ? 'payment-transaction-id-helper-text' : undefined,
            }}
            FormHelperTextProps={{ id: 'payment-transaction-id-helper-text' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CurrencyRupeeIcon aria-hidden="true" sx={{ fontSize: 18, color: alpha(meta.color, 0.7) }} />
                </InputAdornment>
              ),
            }}
          />
        </Collapse>

        {/* Date + Notes */}
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Payment Date & Time"
              type="datetime-local"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={inputSx}
              inputProps={{ 'aria-label': 'Payment date and time' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EventIcon sx={{ fontSize: 18, color: alpha(theme.primary, 0.6) }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any remarks for this transaction"
              sx={inputSx}
              inputProps={{ 'aria-label': 'Payment notes or remarks' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <NotesIcon sx={{ fontSize: 18, color: alpha(theme.primary, 0.6) }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>

        {/* Summary card */}
        <Paper
          elevation={0}
          role="region"
          aria-label="Payment summary"
          sx={{
            p: 2.5,
            borderRadius: 2.5,
            background: `linear-gradient(135deg, ${alpha(theme.primary, 0.06)} 0%, ${alpha(theme.primary, 0.02)} 100%)`,
            border: `2px solid ${alpha(theme.primary, 0.2)}`,
          }}
        >
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{
            textTransform: 'uppercase', letterSpacing: '0.6px', fontSize: '0.68rem', display: 'block', mb: 1.5
          }}>
            Payment Summary
          </Typography>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Customer</Typography>
              <Typography variant="body2" fontWeight={800}>{selectedCustomer?.name}</Typography>
            </Stack>

            {/* Invoice row — differs for single vs multi mode */}
            {invoiceMode === 'multi' ? (
              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>Invoices</Typography>
                  <Chip
                    label={`${multiAllocations.length} invoice${multiAllocations.length !== 1 ? 's' : ''}`}
                    size="small"
                    sx={{
                      height: 20, fontSize: '0.68rem', fontWeight: 800,
                      bgcolor: alpha(theme.primary, 0.1), color: theme.primary,
                      border: `1px solid ${alpha(theme.primary, 0.2)}`,
                    }}
                  />
                </Stack>
                {/* Per-invoice breakdown */}
                {multiAllocations.map((a) => {
                  const s = customerSales.find((cs) => String(cs.saleId) === String(a.saleId));
                  return (
                    <Stack
                      key={a.saleId}
                      direction="row"
                      justifyContent="space-between"
                      sx={{ pl: 1.5, py: 0.25 }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {s?.invoiceNo || `#${a.saleId}`}
                      </Typography>
                      <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.75rem', color: theme.primary }}>
                        {formatCurrency(a.amount)}
                      </Typography>
                    </Stack>
                  );
                })}
                {parsedAmount - multiTotalAllocated > 0.001 && (
                  <Stack direction="row" justifyContent="space-between" sx={{ pl: 1.5, pt: 0.5 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 600 }}>
                      Advance credit
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 700 }}>
                      {formatCurrency(parsedAmount - multiTotalAllocated)}
                    </Typography>
                  </Stack>
                )}
              </Box>
            ) : (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Invoice</Typography>
                <Typography variant="body2" fontWeight={800}>
                  {isBulk ? 'All Pending (Bulk)' : selectedSaleObj?.invoiceNo || '—'}
                </Typography>
              </Stack>
            )}

            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Method</Typography>
              <Chip
                icon={<meta.Icon style={{ fontSize: 13 }} aria-hidden="true" />}
                label={meta.label}
                size="small"
                aria-label={`Payment method: ${meta.label}`}
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: meta.bg, color: meta.color, border: `1px solid ${alpha(meta.color, 0.25)}` }}
              />
            </Stack>
            <Divider sx={{ my: 0.5 }} aria-hidden="true" />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" fontWeight={800}>Total</Typography>
              <Typography
                variant="h5"
                fontWeight={900}
                aria-label={`Total payment amount: ${formatCurrency(parsedAmount)}`}
                sx={{ color: theme.primary, letterSpacing: '-0.5px' }}
              >
                {formatCurrency(parsedAmount)}
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        {/* Duplicate payment warning — non-blocking, shown when a match is found */}
        <DuplicatePaymentWarning
          loading={dupLoading}
          isDuplicate={isDuplicate}
          previousPayment={previousPayment}
          apiError={dupError}
          onCancel={() => {
            // Return the user to Step 2 so they can correct or review the entry.
            setStep(1);
            setDuplicateAcknowledged(false);
          }}
          onProceed={() => setDuplicateAcknowledged(true)}
        />
      </Box>
    );
  };

  // ── Root render ───────────────────────────────────────────────────────────

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto' }}>
      {/* Step indicator */}
      <Stepper
        activeStep={step}
        connector={<WizardConnector />}
        sx={{ mb: 4 }}
        aria-label="Payment wizard steps"
      >
        {STEPS.map((s, i) => (
          <Step
            key={s.label}
            completed={step > i}
            aria-current={step === i ? 'step' : undefined}
          >
            <StepLabel
              StepIconComponent={WizardStepIcon}
              aria-label={
                step > i
                  ? `${s.label} — completed`
                  : step === i
                    ? `${s.label} — current step`
                    : `${s.label} — not yet reached`
              }
              sx={{
                '& .MuiStepLabel-label': {
                  fontWeight: step === i ? 800 : 600,
                  fontSize: { xs: '0.72rem', sm: '0.82rem' },
                  color: step === i ? theme.primary : 'text.secondary',
                  transition: 'color 0.3s ease',
                },
              }}
            >
              {s.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step content card */}
      <Paper
        elevation={0}
        role="region"
        aria-label={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step].label}`}
        aria-live="polite"
        aria-atomic="false"
        sx={{
          p: { xs: 2.5, sm: 3 },
          borderRadius: 3,
          border: `1.5px solid ${alpha(theme.primary, 0.15)}`,
          bgcolor: 'background.paper',
          boxShadow: `0 2px 8px ${alpha(theme.primary, 0.06)}`,
          minHeight: 300,
        }}
      >
        {step === 0 && renderStep1()}
        {step === 1 && renderStep2()}
        {step === 2 && renderStep3()}
      </Paper>

      {/* Navigation buttons */}
      <Stack
        direction="row"
        justifyContent={step > 0 ? 'space-between' : 'flex-end'}
        sx={{ mt: 2.5 }}
        spacing={1.5}
      >
        {step > 0 && (
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            disabled={submitting}
            aria-label={`Go back to step ${step}: ${STEPS[step - 1].label}`}
            sx={{
              minHeight: 48,
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 700,
              px: 2.5,
              borderColor: alpha(theme.primary, 0.35),
              color: theme.primary,
              '&:hover': { borderColor: theme.primary, bgcolor: alpha(theme.primary, 0.04) },
            }}
          >
            Back
          </Button>
        )}

        {step < 2 ? (
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={step === 0 ? handleStep1Next : handleStep2Next}
            disabled={step === 0 ? !canGoToStep2 : (invoiceMode === 'multi' ? parsedAmount <= 0 : !selectedSaleId)}
            aria-label={step === 0 ? 'Continue to invoice selection' : 'Continue to confirm payment'}
            sx={{
              minHeight: 48,
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 800,
              px: 3,
              fontSize: '0.95rem',
              bgcolor: theme.primary,
              boxShadow: 'none',
              '&:not(:disabled)': {
                boxShadow: `0 4px 14px ${alpha(theme.primary, 0.35)}`,
              },
              '&:hover:not(:disabled)': {
                boxShadow: `0 6px 20px ${alpha(theme.primary, 0.5)}`,
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Continue
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={submitting
              ? <CircularProgress size={18} color="inherit" aria-hidden="true" />
              : <CheckCircleIcon aria-hidden="true" />
            }
            onClick={handleSubmit}
            disabled={
              submitting ||
              parsedAmount <= 0 ||
              // Block confirm while a duplicate is detected but not yet acknowledged.
              (isDuplicate && !duplicateAcknowledged)
            }
            aria-label={
              isDuplicate && !duplicateAcknowledged
                ? 'Confirm blocked: acknowledge the duplicate warning first'
                : `Confirm and record payment of ${formatCurrency(parsedAmount)}`
            }
            sx={{
              minHeight: 52,
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 900,
              px: 3.5,
              fontSize: '1rem',
              background: (submitting || parsedAmount <= 0 || (isDuplicate && !duplicateAcknowledged))
                ? undefined
                : `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 100%)`,
              boxShadow: 'none',
              '&:not(:disabled)': {
                boxShadow: `0 6px 20px ${alpha(theme.primary, 0.4)}`,
              },
              '&:hover:not(:disabled)': {
                boxShadow: `0 8px 24px ${alpha(theme.primary, 0.55)}`,
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            {submitting ? 'Processing…' : `Confirm — ${formatCurrency(parsedAmount)}`}
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default PaymentWizard;
