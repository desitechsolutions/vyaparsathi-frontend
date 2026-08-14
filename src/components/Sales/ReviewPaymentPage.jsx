import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Select, MenuItem, TextField, Divider, Grid, IconButton,
  Chip, Stack, Alert, Container, Stepper, Step, StepLabel, LinearProgress,
  Collapse, Card, CardContent, InputAdornment, Tooltip, alpha,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaymentsIcon from '@mui/icons-material/Payments';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import { buildSalePayload, calcMrpDiscountPct } from '../../utils/salesUtils';

// -----------------------------------------------------------------------------
// Line-level math helpers — kept in strict sync with SalesSummary.jsx so the
// Review page's item breakdown mirrors what the seller saw on the cart. If
// these formulae change, update SalesSummary's copies too.
// -----------------------------------------------------------------------------

/** qty × unitPrice − line discount, clamped to 0. Matches backend taxableValue. */
const lineNetBase = (item) => {
  const gross = Number(item.qty || 0) * Number(item.unitPrice || 0);
  const disc  = Number(item.discount || 0);
  return Math.max(0, gross - disc);
};

/** Line GST — always exclusive, computed off lineNetBase. */
const calcLineGst = (item) => {
  const rate = Number(item.gstRate) || 0;
  if (!rate) return 0;
  return lineNetBase(item) * rate / 100;
};

/** Jewellery making charges — per-gram × net weight × qty, else pct × unitPrice × qty. */
const calcMakingCharges = (item) => {
  const qty = Number(item.qty) || 0;
  const netWt = Number(item.netWeightGrams) || Number(item.weightGrams) || 0;
  const perGram = Number(item.makingChargesPerGram) || 0;
  const pct = Number(item.makingChargesPct) || 0;
  const unitPrice = Number(item.unitPrice) || 0;
  if (perGram > 0 && netWt > 0) return perGram * netWt * qty;
  if (pct > 0) return (pct / 100) * unitPrice * qty;
  return 0;
};

// Payment-method metadata (icon + display label). Kept together so the select's
// renderValue (which needs the icon) and MenuItem list stay in sync.
const PAYMENT_METHOD_META = {
  CASH:        { label: 'Cash',                icon: LocalAtmIcon },
  CARD:        { label: 'Debit / Credit Card', icon: CreditCardIcon },
  UPI:         { label: 'UPI / QR Code',       icon: QrCode2Icon },
  NET_BANKING: { label: 'Net Banking',         icon: AccountBalanceIcon },
  CHEQUE:      { label: 'Cheque',              icon: DescriptionOutlinedIcon },
  OTHER:       { label: 'Other',               icon: PaymentsIcon },
};

const paymentMethodOptions = Object.entries(PAYMENT_METHOD_META).map(
  ([value, meta]) => ({ value, label: meta.label, icon: meta.icon })
);

const transactionIdMandatory = (method) =>
  ['CARD', 'UPI', 'NET_BANKING', 'CHEQUE'].includes(method);

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

/**
 * Section header — icon + uppercase caption, matches the pattern used across
 * the redesigned Sales right panel (Customer / Cart sections).
 */
const SectionHeader = ({ icon: Icon, title, action }) => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    sx={{ mb: 1.75 }}
  >
    <Stack direction="row" alignItems="center" spacing={0.75}>
      <Icon sx={{ fontSize: 16, color: 'text.secondary' }} />
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: 'text.secondary',
          fontSize: '0.72rem',
        }}
      >
        {title}
      </Typography>
    </Stack>
    {action}
  </Stack>
);

const SummaryRow = ({ label, value, valueNode, valueColor, bold }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center">
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    {valueNode || (
      <Typography
        variant="body2"
        sx={{ fontWeight: bold ? 700 : 600, color: valueColor || 'text.primary' }}
      >
        {value}
      </Typography>
    )}
  </Stack>
);

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------

