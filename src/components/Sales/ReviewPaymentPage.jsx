import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Select, MenuItem, TextField, Divider, Grid, IconButton, 
  Chip, Stack, Alert, Container
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import PaymentIcon from '@mui/icons-material/Payment';
import HomeIcon from '@mui/icons-material/Home';

import { buildSalePayload, calcMrpDiscountPct }  from '../../utils/salesUtils';

const paymentMethodOptions = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Debit/Credit Card' },
  { value: 'UPI', label: 'UPI / QR Code' },
  { value: 'NET_BANKING', label: 'Net Banking' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'OTHER', label: 'Other' },
];

const transactionIdMandatory = (method) =>
  ['CARD', 'UPI', 'NET_BANKING', 'CHEQUE'].includes(method);

const ReviewPaymentPage = ({
  formData,
  selectedCustomer,
  onConfirm,
  onCancel,
  setError,
  loading,
}) => {
  const [paymentMethods, setPaymentMethods] = useState([
    { paymentMethod: 'CASH', amount: 0, transactionId: '', reference: '', notes: '' }
  ]);
  // ==========================================
  // LOGIC FOR creditBalance (Negative = Advance)
  // ==========================================
  const rawBalance = parseFloat(selectedCustomer?.creditBalance) || 0;
  // If balance is -550, availableAdvance is 550. If balance is 5000, advance is 0.
  const availableAdvance = rawBalance < 0 ? Math.abs(rawBalance) : 0;

  // =======================
  // CALCULATIONS
  // Both subtotal and GST are computed **net of line-level discount** — the same
  // formula the backend uses to persist taxableValue. Bill-level discount then
  // reduces the grand total on top.
  const grossSubtotal = useMemo(() => {
    if (formData.subtotal && !isNaN(Number(formData.subtotal))) {
      return Number(formData.subtotal);
    }
    return (formData.items || []).reduce((sum, item) => {
      const gross = Number(item.qty || 0) * Number(item.unitPrice || 0);
      const disc  = Number(item.discount || 0);
      return sum + Math.max(0, gross - disc);
    }, 0);
  }, [formData.items, formData.subtotal]);

  const subtotal = grossSubtotal;

  const [billLevelDiscount, setBillLevelDiscount] = useState(parseFloat(formData.discount) || 0);

  // GST is always exclusive — added on top of the net-of-line-discount base.
  const totalGst = (formData.items || []).reduce((sum, item) => {
    if (formData.isGstRequired !== 'yes') return sum;
    const rate = Number(item.gstRate) || 0;
    const gross = Number(item.qty || 0) * Number(item.unitPrice || 0);
    const disc  = Number(item.discount || 0);
    const lineNet = Math.max(0, gross - disc);
    return sum + lineNet * rate / 100;
  }, 0);

  // Grand total = grossSubtotal + GST - billLevelDiscount
  const discountedTotal = Math.max(0, grossSubtotal + totalGst - billLevelDiscount);

  // Automatic allocation of advance
  const advanceApplied = Math.min(availableAdvance, discountedTotal);
  const netPayable = (discountedTotal - advanceApplied).toFixed(2);

  const totalPayment = paymentMethods.reduce((sum, pm) => sum + (parseFloat(pm.amount) || 0), 0);
  const remaining = (parseFloat(netPayable) - totalPayment).toFixed(2);

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
    setPaymentMethods([...paymentMethods, { paymentMethod: 'CASH', amount: 0, transactionId: '', reference: '', notes: '' }]);
  };

  const handleRemovePaymentMethod = (index) => {
    const newPayments = paymentMethods.filter((_, i) => i !== index);
    setPaymentMethods(newPayments.length ? newPayments : [{ paymentMethod: 'CASH', amount: 0, transactionId: '', reference: '', notes: '' }]);
  };

  const handleConfirmAction = () => {
    // Validating against netPayable (Bill - Advance)
    if (totalPayment > parseFloat(netPayable)) {
      setError(`Recorded payment exceeds the net payable amount (₹${netPayable}).`);
      return;
    }
    for (let pm of paymentMethods) {
      if (transactionIdMandatory(pm.paymentMethod) && (!pm.transactionId || pm.transactionId.trim() === '')) {
        setError(`Please enter Transaction ID for ${pm.paymentMethod}.`);
        return;
      }
    }

    // Issue 2 Fix: Send billLevelDiscount as invoiceDiscount (distinct from item discounts).
    // totalAmount is the correct grand total (already net of double-discount fix above).
    const payload = buildSalePayload(
      { ...formData, totalAmount: parseFloat(discountedTotal), invoiceDiscount: parseFloat(billLevelDiscount), discount: parseFloat(billLevelDiscount) },
      selectedCustomer,
      paymentMethods,
      'COMPLETED'
    );
    onConfirm(payload);
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', fontSize: { xs: '1.3rem', sm: '1.5rem', md: '2.125rem' } }}>Review & Payment</Typography>
            <Typography variant="body2" color="textSecondary">Record payment distribution to complete sale</Typography>
          </Box>
          <Button startIcon={<ArrowBackIcon />} onClick={onCancel} variant="outlined" sx={{ borderRadius: 2, fontWeight: 700 }}>
            Back to Cart
          </Button>
        </Stack>

        <Grid container spacing={{ xs: 2, md: 4 }}>
          <Grid item xs={12} lg={8} order={{ xs: 2, lg: 1 }}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={7}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <PersonIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Customer Info</Typography>
                  </Stack>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{selectedCustomer?.name || 'Walk-in Customer'}</Typography>
                  <Typography variant="body2" color="textSecondary"><strong>Mob:</strong> {selectedCustomer?.phone || 'N/A'}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <HomeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="textSecondary">{selectedCustomer?.addressLine1 || 'No Address Provided'}</Typography>
                  </Stack>
                </Paper>
              </Grid>
              <Grid item xs={12} md={5}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: 'background.default', border: '1px solid #cbd5e1' }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <LocalShippingIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Logistics</Typography>
                  </Stack>
                  {formData.deliveryRequired ? (
                    <Box>
                      <Chip label="Status: PACKED" size="small" color="info" sx={{ mb: 1, fontWeight: 700 }} />
                      <Typography variant="body2"><strong>Fee:</strong> ₹{formData.deliveryCharge || 0}</Typography>
                      <Typography variant="caption" color="error" sx={{ fontWeight: 700 }}>* Paid directly to courier</Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>In-store pickup</Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'background.default' }}><TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Product Details</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Qty</TableCell>
                    {formData.isGstRequired === 'yes' && (
                      <TableCell align="right" sx={{ fontWeight: 700 }}>GST</TableCell>
                    )}
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                </TableRow></TableHead>
                <TableBody>
                   {formData.items.map((item, idx) => {
                    const lineTotal = Number(item.qty) * Number(item.unitPrice);
                    const gstAmt = formData.isGstRequired === 'yes'
                      ? lineTotal * (Number(item.gstRate) || 0) / 100
                      : 0;
                    const mrpDiscount = calcMrpDiscountPct(item.mrp, item.unitPrice);

                    // Issue 1 Fix: Build variant description for Review page to match PDF invoice
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
                          <Typography variant="caption" color="textSecondary">
                            {item.variantSku || item.sku}
                            {variantParts.length > 0 && ` | ${variantParts.join(' · ')}`}
                          </Typography>
                          {/* Show MRP discount % */}
                          {mrpDiscount && (
                            <Typography variant="caption" sx={{ display: 'block', color: 'success.dark', fontWeight: 700 }}>
                              {mrpDiscount}% off MRP ₹{Number(item.mrp).toFixed(2)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">{item.qty}</TableCell>
                        {formData.isGstRequired === 'yes' && (
                          <TableCell align="right" sx={{ color: '#2e7d32', fontSize: '0.75rem' }}>
                            {Number(item.gstRate) > 0 ? `₹${gstAmt.toFixed(2)} (${item.gstRate}%)` : '—'}
                          </TableCell>
                        )}
                        <TableCell align="right">₹{lineTotal.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', gap: 1 }}><PaymentIcon color="primary" /> Payment Split</Typography>
                <Button startIcon={<AddCircleOutlineIcon />} onClick={handleAddPaymentMethod}>Add Split</Button>
              </Stack>
              {paymentMethods.map((pm, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" sx={{ fontWeight: 700, ml: 1 }}>METHOD</Typography>
                    <Select fullWidth value={pm.paymentMethod} onChange={(e) => handlePaymentChange(index, 'paymentMethod', e.target.value)}>
                      {paymentMethodOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                    </Select>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" sx={{ fontWeight: 700, ml: 1 }}>AMOUNT (₹)</Typography>
                    <TextField fullWidth type="number" value={pm.amount} onChange={(e) => handlePaymentChange(index, 'amount', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" sx={{ fontWeight: 700, ml: 1 }}>TXN ID / REF</Typography>
                    <TextField fullWidth placeholder={transactionIdMandatory(pm.paymentMethod) ? 'Required' : 'Optional'} value={pm.transactionId} onChange={(e) => handlePaymentChange(index, 'transactionId', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} sm={1} sx={{ mt: 3 }}>
                    {index > 0 && <IconButton color="error" onClick={() => handleRemovePaymentMethod(index)}><DeleteIcon /></IconButton>}
                  </Grid>
                </Grid>
              ))}
            </Paper>
          </Grid>

          <Grid item xs={12} lg={4} order={{ xs: 1, lg: 2 }}>
            <Box sx={{ position: { lg: 'sticky' }, top: 24 }}>
              <Paper elevation={12} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 4, bgcolor: 'grey.900', color: 'grey.50' }}>
                <Typography variant="h6" sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 2, fontWeight: 800 }}>Billing Summary</Typography>
                <Stack spacing={2} sx={{ my: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ opacity: 0.7, flexShrink: 0 }}>Subtotal</Typography>
                    <Typography sx={{ fontWeight: 600, textAlign: 'right' }}>₹{subtotal.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ opacity: 0.7, flexShrink: 0 }}>Extra Discount (Bill-Level)</Typography>
                    <TextField
                      size="small" type="number" value={billLevelDiscount}
                      sx={{ width: 100, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1.5, input: { color: 'grey.50', textAlign: 'right', fontWeight: 800 }}}
                      onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          // Clamp: must be >= 0 and not exceed the subtotal
                          const clean = isNaN(val) ? 0 : Math.max(0, Math.min(val, subtotal));
                          setBillLevelDiscount(clean);
                        }}
                      inputProps={{ min: 0, max: subtotal, step: 'any' }}
                    />
                  </Box>

                  {/* DISPLAY APPLIED ADVANCE FROM creditBalance */}
                  {advanceApplied > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ color: '#4ade80', flexShrink: 0 }}>Advance Applied</Typography>
                      <Typography sx={{ fontWeight: 600, color: '#4ade80', textAlign: 'right' }}>- ₹{advanceApplied.toFixed(2)}</Typography>
                    </Box>
                  )}

                  {formData.isGstRequired === 'yes' && totalGst > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ color: '#93c5fd', opacity: 0.9, flexShrink: 0 }}>GST (+)</Typography>
                      <Typography sx={{ fontWeight: 600, color: '#93c5fd', textAlign: 'right' }}>+ ₹{totalGst.toFixed(2)}</Typography>
                    </Box>
                  )}

                  <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, flexShrink: 0 }}>Net Payable</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#4ade80', textAlign: 'right', overflowWrap: 'break-word', minWidth: 0 }}>₹{netPayable}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.8, flexShrink: 0 }}>Paid Now</Typography>
                    <Typography variant="body2" sx={{ textAlign: 'right' }}>₹{totalPayment.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, p: 1.5, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                    <Typography variant="body2" color={Number(remaining) > 0 ? '#f87171' : '#4ade80'} sx={{ flexShrink: 0 }}>Balance Due</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, textAlign: 'right' }} color={Number(remaining) > 0 ? '#f87171' : '#4ade80'}>₹{remaining}</Typography>
                  </Box>
                </Stack>
                <Button fullWidth variant="contained" onClick={handleConfirmAction} disabled={loading} sx={{ py: 2, fontWeight: 900, borderRadius: 3, fontSize: { xs: '1rem', sm: '1.1rem' }, bgcolor: '#4ade80', color: '#064e3b', '&:hover': { bgcolor: '#22c55e' } }}>
                  {loading ? 'PROCESSING...' : 'COMPLETE SALE'}
                </Button>
              </Paper>

              {Number(remaining) > 0 && (
                <Alert severity="info" variant="outlined" sx={{ mt: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
                  Balance ₹{remaining} will be added to ledger.
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