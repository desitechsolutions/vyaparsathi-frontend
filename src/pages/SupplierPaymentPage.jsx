import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box, Grid, Paper, Typography, TextField, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, Chip, Stack, Card, Alert, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Badge, Fade, Divider, CircularProgress,
  Skeleton, Tooltip, Tab, Tabs, InputAdornment, alpha
} from '@mui/material';
import {
  ReceiptLong, Payment, SentimentSatisfiedAlt,
  AccountBalance,
  CheckCircleOutline, Close, PictureAsPdf, Wallet,
  Refresh as RefreshIcon, ErrorOutline,
  Visibility as VisibilityIcon, Search as SearchIcon,
  Print as PrintIcon, TrendingDown, History as HistoryIcon
} from '@mui/icons-material';
import {
  getSuppliers,
  getPurchaseOrders,
  recordBulkSupplierPayment,
  getSupplierPayments,
  getPurchaseOrderById,
  getSupplierPaymentSummary,
} from '../services/api';

// Modern color palette
const theme = {
  primary: '#0f766e',
  primaryLight: '#14b8a6',
  secondary: '#7c3aed',
  danger: '#dc2626',
  warning: '#f59e0b',
  success: '#10b981',
  background: '#f8fafc',
  cardBg: '#ffffff',
  borderColor: '#e2e8f0',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
};

const PAYMENT_MODES = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI / QR' },
  { value: 'NET_BANKING', label: 'IMPS / NEFT' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CARD', label: 'Card' },
  { value: 'OTHER', label: 'Other' },
];

const formInputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    bgcolor: '#ffffff',
    transition: 'all 0.3s ease',
    border: `1.5px solid ${alpha(theme.primary, 0.15)}`,
    '& fieldset': { borderColor: 'transparent' },
    '&:hover fieldset': { borderColor: alpha(theme.primary, 0.3) },
    '&.Mui-focused fieldset': { borderColor: theme.primary, borderWidth: '2px' }
  },
  '& .MuiInputLabel-root': { fontWeight: 700, color: theme.textSecondary },
  '& .MuiInputLabel-shrink': { transform: 'translate(14px, -9px) scale(0.75)' }
};

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

  // --- Tab State ---
  const [activeTab, setActiveTab] = useState(0);

  // --- History search/filter states ---
  const [historySearch, setHistorySearch] = useState('');
  const [historyModeFilter, setHistoryModeFilter] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');

  // --- PO Items Dialog ---
  const [poItemsDialog, setPoItemsDialog] = useState({ open: false, po: null, items: [], loading: false });

  // --- Load Data ---
  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [suppliersRes, posRes] = await Promise.all([
        getSuppliers(),
        getPurchaseOrders(),
      ]);
      const suppliersList = Array.isArray(suppliersRes) ? suppliersRes : [];
      const posList = Array.isArray(posRes) ? posRes : [];

      setSuppliers(suppliersList);

      if (posList.length > 0) {
        const summaries = await Promise.allSettled(
          posList.map((po) => getSupplierPaymentSummary(po.id))
        );
        const summaryMap = {};
        summaries.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            const s = result.value;
            summaryMap[s.purchaseOrderId] = s;
          }
        });
        const enriched = posList.map((po) => {
          const s = summaryMap[po.id];
          return s
            ? {
                ...po,
                paymentStatus: s.paymentStatus || 'PENDING',
                paidAmount: Number(s.totalPaid || 0),
                amountDue: Number(s.amountDue ?? (po.totalAmount - (s.totalPaid || 0))),
              }
            : { ...po, paymentStatus: po.paymentStatus || 'PENDING', paidAmount: 0 };
        });
        setAllPOs(enriched);
      } else {
        setAllPOs([]);
      }
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

  const getPODue = useCallback(
    (po) => {
      if (po.amountDue !== undefined) return Math.max(0, Number(po.amountDue));
      return Math.max(0, Number(po.totalAmount || 0) - Number(po.paidAmount || 0));
    },
    []
  );

  const supplierPOs = useMemo(() =>
    allPOs.filter(po =>
      po.supplierId === selectedSupplierId &&
      po.status !== 'CANCELLED' &&
      po.paymentStatus !== 'PAID'
    ), [selectedSupplierId, allPOs]);

  const totalPayableSelected = useMemo(() => {
    return allPOs
      .filter(po => selectedPOs.includes(po.id))
      .reduce((sum, po) => sum + getPODue(po), 0);
  }, [selectedPOs, allPOs, getPODue]);

  const stats = useMemo(() => {
    const totalPayable = allPOs
      .filter(po => po.paymentStatus !== 'PAID' && po.status !== 'CANCELLED')
      .reduce((sum, po) => sum + getPODue(po), 0);
    const pendingCount = allPOs.filter(po =>
      po.paymentStatus !== 'PAID' && po.status !== 'CANCELLED'
    ).length;
    return { totalPayable, pendingCount };
  }, [allPOs, getPODue]);

  const filteredHistory = useMemo(() => {
    return history.filter((h) => {
      const matchMode = !historyModeFilter || h.paymentMethod === historyModeFilter;
      const searchLow = historySearch.toLowerCase();
      const matchSearch = !historySearch || (
        (h.reference || '').toLowerCase().includes(searchLow) ||
        (h.transactionId || '').toLowerCase().includes(searchLow) ||
        String(h.amount || '').includes(historySearch) ||
        (suppliers.find(s => s.id === h.supplierId)?.name || '').toLowerCase().includes(searchLow)
      );
      const payDate = h.paymentDate ? new Date(h.paymentDate) : null;
      const matchFrom = !historyDateFrom || (payDate && payDate >= new Date(historyDateFrom));
      const toEnd = historyDateTo ? new Date(historyDateTo) : null;
      if (toEnd) toEnd.setHours(23, 59, 59, 999);
      const matchTo = !historyDateTo || (payDate && payDate <= toEnd);
      return matchMode && matchSearch && matchFrom && matchTo;
    });
  }, [history, historyModeFilter, historySearch, historyDateFrom, historyDateTo, suppliers]);

  const pendingPOCount = useMemo(
    () => allPOs.filter(po => po.paymentStatus !== 'PAID' && po.status !== 'CANCELLED').length,
    [allPOs]
  );

  const handleViewPOItems = useCallback(async (po) => {
    setPoItemsDialog({ open: true, po, items: [], loading: true });
    try {
      const detail = await getPurchaseOrderById(po.id);
      setPoItemsDialog({ open: true, po, items: detail?.items || [], loading: false });
    } catch (err) {
      console.error('Failed to load PO items:', err);
      setPoItemsDialog({ open: true, po, items: [], loading: false });
    }
  }, []);

  const escapeHtml = (str) =>
    String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const handlePrintReceipt = useCallback(() => {
    if (!receiptData) return;
    const win = window.open('', '_blank', 'width=480,height=700');
    if (!win) return;
    const amt = Number(receiptData.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    win.document.write(`<!DOCTYPE html>
<html><head><title>Payment Voucher</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px; color: #0f172a; background: #f8fafc; }
  .container { background: white; padding: 24px; border-radius: 12px; max-width: 400px; margin: 0 auto; }
  .header { text-align: center; margin-bottom: 24px; }
  .header h1 { font-size: 22px; font-weight: 900; color: #0f766e; }
  .header p  { color: #64748b; font-size: 13px; margin-top: 4px; }
  .amount    { text-align: center; margin: 24px 0; padding: 20px; background: #f0fdf4; border-radius: 8px; border: 2px solid #10b981; }
  .amount .val { font-size: 36px; font-weight: 900; color: #059669; }
  .amount .lbl { color: #64748b; font-size: 13px; margin-top: 8px; }
  hr { border: none; border-top: 1.5px solid #e2e8f0; margin: 20px 0; }
  .row { display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 14px; }
  .row .label { color: #64748b; font-weight: 600; }
  .row .value { font-weight: 700; color: #1e293b; }
  .notes { margin-top: 20px; background: #f0fdf4; padding: 12px; border-radius: 6px; font-size: 13px; color: #047857; }
  .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #94a3b8; }
  @media print { body { padding: 0; background: white; } .container { border: none; } }
</style></head><body>
<div class="container">
  <div class="header">
    <h1>Payment Voucher</h1>
    <p>VyaparSathi &#8212; Supplier Payment Receipt</p>
  </div>
  <div class="amount">
    <div class="val">&#8377;${escapeHtml(amt)}</div>
    <div class="lbl">✓ Payment Recorded Successfully</div>
  </div>
  <hr/>
  <div class="row"><span class="label">Supplier</span><span class="value">${escapeHtml(receiptData.supplierName)}</span></div>
  <div class="row"><span class="label">Payment Date</span><span class="value">${escapeHtml(receiptData.date)}</span></div>
  <div class="row"><span class="label">Transaction ID</span><span class="value">${escapeHtml(receiptData.id || 'N/A')}</span></div>
  <div class="row"><span class="label">Payment Mode</span><span class="value">${escapeHtml(receiptData.mode)}</span></div>
  <div class="row"><span class="label">Ref / UTR Number</span><span class="value">${escapeHtml(receiptData.ref || 'N/A')}</span></div>
  ${receiptData.notes ? `<div class="notes"><strong>Notes:</strong> ${escapeHtml(receiptData.notes)}</div>` : ''}
  <div class="footer">This is a computer-generated receipt. No signature required.</div>
</div>
</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }, [receiptData]);

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
      <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: theme.background, minHeight: '100vh' }}>
        <Grid container spacing={3} mb={4}>
          {[1, 2, 3].map(i => <Grid item xs={12} sm={4} key={i}><Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} /></Grid>)}
        </Grid>
        <Grid container spacing={4}>
          <Grid item xs={12} lg={5}><Skeleton variant="rounded" height={500} sx={{ borderRadius: 3 }} /></Grid>
          <Grid item xs={12} lg={7}><Skeleton variant="rounded" height={500} sx={{ borderRadius: 3 }} /></Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: theme.background, minHeight: '100vh' }}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        alignItems={{ sm: 'center' }} 
        justifyContent="space-between" 
        mb={4} 
        spacing={2}
      >
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
            <Box sx={{ 
              p: 1.2, 
              borderRadius: 2.5, 
              bgcolor: alpha(theme.primary, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Payment sx={{ fontSize: 26, color: theme.primary, fontWeight: 800 }} />
            </Box>
            <Typography variant="h5" fontWeight={900} color={theme.textPrimary}>
              Supplier Payments
            </Typography>
          </Stack>
          <Typography variant="body2" color={theme.textSecondary} sx={{ ml: 5.5 }}>
            Manage and reconcile payments to your suppliers
          </Typography>
        </Box>
        <Tooltip title="Refresh Data">
          <IconButton 
            onClick={loadData} 
            sx={{ 
              bgcolor: '#ffffff', 
              border: `1.5px solid ${alpha(theme.primary, 0.2)}`,
              color: theme.primary,
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: alpha(theme.primary, 0.05),
                transform: 'rotate(180deg)'
              }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* ── STATS CARDS ────────────────────────────────────── */}
      <Grid container spacing={2.5} mb={4}>
        {[
          { 
            label: 'Total Payable', 
            val: `₹${formatCurrency(stats.totalPayable)}`, 
            color: theme.danger, 
            icon: <TrendingDown /> 
          },
          { 
            label: 'Active Suppliers', 
            val: suppliers.length, 
            color: theme.success, 
            icon: <AccountBalance />, 
            isQty: true 
          },
          { 
            label: 'Pending Orders', 
            val: stats.pendingCount, 
            color: theme.secondary, 
            icon: <ReceiptLong />, 
            isQty: true 
          }
        ].map((stat, i) => (
          <Grid item xs={12} sm={4} key={i}>
            <Card 
              elevation={0} 
              sx={{ 
                p: 3, 
                borderRadius: 3, 
                border: `1.5px solid ${alpha(stat.color, 0.15)}`,
                display: 'flex', 
                alignItems: 'center', 
                gap: 2.5,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: `0 8px 24px ${alpha(stat.color, 0.15)}`,
                  transform: 'translateY(-2px)',
                  borderColor: alpha(stat.color, 0.3)
                }
              }}
            >
              <Box sx={{ 
                bgcolor: alpha(stat.color, 0.1), 
                p: 2, 
                borderRadius: 2.5, 
                color: stat.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {stat.icon}
              </Box>
              <Box>
                <Typography 
                  variant="caption" 
                  fontWeight={800} 
                  color={theme.textSecondary} 
                  sx={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}
                >
                  {stat.label}
                </Typography>
                <Typography variant="h5" fontWeight={900} color={stat.color} sx={{ mt: 0.5 }}>
                  {stat.val}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── MAIN CONTENT GRID ──────────────────────────────── */}
      <Grid container spacing={4}>
        {/* LEFT: PAYMENT CONSOLE */}
        <Grid item xs={12} lg={5}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3.5, 
              borderRadius: 3, 
              border: `1.5px solid ${alpha(theme.primary, 0.15)}`,
              position: 'sticky', 
              top: 24,
              boxShadow: `0 2px 8px ${alpha(theme.primary, 0.08)}`
            }}
          >
            <Stack direction="row" alignItems="center" gap={1.5} mb={3}>
              <Box sx={{ 
                p: 1, 
                borderRadius: 1.5, 
                bgcolor: alpha(theme.primary, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Payment sx={{ fontSize: 22, color: theme.primary }} />
              </Box>
              <Typography variant="h6" fontWeight={900} color={theme.textPrimary}>
                Payment Console
              </Typography>
            </Stack>

            <Stack spacing={3}>
              {/* Supplier Select */}
              <TextField
                select 
                fullWidth 
                label="Select Supplier"
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                sx={formInputSx}
                size="small"
              >
                {suppliers.length === 0 ? (
                  <MenuItem disabled>No suppliers found</MenuItem>
                ) : suppliers.map(s => (
                  <MenuItem key={s.id} value={s.id}>
                    <Typography fontWeight={700}>{s.name}</Typography>
                  </MenuItem>
                ))}
              </TextField>

              {/* Supplier Details */}
              {activeSupplier && (
                <Fade in={!!activeSupplier}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      p: 2.5, 
                      bgcolor: alpha(theme.primary, 0.04),
                      border: `1.5px solid ${alpha(theme.primary, 0.12)}`,
                      borderRadius: 2.5
                    }}
                  >
                    {activeSupplier.phone && (
                      <Stack direction="row" justifyContent="space-between" mb={1}>
                        <Typography variant="caption" fontWeight={800} color={theme.textSecondary}>Phone:</Typography>
                        <Typography variant="caption" fontWeight={700}>{activeSupplier.phone}</Typography>
                      </Stack>
                    )}
                    {activeSupplier.email && (
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" fontWeight={800} color={theme.textSecondary}>Email:</Typography>
                        <Typography variant="caption" fontWeight={700} sx={{ wordBreak: 'break-word' }}>{activeSupplier.email}</Typography>
                      </Stack>
                    )}
                  </Card>
                </Fade>
              )}

              {/* Amount Input */}
              <TextField
                fullWidth 
                label="Amount to Transfer (₹)" 
                type="number"
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                sx={formInputSx}
                size="small"
                inputProps={{ min: 0, step: '0.01' }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />

              {/* PO Selection */}
              {selectedSupplierId && (
                <Box>
                  <Typography 
                    variant="caption" 
                    fontWeight={800} 
                    color={theme.textSecondary} 
                    sx={{ mb: 1.5, display: 'block', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}
                  >
                    Select POs to Pay Against
                  </Typography>
                  {supplierPOs.length === 0 ? (
                    <Card 
                      elevation={0}
                      sx={{ 
                        p: 2.5, 
                        textAlign: 'center', 
                        bgcolor: alpha(theme.success, 0.05),
                        border: `1.5px dashed ${alpha(theme.success, 0.2)}`,
                        borderRadius: 2.5
                      }}
                    >
                      <Typography variant="caption" color={theme.textSecondary} fontWeight={600}>
                        ✓ No pending purchase orders for this supplier.
                      </Typography>
                    </Card>
                  ) : (
                    <Card 
                      elevation={0}
                      sx={{ 
                        borderRadius: 2.5, 
                        overflow: 'hidden', 
                        maxHeight: 240, 
                        overflowY: 'auto',
                        border: `1.5px solid ${alpha(theme.primary, 0.15)}`
                      }}
                    >
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow sx={{ bgcolor: alpha(theme.primary, 0.04) }}>
                            <TableCell padding="checkbox" sx={{ bgcolor: alpha(theme.primary, 0.04), borderBottom: `1.5px solid ${alpha(theme.primary, 0.15)}` }} />
                            <TableCell sx={{ fontWeight: 800, bgcolor: alpha(theme.primary, 0.04), fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: `1.5px solid ${alpha(theme.primary, 0.15)}` }}>PO #</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, bgcolor: alpha(theme.primary, 0.04), fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: `1.5px solid ${alpha(theme.primary, 0.15)}` }}>Due</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {supplierPOs.map(po => {
                            const due = getPODue(po);
                            return (
                              <TableRow
                                key={po.id} 
                                hover
                                onClick={() => setSelectedPOs(prev =>
                                  prev.includes(po.id) ? prev.filter(x => x !== po.id) : [...prev, po.id]
                                )}
                                sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.primary, 0.04) } }}
                              >
                                <TableCell padding="checkbox">
                                  <Checkbox checked={selectedPOs.includes(po.id)} size="small" />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="caption" fontWeight={800}>{po.poNumber}</Typography>
                                  <Typography variant="caption" color={theme.textSecondary} display="block" sx={{ fontSize: '0.65rem' }}>
                                    {po.orderDate ? new Date(po.orderDate).toLocaleDateString('en-IN') : ''}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="caption" fontWeight={900} sx={{ color: theme.danger }}>
                                    ₹{formatCurrency(due)}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </Card>
                  )}
                  {selectedPOs.length > 0 && (
                    <Button
                      size="small" 
                      variant="outlined" 
                      onClick={() => setAmount(totalPayableSelected.toFixed(2))}
                      sx={{ 
                        mt: 1.5, 
                        borderRadius: 2, 
                        fontWeight: 700, 
                        fontSize: '0.75rem',
                        borderColor: alpha(theme.primary, 0.3),
                        color: theme.primary,
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: alpha(theme.primary, 0.05),
                          borderColor: theme.primary
                        }
                      }}
                    >
                      Auto-Fill: ₹{formatCurrency(totalPayableSelected)}
                    </Button>
                  )}
                </Box>
              )}

              {/* Payment Mode + Ref */}
              <Stack direction="row" spacing={2}>
                <TextField
                  select 
                  label="Mode"
                  value={paymentMode} 
                  onChange={(e) => setPaymentMode(e.target.value)}
                  sx={{ flex: 1, ...formInputSx }}
                  size="small"
                >
                  {PAYMENT_MODES.map(m => (
                    <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Ref / UTR No."
                  value={refNumber} 
                  onChange={(e) => setRefNumber(e.target.value)}
                  sx={{ flex: 1, ...formInputSx }}
                  size="small"
                />
              </Stack>

              {/* Notes */}
              <TextField
                fullWidth 
                label="Internal Notes"
                multiline 
                rows={2} 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={formInputSx}
                size="small"
              />

              {/* Submit Button */}
              <Button
                variant="contained" 
                fullWidth 
                size="large"
                onClick={handlePaymentSubmit}
                disabled={isProcessing || !selectedSupplierId || !amount || selectedPOs.length === 0}
                sx={{ 
                  borderRadius: 2.5, 
                  py: 1.8, 
                  fontWeight: 900, 
                  textTransform: 'none', 
                  fontSize: '1rem',
                  background: (isProcessing || !selectedSupplierId || !amount || selectedPOs.length === 0)
                    ? undefined
                    : `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 100%)`,
                  boxShadow: (isProcessing || !selectedSupplierId || !amount || selectedPOs.length === 0)
                    ? 'none'
                    : `0 8px 24px ${alpha(theme.primary, 0.35)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: `linear-gradient(135deg, #065f46 0%, ${theme.primary} 100%)`,
                    boxShadow: `0 12px 32px ${alpha(theme.primary, 0.5)}`,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {isProcessing ? (
                  <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                ) : null}
                {isProcessing
                  ? 'Processing...'
                  : 'Confirm & Record Payment'
                }
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* RIGHT: TABS ─────────────────────────────────────── */}
        <Grid item xs={12} lg={7}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 3, 
              border: `1.5px solid ${alpha(theme.primary, 0.15)}`,
              overflow: 'hidden',
              boxShadow: `0 2px 8px ${alpha(theme.primary, 0.08)}`
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{ 
                borderBottom: `1.5px solid ${alpha(theme.primary, 0.15)}`, 
                bgcolor: alpha(theme.primary, 0.04), 
                px: 2, 
                pt: 1.5,
                '& .MuiTab-root': {
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                  color: theme.textSecondary,
                  '&.Mui-selected': { color: theme.primary }
                },
                '& .MuiTabs-indicator': {
                  bgcolor: theme.primary,
                  height: 3,
                  borderRadius: '3px 3px 0 0'
                }
              }}
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label={`Pending POs (${pendingPOCount})`} />
              <Tab label={`Payment History${selectedSupplierId && history.length ? ` (${history.length})` : ''}`} />
            </Tabs>

            {/* TAB 0: Pending POs */}
            {activeTab === 0 && (
              <TableContainer sx={{ maxHeight: 500 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.primary, 0.04) }}>
                      <TableCell sx={{ fontWeight: 800, bgcolor: alpha(theme.primary, 0.04), fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: `1.5px solid ${alpha(theme.primary, 0.15)}` }}>PO Number</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: alpha(theme.primary, 0.04), fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: `1.5px solid ${alpha(theme.primary, 0.15)}` }}>Supplier</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: alpha(theme.primary, 0.04), fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: `1.5px solid ${alpha(theme.primary, 0.15)}` }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: alpha(theme.primary, 0.04), fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: `1.5px solid ${alpha(theme.primary, 0.15)}` }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, bgcolor: alpha(theme.primary, 0.04), fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: `1.5px solid ${alpha(theme.primary, 0.15)}` }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, bgcolor: alpha(theme.primary, 0.04), fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: `1.5px solid ${alpha(theme.primary, 0.15)}` }}>Due</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, bgcolor: alpha(theme.primary, 0.04), fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: `1.5px solid ${alpha(theme.primary, 0.15)}` }}>Items</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allPOs.filter(po => po.paymentStatus !== 'PAID' && po.status !== 'CANCELLED').length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                          <SentimentSatisfiedAlt sx={{ fontSize: 48, color: alpha(theme.success, 0.3), mb: 1, display: 'block', mx: 'auto' }} />
                          <Typography color={theme.textSecondary} fontWeight={700}>
                            No pending purchase orders. All caught up! ✓
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      allPOs.filter(po => po.paymentStatus !== 'PAID' && po.status !== 'CANCELLED').map(po => {
                        const supplier = suppliers.find(s => s.id === po.supplierId);
                        const due = getPODue(po);
                        return (
                          <TableRow 
                            key={po.id} 
                            hover
                            sx={{ '&:hover': { bgcolor: alpha(theme.primary, 0.04) } }}
                          >
                            <TableCell>
                              <Typography variant="body2" fontWeight={800}>{po.poNumber}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={700}>{supplier?.name || '—'}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color={theme.textSecondary}>
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
                              <Typography variant="body2" fontWeight={700}>₹{formatCurrency(po.totalAmount)}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={900} sx={{ color: theme.danger }}>
                                ₹{formatCurrency(due)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="View PO Items">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewPOItems(po)}
                                  sx={{ color: theme.primary, transition: 'all 0.3s ease', '&:hover': { transform: 'scale(1.15)' } }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* TAB 1: Payment History */}
            {activeTab === 1 && (
              <Box sx={{ p: 3 }}>
                {/* Filters */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={2.5}>
                  <TextField
                    size="small"
                    placeholder="Search by ref, TXN ID, supplier…"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    sx={{ flex: 2, ...formInputSx }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" sx={{ color: theme.textSecondary, opacity: 0.6 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    select 
                    size="small" 
                    label="Mode" 
                    sx={{ flex: 1, ...formInputSx }}
                    value={historyModeFilter} 
                    onChange={(e) => setHistoryModeFilter(e.target.value)}
                  >
                    <MenuItem value="">All Modes</MenuItem>
                    {PAYMENT_MODES.map(m => (
                      <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                    ))}
                  </TextField>
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={2.5} alignItems="center">
                  <TextField
                    size="small" 
                    type="date" 
                    label="From" 
                    sx={{ flex: 1, ...formInputSx }}
                    value={historyDateFrom} 
                    onChange={(e) => setHistoryDateFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    size="small" 
                    type="date" 
                    label="To" 
                    sx={{ flex: 1, ...formInputSx }}
                    value={historyDateTo} 
                    onChange={(e) => setHistoryDateTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                  {(historySearch || historyModeFilter || historyDateFrom || historyDateTo) && (
                    <Button 
                      size="small" 
                      onClick={() => { 
                        setHistorySearch(''); 
                        setHistoryModeFilter(''); 
                        setHistoryDateFrom(''); 
                        setHistoryDateTo(''); 
                      }} 
                      sx={{ fontWeight: 700, whiteSpace: 'nowrap', textTransform: 'none' }}
                    >
                      Clear All
                    </Button>
                  )}
                </Stack>

                {!selectedSupplierId ? (
                  <Card 
                    elevation={0}
                    sx={{ 
                      p: 4, 
                      textAlign: 'center', 
                      borderRadius: 2.5,
                      bgcolor: alpha(theme.warning, 0.05),
                      border: `1.5px dashed ${alpha(theme.warning, 0.2)}`
                    }}
                  >
                    <ErrorOutline sx={{ fontSize: 40, color: alpha(theme.warning, 0.4), mb: 1 }} />
                    <Typography color={theme.textSecondary} variant="body2" fontWeight={600}>
                      Select a supplier from the Payment Console to view history.
                    </Typography>
                  </Card>
                ) : isLoadingHistory ? (
                  <Stack spacing={2}>
                    {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: 2.5 }} />)}
                  </Stack>
                ) : filteredHistory.length === 0 ? (
                  <Card 
                    elevation={0}
                    sx={{ 
                      p: 4, 
                      textAlign: 'center', 
                      borderRadius: 2.5,
                      bgcolor: alpha(theme.textSecondary, 0.04),
                      border: `1.5px dashed ${alpha(theme.textSecondary, 0.15)}`
                    }}
                  >
                    <HistoryIcon sx={{ fontSize: 40, color: alpha(theme.textSecondary, 0.3), mb: 1 }} />
                    <Typography color={theme.textSecondary} variant="body2" fontWeight={600}>
                      {history.length === 0 ? 'No payment history yet.' : 'No results match your filters.'}
                    </Typography>
                  </Card>
                ) : (
                  <Stack spacing={2} sx={{ maxHeight: 400, overflowY: 'auto', pr: 0.5 }}>
                    {filteredHistory.map((h, idx) => (
                      <Card
                        key={h.id || idx}
                        elevation={0}
                        sx={{ 
                          p: 2.5, 
                          borderRadius: 2.5,
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          border: `1.5px solid ${alpha(theme.primary, 0.15)}`,
                          transition: 'all 0.3s ease', 
                          '&:hover': { 
                            borderColor: alpha(theme.primary, 0.4),
                            bgcolor: alpha(theme.primary, 0.02),
                            boxShadow: `0 4px 12px ${alpha(theme.primary, 0.1)}`
                          } 
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                          <Badge color="success" variant="dot" overlap="circular">
                            <Box sx={{ 
                              bgcolor: alpha(theme.success, 0.1), 
                              p: 1.5, 
                              borderRadius: 2.5,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <ReceiptLong sx={{ color: theme.success, fontSize: 20 }} />
                            </Box>
                          </Badge>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={800} noWrap>
                              {suppliers.find(s => s.id === h.supplierId)?.name || 'Supplier'}
                            </Typography>
                            <Typography variant="caption" color={theme.textSecondary} sx={{ display: 'block' }}>
                              {h.paymentDate ? new Date(h.paymentDate).toLocaleString('en-IN') : '—'}
                              {h.transactionId ? ` • ${h.transactionId}` : ''}
                            </Typography>
                            {h.reference && (
                              <Typography variant="caption" sx={{ fontWeight: 800, color: theme.primary, display: 'block' }}>
                                Ref: {h.reference}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                        <Box sx={{ textAlign: 'right', ml: 1.5 }}>
                          <Typography variant="subtitle1" fontWeight={900} color={theme.primary}>
                            ₹{formatCurrency(h.amount)}
                          </Typography>
                          <Stack direction="row" gap={0.75} justifyContent="flex-end" sx={{ mt: 1 }}>
                            <Chip
                              label={PAYMENT_MODES.find(m => m.value === h.paymentMethod)?.label || h.paymentMethod || 'N/A'}
                              size="small" 
                              variant="outlined"
                              sx={{ 
                                height: 22, 
                                fontSize: '0.65rem', 
                                fontWeight: 800,
                                borderColor: alpha(theme.primary, 0.25),
                                color: theme.primary
                              }}
                            />
                            <Tooltip title="View Receipt">
                              <IconButton 
                                size="small" 
                                onClick={() => setReceiptData({
                                  id: h.transactionId || h.id,
                                  amount: h.amount,
                                  mode: PAYMENT_MODES.find(m => m.value === h.paymentMethod)?.label || h.paymentMethod,
                                  supplierName: suppliers.find(s => s.id === h.supplierId)?.name || '',
                                  date: h.paymentDate ? new Date(h.paymentDate).toLocaleString('en-IN') : '—',
                                  ref: h.reference || 'N/A',
                                  notes: h.notes,
                                })}
                                sx={{
                                  color: theme.primary,
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    bgcolor: alpha(theme.primary, 0.1),
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                <ReceiptLong fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

 {/* ── PO ITEMS DIALOG ────────────────────────────────── */}
<Dialog
  open={poItemsDialog.open}
  onClose={() => setPoItemsDialog({ open: false, po: null, items: [], loading: false })}
  fullWidth 
  maxWidth="sm"
  PaperProps={{ sx: { borderRadius: 3 } }}
>
  <DialogTitle sx={{ pb: 1 }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Box>
        <Typography variant="h6" fontWeight={900}>PO Items</Typography>
        {poItemsDialog.po && (
          <Typography variant="caption" color={theme.textSecondary}>
            {poItemsDialog.po.poNumber} — {suppliers.find(s => s.id === poItemsDialog.po?.supplierId)?.name || ''}
          </Typography>
        )}
      </Box>
      <IconButton onClick={() => setPoItemsDialog({ open: false, po: null, items: [], loading: false })}>
        <Close />
      </IconButton>
    </Stack>
  </DialogTitle>
  <Divider />
  <DialogContent sx={{ p: 0 }}>
    {poItemsDialog.loading ? (
      <Stack spacing={1.5} sx={{ p: 2 }}>
        {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={48} />)}
      </Stack>
    ) : poItemsDialog.items.length === 0 ? (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color={theme.textSecondary} variant="body2" fontWeight={600}>
          No items found for this PO.
        </Typography>
      </Box>
    ) : (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.primary, 0.04) }}>
              <TableCell sx={{ fontWeight: 800, bgcolor: alpha(theme.primary, 0.04), fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: `1.5px solid ${alpha(theme.primary, 0.15)}` }}>Item</TableCell>
              <TableCell sx={{ fontWeight: 800, bgcolor: alpha(theme.primary, 0.04), fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: `1.5px solid ${alpha(theme.primary, 0.15)}` }}>SKU</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800, bgcolor: alpha(theme.primary, 0.04), fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: `1.5px solid ${alpha(theme.primary, 0.15)}` }}>Qty</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, bgcolor: alpha(theme.primary, 0.04), fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: `1.5px solid ${alpha(theme.primary, 0.15)}` }}>Unit Cost</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, bgcolor: alpha(theme.primary, 0.04), fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: `1.5px solid ${alpha(theme.primary, 0.15)}` }}>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {poItemsDialog.items.map((item, idx) => (
              <TableRow key={item.id || idx} hover sx={{ '&:hover': { bgcolor: alpha(theme.primary, 0.04) } }}>
                <TableCell>
                  <Typography variant="body2" fontWeight={700}>{item.name || '—'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color={theme.textSecondary}>{item.sku || '—'}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" fontWeight={700}>{item.quantity || 0}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">₹{formatCurrency(item.unitCost)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={900} color={theme.primary}>
                    ₹{formatCurrency((item.quantity || 0) * (item.unitCost || 0))}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )}
  </DialogContent>
  <DialogActions sx={{ p: 2, bgcolor: alpha(theme.primary, 0.04) }}>
    <Button 
      variant="outlined" 
      onClick={() => setPoItemsDialog({ open: false, po: null, items: [], loading: false })} 
      sx={{ fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
    >
      Close
    </Button>
  </DialogActions>
</Dialog>

      {/* ── RECEIPT MODAL ──────────────────────────────────── */}
      <Dialog 
        open={!!receiptData} 
        onClose={() => setReceiptData(null)} 
        PaperProps={{ sx: { borderRadius: 3, width: '100%', maxWidth: 480, p: 0 } }}
      >
        <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={900}>Payment Voucher</Typography>
          <IconButton onClick={() => setReceiptData(null)} size="small"><Close /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3 }}>
          {receiptData && (
            <Stack spacing={2.5}>
              {/* Success Header */}
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 3, 
                  bgcolor: alpha(theme.success, 0.1),
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1.5
                }}>
                  <CheckCircleOutline sx={{ fontSize: 48, color: theme.success }} />
                </Box>
                <Typography variant="h5" fontWeight={900} sx={{ mt: 1 }}>
                  ₹{formatCurrency(receiptData.amount)}
                </Typography>
                <Typography variant="body2" color={theme.textSecondary} fontWeight={600}>
                  Payment Recorded Successfully
                </Typography>
              </Box>

              <Divider />

              {/* Details */}
              <Stack spacing={1.5}>
                {[
                  { label: 'Supplier', val: receiptData.supplierName },
                  { label: 'Payment Date', val: receiptData.date },
                  { label: 'Transaction ID', val: receiptData.id || 'N/A' },
                  { label: 'Payment Mode', val: receiptData.mode },
                  { label: 'Ref / UTR Number', val: receiptData.ref },
                ].filter(r => r.val).map((row, i) => (
                  <Stack key={i} direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color={theme.textSecondary} fontWeight={600}>{row.label}</Typography>
                    <Typography variant="body2" fontWeight={800}>{row.val}</Typography>
                  </Stack>
                ))}
              </Stack>

              {receiptData.notes && (
                <>
                  <Divider />
                  <Box sx={{ p: 2, bgcolor: alpha(theme.primary, 0.04), borderRadius: 2 }}>
                    <Typography variant="caption" fontWeight={800} color={theme.textSecondary} sx={{ display: 'block', mb: 0.5 }}>
                      Notes
                    </Typography>
                    <Typography variant="body2">{receiptData.notes}</Typography>
                  </Box>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: alpha(theme.primary, 0.04), gap: 1 }}>
          <Button
            fullWidth 
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrintReceipt}
            sx={{ 
              borderRadius: 2, 
              fontWeight: 700,
              textTransform: 'none',
              borderColor: alpha(theme.primary, 0.3),
              color: theme.primary,
              '&:hover': {
                bgcolor: alpha(theme.primary, 0.05),
                borderColor: theme.primary
              }
            }}
          >
            Print Voucher
          </Button>
          <Button 
            fullWidth 
            variant="contained"
            onClick={() => setReceiptData(null)}
            sx={{ 
              borderRadius: 2, 
              fontWeight: 700,
              textTransform: 'none',
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 100%)`
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── NOTIFICATIONS ──────────────────────────────────── */}
      <Snackbar
        open={notification.open} 
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={notification.severity} 
          variant="filled" 
          sx={{ 
            borderRadius: 2.5, 
            fontWeight: 700,
            fontSize: '0.9rem'
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}