const ReviewPaymentPage = ({
  formData,
  selectedCustomer,
  onConfirm,
  onCancel,
  setError,
  loading,
  isJewellery = false,
}) => {
  const { t } = useTranslation();

  const [paymentMethods, setPaymentMethods] = useState([
    { paymentMethod: 'CASH', amount: 0, transactionId: '', reference: '', notes: '' }
  ]);
  const [itemsExpanded, setItemsExpanded] = useState(false);

  // ── advance credit ────────────────────────────────────────────────────────
  // creditBalance semantics: NEGATIVE = customer paid in advance (we owe them).
  // POSITIVE = customer owes us (a due). Only the advance case can be auto-
  // applied to this sale; positive dues are surfaced on the Customer identity
  // strip and settled through the Customer Payments flow.
  const rawBalance = parseFloat(selectedCustomer?.creditBalance) || 0;
  const availableAdvance = rawBalance < 0 ? Math.abs(rawBalance) : 0;

  // ── totals ────────────────────────────────────────────────────────────────
  // Computed fresh from items so the Review page mirrors the cart's math
  // exactly. Formula: (metal-net + making-charges + GST) − bill-level discount.
  // Uses the shared helpers above so any per-line discount, GST rate, or
  // jewellery making-charge policy is applied consistently with SalesSummary.
  const items = formData.items || [];

  const metalSubtotal = useMemo(
    () => items.reduce((sum, it) => sum + lineNetBase(it), 0),
    [items]
  );

  const totalMakingCharges = useMemo(
    () => (isJewellery ? items.reduce((sum, it) => sum + calcMakingCharges(it), 0) : 0),
    [items, isJewellery]
  );

  const totalLineDiscount = useMemo(
    () => items.reduce(
      (sum, it) => {
        const gross = Number(it.qty || 0) * Number(it.unitPrice || 0);
        const disc  = Number(it.discount || 0);
        // Cap the discount at gross so we don't over-count clamped lines.
        return sum + Math.min(disc, gross);
      },
      0,
    ),
    [items]
  );

  const totalGst = useMemo(
    () => (formData.isGstRequired === 'yes'
      ? items.reduce((sum, it) => sum + calcLineGst(it), 0)
      : 0),
    [items, formData.isGstRequired]
  );

  // The visual "Subtotal" line in the Billing Summary shows the metal-net base.
  // For non-jewellery flows, this is identical to the cart's subtotal display.
  const subtotal = metalSubtotal;

  const [billLevelDiscount, setBillLevelDiscount] = useState(parseFloat(formData.discount) || 0);

  const discountedTotal = Math.max(0, metalSubtotal + totalMakingCharges + totalGst - billLevelDiscount);
  const advanceApplied = Math.min(availableAdvance, discountedTotal);
  const netPayable = (discountedTotal - advanceApplied).toFixed(2);
  const netPayableNum = parseFloat(netPayable);

  const totalPayment = paymentMethods.reduce((sum, pm) => sum + (parseFloat(pm.amount) || 0), 0);
  const remaining = (netPayableNum - totalPayment).toFixed(2);
  const remainingNum = parseFloat(remaining);

  // Coverage: how much of Net Payable has been captured across payment splits.
  // Drives the LinearProgress bar and the label beside it.
  const coveragePct = netPayableNum > 0 ? Math.min(100, (totalPayment / netPayableNum) * 100) : 100;
  const coverageColor = totalPayment > netPayableNum
    ? 'error'
    : totalPayment >= netPayableNum ? 'success' : 'warning';
  const coverageLabel = totalPayment > netPayableNum
    ? { text: 'Overpaid — reduce a split', color: 'error.main' }
    : totalPayment >= netPayableNum
      ? { text: 'Fully covered', color: 'success.main' }
      : { text: `${coveragePct.toFixed(0)}% covered`, color: 'text.secondary' };

  // ── handlers ──────────────────────────────────────────────────────────────

  const handlePaymentChange = (index, field, value) => {
    const newPayments = [...paymentMethods];
    if (field === 'amount') {
      const val = parseFloat(value);
      newPayments[index][field] = isNaN(val) ? 0 : Math.max(0, val);
    } else if (field === 'paymentMethod') {
      newPayments[index][field] = value;
      if (value === 'CASH') newPayments[index].transactionId = '';
    } else {
      newPayments[index][field] = value;
    }
    setPaymentMethods(newPayments);
  };

  const handleAddPaymentMethod = () => {
    // New split defaults to whatever remains uncovered (or 0 when fully covered),
    // so the seller doesn't have to hand-key the balance every time.
    const suggested = Math.max(0, Number(remaining) || 0);
    setPaymentMethods([
      ...paymentMethods,
      { paymentMethod: 'CASH', amount: suggested, transactionId: '', reference: '', notes: '' },
    ]);
  };

  const handleRemovePaymentMethod = (index) => {
    const newPayments = paymentMethods.filter((_, i) => i !== index);
    setPaymentMethods(
      newPayments.length
        ? newPayments
        : [{ paymentMethod: 'CASH', amount: 0, transactionId: '', reference: '', notes: '' }]
    );
  };

  const handleConfirmAction = () => {
    if (totalPayment > netPayableNum) {
      setError(t('salesFlow.review.errorExceedsPayable', { amount: netPayable }));
      return;
    }
    for (const pm of paymentMethods) {
      if (transactionIdMandatory(pm.paymentMethod) && (!pm.transactionId || pm.transactionId.trim() === '')) {
        setError(t('salesFlow.review.errorNeedTxnId', { method: pm.paymentMethod }));
        return;
      }
    }

    const payload = buildSalePayload(
      {
        ...formData,
        totalAmount: parseFloat(discountedTotal),
        invoiceDiscount: parseFloat(billLevelDiscount),
        discount: parseFloat(billLevelDiscount),
      },
      selectedCustomer,
      paymentMethods,
      'COMPLETED'
    );
    onConfirm(payload);
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" disableGutters>

        {/* HEADER — back button + title, then stepper below */}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
          <IconButton onClick={onCancel} size="small" aria-label={t('salesFlow.review.backToCart')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {t('salesFlow.review.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('salesFlow.review.subtitle')}
            </Typography>
          </Box>
        </Stack>

        {/* STEPPER — locates the user in the Cart → Review → Invoice arc */}
        <Box sx={{ mb: 3, px: { xs: 0, sm: 2 } }}>
          <Stepper activeStep={1} alternativeLabel>
            <Step><StepLabel>Cart</StepLabel></Step>
            <Step><StepLabel>Review &amp; Payment</StepLabel></Step>
            <Step><StepLabel>Invoice</StepLabel></Step>
          </Stepper>
        </Box>

        <Grid container spacing={{ xs: 2, md: 3 }}>

          {/* LEFT COLUMN — Customer, Items, Payment */}
          <Grid item xs={12} lg={8} order={{ xs: 2, lg: 1 }}>

            {/* Customer & Delivery */}
            <Card variant="outlined" sx={{ borderRadius: 3, mb: 2 }}>
              <CardContent>
                <SectionHeader icon={PersonIcon} title={t('salesFlow.review.customerInfo')} />
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  alignItems={{ sm: 'center' }}
                  divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {selectedCustomer?.name || t('salesFlow.review.walkInCustomer')}
                    </Typography>
                    <Stack direction="row" spacing={0.75} sx={{ mt: 0.5, flexWrap: 'wrap' }} useFlexGap>
                      {selectedCustomer?.phone && (
                        <Chip
                          label={selectedCustomer.phone}
                          size="small"
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600, borderColor: 'divider' }}
                        />
                      )}
                      {selectedCustomer?.gstNumber && (
                        <Chip
                          label={`GSTIN ${selectedCustomer.gstNumber}`}
                          size="small"
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600, borderColor: 'divider' }}
                        />
                      )}
                      {selectedCustomer?.addressLine1 && (
                        <Chip
                          label={selectedCustomer.addressLine1}
                          size="small"
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600, borderColor: 'divider', maxWidth: 260 }}
                        />
                      )}
                    </Stack>
                  </Box>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
                    <LocalShippingIcon
                      sx={{
                        fontSize: 20,
                        color: formData.deliveryRequired ? 'primary.main' : 'text.disabled',
                      }}
                    />
                    {formData.deliveryRequired ? (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Delivery · ₹{formData.deliveryCharge || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('salesFlow.review.paidDirectToCourier')}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {t('salesFlow.review.inStorePickup')}
                      </Typography>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Items — collapsed by default; full breakdown on demand */}
            <Card variant="outlined" sx={{ borderRadius: 3, mb: 2 }}>
              <CardContent>
                <SectionHeader
                  icon={ShoppingCartIcon}
                  title={`Items · ${formData.items.length}`}
                  action={
                    <Button
                      size="small"
                      variant="text"
                      endIcon={itemsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      onClick={() => setItemsExpanded((v) => !v)}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      {itemsExpanded ? 'Hide details' : 'Show details'}
                    </Button>
                  }
                />
                {!itemsExpanded && (
                  <Typography variant="body2" color="text.secondary">
                    {formData.items.length} item{formData.items.length === 1 ? '' : 's'} · Subtotal ₹{subtotal.toFixed(2)}
                    {totalLineDiscount > 0 && (
                      <Typography component="span" variant="body2" sx={{ ml: 0.75, color: 'success.main', fontWeight: 700 }}>
                        (₹{totalLineDiscount.toFixed(2)} line discount applied)
                      </Typography>
                    )}
                  </Typography>
                )}
                <Collapse in={itemsExpanded} timeout="auto" unmountOnExit>
                  <TableContainer sx={{ mt: 1 }}>
                    <Table size="small" sx={{ '& .MuiTableCell-root': { borderBottomColor: 'divider' } }}>
                      <TableHead>
                        <TableRow sx={{
                          '& .MuiTableCell-root': {
                            fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase',
                            letterSpacing: 0.4, color: 'text.secondary', py: 1,
                          },
                        }}>
                          <TableCell>{t('salesFlow.review.productDetails')}</TableCell>
                          <TableCell align="center">{t('salesFlow.review.qty')}</TableCell>
                          <TableCell align="right">Rate</TableCell>
                          {isJewellery && <TableCell align="right">Making</TableCell>}
                          {formData.isGstRequired === 'yes' && (
                            <TableCell align="right">{t('salesFlow.review.gstHeader')}</TableCell>
                          )}
                          <TableCell align="right">{t('salesFlow.review.totalHeader')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {formData.items.map((item, idx) => {
                          const gross = Number(item.qty || 0) * Number(item.unitPrice || 0);
                          const lineDiscount = Number(item.discount || 0);
                          const lineTotal = lineNetBase(item);
                          const gstAmt = formData.isGstRequired === 'yes' ? calcLineGst(item) : 0;
                          const makingAmt = isJewellery ? calcMakingCharges(item) : 0;
                          const mrpDiscount = calcMrpDiscountPct(item.mrp, item.unitPrice);
                          const variantParts = [
                            item.variantBrand || item.brand,
                            item.variantColor || item.color,
                            item.variantSize || item.size,
                            item.variantDesign || item.design,
                          ].filter(Boolean);

                          return (
                            <TableRow key={idx}>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.itemName}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {item.variantSku || item.sku}
                                  {variantParts.length > 0 && ` · ${variantParts.join(' · ')}`}
                                </Typography>
                                {mrpDiscount && (
                                  <Typography variant="caption" sx={{ display: 'block', color: 'success.main', fontWeight: 700 }}>
                                    {t('salesFlow.review.mrpOffDisplay', { pct: mrpDiscount, mrp: Number(item.mrp).toFixed(2) })}
                                  </Typography>
                                )}
                                {lineDiscount > 0 && (
                                  <Typography variant="caption" sx={{ display: 'block', color: 'success.main', fontWeight: 700 }}>
                                    − ₹{lineDiscount.toFixed(2)} line discount
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="center">{item.qty}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>
                                ₹{Number(item.unitPrice || 0).toFixed(2)}
                              </TableCell>
                              {isJewellery && (
                                <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                  {makingAmt > 0 ? `₹${makingAmt.toFixed(2)}` : '—'}
                                </TableCell>
                              )}
                              {formData.isGstRequired === 'yes' && (
                                <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                  {Number(item.gstRate) > 0 ? `₹${gstAmt.toFixed(2)} · ${item.gstRate}%` : '—'}
                                </TableCell>
                              )}
                              <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                ₹{lineTotal.toFixed(2)}
                                {lineDiscount > 0 && (
                                  <Typography
                                    variant="caption"
                                    sx={{ display: 'block', color: 'text.secondary', fontWeight: 500, textDecoration: 'line-through' }}
                                  >
                                    ₹{gross.toFixed(2)}
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Collapse>
              </CardContent>
            </Card>

            {/* Payment splits */}
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <SectionHeader
                  icon={PaymentsIcon}
                  title={t('salesFlow.review.paymentSplit')}
                  action={
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon fontSize="small" />}
                      onClick={handleAddPaymentMethod}
                      sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                    >
                      {t('salesFlow.review.addSplit')}
                    </Button>
                  }
                />

                <Stack spacing={1.5}>
                  {paymentMethods.map((pm, index) => {
                    const Meta = PAYMENT_METHOD_META[pm.paymentMethod] || PAYMENT_METHOD_META.CASH;
                    const txRequired = transactionIdMandatory(pm.paymentMethod);
                    return (
                      <Box
                        key={index}
                        sx={{
                          p: 1.75,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: (theme) => alpha(theme.palette.text.primary, 0.02),
                        }}
                      >
                        <Grid container spacing={1.5} alignItems="flex-end">
                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                              {t('salesFlow.review.methodLabel')}
                            </Typography>
                            <Select
                              size="small"
                              fullWidth
                              value={pm.paymentMethod}
                              onChange={(e) => handlePaymentChange(index, 'paymentMethod', e.target.value)}
                              renderValue={(v) => {
                                const M = PAYMENT_METHOD_META[v] || PAYMENT_METHOD_META.CASH;
                                const MI = M.icon;
                                return (
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <MI sx={{ fontSize: 18, color: 'text.secondary' }} />
                                    <span>{M.label}</span>
                                  </Stack>
                                );
                              }}
                              sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
                            >
                              {paymentMethodOptions.map((opt) => {
                                const OI = opt.icon;
                                return (
                                  <MenuItem key={opt.value} value={opt.value}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <OI sx={{ fontSize: 18, color: 'text.secondary' }} />
                                      <span>{opt.label}</span>
                                    </Stack>
                                  </MenuItem>
                                );
                              })}
                            </Select>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                              {t('salesFlow.review.amountInRupees')}
                            </Typography>
                            <TextField
                              size="small"
                              fullWidth
                              type="number"
                              value={pm.amount}
                              onChange={(e) => handlePaymentChange(index, 'amount', e.target.value)}
                              onFocus={(e) => e.target.select()}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                sx: { bgcolor: 'background.paper', borderRadius: 2, fontWeight: 700 },
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                              {t('salesFlow.review.txnIdRef')}
                              {txRequired && <Typography component="span" color="error" sx={{ ml: 0.25, fontWeight: 700 }}>*</Typography>}
                            </Typography>
                            <TextField
                              size="small"
                              fullWidth
                              placeholder={txRequired ? t('salesFlow.review.required') : t('salesFlow.review.optional')}
                              value={pm.transactionId}
                              onChange={(e) => handlePaymentChange(index, 'transactionId', e.target.value)}
                              disabled={pm.paymentMethod === 'CASH'}
                              InputProps={{ sx: { bgcolor: 'background.paper', borderRadius: 2 } }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={1} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            {paymentMethods.length > 1 && (
                              <Tooltip title="Remove split">
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemovePaymentMethod(index)}
                                  aria-label="Remove split"
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Grid>
                        </Grid>
                      </Box>
                    );
                  })}
                </Stack>

                {/* Coverage — how much of Net Payable is captured across splits. */}
                <Box sx={{ mt: 2 }}>
                  <Stack direction="row" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Paid ₹{totalPayment.toFixed(2)} of ₹{netPayable}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: coverageLabel.color }}>
                      {coverageLabel.text}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={coveragePct}
                    color={coverageColor}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* RIGHT COLUMN — Billing summary + Complete Sale CTA */}
          <Grid item xs={12} lg={4} order={{ xs: 1, lg: 2 }}>
            <Box sx={{ position: { lg: 'sticky' }, top: 16 }}>
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <SectionHeader icon={ReceiptLongIcon} title={t('salesFlow.review.billingSummary')} />

                  <Stack spacing={1.5}>
                    <SummaryRow
                      label={isJewellery ? 'Metal subtotal' : t('salesFlow.review.subtotal')}
                      value={`₹${subtotal.toFixed(2)}`}
                    />
                    {totalLineDiscount > 0 && (
                      <SummaryRow
                        label="Line discount"
                        value={`− ₹${totalLineDiscount.toFixed(2)}`}
                        valueColor="success.main"
                      />
                    )}
                    {isJewellery && totalMakingCharges > 0 && (
                      <SummaryRow
                        label="Making charges"
                        value={`+ ₹${totalMakingCharges.toFixed(2)}`}
                      />
                    )}
                    <SummaryRow
                      label={t('salesFlow.review.extraDiscount')}
                      valueNode={
                        <TextField
                          size="small"
                          type="number"
                          value={billLevelDiscount}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            const clean = isNaN(val) ? 0 : Math.max(0, Math.min(val, subtotal));
                            setBillLevelDiscount(clean);
                          }}
                          inputProps={{ min: 0, max: subtotal, step: 'any' }}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                            sx: { borderRadius: 1.5, fontWeight: 700 },
                          }}
                          sx={{ width: 130 }}
                        />
                      }
                    />
                    {advanceApplied > 0 && (
                      <SummaryRow
                        label={t('salesFlow.review.advanceApplied')}
                        value={`− ₹${advanceApplied.toFixed(2)}`}
                        valueColor="success.main"
                      />
                    )}
                    {formData.isGstRequired === 'yes' && totalGst > 0 && (
                      <SummaryRow
                        label={t('salesFlow.review.gstLine')}
                        value={`+ ₹${totalGst.toFixed(2)}`}
                        valueColor="info.main"
                      />
                    )}

                    <Divider />

                    <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {t('salesFlow.review.netPayable')}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                        ₹{netPayable}
                      </Typography>
                    </Stack>

                    <SummaryRow label={t('salesFlow.review.paidNow')} value={`₹${totalPayment.toFixed(2)}`} />

                    <Box
                      sx={{
                        p: 1.25,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: (theme) => alpha(
                          remainingNum > 0 ? theme.palette.warning.main : theme.palette.success.main,
                          0.4
                        ),
                        bgcolor: (theme) => alpha(
                          remainingNum > 0 ? theme.palette.warning.main : theme.palette.success.main,
                          0.08
                        ),
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, color: remainingNum > 0 ? 'warning.dark' : 'success.dark' }}
                        >
                          {remainingNum > 0 ? t('salesFlow.review.balanceDue') : 'Fully paid'}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 800, color: remainingNum > 0 ? 'warning.dark' : 'success.dark' }}
                        >
                          ₹{remaining}
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>

                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleConfirmAction}
                    disabled={loading}
                    startIcon={loading ? null : <CheckCircleOutlineIcon />}
                    sx={{
                      mt: 2.5,
                      py: 1.5,
                      fontWeight: 700,
                      textTransform: 'none',
                      borderRadius: 2,
                      fontSize: '1rem',
                    }}
                  >
                    {loading ? t('salesFlow.review.processing') : t('salesFlow.review.completeSale')}
                  </Button>
                </CardContent>
              </Card>

              {remainingNum > 0 && (
                <Alert
                  severity="info"
                  variant="outlined"
                  sx={{ mt: 2, borderRadius: 2, bgcolor: 'background.paper' }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {t('salesFlow.review.balanceToLedger', { amount: remaining })}
                  </Typography>
                </Alert>
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ReviewPaymentPage;
