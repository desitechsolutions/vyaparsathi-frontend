import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme, alpha } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import {
  Container, Typography, Box, Snackbar, Alert, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, InputAdornment, Autocomplete,
  Stack, Paper, Chip, Tooltip, IconButton, Skeleton, MenuItem, Menu, Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  ShoppingBag as ShoppingBagIcon,
  HourglassBottom as HourglassIcon,
  AttachMoney as MoneyIcon,
  EventBusy as OverdueIcon,
  CalendarMonth as MonthIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  LocalShipping as ReceiveIcon,
  Cancel as CancelIcon,
  Send as SendIcon,
  MoreVert as MoreIcon,
  DoneAll as MarkReceivedIcon,
  FilterAltOff as FilterClearIcon,
  Print as PrintIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  ContentCopy as DuplicateIcon,
} from '@mui/icons-material';

import { usePurchaseOrders } from '../hooks/usePurchaseOrders';
import CustomToolbar from './items/components/CustomToolbar';
import { duplicatePurchaseOrder, getPurchaseOrderSignedUrl } from '../services/api';

// ── Formatting helpers ────────────────────────────────────────────────
const formatInr = (val) =>
  Number(val || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });

const formatDate = (val) => {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return '—';
  }
};

// ── Status → design tokens ────────────────────────────────────────────
// Kept co-located with the page rather than in a shared enum module because
// the pill styling is Purchase Order-specific (Sales has its own map). If a
// second surface needs the same styling, extract to components/po/.
const STATUS_META = {
  DRAFT:              { label: 'Draft',              color: 'text.secondary',    tone: 'default' },
  PENDING_APPROVAL:   { label: 'Pending approval',   color: 'warning.main',      tone: 'warning' },
  REJECTED:           { label: 'Rejected',           color: 'error.main',        tone: 'error' },
  SUBMITTED:          { label: 'Submitted',          color: 'info.main',         tone: 'info' },
  PARTIALLY_RECEIVED: { label: 'Partially received', color: 'warning.main',      tone: 'warning' },
  RECEIVED:           { label: 'Received',           color: 'success.main',      tone: 'success' },
  CANCELLED:          { label: 'Cancelled',          color: 'error.main',        tone: 'error' },
  // Deprecated statuses — remain mapped so legacy rows still render nicely
  // while V81 migrations complete. See PurchaseOrderStatus.java.
  PENDING:            { label: 'Submitted',          color: 'info.main',         tone: 'info' },
  IN_PROGRESS:        { label: 'Partially received', color: 'warning.main',      tone: 'warning' },
};

const STATUS_ORDER = ['DRAFT', 'PENDING_APPROVAL', 'REJECTED', 'SUBMITTED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'];

