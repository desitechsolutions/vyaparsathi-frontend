import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  alpha,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PrintIcon from '@mui/icons-material/Print';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import CancelIcon from '@mui/icons-material/Cancel';
import PaymentsIcon from '@mui/icons-material/Payments';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';

import QrCodeIcon from '@mui/icons-material/QrCode';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HistoryIcon from '@mui/icons-material/History';

import EInvoiceStatusBadge from '../EInvoice/EInvoiceStatusBadge';

import API, {
  fetchSalesHistory,
  cancelSale,
  generateEInvoice,
  cancelEInvoice,
  fetchEWayBillThreshold,
  updateSaleNotes,
  convertProformaToInvoice,
  resumeSale,
  discardDraftSale,
  fetchSaleTimeline,
  API_BASE_URL,
} from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import { useAppPalette } from '../../hooks/useAppPalette';
import EWayBillDialog from '../EInvoice/EWayBillDialog';

/**
 * Small colored dot + text — used across sale, payment, and e-invoice statuses.
 * Enterprise SaaS pattern (Zoho, Linear, Stripe): a 6-8px filled circle beside
 * muted text carries the same signal as a filled chip without the visual weight.
 */
const StatusDot = ({ color, label, muted = false }) => (
  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
    <Box
      component="span"
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        bgcolor: color,
        flexShrink: 0,
        boxShadow: `0 0 0 2px ${alpha(color, 0.12)}`,
      }}
    />
    <Typography
      variant="body2"
      sx={{
        fontSize: '0.8rem',
        fontWeight: muted ? 500 : 600,
        color: muted ? 'text.secondary' : 'text.primary',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </Typography>
  </Box>
);

/**
 * Compact KPI tile — icon on the left, label + value stacked on the right.
 * Neutral by default; `emphasis="warning"` tints the value warning-amber for
 * outstanding-dues style attention without loading a red-alert visual.
 */
const KpiTile = ({ icon, label, value, hint, emphasis = 'neutral', theme }) => {
  const valueColor =
    emphasis === 'warning'
      ? (theme?.warning || '#b45309')
      : 'text.primary';
  return (
    <Paper
      variant="outlined"
      sx={{
        flex: 1,
        p: 1.5,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.5,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
          color: 'primary.main',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2, letterSpacing: 0.2 }}
        >
          {label}
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: valueColor,
            lineHeight: 1.25,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {value}
        </Typography>
        {hint && (
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem', lineHeight: 1.2 }}
          >
            {hint}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

const SALE_STATUS_META = {
  COMPLETED:          { label: 'Completed',           colorKey: 'success' },
  DRAFT:              { label: 'Draft',               colorKey: 'warning' },
  HELD:               { label: 'Held',                colorKey: 'warning' },
  PARTIALLY_RETURNED: { label: 'Partially returned',  colorKey: 'info'    },
  RETURNED:           { label: 'Returned',            colorKey: 'info'    },
  CANCELLED:          { label: 'Cancelled',           colorKey: 'danger'  },
};

const PAYMENT_STATUS_META = {
  PAID:            { label: 'Paid',            colorKey: 'success' },
  PARTIALLY_PAID:  { label: 'Partially paid',  colorKey: 'warning' },
  DUE:             { label: 'Due',             colorKey: 'danger'  },
};

const formatAmount = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatShortDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
};

const getPaymentStatus = (dueAmount) => (Number(dueAmount) <= 0 ? 'PAID' : 'DUE');

// A sale can accept a fresh payment / a return only while it is committed and
// not fully reversed — mirrors SaleService.mapDtoActionable (COMPLETED /
// PARTIALLY_RETURNED). Anything else (DRAFT, HELD, RETURNED, CANCELLED) is
// either pre-commit or terminal.
const isFinancialActionable = (status) =>
  status === 'COMPLETED' || status === 'PARTIALLY_RETURNED';

// DRAFT/HELD rows aren't committed, so ledger/dues/delivery are all N/A —
// the expanded row switches to a slimmer summary layout for them.
const isPreCommit = (status) => status === 'DRAFT' || status === 'HELD';

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { shop } = useShop();
  // Live palette from ThemeContext — updates with LIGHT/DARK/AUTO switches
  const theme = useAppPalette();

  const [salesHistory, setSalesHistory] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // Status filter — empty string = "all non-cancelled" (server default). Explicit
  // CANCELLED lets ops teams find voided invoices; the server flips the include-cancelled
  // rule when a status is supplied. See SaleRepository.searchHistory.
  const [statusFilter, setStatusFilter] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Debounce the free-text search so we don't fire a request on every keystroke.
  // Filter/date changes trigger immediately — those are typed less frequently.
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(handle);
  }, [search]);

  const [expandedSaleKey, setExpandedSaleKey] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [exporting, setExporting] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(null); // Track which sale's invoice is loading

  // Modal States — returns now navigate to /sales/return; only cancel dialog stays inline.
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  // Cancel Logic State
  const [cancelReason, setCancelReason] = useState('');

  // Notes edit state — dialog local to a single sale so parallel edits stay isolated.
  const [notesDialog, setNotesDialog] = useState({ open: false, saleId: null, draft: '' });
  const [notesSaving, setNotesSaving] = useState(false);

  // Proforma → Invoice conversion is a shop-critical, non-reversible op — track
  // the in-flight sale id so the row action can render a spinner and stay
  // disabled during the request.
  const [convertingProformaId, setConvertingProformaId] = useState(null);

  // Discard-draft state — confirmation-gated because it's a hard delete.
  // Only exposed for DRAFT / HELD rows (server also enforces).
  const [discardDialog, setDiscardDialog] = useState({ open: false, sale: null });
  const [discarding, setDiscarding] = useState(false);

  // Timeline (void/refund history) dialog state — merges audit rows + linked
  // credit notes so the user can trace every mutation the sale has seen.
  const [timelineDialog, setTimelineDialog] = useState({ open: false, sale: null });
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const params = new URLSearchParams(location.search);
  const isFilteredView = params.get('search');

  // E-Invoice & E-Way Bill States (Issue 5)
  const [ewayBillDialogOpen, setEwayBillDialogOpen] = useState(false);
  const [ewayBillSale, setEwayBillSale] = useState(null);
  const [ewayBillThreshold, setEwayBillThreshold] = useState(50000);
  const [einvoiceLoading, setEinvoiceLoading] = useState(null);

  // Row-level overflow menu ({anchor, sale}) — only one row's menu can be open at a time
  const [rowMenu, setRowMenu] = useState({ anchor: null, sale: null });
  const openRowMenu = (e, sale) => setRowMenu({ anchor: e.currentTarget, sale });
  const closeRowMenu = () => setRowMenu({ anchor: null, sale: null });

  useEffect(() => {
    fetchEWayBillThreshold()
      .then((threshold) => {
        if (typeof threshold === 'number') setEwayBillThreshold(threshold);
      })
      .catch(() => {});
  }, []);

  const handleGenerateEInvoiceAction = async (sale) => {
    const saleId = sale.id || sale.saleId;
    setEinvoiceLoading(saleId);
    try {
      const resData = await generateEInvoice(saleId);
      showSnackbar(t('salesFlow.history.eInvoiceGenerated'), 'success');
      setSalesHistory(prev => {
        const updateItem = (s) => ((s.id || s.saleId) === saleId) ? {
          ...s,
          einvoiceStatus: resData?.einvoiceStatus || 'GENERATED',
          irn: resData?.irn || s.irn,
          ackNo: resData?.ackNo || s.ackNo,
          ackDate: resData?.ackDate || s.ackDate,
          qrCodePath: resData?.qrCodePath || s.qrCodePath
        } : s;
        if (Array.isArray(prev)) return prev.map(updateItem);
        if (prev && Array.isArray(prev.content)) return { ...prev, content: prev.content.map(updateItem) };
        return prev;
      });
      loadData();
    } catch (err) {
      console.error('E-Invoice Error:', err);
      showSnackbar(err?.response?.data?.message || t('salesFlow.history.failedEInvoice'), 'error');
    } finally {
      setEinvoiceLoading(null);
    }
  };

  const handleCancelEInvoiceAction = async (sale) => {
    const saleId = sale.id || sale.saleId;
    setEinvoiceLoading(saleId);
    try {
      const resData = await cancelEInvoice(saleId, 'Cancelled via portal');
      showSnackbar(t('salesFlow.history.eInvoiceCancelled'), 'success');
      setSalesHistory(prev => {
        const updateItem = (s) => ((s.id || s.saleId) === saleId) ? {
          ...s,
          einvoiceStatus: resData?.einvoiceStatus || 'CANCELLED'
        } : s;
        if (Array.isArray(prev)) return prev.map(updateItem);
        if (prev && Array.isArray(prev.content)) return { ...prev, content: prev.content.map(updateItem) };
        return prev;
      });
      loadData();
    } catch (err) {
      console.error('Cancel E-Invoice Error:', err);
      showSnackbar(err?.response?.data?.message || t('salesFlow.history.failedCancelEInvoice'), 'error');
    } finally {
      setEinvoiceLoading(null);
    }
  };

  const handleOpenEWayBillModal = (sale) => {
    setEwayBillSale(sale);
    setEwayBillDialogOpen(true);
  };

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Notes / proforma-conversion handlers — must sit AFTER showSnackbar so the
  // useCallback closure can capture the reference at initialization time
  // (avoids the TDZ error we hit when they were declared earlier in the file).
  const openNotesDialog = useCallback((sale) => {
    setNotesDialog({ open: true, saleId: sale.saleId ?? sale.id, draft: sale.notes || '' });
  }, []);

  const closeNotesDialog = useCallback(() => {
    setNotesDialog({ open: false, saleId: null, draft: '' });
  }, []);

  const saveSaleNotes = useCallback(async () => {
    if (!notesDialog.saleId) return;
    setNotesSaving(true);
    try {
      // Trim + empty → null so we clear cleanly rather than storing whitespace.
      const nextNotes = notesDialog.draft?.trim() || '';
      await updateSaleNotes(notesDialog.saleId, nextNotes || null);
      // Reflect locally without a full history refetch — patch the in-memory row.
      setSalesHistory((prev) => {
        const patchOne = (s) => ((s.saleId ?? s.id) === notesDialog.saleId ? { ...s, notes: nextNotes } : s);
        if (Array.isArray(prev)) return prev.map(patchOne);
        if (prev && Array.isArray(prev.content)) return { ...prev, content: prev.content.map(patchOne) };
        return prev;
      });
      showSnackbar('Notes saved', 'success');
      closeNotesDialog();
    } catch (e) {
      showSnackbar('Failed to save notes', 'error');
    } finally {
      setNotesSaving(false);
    }
  }, [notesDialog.saleId, notesDialog.draft, showSnackbar, closeNotesDialog]);

  const confirmDiscardDraft = useCallback(async () => {
    const sale = discardDialog.sale;
    const saleId = sale?.saleId ?? sale?.id;
    if (!saleId) return;
    setDiscarding(true);
    try {
      await discardDraftSale(saleId);
      showSnackbar(
        sale.status === 'HELD' ? 'Held order discarded' : 'Draft discarded',
        'success'
      );
      setDiscardDialog({ open: false, sale: null });
      loadData();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to discard';
      showSnackbar(msg, 'error');
    } finally {
      setDiscarding(false);
    }
  // loadData is defined below — safe because this callback only fires on button
  // click, well after module init completes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discardDialog.sale, showSnackbar]);

  const handleOpenTimeline = useCallback(async (sale) => {
    const saleId = sale?.saleId ?? sale?.id;
    if (!saleId) return;
    setTimelineDialog({ open: true, sale });
    setTimelineEvents([]);
    setTimelineLoading(true);
    try {
      const { data } = await fetchSaleTimeline(saleId);
      setTimelineEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to load timeline';
      showSnackbar(msg, 'error');
    } finally {
      setTimelineLoading(false);
    }
  }, [showSnackbar]);

  const handleConvertProforma = useCallback(async (sale) => {
    const saleId = sale?.saleId ?? sale?.id;
    if (!saleId) return;
    setConvertingProformaId(saleId);
    try {
      const res = await convertProformaToInvoice(saleId);
      // Backend returns the fresh INVOICE SaleDto; refresh history so the new
      // invoice appears and the source proforma's row (if the server ever
      // exposes conversion status) stays consistent.
      const newInvoiceNo = res?.data?.invoiceNo || res?.data?.data?.invoiceNo;
      showSnackbar(
        newInvoiceNo ? `Converted → invoice ${newInvoiceNo}` : 'Proforma converted to invoice',
        'success'
      );
      // loadData is declared just below — safe because this callback only
      // fires on user click, well after module init has finished.
      loadData();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to convert proforma';
      showSnackbar(msg, 'error');
    } finally {
      setConvertingProformaId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSnackbar]);

  const loadData = useCallback(() => {
    setLoading(true);
    fetchSalesHistory({
      page,
      size: rowsPerPage,
      q: debouncedSearch || undefined,
      status: statusFilter || undefined,
      from: startDate || undefined,
      to: endDate || undefined,
    })
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) {
          // Defensive: some older backends may still return a plain array.
          setSalesHistory(data);
          setTotalElements(data.length);
        } else if (data && Array.isArray(data.content)) {
          setSalesHistory(data.content);
          setTotalElements(Number(data.totalElements ?? data.content.length));
        } else {
          setSalesHistory([]);
          setTotalElements(0);
        }
      })
      .catch(() => showSnackbar(t('salesFlow.history.failedLoadHistory'), 'error'))
      .finally(() => setLoading(false));
  }, [page, rowsPerPage, debouncedSearch, statusFilter, startDate, endDate, showSnackbar]);

  useEffect(() => {
    const urlSearch = params.get('search') || '';
    setSearch(urlSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => {
    loadData();
  }, [refreshTrigger, loadData]);

  // Any filter change resets to page 0 — otherwise a filter that shrinks
  // the result set would leave the user paginated past the end.
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, statusFilter, startDate, endDate]);

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
        showSnackbar(t('salesFlow.history.popupBlocked'), 'warning');
        URL.revokeObjectURL(fileURL);
      } else {
        // Revoke URL after 2 minutes
        setTimeout(() => {
          URL.revokeObjectURL(fileURL);
        }, 120000);
      }
    } catch (err) {
      console.error('Preview Error:', err);
      showSnackbar(t('salesFlow.history.failedPreview'), 'error');
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

      showSnackbar(t('salesFlow.history.downloadedSuccess'), 'success');
    } catch (err) {
      console.error('Download Error:', err);
      showSnackbar(t('salesFlow.history.failedDownload'), 'error');
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
      showSnackbar(t('salesFlow.history.couldNotGeneratePdf'), 'error');
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
      showSnackbar(t('salesFlow.history.failedDownload'), 'error');
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

  // ============ SERVER-SIDE LIST ============
  // Filtering and pagination live on the backend (see fetchSalesHistory params).
  // `filteredSales` retained as a name for downstream callers; it's just the
  // current page's rows exactly as the server returned them (already sorted
  // by date DESC via the controller). No client-side re-filtering.
  const filteredSales = useMemo(() => {
    return Array.isArray(salesHistory)
      ? salesHistory
      : (salesHistory && Array.isArray(salesHistory.content) ? salesHistory.content : []);
  }, [salesHistory]);

  // Backend already paginated — render the returned page as-is.
  const paginatedSales = filteredSales;

  // Page-scope aggregates for the KPI strip. Labeled "on this page" in the UI so
  // the operator knows these totals move with pagination. Cancelled rows are
  // ignored since they never contributed to revenue. DRAFT/HELD are excluded
  // from Revenue but included in the count so the count matches `totalElements`.
  const pageStats = useMemo(() => {
    const list = Array.isArray(filteredSales) ? filteredSales : [];
    let revenue = 0;
    let outstanding = 0;
    let counted = 0;
    for (const s of list) {
      const status = s.status;
      if (status === 'CANCELLED') continue;
      if (!isPreCommit(status)) {
        revenue += Number(s.totalAmount || 0);
        outstanding += Math.max(0, Number(s.dueAmount || 0));
      }
      counted += 1;
    }
    return { revenue, outstanding, counted };
  }, [filteredSales]);

  const hasActiveFilters = Boolean(
    debouncedSearch || statusFilter || startDate || endDate
  );

  const handleClearAllFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setPage(0);
    const p = new URLSearchParams(location.search);
    p.delete('search');
    navigate({ search: p.toString() }, { replace: true });
  };

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
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={1.5}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            {isFilteredView && (
              <IconButton onClick={() => navigate(-1)} size="small" aria-label="Back">
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            )}
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.textPrimary }}>
              {isFilteredView ? 'Invoice Lookup' : 'Sales History'}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Refresh">
              <span>
                <IconButton size="small" onClick={loadData} disabled={loading} aria-label="Refresh">
                  {loading ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Process a return by invoice number">
              <Button
                variant="outlined"
                size="small"
                startIcon={<AssignmentReturnIcon />}
                onClick={() => navigate('/sales/return')}
                sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
              >
                Process Return
              </Button>
            </Tooltip>
            <Button
              variant="outlined"
              size="small"
              startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
              disabled={exporting || filteredSales.length === 0}
              onClick={handleExportCSV}
              sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </Stack>
        </Stack>

        {/* KPI strip — three tiles summarising the current filter. Count is
            authoritative (server totalElements across all pages); money tiles
            are labeled "on this page" because we don't have a server-side
            aggregate endpoint yet. Explicit label > silently misleading total. */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ display: { xs: 'none', sm: 'flex' } }}
        >
          <KpiTile
            icon={<FormatListNumberedIcon fontSize="small" />}
            label="Sales in filter"
            value={loading ? '—' : totalElements.toLocaleString('en-IN')}
            hint={hasActiveFilters ? 'Filtered' : 'All time'}
            theme={theme}
          />
          <KpiTile
            icon={<TrendingUpIcon fontSize="small" />}
            label="Revenue on this page"
            value={loading ? '—' : formatAmount(pageStats.revenue)}
            hint={`${pageStats.counted} rows shown`}
            theme={theme}
          />
          <KpiTile
            icon={<AccountBalanceWalletOutlinedIcon fontSize="small" />}
            label="Outstanding on this page"
            value={loading ? '—' : formatAmount(pageStats.outstanding)}
            hint={pageStats.outstanding > 0 ? 'Follow up on dues' : 'All settled'}
            emphasis={pageStats.outstanding > 0 ? 'warning' : 'neutral'}
            theme={theme}
          />
        </Stack>

        <Tabs
          value={statusFilter === 'DRAFT' ? 1 : statusFilter === 'HELD' ? 2 : 0}
          onChange={(_, next) => {
            const nextFilter = next === 1 ? 'DRAFT' : next === 2 ? 'HELD' : '';
            setStatusFilter(nextFilter);
            setPage(0);
          }}
          sx={{
            minHeight: 36,
            borderBottom: '1px solid',
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '0.8125rem',
              fontWeight: 600,
              minHeight: 36,
              py: 0.5,
              px: 2,
              color: 'text.secondary',
              '&.Mui-selected': { color: 'text.primary' },
            },
            '& .MuiTabs-indicator': { bgcolor: 'primary.main', height: 2 },
          }}
        >
          <Tab label={t('salesFlow.history.allTab')} />
          <Tab label={t('salesFlow.history.draftsTab')} />
          <Tab label={t('salesFlow.history.heldTab')} />
        </Tabs>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <TextField
            size="small"
            placeholder="Search name or invoice #"
            value={search}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => handleSearchChange({ target: { value: '' } })}
                    edge="end"
                    aria-label="Clear search"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{ minWidth: { sm: 260 } }}
          />
          <TextField
            type="date"
            size="small"
            label="From"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <TextField
            type="date"
            size="small"
            label="To"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            // Force the label to stay floated regardless of value — otherwise
            // MUI thinks value="" means empty and drops the label into the
            // input, where it overlays the "All (excl. cancelled)" text.
            InputLabelProps={{ shrink: true }}
            SelectProps={{ displayEmpty: true }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All (excl. cancelled)</MenuItem>
            <MenuItem value="DRAFT">Draft</MenuItem>
            <MenuItem value="HELD">Held (parked)</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="PARTIALLY_RETURNED">Partially returned</MenuItem>
            <MenuItem value="RETURNED">Returned</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
          </TextField>

          {hasActiveFilters && (
            <Button
              variant="text"
              size="small"
              startIcon={<CloseIcon fontSize="small" />}
              onClick={handleClearAllFilters}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                color: 'text.secondary',
                alignSelf: { xs: 'flex-start', sm: 'center' },
              }}
            >
              Clear filters
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Main Table — clean, dot-based status, always-visible actions */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', borderColor: 'divider' }}>
        <TableContainer>
          <Table size="small" sx={{
            '& .MuiTableCell-root': {
              borderBottomColor: 'divider',
              py: 1.25,
            },
          }}>
            <TableHead>
              <TableRow sx={{
                '& .MuiTableCell-root': {
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: 0.3,
                  color: 'text.secondary',
                  borderBottom: '1px solid',
                  borderBottomColor: 'divider',
                  bgcolor: 'transparent',
                },
              }}>
                <TableCell width={40} />
                <TableCell>Invoice</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>E-Invoice</TableCell>
                <TableCell align="right" width={140}>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8, border: 0 }}>
                    <CircularProgress size={26} sx={{ color: theme.primary }} />
                  </TableCell>
                </TableRow>
              ) : paginatedSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary', border: 0 }}>
                    <Typography variant="body2">No transactions match your filters.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSales.map((sale, idx) => {
                  const saleKey = sale.id || sale.saleId || sale.invoiceNo || idx;
                  const isExpanded = expandedSaleKey === saleKey;
                  const payStatus = getPaymentStatus(sale.dueAmount);
                  const isLoadingThisSale = invoiceLoading === saleKey;

                  const saleMeta = SALE_STATUS_META[sale.status] || { label: sale.status || 'Unknown', colorKey: 'info' };
                  const payMeta = PAYMENT_STATUS_META[payStatus] || null;
                  const showPayment = sale.status !== 'DRAFT' && sale.status !== 'CANCELLED' && payMeta;
                  const showEInvoice = sale.status === 'COMPLETED' && sale.einvoiceStatus === 'GENERATED';

                  return (
                    <React.Fragment key={saleKey}>
                      <TableRow
                        hover
                        sx={{
                          '&:hover': { bgcolor: alpha(theme.primary, 0.02) },
                          '& > *': { borderBottom: isExpanded ? 'unset' : undefined },
                        }}
                      >
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => setExpandedSaleKey(isExpanded ? null : saleKey)}
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          </IconButton>
                        </TableCell>

                        <TableCell sx={{ fontWeight: 600, color: 'text.primary', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.82rem' }}>
                          {sale.invoiceNo || '—'}
                        </TableCell>

                        <TableCell sx={{ color: 'text.primary' }}>
                          {sale.customerName || <Box component="span" sx={{ color: 'text.secondary' }}>Walk-in</Box>}
                        </TableCell>

                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                          {formatShortDate(sale.date)}
                        </TableCell>

                        <TableCell align="right" sx={{
                          fontWeight: 600,
                          color: 'text.primary',
                          fontVariantNumeric: 'tabular-nums',
                          whiteSpace: 'nowrap',
                        }}>
                          {formatAmount(sale.totalAmount)}
                        </TableCell>

                        <TableCell>
                          <Stack spacing={0.4}>
                            <StatusDot color={theme[saleMeta.colorKey]} label={saleMeta.label} />
                            {showPayment && (
                              <StatusDot color={theme[payMeta.colorKey]} label={payMeta.label} muted />
                            )}
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <EInvoiceStatusBadge sale={sale} />
                        </TableCell>

                        <TableCell align="right">
                          <Stack direction="row" spacing={0.25} justifyContent="flex-end" alignItems="center">
                            {sale.status === 'DRAFT' ? (
                              <Tooltip title="Resume draft">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => navigate(`/sales?resumeId=${sale.saleId}`)}
                                  aria-label="Resume draft"
                                >
                                  <PlayArrowIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : sale.status === 'HELD' ? (
                              <Tooltip title="Resume held order">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  aria-label="Resume held order"
                                  onClick={async () => {
                                    try {
                                      await resumeSale(sale.saleId);
                                      navigate(`/sales?resumeId=${sale.saleId}`);
                                    } catch (err) {
                                      showSnackbar(err?.response?.data?.message || 'Failed to resume order', 'error');
                                    }
                                  }}
                                >
                                  <PlayArrowIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title="View invoice">
                                <span>
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handlePrintInvoice(sale)}
                                    disabled={isLoadingThisSale}
                                    aria-label="View invoice"
                                  >
                                    {isLoadingThisSale
                                      ? <CircularProgress size={16} color="inherit" />
                                      : <VisibilityIcon fontSize="small" />}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}

                            {(sale.canReturn != null ? sale.canReturn : isFinancialActionable(sale.status)) && (
                              <Tooltip title="Return items">
                                <IconButton
                                  size="small"
                                  onClick={() => navigate(`/sales/return?invoice=${encodeURIComponent(sale.invoiceNo || '')}`)}
                                  aria-label="Return items"
                                >
                                  <AssignmentReturnIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}

                            <Tooltip title="More">
                              <IconButton
                                size="small"
                                onClick={(e) => openRowMenu(e, sale)}
                                aria-label="More actions"
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell colSpan={8} sx={{ p: 0, border: 0 }}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{
                              px: 3,
                              py: 2,
                              bgcolor: alpha(theme.primary, 0.015),
                              borderBottom: '1px solid',
                              borderBottomColor: 'divider',
                            }}>
                              <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={{ xs: 1.5, sm: 4 }}
                                alignItems={{ xs: 'flex-start', sm: 'center' }}
                                flexWrap="wrap"
                                useFlexGap
                              >
                                {isPreCommit(sale.status) ? (
                                  // DRAFT / HELD: not committed — no ledger, no delivery, no dues.
                                  // Show the running cart total only, and let the user resume/discard
                                  // via the row action + overflow menu.
                                  <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.72rem' }}>
                                      {sale.status === 'DRAFT' ? 'Draft total' : 'Held total'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                                      {formatAmount(sale.totalAmount)}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                                      Not committed — resume to complete or discard.
                                    </Typography>
                                  </Box>
                                ) : (
                                  <>
                                    <Box>
                                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.72rem' }}>
                                        Total
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                                        {formatAmount(sale.totalAmount)}
                                      </Typography>
                                    </Box>
                                    <Box>
                                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.72rem' }}>
                                        Paid
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                                        {formatAmount(Number(sale.totalAmount || 0) - Number(sale.dueAmount || 0))}
                                      </Typography>
                                    </Box>
                                    <Box>
                                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.72rem' }}>
                                        Due
                                      </Typography>
                                      <Typography variant="body2" sx={{
                                        fontWeight: 600,
                                        fontVariantNumeric: 'tabular-nums',
                                        color: Number(sale.dueAmount) > 0 ? theme.danger : 'text.primary',
                                      }}>
                                        {formatAmount(sale.dueAmount)}
                                      </Typography>
                                    </Box>
                                  </>
                                )}

                                <Box sx={{ flexGrow: 1 }} />

                                {/* Customer profile — only for committed sales with a customer.
                                    DRAFT/HELD may have a customer but the "dues" page is a
                                    ledger view that doesn't make sense for uncommitted rows. */}
                                {sale.customerId && !isPreCommit(sale.status) && (
                                  <Button
                                    variant="text"
                                    size="small"
                                    onClick={() => navigate(`/customer-details/${sale.customerId}/dues`)}
                                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                                  >
                                    Customer profile
                                  </Button>
                                )}

                                {/* Delivery — only for committed sales. Deliveries can't exist
                                    for DRAFT/HELD/CANCELLED rows on the server. */}
                                {!isPreCommit(sale.status) && sale.status !== 'CANCELLED' && (
                                  <Button
                                    variant="text"
                                    size="small"
                                    startIcon={<LocalShippingIcon fontSize="small" />}
                                    onClick={() => navigate(`/delivery?saleId=${sale.saleId}`)}
                                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                                  >
                                    Delivery
                                  </Button>
                                )}

                                {/* Proforma → Invoice conversion. Only shown for PROFORMA rows
                                    that aren't already cancelled/returned. Server enforces
                                    once-only via SaleRepository.existsByProformaSourceSale_Id. */}
                                {sale.saleType === 'PROFORMA' && sale.status !== 'CANCELLED' && sale.status !== 'RETURNED' && (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => handleConvertProforma(sale)}
                                    disabled={convertingProformaId === (sale.saleId ?? sale.id)}
                                    startIcon={
                                      convertingProformaId === (sale.saleId ?? sale.id)
                                        ? <CircularProgress size={14} color="inherit" />
                                        : null
                                    }
                                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                                  >
                                    Convert to invoice
                                  </Button>
                                )}

                                {/* Receive Payment — committed sales with an outstanding due only.
                                    Excludes DRAFT/HELD (no ledger entry yet) and RETURNED/CANCELLED
                                    (terminal states where the credit note has already zeroed dues). */}
                                {isFinancialActionable(sale.status) && Number(sale.dueAmount) > 0 && (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<PaymentsIcon fontSize="small" />}
                                    onClick={() => navigate(`/customer-payments?saleId=${sale.saleId}`)}
                                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                                  >
                                    Receive Payment
                                  </Button>
                                )}
                              </Stack>

                              {/* Sale-level notes — inline read-only display + edit trigger.
                                  Uses the SaleDueDto.notes field surfaced by /api/sales/history and
                                  PATCH /api/sales/{id}/notes for the save. */}
                              <Box sx={{
                                mt: 1.5, pt: 1.25,
                                borderTop: '1px dashed', borderTopColor: 'divider',
                                display: 'flex', alignItems: 'flex-start', gap: 1,
                              }}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.72rem' }}>
                                    Notes
                                  </Typography>
                                  <Typography variant="body2" sx={{
                                    fontStyle: sale.notes ? 'normal' : 'italic',
                                    color: sale.notes ? 'text.primary' : 'text.disabled',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                  }}>
                                    {sale.notes || 'No notes'}
                                  </Typography>
                                </Box>
                                <Button
                                  variant="text"
                                  size="small"
                                  onClick={() => openNotesDialog(sale)}
                                  sx={{ textTransform: 'none', fontWeight: 600, flexShrink: 0 }}
                                >
                                  {sale.notes ? 'Edit' : 'Add note'}
                                </Button>
                              </Box>
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
          count={totalElements}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          sx={{ borderTop: '1px solid', borderTopColor: 'divider' }}
        />
      </Paper>

      {/* NOTES EDIT DIALOG — used by the "Add note" / "Edit" affordance on the expanded row.
          PATCH /api/sales/{id}/notes with trimmed body; empty trim → null (server clears). */}
      <Dialog open={notesDialog.open} onClose={closeNotesDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Sale notes</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            maxRows={8}
            placeholder="Add a note about this sale (optional)…"
            value={notesDialog.draft}
            onChange={(e) => setNotesDialog((prev) => ({ ...prev, draft: e.target.value }))}
            inputProps={{ maxLength: 1000 }}
            sx={{ mt: 1 }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
            {notesDialog.draft?.length || 0}/1000
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeNotesDialog} disabled={notesSaving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={saveSaleNotes}
            disabled={notesSaving}
            startIcon={notesSaving ? <CircularProgress size={14} /> : null}
          >
            {notesSaving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ROW-LEVEL OVERFLOW MENU (Invoice ops + Compliance + Cancel) */}
      <Menu
        anchorEl={rowMenu.anchor}
        open={Boolean(rowMenu.anchor)}
        onClose={closeRowMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            const sale = rowMenu.sale;
            closeRowMenu();
            if (sale) handleDownloadInvoice(sale);
          }}
        >
          <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Download PDF" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            const sale = rowMenu.sale;
            closeRowMenu();
            if (sale) handleWhatsAppInvoice(sale);
          }}
        >
          <ListItemIcon><WhatsAppIcon fontSize="small" sx={{ color: '#25D366' }} /></ListItemIcon>
          <ListItemText primary="Share via WhatsApp" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            const sale = rowMenu.sale;
            closeRowMenu();
            if (sale) handlePrintInvoice(sale);
          }}
        >
          <ListItemIcon><PrintIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Print" />
        </MenuItem>

        {rowMenu.sale?.status === 'COMPLETED' && [
          <Divider key="d1" />,
          rowMenu.sale?.einvoiceStatus === 'GENERATED' ? (
            <MenuItem
              key="einv-cancel"
              onClick={() => {
                const sale = rowMenu.sale;
                closeRowMenu();
                if (sale) handleCancelEInvoiceAction(sale);
              }}
            >
              <ListItemIcon><CancelIcon fontSize="small" /></ListItemIcon>
              <ListItemText
                primary="Cancel E-Invoice"
                secondary="IRN issued"
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </MenuItem>
          ) : (
            <MenuItem
              key="einv-gen"
              onClick={() => {
                const sale = rowMenu.sale;
                closeRowMenu();
                if (sale) handleGenerateEInvoiceAction(sale);
              }}
            >
              <ListItemIcon><QrCodeIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Generate E-Invoice" />
            </MenuItem>
          ),
          <MenuItem
            key="eway"
            onClick={() => {
              const sale = rowMenu.sale;
              closeRowMenu();
              if (sale) handleOpenEWayBillModal(sale);
            }}
          >
            <ListItemIcon><LocalShippingIcon fontSize="small" /></ListItemIcon>
            <ListItemText
              primary={rowMenu.sale?.ewayBillNo ? 'View E-Way Bill' : 'Generate E-Way Bill'}
              secondary={rowMenu.sale?.ewayBillNo || null}
              secondaryTypographyProps={{ variant: 'caption', sx: { fontFamily: 'monospace' } }}
            />
          </MenuItem>,
        ]}

        {rowMenu.sale
          // Prefer the server-truth flag (SaleDueDto.canCancel). Fall back to the
          // legacy client-side gate for any older backend that hasn't shipped the
          // field yet — status !== CANCELLED + (DRAFT or today's COMPLETED).
          && (rowMenu.sale.canCancel != null
                ? rowMenu.sale.canCancel
                : (rowMenu.sale.status !== 'CANCELLED'
                    && (rowMenu.sale.status === 'DRAFT'
                        || (rowMenu.sale.status === 'COMPLETED' && isToday(rowMenu.sale.date))))) && [
          <Divider key="d2" />,
          <MenuItem
            key="cancel"
            onClick={() => {
              const sale = rowMenu.sale;
              closeRowMenu();
              if (sale) handleOpenCancel(sale);
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon><CancelIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText primary="Cancel Sale" />
          </MenuItem>,
        ]}

        {/* Discard for DRAFT / HELD — a hard delete gated by server-side status guard.
            Distinct from "Cancel Sale": Cancel is for committed sales (with ledger/stock
            impact to reverse). Discard is for work-in-progress rows that never committed. */}
        {rowMenu.sale && (rowMenu.sale.status === 'DRAFT' || rowMenu.sale.status === 'HELD') && [
          <Divider key="d3" />,
          <MenuItem
            key="discard"
            onClick={() => {
              const sale = rowMenu.sale;
              closeRowMenu();
              if (sale) setDiscardDialog({ open: true, sale });
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon><CancelIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText primary={rowMenu.sale.status === 'HELD' ? 'Discard held order' : 'Discard draft'} />
          </MenuItem>,
        ]}

        {/* Timeline — available for every committed row (i.e. anything past DRAFT/HELD)
            since audit + credit-note rows only exist there. */}
        {rowMenu.sale && rowMenu.sale.status !== 'DRAFT' && rowMenu.sale.status !== 'HELD' && [
          <Divider key="d4" />,
          <MenuItem
            key="timeline"
            onClick={() => {
              const sale = rowMenu.sale;
              closeRowMenu();
              if (sale) handleOpenTimeline(sale);
            }}
          >
            <ListItemIcon><HistoryIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="View history" />
          </MenuItem>,
        ]}
      </Menu>

      {/* DISCARD DRAFT / HELD CONFIRMATION */}
      <Dialog
        open={discardDialog.open}
        onClose={() => !discarding && setDiscardDialog({ open: false, sale: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {discardDialog.sale?.status === 'HELD' ? 'Discard held order?' : 'Discard draft?'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {discardDialog.sale
              ? `${discardDialog.sale.invoiceNo} will be permanently deleted. This can't be undone.`
              : ''}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscardDialog({ open: false, sale: null })} disabled={discarding}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDiscardDraft}
            disabled={discarding}
            startIcon={discarding ? <CircularProgress size={14} color="inherit" /> : null}
          >
            {discarding ? 'Discarding…' : 'Discard'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* TIMELINE DIALOG — void / refund / cancel history for a single sale */}
      <Dialog
        open={timelineDialog.open}
        onClose={() => setTimelineDialog({ open: false, sale: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          History — {timelineDialog.sale?.invoiceNo || 'Sale'}
        </DialogTitle>
        <DialogContent dividers>
          {timelineLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
              <CircularProgress size={28} sx={{ color: theme.primary }} />
              <Typography variant="caption" color={theme.textSecondary}>Loading history…</Typography>
            </Box>
          ) : timelineEvents.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
              No mutation events recorded for this sale.
            </Typography>
          ) : (
            <Stack spacing={1.5} sx={{ py: 0.5 }}>
              {timelineEvents.map((ev) => {
                const isMoney = ev.action === 'CREDIT_NOTE' || ev.action === 'PROCESS_RETURN';
                const isCancel = ev.action === 'CANCEL_SALE';
                const chipColor = isCancel ? 'error' : isMoney ? 'warning' : 'default';
                const label = (ev.action || '').replace(/_/g, ' ');
                return (
                  <Paper
                    key={ev.id}
                    variant="outlined"
                    sx={{ p: 1.25, borderRadius: 1.5, borderLeft: `3px solid ${isCancel ? theme.danger : isMoney ? theme.warning : theme.primary}` }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                      <Chip size="small" label={label} color={chipColor} sx={{ fontWeight: 700 }} />
                      <Typography variant="caption" color="text.secondary">
                        {ev.timestamp ? formatShortDate(ev.timestamp) : '—'}
                      </Typography>
                    </Stack>
                    {ev.message && (
                      <Typography variant="body2" sx={{ mt: 0.75, whiteSpace: 'pre-wrap' }}>
                        {ev.message}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                      {ev.refNo && (
                        <Typography variant="caption" color="text.secondary">
                          Ref: <strong>{ev.refNo}</strong>
                        </Typography>
                      )}
                      {ev.amount != null && (
                        <Typography variant="caption" color="text.secondary">
                          Amount: <strong>{formatAmount(ev.amount)}</strong>
                        </Typography>
                      )}
                      {ev.username && (
                        <Typography variant="caption" color="text.secondary">
                          By: <strong>{ev.username}</strong>
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTimelineDialog({ open: false, sale: null })}>Close</Button>
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

      {/* E-WAY BILL DIALOG */}
      <EWayBillDialog
        open={ewayBillDialogOpen}
        sale={ewayBillSale}
        onClose={() => setEwayBillDialogOpen(false)}
        onSuccess={() => {
          showSnackbar('E-Way Bill generated successfully!', 'success');
          loadData();
        }}
      />

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