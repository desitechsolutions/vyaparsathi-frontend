import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  TablePagination,
  Collapse,
  Box,
  Button,
  Tooltip,
  Divider,
  CircularProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Alert,
  Snackbar,
  alpha,
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
import RefreshIcon from '@mui/icons-material/Refresh';

import API, {
  fetchSalesHistory,
  getSaleById,
  processSaleReturn,
  cancelSale,
  API_BASE_URL,
} from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';

// Modern color palette
const theme = {
  primary: '#0f766e',
  primaryLight: '#14b8a6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#dc2626',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
};

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

const formatAmount = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getPaymentStatus = (dueAmount) => (Number(dueAmount) <= 0 ? 'PAID' : 'DUE');

const isToday = (dateString) => {
  const d = new Date(dateString);
  const today = new Date();
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
};

const normalizePhoneForWhatsApp = (raw) => {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
  return last10.length === 10 ? `91${last10}` : '';
};

const withDownloadParam = (urlOrPath) => {
  if (!urlOrPath) return '';
  return urlOrPath.includes('?') ? `${urlOrPath}&download=true` : `${urlOrPath}?download=true`;
};

const csvCell = (value) => {
  const s = String(value ?? '');
  return `"${s.replace(/"/g, '""')}"`;
};

const SalesHistory = ({ onResume, refreshTrigger }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { shop } = useShop();

  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [expandedSaleKey, setExpandedSaleKey] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [exporting, setExporting] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(null); // Track which sale's invoice is loading

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

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const loadData = useCallback(() => {
    setLoading(true);
    fetchSalesHistory()
      .then((res) => setSalesHistory(res.data || []))
      .catch(() => showSnackbar('Failed to load sales history', 'error'))
      .finally(() => setLoading(false));
  }, [showSnackbar]);

  useEffect(() => {
    const urlSearch = params.get('search') || '';
    setSearch(urlSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => {
    loadData();
  }, [refreshTrigger, loadData]);

  useEffect(() => {
    setPage(0);
  }, [search, startDate, endDate]);

  const totalReturnValue = useMemo(() => {
    return returnItems.reduce((acc, item) => acc + item.returnQuantity * item.unitPrice, 0);
  }, [returnItems]);

  // ============ INVOICE HELPERS (FIXED) ============

  const getSignedInvoicePath = async (saleId) => {
    const res = await API.get(`/api/sales/${saleId}/signed-url`);
    return res.data;
  };

  const toAbsoluteInvoiceUrl = (signedPath) => {
    if (!signedPath) return '';
    if (String(signedPath).startsWith('http')) return signedPath;
    const base = String(API_BASE_URL || '').replace(/\/$/, '');
    const path = String(signedPath).startsWith('/') ? signedPath : `/${signedPath}`;
    return `${base}${path}`;
  };

  /**
   * Fetch PDF Blob with native fetch API (bypasses axios interceptors)
   * Opens in NEW tab WITHOUT affecting current page
   */
  const openInvoiceBlobPreview = async (signedPath) => {
    try {
      const response = await fetch(signedPath, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/pdf' },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const blob = await response.blob();

      if (!blob.type.includes('pdf')) {
        throw new Error('Invalid file type received');
      }

      const fileURL = URL.createObjectURL(blob);

      // Open in NEW window - doesn't affect current page
      const previewWindow = window.open(
        fileURL,
        `invoice_preview_${Date.now()}`,
        'width=1000,height=800,noopener,noreferrer'
      );

      if (!previewWindow || previewWindow.closed) {
        showSnackbar('Popup blocked. Please allow popups to view the invoice.', 'warning');
        URL.revokeObjectURL(fileURL);
      } else {
        // Revoke URL after 2 minutes
        setTimeout(() => {
          URL.revokeObjectURL(fileURL);
        }, 120000);
      }
    } catch (err) {
      console.error('Preview Error:', err);
      showSnackbar('Failed to open invoice preview', 'error');
    }
  };

  /**
   * Download PDF Blob with native fetch API
   * Triggers download WITHOUT navigating away
   */
  const downloadInvoiceBlob = async (signedPath, filename) => {
    try {
      const downloadUrl = withDownloadParam(signedPath);
      const response = await fetch(downloadUrl, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/pdf' },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const blob = await response.blob();

      if (!blob.type.includes('pdf')) {
        throw new Error('Invalid file type received');
      }

      const fileURL = URL.createObjectURL(blob);

      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', filename);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Revoke URL immediately after download
      setTimeout(() => {
        URL.revokeObjectURL(fileURL);
      }, 100);

      showSnackbar('Invoice downloaded successfully', 'success');
    } catch (err) {
      console.error('Download Error:', err);
      showSnackbar('Failed to download invoice', 'error');
    }
  };

  const handlePrintInvoice = async (sale) => {
    const saleId = sale.id || sale.saleId;
    setInvoiceLoading(saleId);
    try {
      const signedPath = await getSignedInvoicePath(saleId);
      await openInvoiceBlobPreview(signedPath);
    } catch (err) {
      console.error('Print Invoice Error:', err);
      showSnackbar('Could not generate PDF', 'error');
    } finally {
      setInvoiceLoading(null);
    }
  };

  const handleDownloadInvoice = async (sale) => {
    const saleId = sale.id || sale.saleId;
    setInvoiceLoading(saleId);
    try {
      const signedPath = await getSignedInvoicePath(saleId);
      await downloadInvoiceBlob(signedPath, `invoice_${sale.invoiceNo || saleId}.pdf`);
    } catch (err) {
      console.error('Download Invoice Error:', err);
      showSnackbar('Failed to download invoice', 'error');
    } finally {
      setInvoiceLoading(null);
    }
  };

  const handleWhatsAppInvoice = async (sale) => {
    try {
      const saleId = sale.id || sale.saleId;
      const rawPhone = sale.phone || sale.customer?.phone || '';
      const phone = normalizePhoneForWhatsApp(rawPhone);

      if (!phone) {
        showSnackbar('Customer phone number missing/invalid', 'warning');
        return;
      }

      const signedPath = await getSignedInvoicePath(saleId);
      const absolute = toAbsoluteInvoiceUrl(signedPath);
      const downloadLink = withDownloadParam(absolute);

      const amount = sale.totalAmount
        ? `₹${Number(sale.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        : '';
      const date = sale.date ? new Date(sale.date).toLocaleDateString('en-IN') : '';

      // Plain text message (no emojis which don't encode well in URLs)
      const lines = [
        shop?.name ? `Invoice from ${shop.name}` : null,
        `Invoice: ${sale.invoiceNo || saleId}`,
        date ? `Date: ${date}` : null,
        amount ? `Amount: ${amount}` : null,
        '',
        'Download your invoice:',
        downloadLink,
        '',
        'Thank you for your business!',
      ].filter(Boolean);

      const message = encodeURIComponent(lines.join('\n'));
      const url = `https://wa.me/${phone}?text=${message}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('WhatsApp Invoice Error:', err);
      showSnackbar('Could not prepare WhatsApp link', 'error');
    }
  };

  // ============ RETURN LOGIC ============

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

      setReturnItems(
        items.map((item) => ({
          saleItemId: item.id,
          itemName: item.itemName,
          originalQty: item.qty,
          returnedQty: item.returnedQty || 0,
          netQty: item.netQty !== undefined ? item.netQty : item.qty - (item.returnedQty || 0),
          unitPrice: item.unitPrice,
          returnQuantity: 0,
        })),
      );
    } catch (err) {
      showSnackbar('Failed to load items for return', 'error');
      setReturnDialogOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const submitReturn = async () => {
    const saleId = selectedSale?.id || selectedSale?.saleId;
    const validItems = returnItems.filter((i) => i.returnQuantity > 0);

    if (validItems.length === 0) {
      showSnackbar('Please enter a return quantity for at least one item', 'warning');
      return;
    }

    const payload = {
      saleId,
      reason: returnReason,
      refundPayment: isRefundPayment,
      returnItems: validItems.map((i) => ({
        saleItemId: i.saleItemId,
        returnQuantity: Number(i.returnQuantity),
      })),
    };

    try {
      await processSaleReturn(saleId, payload);
      showSnackbar('Return processed successfully');
      setReturnDialogOpen(false);
      loadData();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Return failed', 'error');
    }
  };

  // ============ CANCEL LOGIC ============

  const handleOpenCancel = (sale) => {
    setSelectedSale(sale);
    setCancelReason('');
    setCancelDialogOpen(true);
  };

  const submitCancel = async () => {
    if (!cancelReason.trim()) return;
    try {
      await cancelSale(selectedSale.id || selectedSale.saleId, cancelReason);
      showSnackbar('Sale cancelled successfully');
      setCancelDialogOpen(false);
      loadData();
    } catch (err) {
      showSnackbar('Cancellation failed', 'error');
    }
  };

  // ============ FILTERING ============

  const filteredSales = useMemo(() => {
    const searchLower = search.toLowerCase();

    return salesHistory
      .filter((sale) => {
        const matchesSearch =
          (sale.customerName || '').toLowerCase().includes(searchLower) ||
          (sale.invoiceNo || '').toLowerCase().includes(searchLower);

        const saleDate = new Date(sale.date).setHours(0, 0, 0, 0);
        const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
        const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;

        return matchesSearch && (!start || saleDate >= start) && (!end || saleDate <= end);
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [salesHistory, search, startDate, endDate]);

  const paginatedSales = filteredSales.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);

    const p = new URLSearchParams(location.search);
    if (value.trim()) p.set('search', value.trim());
    else p.delete('search');

    navigate({ search: p.toString() }, { replace: true });
  };

  const handleExportCSV = () => {
    if (filteredSales.length === 0) {
      showSnackbar('No data to export', 'warning');
      return;
    }

    setExporting(true);

    const headers = ['Invoice #', 'Customer', 'Date', 'Total Amount', 'Status', 'Payment Status', 'Due Amount'];

    const rows = filteredSales.map((sale) => [
      csvCell(sale.invoiceNo || ''),
      csvCell(sale.customerName || 'Walk-in'),
      csvCell(new Date(sale.date).toLocaleDateString('en-IN')),
      csvCell(Number(sale.totalAmount || 0).toFixed(2)),
      csvCell(sale.status || ''),
      csvCell(getPaymentStatus(sale.dueAmount)),
      csvCell(Number(sale.dueAmount || 0).toFixed(2)),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sales_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setExporting(false);
    showSnackbar(`Exported ${filteredSales.length} sales records`, 'success');
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header & Search Sections */}
      <Stack spacing={3} sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {isFilteredView ? (
              <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: alpha(theme.primary, 0.1), color: theme.primary }}>
                <ArrowBackIcon />
              </IconButton>
            ) : (
              <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: alpha(theme.primary, 0.1) }}>
                <HistoryIcon sx={{ fontSize: 28, color: theme.primary }} />
              </Box>
            )}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: theme.textPrimary }}>
                {isFilteredView ? 'Invoice Lookup' : 'Sales History'}
              </Typography>
              <Typography variant="body2" color={theme.textSecondary}>
                Manage returns, payments, and invoice status
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
              disabled={loading}
              onClick={loadData}
              sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
              disabled={exporting || filteredSales.length === 0}
              onClick={handleExportCSV}
              sx={{ bgcolor: theme.success, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </Stack>
        </Stack>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 3,
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            bgcolor: '#f8fafc',
            flexWrap: 'wrap',
            border: `1.5px solid ${alpha(theme.primary, 0.15)}`,
          }}
        >
          <TextField
            size="small"
            placeholder="Search name/invoice..."
            value={search}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ bgcolor: 'white', minWidth: 250, borderRadius: 2 }}
          />
          <Divider orientation="vertical" flexItem />
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <DateRangeIcon fontSize="small" color="action" />
            <TextField
              type="date"
              size="small"
              label="From"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              sx={{ bgcolor: 'white', borderRadius: 2 }}
            />
            <TextField
              type="date"
              size="small"
              label="To"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              sx={{ bgcolor: 'white', borderRadius: 2 }}
            />
          </Stack>
        </Paper>
      </Stack>

      {/* Main Table */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', border: `1.5px solid ${alpha(theme.primary, 0.15)}` }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: alpha(theme.primary, 0.04) }}>
              <TableRow>
                <TableCell width={50} />
                <TableCell sx={{ fontWeight: 800, color: theme.textPrimary }}>Invoice #</TableCell>
                <TableCell sx={{ fontWeight: 800, color: theme.textPrimary }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 800, color: theme.textPrimary }}>Date</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: theme.textPrimary }}>
                  Total
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: theme.textPrimary }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800, color: theme.textPrimary }}>Payment</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                    <CircularProgress sx={{ color: theme.primary }} />
                  </TableCell>
                </TableRow>
              ) : paginatedSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5, color: theme.textSecondary }}>
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSales.map((sale, idx) => {
                  const saleKey = sale.id || sale.saleId || sale.invoiceNo || idx;
                  const isExpanded = expandedSaleKey === saleKey;
                  const payStatus = getPaymentStatus(sale.dueAmount);
                  const isCancelable = sale.status === 'DRAFT' || (sale.status === 'COMPLETED' && isToday(sale.date));
                  const isLoadingThisSale = invoiceLoading === saleKey;

                  return (
                    <React.Fragment key={saleKey}>
                      <TableRow hover sx={{ '&:hover': { bgcolor: alpha(theme.primary, 0.02) } }}>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            onClick={() => setExpandedSaleKey(isExpanded ? null : saleKey)}
                            sx={{ color: theme.primary }}
                          >
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>

                        <TableCell sx={{ fontWeight: 700, color: theme.textPrimary }}>{sale.invoiceNo}</TableCell>
                        <TableCell sx={{ color: theme.textPrimary }}>{sale.customerName || 'Walk-in'}</TableCell>
                        <TableCell sx={{ color: theme.textSecondary }}>{new Date(sale.date).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: theme.primary }}>
                          {formatAmount(sale.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={sale.status} 
                            color={statusConfig[sale.status]?.color || 'default'} 
                            size="small" 
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell>
                          {sale.status !== 'DRAFT' && (
                            <Chip 
                              label={payStatus} 
                              size="small" 
                              color={paymentStatusColors[payStatus] || 'default'}
                              sx={{ fontWeight: 700 }}
                            />
                          )}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell colSpan={7} sx={{ p: 0 }}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 3, bgcolor: alpha(theme.primary, 0.02), borderBottom: `1px solid ${alpha(theme.primary, 0.1)}` }}>
                              <Stack direction="row" spacing={4} divider={<Divider orientation="vertical" flexItem />}>
                                <Stack spacing={1.5} sx={{ minWidth: 240 }}>
                                  <Typography variant="overline" sx={{ fontWeight: 800, color: theme.textSecondary, fontSize: '0.75rem', letterSpacing: 0.5 }}>
                                    Transaction Actions
                                  </Typography>

                                  {sale.status === 'DRAFT' ? (
                                    <Button
                                      variant="contained"
                                      startIcon={<PlayArrowIcon />}
                                      onClick={() => navigate(`/sales?resumeId=${sale.id}`)}
                                      sx={{ background: `linear-gradient(135deg, ${theme.warning} 0%, ${theme.primaryLight} 100%)`, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                                    >
                                      Resume Draft
                                    </Button>
                                  ) : (
                                    <>
                                      <Button
                                        variant="contained"
                                        startIcon={isLoadingThisSale ? <CircularProgress size={20} color="inherit" /> : <PrintIcon />}
                                        onClick={() => handlePrintInvoice(sale)}
                                        disabled={isLoadingThisSale}
                                        sx={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 100%)`, textTransform: 'none', fontWeight: 700, borderRadius: 2, color: 'white' }}
                                      >
                                        {isLoadingThisSale ? 'Opening...' : 'Print / Preview'}
                                      </Button>

                                      <Button
                                        variant="outlined"
                                        startIcon={isLoadingThisSale ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                                        onClick={() => handleDownloadInvoice(sale)}
                                        disabled={isLoadingThisSale}
                                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, borderColor: theme.primary, color: theme.primary }}
                                      >
                                        {isLoadingThisSale ? 'Downloading...' : 'Download PDF'}
                                      </Button>

                                      <Button
                                        variant="contained"
                                        startIcon={<WhatsAppIcon />}
                                        onClick={() => handleWhatsAppInvoice(sale)}
                                        sx={{ bgcolor: '#25D366', textTransform: 'none', fontWeight: 700, borderRadius: 2, color: '#fff', '&:hover': { bgcolor: '#1ebe5d' } }}
                                      >
                                        WhatsApp Invoice
                                      </Button>

                                      {sale.status !== 'CANCELLED' && (
                                        <Button
                                          variant="outlined"
                                          color="secondary"
                                          startIcon={<AssignmentReturnIcon />}
                                          onClick={() => handleOpenReturn(sale)}
                                          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                                        >
                                          Return Items
                                        </Button>
                                      )}
                                    </>
                                  )}

                                  {isCancelable && sale.status !== 'CANCELLED' && (
                                    <Button
                                      variant="text"
                                      color="error"
                                      startIcon={<CancelIcon />}
                                      onClick={() => handleOpenCancel(sale)}
                                      sx={{ textTransform: 'none', fontWeight: 700 }}
                                    >
                                      {sale.status === 'DRAFT' ? 'Discard Draft' : 'Cancel Sale'}
                                    </Button>
                                  )}
                                </Stack>

                                <Box sx={{ flexGrow: 1 }}>
                                  <Typography variant="overline" sx={{ fontWeight: 800, color: theme.textSecondary, fontSize: '0.75rem', letterSpacing: 0.5 }}>
                                    Financial Summary
                                  </Typography>
                                  <Stack spacing={1.5} sx={{ mt: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                      <Typography variant="body2" sx={{ color: theme.textSecondary }}>Total Bill Amount:</Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 800, color: theme.textPrimary }}>
                                        {formatAmount(sale.totalAmount)}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                      <Typography variant="body2" sx={{ color: theme.textSecondary }}>Current Outstanding:</Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 800, color: theme.danger }}>
                                        {formatAmount(sale.dueAmount)}
                                      </Typography>
                                    </Box>

                                    {Number(sale.dueAmount) > 0 && (
                                      <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<PaymentsIcon />}
                                        onClick={() => navigate(`/customer-payments?saleId=${sale.saleId}`)}
                                        sx={{ mt: 1, width: 'fit-content', borderRadius: 2, bgcolor: theme.success, textTransform: 'none', fontWeight: 700 }}
                                      >
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
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredSales.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
          sx={{ bgcolor: alpha(theme.primary, 0.02), borderTop: `1px solid ${alpha(theme.primary, 0.1)}` }}
        />
      </Paper>

      {/* RETURN DIALOG */}
      <Dialog open={returnDialogOpen} onClose={() => setReturnDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: alpha(theme.primary, 0.04), color: theme.textPrimary }}>
          Process Return: {selectedSale?.invoiceNo}
        </DialogTitle>
        <DialogContent dividers>
          {loadingDetails ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
              <CircularProgress size={30} sx={{ color: theme.primary }} />
              <Typography variant="caption" color={theme.textSecondary}>Loading purchased items...</Typography>
            </Box>
          ) : (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: alpha(theme.primary, 0.04) }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Item Description</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800 }}>
                        Available
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>
                        Returning
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {returnItems.map((item, index) => (
                      <TableRow key={item.saleItemId}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {item.itemName}
                          </Typography>
                          <Typography variant="caption" color={theme.textSecondary}>
                            {formatAmount(item.unitPrice)} / unit
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={`Original Purchase: ${item.originalQty}`}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {item.netQty}
                              </Typography>
                              {item.returnedQty > 0 && (
                                <Typography variant="caption" sx={{ color: theme.danger }}>
                                  ({item.returnedQty} already ret.)
                                </Typography>
                              )}
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

                    <TableRow sx={{ bgcolor: alpha(theme.success, 0.05) }}>
                      <TableCell colSpan={2} align="right">
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                          Total Return Value:
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: theme.success }}>
                          {formatAmount(totalReturnValue)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <TextField
                fullWidth
                label="Reason for return"
                multiline
                rows={2}
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
              />

              <Box sx={{ p: 2, bgcolor: alpha(theme.warning, 0.08), borderRadius: 2, border: `1px solid ${alpha(theme.warning, 0.2)}` }}>
                <FormControlLabel
                  control={<Checkbox checked={isRefundPayment} onChange={(e) => setIsRefundPayment(e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontWeight: 700 }}>Issue Refund / Add to Customer Credit?</Typography>}
                />
                <Typography variant="caption" display="block" color={theme.textSecondary} sx={{ ml: 4, mt: 0.5 }}>
                  This will reduce the invoice total and adjust the customer's ledger balance.
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: alpha(theme.primary, 0.04) }}>
          <Button onClick={() => setReturnDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={submitReturn}
            disabled={loadingDetails || totalReturnValue <= 0}
            startIcon={<AssignmentReturnIcon />}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Confirm Return {totalReturnValue > 0 && `(${formatAmount(totalReturnValue)})`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CANCEL DIALOG */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: theme.danger, fontWeight: 800 }}>
          <WarningAmberIcon /> Confirm Cancellation
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: theme.textPrimary }}>
            Are you sure you want to cancel <strong>Invoice {selectedSale?.invoiceNo}</strong>? This action reverses all
            stock and payment entries permanently.
          </Typography>
          <TextField
            fullWidth
            label="Cancellation Reason"
            required
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: alpha(theme.primary, 0.04) }}>
          <Button onClick={() => setCancelDialogOpen(false)}>No, Keep Sale</Button>
          <Button variant="contained" color="error" onClick={submitCancel} disabled={!cancelReason.trim()} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Cancel Sale Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SalesHistory;