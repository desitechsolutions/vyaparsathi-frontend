import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box, Grid, Paper, Typography, TextField, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, Chip, Stack, Card, Alert, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Badge, Fade, Divider, CircularProgress,
  Skeleton, Tooltip
} from '@mui/material';
import {
  ReceiptLong, History, Payment, SentimentSatisfiedAlt,
  FileDownload, AccountBalance,
  CheckCircleOutline, Close, PictureAsPdf, Wallet,
  Refresh as RefreshIcon, ErrorOutline
} from '@mui/icons-material';
import {
  getSuppliers,
  getPurchaseOrders,
  recordBulkSupplierPayment,
  getSupplierPayments,
} from '../services/api';

const PAYMENT_MODES = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI / QR' },
  { value: 'NET_BANKING', label: 'IMPS / NEFT' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CARD', label: 'Card' },
  { value: 'OTHER', label: 'Other' },
];

export default function SupplierPaymentPage() {
  // --- Data States ---
  const [suppliers, setSuppliers] = useState([]);
  const [allPOs, setAllPOs] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // --- Form States ---
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [selectedPOs, setSelectedPOs] = useState([]);
  const [amount, setAmount] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [notes, setNotes] = useState('');

  // --- UI States ---
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [receiptData, setReceiptData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Load Data ---
  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [suppliersRes, posRes] = await Promise.all([
        getSuppliers(),
        getPurchaseOrders(),
      ]);
      setSuppliers(Array.isArray(suppliersRes) ? suppliersRes : []);
      setAllPOs(Array.isArray(posRes) ? posRes : []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setNotification({ open: true, message: 'Failed to load data. Please refresh.', severity: 'error' });
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const loadPaymentHistory = useCallback(async (supplierId) => {
    if (!supplierId) { setHistory([]); return; }
    setIsLoadingHistory(true);
    try {
      const res = await getSupplierPayments({ supplierId, page: 0, size: 50 });
      const content = res?.content || res || [];
      setHistory(Array.isArray(content) ? content : []);
    } catch (err) {
      console.error('Failed to load payment history:', err);
      setHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    setSelectedPOs([]);
    setAmount('');
    loadPaymentHistory(selectedSupplierId);
  }, [selectedSupplierId, loadPaymentHistory]);

  // --- Derived Data ---
  const activeSupplier = useMemo(() =>
    suppliers.find(s => s.id === selectedSupplierId), [selectedSupplierId, suppliers]);

  // POs for the selected supplier that are not fully paid (PENDING or PARTIALLY_PAID)
  const supplierPOs = useMemo(() =>
    allPOs.filter(po =>
      po.supplierId === selectedSupplierId &&
      po.status !== 'CANCELLED' &&
      po.paymentStatus !== 'PAID'
    ), [selectedSupplierId, allPOs]);

  const totalPayableSelected = useMemo(() => {
    return allPOs
      .filter(po => selectedPOs.includes(po.id))
      .reduce((sum, po) => {
        const due = Number(po.totalAmount || 0) - Number(po.paidAmount || 0);
        return sum + Math.max(0, due);
      }, 0);
  }, [selectedPOs, allPOs]);

  // Summary stats
  const stats = useMemo(() => {
    const totalPayable = allPOs
      .filter(po => po.paymentStatus !== 'PAID' && po.status !== 'CANCELLED')
      .reduce((sum, po) => {
        const due = Number(po.totalAmount || 0) - Number(po.paidAmount || 0);
        return sum + Math.max(0, due);
      }, 0);
    const pendingCount = allPOs.filter(po =>
      po.paymentStatus !== 'PAID' && po.status !== 'CANCELLED'
    ).length;
    return { totalPayable, pendingCount };
  }, [allPOs]);

  // --- Submit Payment ---
  const handlePaymentSubmit = async () => {
    if (!selectedSupplierId) {
      setNotification({ open: true, message: 'Please select a supplier.', severity: 'error' });
      return;
    }
    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      setNotification({ open: true, message: 'Please enter a valid amount.', severity: 'error' });
      return;
    }
    if (selectedPOs.length === 0) {
      setNotification({ open: true, message: 'Please select at least one Purchase Order to pay against.', severity: 'error' });
      return;
    }

    setIsProcessing(true);
    try {
      const payload = {
        supplierId: selectedSupplierId,
        selectedPoIds: selectedPOs,
        totalAmount: payAmount,
        paymentMethod: paymentMode,
        paymentDate: new Date().toISOString(),
        reference: refNumber || null,
        notes: notes || null,
      };

      const result = await recordBulkSupplierPayment(payload);
      const resultArray = Array.isArray(result) ? result : [result];

      // Show receipt for first payment
      const firstPayment = resultArray[0];
      setReceiptData({
        id: firstPayment?.transactionId || firstPayment?.id || `TXN-${Date.now()}`,
        amount: payAmount,
        mode: PAYMENT_MODES.find(m => m.value === paymentMode)?.label || paymentMode,
        supplierName: activeSupplier?.name || '',
        date: new Date().toLocaleString(),
        ref: refNumber || 'N/A',
        notes: notes,
        poCount: selectedPOs.length,
      });

      setAmount('');
      setRefNumber('');
      setNotes('');
      setSelectedPOs([]);
      setNotification({ open: true, message: 'Payment recorded successfully!', severity: 'success' });

      // Reload data & history
      await loadData();
      await loadPaymentHistory(selectedSupplierId);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to process payment. Please try again.';
      setNotification({ open: true, message: msg, severity: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (val) =>
    Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'PAID': return 'success';
      case 'PARTIALLY_PAID': return 'warning';
      default: return 'error';
    }
  };

  if (isLoadingData) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f1f5f9', minHeight: '100vh' }}>
        <Grid container spacing={2} mb={4}>
          {[1, 2, 3].map(i => <Grid item xs={12} sm={4} key={i}><Skeleton variant="rounded" height={80} sx={{ borderRadius: 4 }} /></Grid>)}
        </Grid>
        <Grid container spacing={4}>
          <Grid item xs={12} lg={5}><Skeleton variant="rounded" height={500} sx={{ borderRadius: 6 }} /></Grid>
          <Grid item xs={12} lg={7}><Skeleton variant="rounded" height={500} sx={{ borderRadius: 6 }} /></Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f1f5f9', minHeight: '100vh' }}>

      {/* 1. TOP DASHBOARD RIBBON */}
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" mb={3} spacing={2}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Payment color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h5" fontWeight={900} color="#0f172a">Supplier Payments</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">Manage and reconcile payments to your suppliers</Typography>
        </Box>
        <Tooltip title="Refresh Data">
          <IconButton onClick={loadData} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0' }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <Grid container spacing={2} mb={4}>
        {[
          { label: 'Total Payable', val: `₹${formatCurrency(stats.totalPayable)}`, color: '#e11d48', icon: <Wallet /> },
          { label: 'Active Suppliers', val: suppliers.length, color: '#059669', icon: <AccountBalance />, isQty: true },
          { label: 'Pending Orders', val: stats.pendingCount, color: '#2563eb', icon: <ReceiptLong />, isQty: true }
        ].map((stat, i) => (
          <Grid item xs={12} sm={4} key={i}>
            <Card elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ bgcolor: `${stat.color}15`, p: 1.5, borderRadius: 3, color: stat.color }}>{stat.icon}</Box>
              <Box>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase' }}>{stat.label}</Typography>
                <Typography variant="h5" fontWeight={900}>{stat.isQty ? stat.val : stat.val}</Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* 2. PAYMENT CONSOLE (LEFT) */}
        <Grid item xs={12} lg={5}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 6, border: '1px solid #e2e8f0', position: 'sticky', top: 24 }}>
            <Stack direction="row" alignItems="center" gap={1} mb={3}>
              <Payment color="primary" />
              <Typography variant="h6" fontWeight={900}>Payment Console</Typography>
            </Stack>

            <Stack spacing={2.5}>
              {/* Supplier Select */}
              <TextField
                select fullWidth label="Select Supplier"
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                sx={formInputSx}
              >
                {suppliers.length === 0 ? (
                  <MenuItem disabled>No suppliers found</MenuItem>
                ) : suppliers.map(s => (
                  <MenuItem key={s.id} value={s.id} sx={{ justifyContent: 'space-between' }}>
                    <Typography fontWeight={600}>{s.name}</Typography>
                  </MenuItem>
                ))}
              </TextField>

              {activeSupplier && (
                <Fade in={!!activeSupplier}>
                  <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '1px dashed #cbd5e1' }}>
                    {activeSupplier.phone && (
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" fontWeight={700}>Phone:</Typography>
                        <Typography variant="caption">{activeSupplier.phone}</Typography>
                      </Stack>
                    )}
                    {activeSupplier.email && (
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" fontWeight={700}>Email:</Typography>
                        <Typography variant="caption">{activeSupplier.email}</Typography>
                      </Stack>
                    )}
                  </Box>
                </Fade>
              )}

              {/* Amount */}
              <TextField
                fullWidth label="Amount to Transfer (₹)" type="number"
                value={amount} onChange={(e) => setAmount(e.target.value)}
                sx={formInputSx}
                inputProps={{ min: 0, step: '0.01' }}
              />

              {/* PO Selection */}
              {selectedSupplierId && (
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    SELECT POs TO PAY AGAINST
                  </Typography>
                  {supplierPOs.length === 0 ? (
                    <Box sx={{ p: 2, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 3, border: '1px dashed #cbd5e1' }}>
                      <Typography variant="caption" color="text.secondary">No pending purchase orders for this supplier.</Typography>
                    </Box>
                  ) : (
                    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', maxHeight: 220, overflowY: 'auto' }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell padding="checkbox" sx={{ bgcolor: '#f8fafc' }} />
                            <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', fontSize: '0.72rem' }}>PO #</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, bgcolor: '#f8fafc', fontSize: '0.72rem' }}>Due</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {supplierPOs.map(po => {
                            const due = Math.max(0, Number(po.totalAmount || 0) - Number(po.paidAmount || 0));
                            return (
                              <TableRow
                                key={po.id} hover
                                onClick={() => setSelectedPOs(prev =>
                                  prev.includes(po.id) ? prev.filter(x => x !== po.id) : [...prev, po.id]
                                )}
                                sx={{ cursor: 'pointer' }}
                              >
                                <TableCell padding="checkbox">
                                  <Checkbox checked={selectedPOs.includes(po.id)} size="small" />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="caption" fontWeight={700}>{po.poNumber}</Typography>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    {po.orderDate ? new Date(po.orderDate).toLocaleDateString('en-IN') : ''}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="caption" fontWeight={900} color="error.main">₹{formatCurrency(due)}</Typography>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </Paper>
                  )}
                  {selectedPOs.length > 0 && (
                    <Button
                      size="small" variant="outlined" color="primary"
                      onClick={() => setAmount(totalPayableSelected.toFixed(2))}
                      sx={{ mt: 1, borderRadius: 2, fontWeight: 700, fontSize: '0.72rem' }}
                    >
                      Fill Total Due: ₹{formatCurrency(totalPayableSelected)}
                    </Button>
                  )}
                </Box>
              )}

              {/* Payment Mode + Ref */}
              <Stack direction="row" spacing={2}>
                <TextField
                  select sx={{ flex: 1, ...formInputSx }} label="Mode"
                  value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}
                >
                  {PAYMENT_MODES.map(m => (
                    <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  sx={{ flex: 1, ...formInputSx }} label="Ref / UTR No."
                  value={refNumber} onChange={(e) => setRefNumber(e.target.value)}
                />
              </Stack>

              <TextField
                fullWidth label="Internal Notes"
                multiline rows={2} value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={formInputSx}
              />

              <Button
                variant="contained" fullWidth size="large"
                onClick={handlePaymentSubmit}
                disabled={isProcessing || !selectedSupplierId || !amount || selectedPOs.length === 0}
                sx={{ borderRadius: 4, py: 2, fontWeight: 900, textTransform: 'none', fontSize: '1rem', boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)' }}
              >
                {isProcessing ? <CircularProgress size={24} color="inherit" /> : 'Confirm & Record Payment'}
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* 3. PENDING POs TABLE + HISTORY (RIGHT) */}
        <Grid item xs={12} lg={7}>
          <Stack spacing={4}>

            {/* All Pending POs */}
            <Card variant="outlined" sx={{ borderRadius: 6, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc' }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={900}>Pending Reconciliation</Typography>
                  <Typography variant="caption" color="text.secondary">All purchase orders pending payment</Typography>
                </Box>
              </Box>
              <TableContainer sx={{ maxHeight: 320 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>PO Number</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Supplier</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Balance Due</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allPOs.filter(po => po.paymentStatus !== 'PAID' && po.status !== 'CANCELLED').length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                          <SentimentSatisfiedAlt sx={{ fontSize: 48, color: '#cbd5e1', mb: 1, display: 'block', mx: 'auto' }} />
                          <Typography color="text.secondary">No pending purchase orders. You're all caught up!</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      allPOs.filter(po => po.paymentStatus !== 'PAID' && po.status !== 'CANCELLED').map(po => {
                        const supplier = suppliers.find(s => s.id === po.supplierId);
                        const due = Math.max(0, Number(po.totalAmount || 0) - Number(po.paidAmount || 0));
                        return (
                          <TableRow key={po.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={800}>{po.poNumber}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{supplier?.name || '—'}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {po.orderDate ? new Date(po.orderDate).toLocaleDateString('en-IN') : '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={po.paymentStatus || 'PENDING'}
                                size="small"
                                color={getPaymentStatusColor(po.paymentStatus)}
                                sx={{ fontSize: '0.65rem', fontWeight: 900 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">₹{formatCurrency(po.totalAmount)}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={900} color="error.main">
                                ₹{formatCurrency(due)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

            {/* Payment History */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} px={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <History fontSize="small" color="action" />
                  <Typography variant="subtitle1" fontWeight={900}>
                    {selectedSupplierId ? `${activeSupplier?.name || ''} Payment History` : 'Select a supplier to view history'}
                  </Typography>
                </Stack>
                <Button size="small" startIcon={<FileDownload />} disabled>Export CSV</Button>
              </Stack>

              {isLoadingHistory ? (
                <Stack spacing={2}>
                  {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: 4 }} />)}
                </Stack>
              ) : history.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
                  <ErrorOutline sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                  <Typography color="text.secondary" variant="body2">
                    {selectedSupplierId ? 'No payment history for this supplier.' : 'Select a supplier above to see their payment history.'}
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={2}>
                  {history.map((h, idx) => (
                    <Paper
                      key={h.id || idx}
                      variant="outlined"
                      sx={{ p: 2, borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.2s', '&:hover': { borderColor: '#2563eb', bgcolor: '#f8fafc' } }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Badge color="success" variant="dot" overlap="circular">
                          <Box sx={{ bgcolor: '#f1f5f9', p: 1.5, borderRadius: 3 }}><ReceiptLong color="action" /></Box>
                        </Badge>
                        <Box>
                          <Typography variant="body2" fontWeight={800}>
                            {suppliers.find(s => s.id === h.supplierId)?.name || 'Supplier'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {h.paymentDate ? new Date(h.paymentDate).toLocaleString('en-IN') : '—'}
                            {h.transactionId ? ` • ${h.transactionId}` : ''}
                          </Typography>
                          {h.reference && (
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#6366f1' }}>
                              Ref: {h.reference}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="subtitle1" fontWeight={900}>₹{formatCurrency(h.amount)}</Typography>
                        <Stack direction="row" gap={0.5} justifyContent="flex-end">
                          <Chip
                            label={PAYMENT_MODES.find(m => m.value === h.paymentMethod)?.label || h.paymentMethod || 'N/A'}
                            size="small" variant="outlined"
                            sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800 }}
                          />
                          <IconButton size="small" onClick={() => setReceiptData({
                            id: h.transactionId || h.id,
                            amount: h.amount,
                            mode: PAYMENT_MODES.find(m => m.value === h.paymentMethod)?.label || h.paymentMethod,
                            supplierName: suppliers.find(s => s.id === h.supplierId)?.name || '',
                            date: h.paymentDate ? new Date(h.paymentDate).toLocaleString('en-IN') : '—',
                            ref: h.reference || 'N/A',
                            notes: h.notes,
                          })}>
                            <History sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Stack>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
          </Stack>
        </Grid>
      </Grid>

      {/* DIGITAL RECEIPT MODAL */}
      <Dialog open={!!receiptData} onClose={() => setReceiptData(null)} PaperProps={{ sx: { borderRadius: 6, width: '100%', maxWidth: 450, p: 1 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={900}>Payment Voucher</Typography>
          <IconButton onClick={() => setReceiptData(null)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          {receiptData && (
            <Box sx={{ p: 2 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <CheckCircleOutline sx={{ fontSize: 64, color: '#059669', mb: 1 }} />
                <Typography variant="h4" fontWeight={900}>₹{formatCurrency(receiptData.amount)}</Typography>
                <Typography variant="body2" color="text.secondary">Payment Recorded Successfully</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <Stack spacing={2}>
                {[
                  { label: 'Supplier', val: receiptData.supplierName },
                  { label: 'Payment Date', val: receiptData.date },
                  { label: 'Transaction ID', val: receiptData.id || 'N/A' },
                  { label: 'Payment Mode', val: receiptData.mode },
                  { label: 'Ref / UTR Number', val: receiptData.ref },
                ].filter(r => r.val).map((row, i) => (
                  <Stack key={i} direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                    <Typography variant="body2" fontWeight={800}>{row.val}</Typography>
                  </Stack>
                ))}
              </Stack>
              {receiptData.notes && (
                <Box sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">Notes:</Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>{receiptData.notes}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button fullWidth variant="outlined" onClick={() => window.print()} sx={{ borderRadius: 3 }}>
            Print Voucher
          </Button>
          <Button fullWidth variant="contained" startIcon={<PictureAsPdf />} sx={{ borderRadius: 3 }} onClick={() => setReceiptData(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open} autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={notification.severity} variant="filled" sx={{ borderRadius: 3, fontWeight: 700 }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

const formInputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 4,
    bgcolor: 'white',
    transition: '0.2s',
    '&:hover fieldset': { borderColor: '#2563eb' },
    '&.Mui-focused fieldset': { borderWidth: '2px' }
  },
  '& .MuiInputLabel-root': { fontWeight: 600 }
};
