import React, { useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Select, MenuItem, TextField, Divider, Grid, IconButton, 
  Chip, Stack, Alert, Container
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import PaymentIcon from '@mui/icons-material/Payment';
import HomeIcon from '@mui/icons-material/Home';

// SHARED UTILITY (single source of truth)
import { buildSalePayload }  from '../../utils/salesUtils';

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
  onSaveDraft,
  onCancel,
  setError,
  loading,
}) => {
  const [paymentMethods, setPaymentMethods] = useState([
    { paymentMethod: 'CASH', amount: 0, transactionId: '', reference: '', notes: '' }
  ]);

  const [discount, setDiscount] = useState(formData.discount || 0);

  // =======================
  // CALCULATIONS
  // =======================
  const subtotal = parseFloat(formData.totalAmount) || 0;
  const discountedTotal = (subtotal - discount).toFixed(2);
  const totalPayment = paymentMethods.reduce(
    (sum, pm) => sum + (parseFloat(pm.amount) || 0),
    0
  );
  const remaining = (parseFloat(discountedTotal) - totalPayment).toFixed(2);

  // =======================
  // PAYMENT HANDLERS
  // =======================
  const handlePaymentChange = (index, field, value) => {
    const newPayments = [...paymentMethods];

    if (field === 'amount') {
      newPayments[index][field] = parseFloat(value) || 0;
    } else if (field === 'paymentMethod') {
      newPayments[index][field] = value;
      if (value === 'CASH') newPayments[index].transactionId = '';
    } else {
      newPayments[index][field] = value;
    }

    setPaymentMethods(newPayments);
  };

  const handleAddPaymentMethod = () => {
    setPaymentMethods([
      ...paymentMethods,
      { paymentMethod: 'CASH', amount: 0, transactionId: '', reference: '', notes: '' }
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

  // ======================================================
  // THIN WRAPPER AROUND SHARED UTILITY
  // ======================================================
  const generateSaleDtoPayload = (status) => {
    return buildSalePayload(
      {
        ...formData,
        totalAmount: parseFloat(discountedTotal),
        discount: parseFloat(discount),
      },
      selectedCustomer,
      paymentMethods,
      status
    );
  };

  // =======================
  // CONFIRM SALE (FINAL)
  // =======================
  const handleConfirmAction = () => {
    // ---- VALIDATIONS ----
    if (totalPayment > parseFloat(discountedTotal)) {
      setError('Recorded payment exceeds the bill amount.');
      return;
    }

    for (let pm of paymentMethods) {
      if (
        transactionIdMandatory(pm.paymentMethod) &&
        (!pm.transactionId || pm.transactionId.trim() === '')
      ) {
        setError(`Please enter Transaction ID for ${pm.paymentMethod}.`);
        return;
      }
    }

    // ---- BUILD PAYLOAD (CENTRALIZED) ----
    const payload = generateSaleDtoPayload('COMPLETED');

    // Attach payment details ONLY for completed sale
    payload.paymentDetails = paymentMethods
      .filter(pm => pm.amount > 0)
      .map(pm => ({
        paymentMethod: pm.paymentMethod,
        amount: parseFloat(pm.amount),
        transactionId: pm.transactionId || pm.reference,
        paymentDate: new Date().toISOString(),
      }));

    // ---- HAND OFF TO SALES.JSX ----
    onConfirm(payload);
  };

  // =======================
  // SAVE DRAFT
  // =======================
  const handleDraftAction = () => {
    const payload = generateSaleDtoPayload('DRAFT');
    onSaveDraft(payload);
  };

  // =======================
  // UI BELOW 
  // =======================
  return (
    <Box sx={{ p: { xs: 1, md: 3 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Container maxWidth="xl">
        {/* -------- HEADER -------- */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Review & Payment
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Finalize quantities and record payment distribution
            </Typography>
          </Box>

          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onCancel}
            variant="outlined"
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Back to Cart
          </Button>
        </Stack>

        <Grid container spacing={4}>
          <Grid item xs={12} lg={8}>
            {/* -------- CUSTOMER & LOGISTICS -------- */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={7}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <PersonIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Customer Info
                    </Typography>
                  </Stack>

                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {selectedCustomer?.name || 'Walk-in Customer'}
                  </Typography>

                  <Typography variant="body2" color="textSecondary">
                    <strong>Mob:</strong> {selectedCustomer?.phone || 'N/A'}
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <HomeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="textSecondary">
                      {selectedCustomer?.addressLine1 || 'No Address Provided'}
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12} md={5}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: '#f1f5f9',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <LocalShippingIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Logistics
                    </Typography>
                  </Stack>

                  {formData.deliveryRequired ? (
                    <Box>
                      <Chip
                        label="Status: PACKED"
                        size="small"
                        color="info"
                        sx={{ mb: 1, fontWeight: 700 }}
                      />
                      <Typography variant="body2">
                        <strong>Fee:</strong> ₹{formData.deliveryCharge || 0}
                      </Typography>
                      <Typography variant="caption" color="error" sx={{ fontWeight: 700 }}>
                        * Paid directly to courier
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                      In-store pickup
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>

            {/* -------- ITEMS TABLE -------- */}
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Product Details</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Qty</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {formData.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.itemName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {item.sku} | {item.size}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">{item.qty}</TableCell>

                      <TableCell align="right">
                        ₹{(item.qty * item.unitPrice).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* -------- PAYMENT SECTION -------- */}
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', gap: 1 }}>
                  <PaymentIcon color="primary" /> Payment Distribution
                </Typography>

                <Button
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={handleAddPaymentMethod}
                >
                  Add Split
                </Button>
              </Stack>

              {paymentMethods.map((pm, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" sx={{ fontWeight: 700, ml: 1 }}>
                      METHOD
                    </Typography>
                    <Select
                      fullWidth
                      value={pm.paymentMethod}
                      onChange={(e) =>
                        handlePaymentChange(index, 'paymentMethod', e.target.value)
                      }
                    >
                      {paymentMethodOptions.map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" sx={{ fontWeight: 700, ml: 1 }}>
                      AMOUNT (₹)
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      value={pm.amount}
                      onChange={(e) =>
                        handlePaymentChange(index, 'amount', e.target.value)
                      }
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" sx={{ fontWeight: 700, ml: 1 }}>
                      TXN ID / REF
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder={
                        transactionIdMandatory(pm.paymentMethod)
                          ? 'Required'
                          : 'Optional'
                      }
                      value={pm.transactionId}
                      onChange={(e) =>
                        handlePaymentChange(index, 'transactionId', e.target.value)
                      }
                    />
                  </Grid>

                  <Grid item xs={12} sm={1} sx={{ mt: 3 }}>
                    {index > 0 && (
                      <IconButton
                        color="error"
                        onClick={() => handleRemovePaymentMethod(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Grid>
                </Grid>
              ))}
            </Paper>
          </Grid>

          {/* -------- BILLING SUMMARY (RIGHT) -------- */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ position: 'sticky', top: 24 }}>
              <Paper
                elevation={12}
                sx={{
                  p: 4,
                  borderRadius: 4,
                  bgcolor: '#0f172a',
                  color: 'white'
                }}
              >
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    pb: 2,
                    fontWeight: 800
                  }}
                >
                  Billing Summary
                </Typography>

                <Stack spacing={3} sx={{ my: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ opacity: 0.7 }}>Item Subtotal</Typography>
                    <Typography sx={{ fontWeight: 600 }}>
                      ₹{subtotal.toFixed(2)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ opacity: 0.7 }}>Extra Discount</Typography>
                    <TextField
                      size="small"
                      type="number"
                      value={discount}
                      sx={{
                        width: 100,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        borderRadius: 1.5,
                        input: {
                          color: 'white',
                          textAlign: 'right',
                          fontWeight: 800
                        }
                      }}
                      onChange={(e) =>
                        setDiscount(parseFloat(e.target.value) || 0)
                      }
                    />
                  </Box>

                  <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>
                      Grand Total
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 900, color: '#4ade80' }}
                    >
                      ₹{discountedTotal}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Paid Now
                    </Typography>
                    <Typography variant="body2">
                      ₹{totalPayment.toFixed(2)}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      p: 1.5,
                      bgcolor: 'rgba(255,255,255,0.05)',
                      borderRadius: 2
                    }}
                  >
                    <Typography
                      variant="body2"
                      color={Number(remaining) > 0 ? '#f87171' : '#4ade80'}
                    >
                      Credit Balance
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 800 }}
                      color={Number(remaining) > 0 ? '#f87171' : '#4ade80'}
                    >
                      ₹{remaining}
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleConfirmAction}
                  disabled={loading}
                  sx={{
                    py: 2,
                    fontWeight: 900,
                    borderRadius: 3,
                    mb: 2,
                    fontSize: '1.1rem',
                    bgcolor: '#4ade80',
                    color: '#064e3b',
                    '&:hover': { bgcolor: '#22c55e' },
                  }}
                >
                  {loading ? 'PROCESSING...' : 'COMPLETE SALE'}
                </Button>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="inherit"
                      startIcon={<SaveIcon />}
                      onClick={handleDraftAction}
                      sx={{ borderColor: 'rgba(255,255,255,0.2)', py: 1.5 }}
                    >
                      Save Draft
                    </Button>
                  </Grid>

                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="text"
                      color="inherit"
                      onClick={onCancel}
                      sx={{ opacity: 0.6 }}
                    >
                      Cancel
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              {Number(remaining) > 0 && (
                <Alert
                  severity="info"
                  variant="outlined"
                  sx={{ mt: 2, borderRadius: 2, bgcolor: 'white' }}
                >
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