// KPI cell — same convention inlined on Stock / LowStockAlerts / Items.
// Kept local per project pattern; extraction waits for a fourth consumer.
const KpiCell = ({ icon, label, value, color, divider }) => (
  <Box sx={{
    p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
    borderRight: divider ? '1px solid' : 'none',
    borderColor: 'divider',
    minWidth: 0,
  }}>
    <Box sx={{
      display: 'inline-flex', p: 1, borderRadius: 1,
      bgcolor: alpha(color, 0.1), color,
      alignItems: 'center', justifyContent: 'center',
    }}>
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={700}
        sx={{ letterSpacing: 0.6, fontSize: '0.65rem', display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={700} color="text.primary"
        sx={{ lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

const FilterChip = ({ active, onClick, label, count, color }) => (
  <Chip
    label={
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
        {label}
        <Box component="span" sx={{ opacity: 0.7, fontWeight: 500 }}>{count}</Box>
      </Box>
    }
    size="small" onClick={onClick} clickable
    variant={active ? 'filled' : 'outlined'}
    sx={{
      fontWeight: 600, borderRadius: 1,
      bgcolor: active ? (color || 'primary.main') : 'transparent',
      color: active ? 'common.white' : 'text.primary',
      borderColor: color || 'divider',
      '&:hover': {
        bgcolor: active
          ? (color || 'primary.main')
          : (color ? alpha(color, 0.08) : 'action.hover'),
      },
    }}
  />
);

const StatusPill = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, color: 'text.secondary', tone: 'default' };
  return (
    <Chip
      label={meta.label}
      size="small"
      color={meta.tone === 'default' ? undefined : meta.tone}
      variant={meta.tone === 'default' ? 'outlined' : 'filled'}
      sx={{
        fontWeight: 700,
        borderRadius: 1,
        letterSpacing: 0.3,
        fontSize: '0.72rem',
      }}
    />
  );
};

// Overdue = expectedDeliveryDate < today AND status is still open.
// Terminal states (RECEIVED, CANCELLED) never render as overdue.
const isOpen = (status) => status === 'SUBMITTED'
  || status === 'PARTIALLY_RECEIVED'
  || status === 'PENDING' // legacy
  || status === 'IN_PROGRESS'; // legacy

const isOverdue = (po) => {
  if (!po.expectedDeliveryDate || !isOpen(po.status)) return false;
  const due = new Date(po.expectedDeliveryDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return due < now;
};

const PurchaseOrders = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    isLoading,
    orders,
    allSuppliers,
    snackbar,
    handleDelete,
    handleSubmitPO,
    handleCancelPO,
    handleSendPO,
    handleMarkReceived,
    handleSnackbarClose,
    refreshData,
    deleteDialog,
    confirmDelete,
    cancelDelete,
  } = usePurchaseOrders();

  // ── Local filter state ──────────────────────────────────────────────
  const [searchText, setSearchText] = useState('');
  const [supplierFilter, setSupplierFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // ── Confirm dialogs (kept on the list page for row-level bulk actions) ──
  const [submitDialog, setSubmitDialog] = useState({ open: false, po: null });
  const [cancelDialog, setCancelDialog] = useState({ open: false, po: null, reason: '' });
  const [sendDialog, setSendDialog] = useState({ open: false, po: null });
  const [receivedDialog, setReceivedDialog] = useState({ open: false, po: null });
  const [actionBusy, setActionBusy] = useState(false);

  // Row action menu (three-dot on each PO row)
  const [rowMenu, setRowMenu] = useState({ anchor: null, po: null });
  const openRowMenu = (event, po) => setRowMenu({ anchor: event.currentTarget, po });
  const closeRowMenu = () => setRowMenu({ anchor: null, po: null });

  // Duplicate PO state (BE builds the copy; FE navigates to the new edit route).
  const [duplicating, setDuplicating] = useState(false);
  const handleDuplicatePO = async (po) => {
    if (!po?.id || duplicating) return;
    setDuplicating(true);
    try {
      const copy = await duplicatePurchaseOrder(po.id);
      if (copy?.id) {
        navigate(`/purchase-orders/${copy.id}/edit`);
      }
    } catch (err) {
      // hook's snackbar isn't wired for this action; refreshData will pick up
      // any partial state on next visit. Log for now — a dedicated snackbar
      // hook slot would be a nice cleanup but doesn't block the flow.
      console.error('Duplicate PO failed:', err);
    } finally {
      setDuplicating(false);
    }
  };

  // ── Print / Share handoffs ────────────────────────────────────────
  // Print + share both flow through the server-rendered PDF. The signed
  // URL is short-lived (invoice-token expiry) so a shared link can't leak
  // beyond a few minutes. Printing opens the inline PDF and lets the
  // browser's print dialog produce a "Save as PDF" the shop actually keeps.
  const openSignedPdf = async (po) => {
    if (!po?.id) return null;
    try {
      const signedPath = await getPurchaseOrderSignedUrl(po.id);
      // signedPath is a server-relative path like "/api/purchase-orders/signed?token=…"
      // Combine with the API base so it works in dev + prod (env may proxy).
      return signedPath;
    } catch (err) {
      console.error('Failed to get PO PDF signed URL', err);
      return null;
    }
  };

  const handlePrintPO = async (po) => {
    const path = await openSignedPdf(po);
    if (path) window.open(path, '_blank', 'noopener,noreferrer');
  };

  const buildShareText = (po, signedUrl) => {
    // Full absolute URL for shares so the link is clickable from any device.
    const absUrl = signedUrl
      ? (signedUrl.startsWith('http') ? signedUrl : `${window.location.origin}${signedUrl}`)
      : null;
    const lines = [
      `Purchase Order ${po.poNumber || ''}`,
      `Supplier: ${po.supplier?.name || '—'}`,
      `Order date: ${formatDate(po.orderDate)}`,
      po.expectedDeliveryDate ? `Expected delivery: ${formatDate(po.expectedDeliveryDate)}` : null,
      `Total: ₹${formatInr(po.totalAmount)}`,
      absUrl ? `\nPDF: ${absUrl}` : null,
    ].filter(Boolean);
    return lines.join('\n');
  };

  const handleShareWhatsApp = async (po) => {
    const path = await openSignedPdf(po);
    const text = encodeURIComponent(buildShareText(po, path));
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareEmail = async (po) => {
    const path = await openSignedPdf(po);
    const subject = encodeURIComponent(`Purchase Order ${po.poNumber || ''}`);
    const body = encodeURIComponent(buildShareText(po, path));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // ── URL pre-fill contract (LowStockAlerts + SupplierPaymentPage) ────
  // Phase 2: preserve ?variantId, ?qty, ?supplierId — forward to the new
  // /purchase-orders/new route which knows how to pre-fill. The ?ids= bulk
  // case still lands here as a fallback (Phase 6 wires proper multi-line
  // pre-fill via the same route).
  useEffect(() => {
    const variantId = searchParams.get('variantId');
    const qty = searchParams.get('qty');
    const supplierId = searchParams.get('supplierId');
    const ids = searchParams.get('ids');

    if (variantId || ids || supplierId) {
      const params = new URLSearchParams();
      if (variantId) params.set('variantId', variantId);
      if (qty) params.set('qty', qty);
      if (supplierId) params.set('supplierId', supplierId);
      if (ids) params.set('ids', ids);
      navigate(`/purchase-orders/new?${params.toString()}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Phase 2: navigate to dedicated routes instead of opening a modal.
  const openCreate = () => navigate('/purchase-orders/new');
  const openView = (po) => navigate(`/purchase-orders/${po.id}`);
  const openEdit = (po) => navigate(`/purchase-orders/${po.id}/edit`);

  // /receiving/:poId route was retired with ReceivingPage.jsx. Pass poId as
  // a query param so Receiving.jsx (once redesigned) can pre-select the PO
  // and open its create-receipt flow. Today Receiving.jsx ignores the param —
  // shop still lands on the general list — but the URL contract is preserved
  // for that future enhancement.
  const handleGoToReceiving = (poId) => navigate(`/receivings?poId=${poId}`);

  // ── Filter + KPI derivations ────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : null;
    const to = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : null;

    return (orders || []).filter((po) => {
      if (q) {
        const hay = [po.poNumber, po.supplier?.name].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (supplierFilter && String(po.supplierId) !== String(supplierFilter.id)) return false;
      if (statusFilter !== 'ALL' && po.status !== statusFilter) return false;
      if (from != null) {
        const t = po.orderDate ? new Date(po.orderDate).getTime() : 0;
        if (t < from) return false;
      }
      if (to != null) {
        const t = po.orderDate ? new Date(po.orderDate).getTime() : 0;
        if (t > to) return false;
      }
      return true;
    });
  }, [orders, searchText, supplierFilter, statusFilter, dateFrom, dateTo]);

  const statusCounts = useMemo(() => {
    const counts = { ALL: orders.length };
    STATUS_ORDER.forEach((s) => { counts[s] = 0; });
    (orders || []).forEach((po) => {
      // Normalize legacy statuses into canonical counts.
      let s = po.status;
      if (s === 'PENDING') s = 'SUBMITTED';
      if (s === 'IN_PROGRESS') s = 'PARTIALLY_RECEIVED';
      if (counts[s] != null) counts[s] += 1;
    });
    return counts;
  }, [orders]);

  const kpi = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    let openCount = 0;
    let awaitingCount = 0;
    let onOrderValue = 0;
    let overdueCount = 0;
    let monthSpend = 0;
    (orders || []).forEach((po) => {
      if (isOpen(po.status)) {
        openCount += 1;
        onOrderValue += Number(po.totalAmount || 0);
        // "Awaiting receipt" = SUBMITTED (fully open, no goods in) as opposed
        // to PARTIALLY_RECEIVED which is mid-flight.
        if (po.status === 'SUBMITTED' || po.status === 'PENDING') awaitingCount += 1;
        if (isOverdue(po)) overdueCount += 1;
      }
      const orderMs = po.orderDate ? new Date(po.orderDate).getTime() : 0;
      if (orderMs >= monthStart && po.status !== 'CANCELLED') {
        monthSpend += Number(po.totalAmount || 0);
      }
    });
    return { openCount, awaitingCount, onOrderValue, overdueCount, monthSpend };
  }, [orders]);

  // ── Action confirmations ────────────────────────────────────────────
  const confirmSubmit = async () => {
    if (!submitDialog.po) return;
    setActionBusy(true);
    await handleSubmitPO(submitDialog.po.id);
    setActionBusy(false);
    setSubmitDialog({ open: false, po: null });
    refreshData();
  };

  const confirmCancel = async () => {
    if (!cancelDialog.po) return;
    if (!cancelDialog.reason || !cancelDialog.reason.trim()) return; // BE enforces too
    setActionBusy(true);
    await handleCancelPO(cancelDialog.po.id, cancelDialog.reason.trim());
    setActionBusy(false);
    setCancelDialog({ open: false, po: null, reason: '' });
  };

  const confirmSend = async () => {
    if (!sendDialog.po) return;
    setActionBusy(true);
    await handleSendPO(sendDialog.po.id);
    setActionBusy(false);
    setSendDialog({ open: false, po: null });
  };

  const confirmMarkReceived = async () => {
    if (!receivedDialog.po) return;
    setActionBusy(true);
    await handleMarkReceived(receivedDialog.po.id);
    setActionBusy(false);
    setReceivedDialog({ open: false, po: null });
  };

  const clearFilters = () => {
    setSearchText('');
    setSupplierFilter(null);
    setStatusFilter('ALL');
    setDateFrom('');
    setDateTo('');
  };

  const filtersActive = !!(searchText || supplierFilter || statusFilter !== 'ALL' || dateFrom || dateTo);

  // ── Grid columns ────────────────────────────────────────────────────
  // Trimmed to the 7 columns that fit standard screen widths without
  // horizontal scroll: PO # / Supplier / Order Date / Status / Payment /
  // Value / Actions. Lines + Expected Delivery moved to the detail page.
  const columns = useMemo(() => [
    {
      field: 'poNumber',
      headerName: 'PO #',
      flex: 1, minWidth: 160,
      renderCell: (params) => (
        <Box
          onClick={(e) => { e.stopPropagation(); openView(params.row); }}
          sx={{
            display: 'flex', alignItems: 'center',
            cursor: 'pointer',
            '&:hover .po-num-link': { textDecoration: 'underline' },
          }}
        >
          <Typography
            variant="body2"
            fontWeight={700}
            noWrap
            className="po-num-link"
            sx={{ fontFamily: 'monospace', color: 'primary.main' }}
          >
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'supplierName',
      headerName: 'Supplier',
      flex: 1.2, minWidth: 160,
      valueGetter: (params) => params?.row?.supplier?.name || '—',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={500} noWrap>{params.value}</Typography>
      ),
    },
    {
      field: 'orderDate',
      headerName: 'Order Date',
      flex: 0.7, minWidth: 120,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">{formatDate(params.value)}</Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.8, minWidth: 130,
      renderCell: (params) => <StatusPill status={params.value} />,
    },
    {
      field: 'paymentStatus',
      headerName: 'Payment',
      flex: 0.6, minWidth: 100,
      renderCell: (params) => {
        const raw = params.value || 'PENDING';
        const tone = raw === 'PAID' ? 'success' : raw === 'PARTIAL' ? 'warning' : 'default';
        return (
          <Chip
            label={raw}
            size="small"
            color={tone === 'default' ? undefined : tone}
            variant={tone === 'default' ? 'outlined' : 'filled'}
            sx={{ fontWeight: 700, borderRadius: 1, fontSize: '0.65rem', height: 22, letterSpacing: 0.3 }}
          />
        );
      },
    },
    {
      field: 'totalAmount',
      headerName: 'Value',
      flex: 0.7, minWidth: 110,
      align: 'right', headerAlign: 'right',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={700}>
          ₹{formatInr(params.value)}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false, filterable: false, disableColumnMenu: true,
      align: 'right', headerAlign: 'right',
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); openRowMenu(e, params.row); }}
        >
          <MoreIcon fontSize="small" />
        </IconButton>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ pt: 3, pb: 4 }}>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Header ─────────────────────────────────────────────────── */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.4 }}>
              {t('purchaseOrdersPage.title', 'Purchase Orders')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Track every order from draft to receipt. Cancel or send to supplier with a full audit trail.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/purchase-orders/approvals')}
              sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none', mr: 1 }}
            >
              Approvals
              {statusCounts.PENDING_APPROVAL > 0 && (
                <Chip
                  label={statusCounts.PENDING_APPROVAL}
                  size="small"
                  color="warning"
                  sx={{ ml: 1, height: 20, fontWeight: 700, fontSize: '0.65rem', borderRadius: 0.75 }}
                />
              )}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/purchase-orders/reports')}
              sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none' }}
            >
              Reports
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={openCreate}
              sx={{
                borderRadius: 1.5,
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none' },
              }}
            >
              New PO
            </Button>
          </Stack>
        </Stack>

        {/* KPI strip ──────────────────────────────────────────────── */}
        <Paper elevation={0} sx={{
          mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider',
          overflow: 'hidden',
        }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr 1fr',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(5, 1fr)',
            },
          }}>
            <KpiCell icon={<ShoppingBagIcon fontSize="small" />} label="OPEN POS"
              value={kpi.openCount} color={theme.palette.primary.main} divider />
            <KpiCell icon={<HourglassIcon fontSize="small" />} label="AWAITING RECEIPT"
              value={kpi.awaitingCount} color={theme.palette.info.main} divider />
            <KpiCell icon={<MoneyIcon fontSize="small" />} label="ON-ORDER VALUE"
              value={`₹${formatInr(kpi.onOrderValue)}`} color={theme.palette.success.main} divider />
            <KpiCell icon={<OverdueIcon fontSize="small" />} label="OVERDUE"
              value={kpi.overdueCount} color={theme.palette.error.main} divider />
            <KpiCell icon={<MonthIcon fontSize="small" />} label="THIS MONTH"
              value={`₹${formatInr(kpi.monthSpend)}`} color={theme.palette.warning.main} />
          </Box>
        </Paper>

        {/* Filter bar ─────────────────────────────────────────────── */}
        <Paper elevation={0} sx={{
          p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider',
        }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
            <TextField
              size="small"
              placeholder="Search PO # or supplier…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              sx={{ minWidth: { xs: '100%', md: 280 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <Autocomplete
              size="small"
              options={allSuppliers || []}
              getOptionLabel={(o) => o?.name || ''}
              isOptionEqualToValue={(a, b) => a?.id === b?.id}
              value={supplierFilter}
              onChange={(_, v) => setSupplierFilter(v)}
              renderInput={(params) => <TextField {...params} placeholder="Supplier" />}
              sx={{ minWidth: { xs: '100%', md: 220 } }}
            />
            <TextField
              size="small"
              type="date"
              label="From"
              InputLabelProps={{ shrink: true }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              sx={{ minWidth: { xs: '100%', md: 150 } }}
            />
            <TextField
              size="small"
              type="date"
              label="To"
              InputLabelProps={{ shrink: true }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              sx={{ minWidth: { xs: '100%', md: 150 } }}
            />
            {filtersActive && (
              <Button
                size="small"
                variant="text"
                startIcon={<FilterClearIcon fontSize="small" />}
                onClick={clearFilters}
                sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
              >
                Clear
              </Button>
            )}
          </Stack>

          {/* Chip row — StockTab-style status filter with counts */}
          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
            <FilterChip
              active={statusFilter === 'ALL'}
              onClick={() => setStatusFilter('ALL')}
              label="All"
              count={statusCounts.ALL || 0}
            />
            {STATUS_ORDER.map((s) => (
              <FilterChip
                key={s}
                active={statusFilter === s}
                onClick={() => setStatusFilter(s)}
                label={STATUS_META[s].label}
                count={statusCounts[s] || 0}
                color={theme.palette[STATUS_META[s].tone === 'default' ? 'grey' : STATUS_META[s].tone]?.main}
              />
            ))}
          </Stack>
        </Paper>

        {/* DataGrid ──────────────────────────────────────────────── */}
        <Paper elevation={0} sx={{
          borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden',
        }}>
          {isLoading ? (
            <Box sx={{ p: 2 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="rectangular" height={54} sx={{ mb: 1, borderRadius: 1 }} />
              ))}
            </Box>
          ) : (
            <DataGrid
              autoHeight
              rows={filteredOrders}
              columns={columns}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              rowHeight={54}
              onRowClick={(params) => openView(params.row)}
              initialState={{
                pagination: { paginationModel: { pageSize: 25 } },
                sorting: { sortModel: [{ field: 'orderDate', sort: 'desc' }] },
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              slots={{ toolbar: CustomToolbar }}
              slotProps={{
                toolbar: {
                  quickFilterProps: { debounceMs: 300 },
                },
              }}
              sx={{
                border: 0,
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: alpha(theme.palette.text.primary, 0.04),
                  textTransform: 'uppercase',
                  fontSize: '0.72rem',
                  letterSpacing: 0.5,
                  color: 'text.secondary',
                  fontWeight: 700,
                },
                '& .MuiDataGrid-row': { cursor: 'pointer' },
                '& .MuiDataGrid-row:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                },
                '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
                  outline: 'none',
                },
              }}
              localeText={{ noRowsLabel: filtersActive ? 'No purchase orders match your filters.' : 'No purchase orders yet.' }}
            />
          )}
        </Paper>

        {/* Row action menu — three-dot jump-off. Common actions live here so
            the row itself stays clickable-to-detail. Print, WhatsApp, Email
            all render server-agnostic client-side handoffs (window.print +
            wa.me + mailto: URLs); a formal PO PDF endpoint is a later phase. */}
        <Menu
          anchorEl={rowMenu.anchor}
          open={Boolean(rowMenu.anchor)}
          onClose={closeRowMenu}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => { openView(rowMenu.po); closeRowMenu(); }}>
            <ViewIcon fontSize="small" sx={{ mr: 1 }} /> View Details
          </MenuItem>
          {rowMenu.po?.status === 'DRAFT' && (
            <MenuItem onClick={() => { openEdit(rowMenu.po); closeRowMenu(); }}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
            </MenuItem>
          )}
          <Divider />
          {rowMenu.po?.status === 'DRAFT' && (
            <MenuItem onClick={() => { setSubmitDialog({ open: true, po: rowMenu.po }); closeRowMenu(); }}>
              <SendIcon fontSize="small" sx={{ mr: 1 }} /> Submit
            </MenuItem>
          )}
          {(rowMenu.po?.status === 'SUBMITTED' || rowMenu.po?.status === 'PARTIALLY_RECEIVED') && (
            <MenuItem onClick={() => { handleGoToReceiving(rowMenu.po.id); closeRowMenu(); }}>
              <ReceiveIcon fontSize="small" sx={{ mr: 1 }} /> Receive Items
            </MenuItem>
          )}
          {(rowMenu.po?.status === 'SUBMITTED' || rowMenu.po?.status === 'PARTIALLY_RECEIVED') && (
            <MenuItem onClick={() => { setSendDialog({ open: true, po: rowMenu.po }); closeRowMenu(); }}>
              <SendIcon fontSize="small" sx={{ mr: 1 }} /> Mark sent to supplier
            </MenuItem>
          )}
          {(rowMenu.po?.status === 'SUBMITTED' || rowMenu.po?.status === 'PARTIALLY_RECEIVED') && (
            <MenuItem onClick={() => { setReceivedDialog({ open: true, po: rowMenu.po }); closeRowMenu(); }}>
              <MarkReceivedIcon fontSize="small" sx={{ mr: 1 }} /> Mark fully received
            </MenuItem>
          )}
          <Divider />
          <MenuItem onClick={() => { handlePrintPO(rowMenu.po); closeRowMenu(); }}>
            <PrintIcon fontSize="small" sx={{ mr: 1 }} /> Print / Save as PDF
          </MenuItem>
          <MenuItem onClick={() => { handleShareWhatsApp(rowMenu.po); closeRowMenu(); }}>
            <WhatsAppIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} /> Share via WhatsApp
          </MenuItem>
          <MenuItem onClick={() => { handleShareEmail(rowMenu.po); closeRowMenu(); }}>
            <EmailIcon fontSize="small" sx={{ mr: 1 }} /> Share via Email
          </MenuItem>
          <MenuItem onClick={() => { handleDuplicatePO(rowMenu.po); closeRowMenu(); }}
            disabled={duplicating}>
            <DuplicateIcon fontSize="small" sx={{ mr: 1 }} /> Duplicate PO
          </MenuItem>
          {rowMenu.po?.status === 'DRAFT' && (
            <>
              <Divider />
              <MenuItem onClick={() => { handleDelete(rowMenu.po.id); closeRowMenu(); }}>
                <CancelIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} /> Delete draft
              </MenuItem>
            </>
          )}
          {rowMenu.po?.status && rowMenu.po.status !== 'DRAFT'
            && rowMenu.po.status !== 'RECEIVED' && rowMenu.po.status !== 'CANCELLED' && (
            <>
              <Divider />
              <MenuItem onClick={() => { setCancelDialog({ open: true, po: rowMenu.po, reason: '' }); closeRowMenu(); }}>
                <CancelIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} /> Cancel PO
              </MenuItem>
            </>
          )}
        </Menu>

        {/* Submit confirmation */}
        <Dialog open={submitDialog.open} onClose={() => setSubmitDialog({ open: false, po: null })}
          PaperProps={{ sx: { borderRadius: 2 } }}>
          <DialogTitle sx={{ p: 2.5, fontWeight: 800 }}>Submit purchase order?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              <strong>{submitDialog.po?.poNumber}</strong> will move to Submitted. Draft edits are locked
              once submitted; further changes require cancel + reissue.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1, bgcolor: alpha(theme.palette.text.primary, 0.02) }}>
            <Button onClick={() => setSubmitDialog({ open: false, po: null })}
              sx={{ textTransform: 'none', fontWeight: 600 }}>
              Cancel
            </Button>
            <Button onClick={confirmSubmit} variant="contained" disabled={actionBusy}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              Submit
            </Button>
          </DialogActions>
        </Dialog>

        {/* Cancel confirmation — reason is required (BE @NotBlank, 500-char cap) */}
        <Dialog open={cancelDialog.open}
          onClose={() => setCancelDialog({ open: false, po: null, reason: '' })}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 480 } }}>
          <DialogTitle sx={{ p: 2.5, fontWeight: 800, color: 'error.main' }}>
            Cancel this purchase order?
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>{cancelDialog.po?.poNumber}</strong> · {cancelDialog.po?.supplier?.name}
              <br />
              Cancellation is permanent and audit-logged. Include a reason so the timeline shows
              why the order was voided.
            </Typography>
            <TextField
              autoFocus
              fullWidth
              multiline
              minRows={2}
              maxRows={5}
              inputProps={{ maxLength: 500 }}
              label="Reason (required)"
              placeholder="e.g. Supplier out of stock, order duplicated, price mismatch…"
              value={cancelDialog.reason}
              onChange={(e) => setCancelDialog((s) => ({ ...s, reason: e.target.value }))}
              helperText={`${cancelDialog.reason.length}/500`}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1, bgcolor: alpha(theme.palette.text.primary, 0.02) }}>
            <Button onClick={() => setCancelDialog({ open: false, po: null, reason: '' })}
              sx={{ textTransform: 'none', fontWeight: 600 }}>
              Keep PO
            </Button>
            <Button
              onClick={confirmCancel}
              variant="contained"
              color="error"
              disabled={actionBusy || !cancelDialog.reason.trim()}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
            >
              Cancel PO
            </Button>
          </DialogActions>
        </Dialog>

        {/* "Mark sent" confirmation — Phase 1 stub, Phase 5 wires real email */}
        <Dialog open={sendDialog.open} onClose={() => setSendDialog({ open: false, po: null })}
          PaperProps={{ sx: { borderRadius: 2 } }}>
          <DialogTitle sx={{ p: 2.5, fontWeight: 800 }}>Mark as sent to supplier?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Stamps <strong>{sendDialog.po?.poNumber}</strong> with today's date as the "sent"
              timestamp. Real email dispatch arrives in Phase 5 — for now, this records the
              handover for reporting.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1, bgcolor: alpha(theme.palette.text.primary, 0.02) }}>
            <Button onClick={() => setSendDialog({ open: false, po: null })}
              sx={{ textTransform: 'none', fontWeight: 600 }}>
              Cancel
            </Button>
            <Button onClick={confirmSend} variant="contained" disabled={actionBusy}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              Mark sent
            </Button>
          </DialogActions>
        </Dialog>

        {/* Mark received — admin closeout */}
        <Dialog open={receivedDialog.open} onClose={() => setReceivedDialog({ open: false, po: null })}
          PaperProps={{ sx: { borderRadius: 2 } }}>
          <DialogTitle sx={{ p: 2.5, fontWeight: 800 }}>Mark PO as fully received?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              This is a manual close-out for <strong>{receivedDialog.po?.poNumber}</strong>. Use it
              when the receiving flow can't fully match (e.g. supplier can't deliver the last N units
              and both sides agree to close). Normal receipts should flow through Receive Goods.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1, bgcolor: alpha(theme.palette.text.primary, 0.02) }}>
            <Button onClick={() => setReceivedDialog({ open: false, po: null })}
              sx={{ textTransform: 'none', fontWeight: 600 }}>
              Cancel
            </Button>
            <Button onClick={confirmMarkReceived} variant="contained" color="success" disabled={actionBusy}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              Mark received
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete draft — retains existing modal-flavoured guard */}
        <Dialog open={deleteDialog?.open || false} onClose={cancelDelete}
          PaperProps={{ sx: { borderRadius: 2 } }}>
          <DialogTitle sx={{ p: 2.5, fontWeight: 800, color: 'error.main' }}>Delete draft PO?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Only draft POs can be deleted. Submitted or later POs must be cancelled (with a reason).
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1, bgcolor: alpha(theme.palette.text.primary, 0.02) }}>
            <Button onClick={cancelDelete} sx={{ textTransform: 'none', fontWeight: 600 }}>
              Cancel
            </Button>
            <Button onClick={confirmDelete} variant="contained" color="error"
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default PurchaseOrders;
