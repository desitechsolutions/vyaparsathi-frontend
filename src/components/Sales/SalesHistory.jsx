import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Paper,
  Typography, TextField, InputAdornment, IconButton, Chip, TablePagination,
  Collapse, Box, Button, Tooltip, Divider, CircularProgress, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, FormControlLabel,
  Alert, Snackbar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PrintIcon from '@mui/icons-material/Print';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DownloadIcon from '@mui/icons-material/Download';
import HistoryIcon from '@mui/icons-material/History';
import DateRangeIcon from '@mui/icons-material/DateRange';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import CancelIcon from '@mui/icons-material/Cancel';
import PaymentsIcon from '@mui/icons-material/Payments';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

import API, { fetchSalesHistory, getSaleById, processSaleReturn, cancelSale, API_BASE_URL } from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const statusConfig = {
  COMPLETED: { label: 'Completed', color: 'success' },
  DRAFT: { label: 'Draft', color: 'warning' },
  CANCELLED: { label: 'Cancelled', color: 'error' },
  RETURNED: { label: 'Returned', color: 'secondary' },
};

const paymentStatusColors = {
  PAID: 'success',
  PARTIALLY_PAID: 'warning',
  DUE: 'error',
};

const formatAmount = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const getPaymentStatus = (dueAmount) => Number(dueAmount) <= 0 ? 'PAID' : 'DUE';
const isToday = (dateString) => {
  const d = new Date(dateString);
  const today = new Date();
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
};

const SalesHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedRow, setExpandedRow] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Export loading state
  const [exporting, setExporting] = useState(false);

  // Modal States
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  // Return Logic States
  const [returnItems, setReturnItems] = useState([]);
  const [returnReason, setReturnReason] = useState('');
  const [isRefundPayment, setIsRefundPayment] = useState(false);

  // Cancel Logic State
  const [cancelReason, setCancelReason] = useState('');

  const params = new URLSearchParams(location.search);
  const isFilteredView = params.get('search');

  // ────────────────────────────────────────────────
  // Sync search from URL → state (on mount & when URL changes)
  // ────────────────────────────────────────────────
  useEffect(() => {
    const urlSearch = params.get('search') || '';
    setSearch(urlSearch);
  }, [location.search]);

  useEffect(() => { loadData(); }, []);

  const loadData = () => {
    setLoading(true);
    fetchSalesHistory()
      .then((res) => setSalesHistory(res.data || []))
      .catch((err) => showSnackbar("Failed to load sales history", "error"))
      .finally(() => setLoading(false));
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // --- Summary Calculation for Return ---
  const totalReturnValue = useMemo(() => {
    return returnItems.reduce((acc, item) => acc + (item.returnQuantity * item.unitPrice), 0);
  }, [returnItems]);

  // --- Return Logic ---
  const handleOpenReturn = async (sale) => {
    const saleId = sale.id || sale.saleId;
    setSelectedSale(sale);
    setReturnDialogOpen(true);
    setLoadingDetails(true);
    setReturnReason('');
    setIsRefundPayment(false);

    try {
      const res = await getSaleById(saleId);
      const items = res.data.items || [];

      setReturnItems(items.map(item => ({
        saleItemId: item.id,
        itemName: item.itemName,
        originalQty: item.qty,
        returnedQty: item.returnedQty || 0,
        netQty: item.netQty !== undefined ? item.netQty : (item.qty - (item.returnedQty || 0)),
        unitPrice: item.unitPrice,
        returnQuantity: 0
      })));
    } catch (err) {
      showSnackbar("Failed to load items for return.", "error");
      setReturnDialogOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const submitReturn = async () => {
    const saleId = selectedSale?.id || selectedSale?.saleId;
    const validItems = returnItems.filter(i => i.returnQuantity > 0);

    if (validItems.length === 0) {
      showSnackbar("Please enter a return quantity for at least one item.", "warning");
      return;
    }

    const payload = {
      saleId: saleId,
      reason: returnReason,
      refundPayment: isRefundPayment,
      returnItems: validItems.map(i => ({
        saleItemId: i.saleItemId,
        returnQuantity: Number(i.returnQuantity)
      }))
    };

    try {
      await processSaleReturn(saleId, payload);
      showSnackbar("Return processed successfully");
      setReturnDialogOpen(false);
      loadData();
    } catch (err) {
      showSnackbar(err.response?.data?.message || "Return failed", "error");
    }
  };

  // --- Cancel Logic ---
  const handleOpenCancel = (sale) => {
    setSelectedSale(sale);
    setCancelReason('');
    setCancelDialogOpen(true);
  };

  const submitCancel = async () => {
    if (!cancelReason.trim()) return;
    try {
      await cancelSale(selectedSale.id || selectedSale.saleId, cancelReason);
      showSnackbar("Sale cancelled successfully");
      setCancelDialogOpen(false);
      loadData();
    } catch (err) {
      showSnackbar("Cancellation failed", "error");
    }
  };

  const handlePrintInvoice = async (sale) => {
    const saleId = sale.id || sale.saleId;
    try {
      // 1. Get the signed URL/Path
      const res = await API.get(`/api/sales/${saleId}/signed-url`);
      const signedPath = res.data;

      // 2. Fetch as BLOB using the authenticated API instance
      const response = await API.get(signedPath, {
        responseType: 'blob',
      });

      // 3. Create a blob URL and open it
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);

      // Open in new tab
      const pdfWindow = window.open();
      if (pdfWindow) {
        pdfWindow.location.href = fileURL;
      } else {
        // Fallback if popup is blocked
        window.location.assign(fileURL);
      }

      // Clean up
      setTimeout(() => URL.revokeObjectURL(fileURL), 60000);
    } catch (err) {
      console.error("In-browser PDF Error:", err);
      showSnackbar("Could not generate PDF. Please check your connection.", "error");
    }
  };

  const handleWhatsAppInvoice = (sale) => {
    const amount = sale.totalAmount != null
      ? `₹${Number(sale.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      : '';
    const date = sale.date ? new Date(sale.date).toLocaleDateString('en-IN') : '';
    const lines = [
      `🧾 *Invoice #${sale.invoiceNo || sale.id}*`,
      date ? `📅 Date: ${date}` : '',
      amount ? `💰 Amount: ${amount}` : '',
      `Thank you for your purchase! 🙏`,
    ].filter(Boolean).join('\n');

    const rawPhone = sale.customerPhone || sale.customer?.phone || '';
    const phone = rawPhone ? `91${rawPhone.replace(/\D/g, '')}` : '';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(lines)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // ────────────────────────────────────────────────
  // Filtering – now driven by URL + local search input
  // ────────────────────────────────────────────────
  const filteredSales = useMemo(() => {
    return salesHistory.filter(sale => {
      const matchesSearch = (sale.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
                           (sale.invoiceNo || '').toLowerCase().includes(search.toLowerCase());
      const saleDate = new Date(sale.date).setHours(0,0,0,0);
      const start = startDate ? new Date(startDate).setHours(0,0,0,0) : null;
      const end = endDate ? new Date(endDate).setHours(23,59,59,999) : null;
      return matchesSearch && (!start || saleDate >= start) && (!end || saleDate <= end);
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [salesHistory, search, startDate, endDate]);

  const paginatedSales = filteredSales.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // ─── Sync local search back to URL (improves shareability) ───
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);

    const params = new URLSearchParams(location.search);
    if (value.trim()) {
      params.set('search', value.trim());
    } else {
      params.delete('search');
    }
    navigate({ search: params.toString() }, { replace: true });
  };

  // ─── NEW: Export Filtered Sales to CSV ───
  const handleExportCSV = () => {
    if (filteredSales.length === 0) {
      showSnackbar("No data to export", "warning");
      return;
    }

    setExporting(true);

    // Define CSV headers
    const headers = [
      'Invoice #',
      'Customer',
      'Date',
      'Total Amount',
      'Status',
      'Payment Status',
      'Due Amount'
    ];

    // Map data rows
    const rows = filteredSales.map(sale => [
      `"${sale.invoiceNo || ''}"`,  // quote to handle commas
      `"${sale.customerName || 'Walk-in'}"`,
      new Date(sale.date).toLocaleDateString('en-IN'),
      formatAmount(sale.totalAmount),
      sale.status,
      getPaymentStatus(sale.dueAmount),
      formatAmount(sale.dueAmount)
    ]);

    // Build CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create Blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sales_history_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExporting(false);
    showSnackbar(`Exported ${filteredSales.length} sales records`, "success");
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header & Search Sections */}
      <Stack spacing={3} sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {isFilteredView ? (
              <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: '#f1f5f9', mr: 1 }}>
                <ArrowBackIcon />
              </IconButton>
            ) : (
              <HistoryIcon color="primary" sx={{ fontSize: 32 }} />
            )}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {isFilteredView ? 'Invoice Lookup' : 'Sales History'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Manage returns, payments, and invoice status
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
            disabled={exporting || filteredSales.length === 0}
            onClick={handleExportCSV}
            sx={{ bgcolor: '#10b981', borderRadius: 2, fontWeight: 700 }}
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </Stack>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center', bgcolor: '#f8fafc' }}>
          <TextField
            size="small"
            placeholder="Search name/invoice..."
            value={search}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
            }}
            sx={{ bgcolor: 'white', minWidth: 250 }}
          />
          <Divider orientation="vertical" flexItem />
          <Stack direction="row" spacing={1} alignItems="center">
            <DateRangeIcon fontSize="small" color="action" />
            <TextField
              type="date"
              size="small"
              label="From"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              sx={{ bgcolor: 'white' }}
            />
            <TextField
              type="date"
              size="small"
              label="To"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              sx={{ bgcolor: 'white' }}
            />
          </Stack>
        </Paper>
      </Stack>

      {/* Main Table */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
              <TableRow>
                <TableCell width={50} />
                <TableCell sx={{ fontWeight: 700 }}>Invoice #</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 10 }}><CircularProgress /></TableCell></TableRow>
              ) : paginatedSales.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}>No transactions found.</TableCell></TableRow>
              ) : paginatedSales.map((sale, idx) => {
                  const isExpanded = expandedRow === idx;
                  const payStatus = getPaymentStatus(sale.dueAmount);
                  const isCancelable = sale.status === 'DRAFT' || (sale.status === 'COMPLETED' && isToday(sale.date));

                  return (
                    <React.Fragment key={sale.id || idx}>
                      <TableRow hover>
                        <TableCell>
                          <IconButton size="small" onClick={() => setExpandedRow(isExpanded ? null : idx)}>
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{sale.invoiceNo}</TableCell>
                        <TableCell>{sale.customerName || 'Walk-in'}</TableCell>
                        <TableCell>{new Date(sale.date).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{formatAmount(sale.totalAmount)}</TableCell>
                        <TableCell><Chip label={sale.status} color={statusConfig[sale.status]?.color || 'default'} size="small" /></TableCell>
                        <TableCell>{sale.status !== 'DRAFT' && <Chip label={payStatus} size="small" color={paymentStatusColors[payStatus]} />}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={7} sx={{ p: 0 }}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 3, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                              <Stack direction="row" spacing={4} divider={<Divider orientation="vertical" flexItem />}>
                                <Stack spacing={1.5} sx={{ minWidth: 220 }}>
                                  <Typography variant="overline" color="textSecondary">Transaction Actions</Typography>
                                  {sale.status === 'DRAFT' ? (
                                    <Button variant="contained" color="warning" startIcon={<PlayArrowIcon />} onClick={() => navigate(`/sales?resumeId=${sale.id}`)}>Resume Draft</Button>
                                  ) : (
                                    <>
                                      <Button variant="contained" startIcon={<PrintIcon />} onClick={() => handlePrintInvoice(sale)} sx={{ bgcolor: '#0f172a', '&:hover': {bgcolor: '#1e293b'} }}>Print Invoice</Button>
                                      <Button variant="contained" startIcon={<WhatsAppIcon />} onClick={() => handleWhatsAppInvoice(sale)} sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1ebe5d' }, color: '#fff' }}>Send on WhatsApp</Button>
                                      {sale.status !== 'CANCELLED' && (
                                        <Button variant="outlined" color="secondary" startIcon={<AssignmentReturnIcon />} onClick={() => handleOpenReturn(sale)}>Return Items</Button>
                                      )}
                                    </>
                                  )}
                                  {isCancelable && sale.status !== 'CANCELLED' && (
                                    <Button variant="text" color="error" startIcon={<CancelIcon />} onClick={() => handleOpenCancel(sale)}>
                                      {sale.status === 'DRAFT' ? 'Discard Draft' : 'Cancel Sale'}
                                    </Button>
                                  )}
                                </Stack>
                                <Box sx={{ flexGrow: 1 }}>
                                  <Typography variant="overline" color="textSecondary">Financial Summary</Typography>
                                  <Stack spacing={1} sx={{ mt: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '300px' }}>
                                      <Typography variant="body2">Total Bill Amount:</Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatAmount(sale.totalAmount)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '300px' }}>
                                      <Typography variant="body2">Current Outstanding:</Typography>
                                      <Typography variant="body2" color="error.main" sx={{ fontWeight: 700 }}>{formatAmount(sale.dueAmount)}</Typography>
                                    </Box>
                                    {Number(sale.dueAmount) > 0 && (
                                      <Button variant="contained" color="success" size="small" startIcon={<PaymentsIcon />}
                                        onClick={() => navigate(`/customer-payments?saleId=${sale.id}`)} sx={{ mt: 1, width: 'fit-content', borderRadius: 2 }}>
                                        Receive Payment
                                      </Button>
                                    )}
                                  </Stack>
                                </Box>
                              </Stack>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })
              }
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredSales.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => setRowsPerPage(parseInt(e.target.value, 10))}
        />
      </Paper>

      {/* RETURN DIALOG */}
      <Dialog open={returnDialogOpen} onClose={() => setReturnDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>
          Process Return: {selectedSale?.invoiceNo}
        </DialogTitle>
        <DialogContent dividers>
          {loadingDetails ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
              <CircularProgress size={30} />
              <Typography variant="caption">Loading purchased items...</Typography>
            </Box>
          ) : (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Item Description</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Available</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Returning</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {returnItems.map((item, index) => (
                      <TableRow key={item.saleItemId}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.itemName}</Typography>
                          <Typography variant="caption" color="textSecondary">{formatAmount(item.unitPrice)} / unit</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={`Original Purchase: ${item.originalQty}`}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.netQty}</Typography>
                              {item.returnedQty > 0 && <Typography variant="caption" color="error">({item.returnedQty} already ret.)</Typography>}
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            value={item.returnQuantity}
                            disabled={item.netQty <= 0}
                            onChange={(e) => {
                              const val = Math.min(item.netQty, Math.max(0, Number(e.target.value)));
                              const newItems = [...returnItems];
                              newItems[index].returnQuantity = val;
                              setReturnItems(newItems);
                            }}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* SUMMARY ROW */}
                    <TableRow sx={{ bgcolor: '#f0fdf4' }}>
                      <TableCell colSpan={2} align="right">
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Total Return Value:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" color="success.main" sx={{ fontWeight: 800 }}>
                          {formatAmount(totalReturnValue)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <TextField fullWidth label="Reason for return" multiline rows={2} value={returnReason} onChange={e => setReturnReason(e.target.value)} />

              <Box sx={{ p: 2, bgcolor: '#fff7ed', borderRadius: 2, border: '1px solid #ffedd5' }}>
                <FormControlLabel
                  control={<Checkbox checked={isRefundPayment} onChange={e => setIsRefundPayment(e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontWeight: 700 }}>Issue Refund / Add to Customer Credit?</Typography>}
                />
                <Typography variant="caption" display="block" color="textSecondary" sx={{ ml: 4 }}>
                  This will reduce the invoice total and adjust the customer's ledger balance.
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
          <Button onClick={() => setReturnDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={submitReturn}
            disabled={loadingDetails || totalReturnValue <= 0}
            startIcon={<AssignmentReturnIcon />}
          >
            Confirm Return {totalReturnValue > 0 && `(${formatAmount(totalReturnValue)})`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CANCEL DIALOG */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main', fontWeight: 800 }}>
          <WarningAmberIcon /> Confirm Cancellation
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Are you sure you want to cancel <strong>Invoice {selectedSale?.invoiceNo}</strong>? This action reverses all stock and payment entries permanently.
          </Typography>
          <TextField fullWidth label="Cancellation Reason" required value={cancelReason} onChange={e => setCancelReason(e.target.value)} autoFocus />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCancelDialogOpen(false)}>No, Keep Sale</Button>
          <Button variant="contained" color="error" onClick={submitCancel} disabled={!cancelReason.trim()}>
            Cancel Sale Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default SalesHistory;