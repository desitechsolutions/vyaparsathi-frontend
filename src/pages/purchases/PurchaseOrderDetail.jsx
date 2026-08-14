import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Chip, IconButton, Stack, CircularProgress,
  Divider, Alert, Snackbar, Container, Table, TableBody, TableCell, TableHead,
  TableRow, TableContainer, Grid, LinearProgress, Menu, MenuItem, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CancelIcon from '@mui/icons-material/Cancel';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import HistoryIcon from '@mui/icons-material/History';
import CreateOutlinedIcon from '@mui/icons-material/CreateOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import BlockIcon from '@mui/icons-material/Block';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';

import PrintIcon from '@mui/icons-material/Print';

import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import {
  getPurchaseOrderById,
  cancelPurchaseOrder,
  sendPurchaseOrder,
  markReceivedPurchaseOrder,
  getPurchaseOrderSignedUrl,
  duplicatePurchaseOrder,
} from '../../services/api';

const STATUS_META = {
  DRAFT:              { label: 'DRAFT', tone: 'default' },
  SUBMITTED:          { label: 'SUBMITTED', tone: 'info' },
  AWAITING_RECEIPT:   { label: 'AWAITING RECEIPT', tone: 'info' },
  PARTIALLY_RECEIVED: { label: 'PARTIALLY RECEIVED', tone: 'warning' },
  RECEIVED:           { label: 'RECEIVED', tone: 'success' },
  CANCELLED:          { label: 'CANCELLED', tone: 'error' },
  PENDING:            { label: 'SUBMITTED', tone: 'info' },
  IN_PROGRESS:        { label: 'PARTIALLY RECEIVED', tone: 'warning' },
};

// Derive the user-facing status from the persisted BE status + the receiving
// progress. "SUBMITTED with 0 received" is "AWAITING RECEIPT". Partial receipts
// stay PARTIALLY_RECEIVED; RECEIVED only when every line is fully closed. This
// insulates the UI from the BE's coarser state machine.
const derivedStatus = (po) => {
  if (!po?.status) return null;
  const s = po.status;
  if (s === 'DRAFT' || s === 'CANCELLED' || s === 'RECEIVED') return s;
  const items = po.items || [];
  const totalOrdered = items.reduce((a, i) => a + Number(i.quantity || 0), 0);
  const totalReceived = items.reduce((a, i) => a + Number(i.receivedQuantity || 0), 0);
  if (totalOrdered === 0) return s;
  if (totalReceived <= 0) return 'AWAITING_RECEIPT';
  if (totalReceived >= totalOrdered) return 'RECEIVED';
  return 'PARTIALLY_RECEIVED';
};

const inr = (v) =>
  `₹${Number(v || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (v) => {
  if (!v) return '—';
  try {
    return new Date(v).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  } catch { return String(v); }
};

const fmtDateShort = (v) => {
  if (!v) return '—';
  try {
    return new Date(v).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return String(v); }
};

const KpiCell = ({ icon, label, value, color, divider }) => (
  <Box sx={{
    p: 2, display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0,
    borderRight: divider ? '1px solid' : 'none', borderColor: 'divider',
  }}>
    <Box sx={{
      display: 'inline-flex', p: 1, borderRadius: 1,
      bgcolor: alpha(color, 0.1), color,
    }}>
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={700}
        sx={{ letterSpacing: 0.6, fontSize: '0.65rem', display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={700}
        sx={{ lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

const isOpen = (status) => status === 'SUBMITTED'
  || status === 'PARTIALLY_RECEIVED'
  || status === 'PENDING' || status === 'IN_PROGRESS';

export default function PurchaseOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const printMode = searchParams.get('print') === '1';

  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', severity: 'info' });
  const [actionMenu, setActionMenu] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [cancelDialog, setCancelDialog] = useState({ open: false, reason: '' });
  const [sendDialog, setSendDialog] = useState(false);
  const [receivedDialog, setReceivedDialog] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPurchaseOrderById(id);
      setPo(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load purchase order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  // Print handoff: when opened with ?print=1 (from the list's "Print / Save as
  // PDF" action), fire the browser print dialog as soon as the PO is loaded.
  // The @media print block below hides chrome so the printed page is clean.
  useEffect(() => {
    if (printMode && po && !loading) {
      const t = setTimeout(() => window.print(), 300);
      return () => clearTimeout(t);
    }
  }, [printMode, po, loading]);

  // KPI derivations
  const kpi = useMemo(() => {
    if (!po) return { value: 0, awaiting: 0, daysToDelivery: null, receivedPct: 0 };
    const totalOrdered = (po.items || []).reduce((a, i) => a + Number(i.quantity || 0), 0);
    const totalReceived = (po.items || []).reduce((a, i) => a + Number(i.receivedQuantity || 0), 0);
    const awaiting = Math.max(0, totalOrdered - totalReceived);
    let daysToDelivery = null;
    if (po.expectedDeliveryDate) {
      const due = new Date(po.expectedDeliveryDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      daysToDelivery = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    }
    const receivedPct = totalOrdered > 0 ? Math.min(100, (totalReceived / totalOrdered) * 100) : 0;
    return { value: Number(po.totalAmount || 0), awaiting, daysToDelivery, receivedPct };
  }, [po]);

  // Activity timeline derived from persisted timestamps.
  const timeline = useMemo(() => {
    if (!po) return [];
    const events = [];
    if (po.createdAt || po.orderDate) {
      events.push({
        key: 'created',
        icon: <CreateOutlinedIcon fontSize="small" />,
        color: theme.palette.text.secondary,
        label: 'Created',
        detail: `Draft — ${(po.items || []).length} line item${(po.items || []).length === 1 ? '' : 's'}`,
        at: po.createdAt || po.orderDate,
      });
    }
    if (po.sentAt) {
      events.push({
        key: 'sent',
        icon: <MarkEmailReadIcon fontSize="small" />,
        color: theme.palette.info.main,
        label: 'Sent to supplier',
        detail: 'PO handed over to the supplier for fulfilment.',
        at: po.sentAt,
      });
    }
    if (po.status === 'SUBMITTED' || po.status === 'PARTIALLY_RECEIVED' || po.status === 'RECEIVED') {
      events.push({
        key: 'submitted',
        icon: <AssignmentOutlinedIcon fontSize="small" />,
        color: theme.palette.info.main,
        label: 'Submitted',
        detail: 'PO locked for receiving.',
        at: po.updatedAt,
      });
    }
    if (po.receivedAt) {
      events.push({
        key: 'received',
        icon: <Inventory2OutlinedIcon fontSize="small" />,
        color: theme.palette.success.main,
        label: 'Fully received',
        detail: 'All lines closed out.',
        at: po.receivedAt,
      });
    }
    if (po.cancelledAt) {
      events.push({
        key: 'cancelled',
        icon: <BlockIcon fontSize="small" />,
        color: theme.palette.error.main,
        label: 'Cancelled',
        detail: po.cancellationReason || 'No reason recorded.',
        at: po.cancelledAt,
      });
    }
    return events.sort((a, b) => new Date(a.at) - new Date(b.at));
  }, [po, theme]);

  const openActions = (e) => setActionMenu(e.currentTarget);
  const closeActions = () => setActionMenu(null);

  const runCancel = async () => {
    if (!cancelDialog.reason.trim()) return;
    setActionBusy(true);
    try {
      await cancelPurchaseOrder(po.id, cancelDialog.reason.trim());
      setSnackbar({ open: true, msg: 'Purchase order cancelled.', severity: 'success' });
      setCancelDialog({ open: false, reason: '' });
      load();
    } catch (err) {
      setSnackbar({ open: true, msg: err?.response?.data?.message || 'Cancel failed.', severity: 'error' });
    } finally {
      setActionBusy(false);
    }
  };

  const runSend = async () => {
    setActionBusy(true);
    try {
      await sendPurchaseOrder(po.id);
      setSnackbar({ open: true, msg: 'Marked as sent to supplier.', severity: 'success' });
      setSendDialog(false);
      load();
    } catch (err) {
      setSnackbar({ open: true, msg: err?.response?.data?.message || 'Send failed.', severity: 'error' });
    } finally {
      setActionBusy(false);
    }
  };

  const runMarkReceived = async () => {
    setActionBusy(true);
    try {
      await markReceivedPurchaseOrder(po.id);
      setSnackbar({ open: true, msg: 'Marked as fully received.', severity: 'success' });
      setReceivedDialog(false);
      load();
    } catch (err) {
      setSnackbar({ open: true, msg: err?.response?.data?.message || 'Mark received failed.', severity: 'error' });
    } finally {
      setActionBusy(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ pt: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  if (error || !po) {
    return (
      <Container maxWidth="xl" sx={{ pt: 4 }}>
        <Alert severity="error">{error || 'Purchase order not found.'}</Alert>
      </Container>
    );
  }

  const display = derivedStatus(po);
  const meta = STATUS_META[display] || { label: po.status, tone: 'default' };
  const canReceive = isOpen(po.status);
  const canCancel = po.status && po.status !== 'DRAFT' && po.status !== 'RECEIVED' && po.status !== 'CANCELLED';
  const igst = (po.items || []).reduce((a, it) => a + Number(it.igstAmt || 0), 0);
  const cgst = (po.items || []).reduce((a, it) => a + Number(it.cgstAmt || 0), 0);
  const sgst = (po.items || []).reduce((a, it) => a + Number(it.sgstAmt || 0), 0);
  // "Fully received & unpaid" gate for the Record Payment CTA. paymentStatus
  // comes from BE (PENDING / PARTIAL / PAID); RECEIVED alone isn't enough.
  const isFullyReceived = display === 'RECEIVED';
  const isPaid = po.paymentStatus === 'PAID';
  const showRecordPayment = isFullyReceived && !isPaid;
  const showReceiveItems = display === 'AWAITING_RECEIPT' || display === 'PARTIALLY_RECEIVED'
    || po.status === 'SUBMITTED' || po.status === 'PARTIALLY_RECEIVED';

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Print-only CSS — hides interactive chrome (back arrow, action buttons,
          three-dot menu, dialogs, snackbar) so "Print / Save as PDF" produces a
          clean document. Uses global @media print rules keyed on classNames. */}
      <style>{`
        @media print {
          @page { margin: 12mm; }
          body { background: #fff !important; }
          .po-print-hide { display: none !important; }
          .po-print-page { padding: 0 !important; }
          .MuiPaper-root { box-shadow: none !important; }
        }
      `}</style>
      <Container maxWidth="xl" sx={{ pt: 3, pb: 4 }} className="po-print-page">
        <Snackbar
          open={snackbar.open} autoHideDuration={3000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert severity={snackbar.severity} variant="filled"
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
            {snackbar.msg}
          </Alert>
        </Snackbar>

        {/* Header ─────────────────────────────────────────────────── */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <IconButton onClick={() => navigate('/purchase-orders')} size="small" className="po-print-hide">
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.4, fontFamily: 'monospace' }}>
                {po.poNumber}
              </Typography>
              <Chip
                label={meta.label}
                color={meta.tone === 'default' ? undefined : meta.tone}
                variant={meta.tone === 'default' ? 'outlined' : 'filled'}
                size="small"
                sx={{ fontWeight: 700, borderRadius: 1 }}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {po.supplier?.name || '—'} · Ordered {fmtDateShort(po.orderDate)}
              {po.expectedDeliveryDate && <> · Expected {fmtDateShort(po.expectedDeliveryDate)}</>}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} className="po-print-hide">
            <Button
              variant="outlined" size="small" startIcon={<PrintIcon fontSize="small" />}
              onClick={async () => {
                try {
                  const path = await getPurchaseOrderSignedUrl(po.id);
                  if (path) window.open(path, '_blank', 'noopener,noreferrer');
                } catch (err) {
                  setSnackbar({ open: true, msg: 'Failed to open PDF.', severity: 'error' });
                }
              }}
              sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none' }}
            >
              PDF
            </Button>
            {po.status === 'DRAFT' && (
              <Button
                variant="outlined" size="small" startIcon={<EditIcon fontSize="small" />}
                onClick={() => navigate(`/purchase-orders/${po.id}/edit`)}
                sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none' }}
              >
                Edit
              </Button>
            )}
            {/* Primary CTA: shifts based on lifecycle stage.
                 - Awaiting / partial → Receive Items (drives the receiving flow)
                 - Fully received + unpaid → Record Payment (drives AP settlement) */}
            {showReceiveItems && (
              <Button
                variant="contained" size="small" startIcon={<LocalShippingIcon fontSize="small" />}
                onClick={() => navigate(`/receivings?poId=${po.id}`)}
                sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none' }}
              >
                Receive Items
              </Button>
            )}
            {showRecordPayment && (
              <Button
                variant="contained" size="small" color="success"
                startIcon={<AttachMoneyIcon fontSize="small" />}
                onClick={() => navigate(`/supplier-payments?purchaseOrderId=${po.id}`)}
                sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none' }}
              >
                Record Payment
              </Button>
            )}
            <IconButton onClick={openActions} size="small">
              <MoreVertIcon fontSize="small" />
            </IconButton>
            {/* Three-dot menu — always renders at least Print / Share / Duplicate
                so it's never empty; state-machine actions gate on lifecycle stage. */}
            <Menu anchorEl={actionMenu} open={Boolean(actionMenu)} onClose={closeActions}>
              {(po.status === 'SUBMITTED' || po.status === 'PARTIALLY_RECEIVED') && (
                <MenuItem onClick={() => { setSendDialog(true); closeActions(); }}>
                  <SendIcon fontSize="small" sx={{ mr: 1 }} /> Mark sent to supplier
                </MenuItem>
              )}
              {canReceive && (
                <MenuItem onClick={() => { setReceivedDialog(true); closeActions(); }}>
                  <DoneAllIcon fontSize="small" sx={{ mr: 1 }} /> Mark fully received
                </MenuItem>
              )}
              <MenuItem onClick={async () => {
                closeActions();
                try {
                  const path = await getPurchaseOrderSignedUrl(po.id);
                  if (path) window.open(path, '_blank', 'noopener,noreferrer');
                } catch { setSnackbar({ open: true, msg: 'Failed to open PDF.', severity: 'error' }); }
              }}>
                <PrintIcon fontSize="small" sx={{ mr: 1 }} /> Print / Save as PDF
              </MenuItem>
              <MenuItem onClick={async () => {
                closeActions();
                let path = null;
                try { path = await getPurchaseOrderSignedUrl(po.id); } catch { /* fall through — share text without link */ }
                const abs = path ? (path.startsWith('http') ? path : `${window.location.origin}${path}`) : null;
                const text = encodeURIComponent([
                  `Purchase Order ${po.poNumber || ''}`,
                  `Supplier: ${po.supplier?.name || '—'}`,
                  `Total: ₹${Number(po.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                  abs ? `\nPDF: ${abs}` : null,
                ].filter(Boolean).join('\n'));
                window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
              }}>
                <WhatsAppIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} /> Share via WhatsApp
              </MenuItem>
              <MenuItem onClick={async () => {
                closeActions();
                let path = null;
                try { path = await getPurchaseOrderSignedUrl(po.id); } catch { /* fall through */ }
                const abs = path ? (path.startsWith('http') ? path : `${window.location.origin}${path}`) : null;
                const subject = encodeURIComponent(`Purchase Order ${po.poNumber || ''}`);
                const body = encodeURIComponent([
                  `Purchase Order ${po.poNumber || ''}`,
                  `Supplier: ${po.supplier?.name || '—'}`,
                  `Total: ₹${Number(po.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                  abs ? `\nPDF: ${abs}` : null,
                ].filter(Boolean).join('\n'));
                window.location.href = `mailto:?subject=${subject}&body=${body}`;
              }}>
                <EmailIcon fontSize="small" sx={{ mr: 1 }} /> Share via Email
              </MenuItem>
              <MenuItem onClick={async () => {
                closeActions();
                try {
                  const copy = await duplicatePurchaseOrder(po.id);
                  if (copy?.id) navigate(`/purchase-orders/${copy.id}/edit`);
                } catch (err) {
                  setSnackbar({ open: true, msg: err?.response?.data?.message || 'Duplicate failed.', severity: 'error' });
                }
              }}>
                <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} /> Duplicate PO
              </MenuItem>
              {canCancel && [
                <Divider key="cancel-divider" />,
                <MenuItem key="cancel"
                  onClick={() => { setCancelDialog({ open: true, reason: '' }); closeActions(); }}>
                  <CancelIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} /> Cancel PO
                </MenuItem>,
              ]}
            </Menu>
          </Stack>
        </Stack>

        {/* KPI strip ──────────────────────────────────────────────── */}
        <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
          }}>
            <KpiCell icon={<AttachMoneyIcon fontSize="small" />} label="VALUE"
              value={inr(kpi.value)} color={theme.palette.primary.main} divider />
            <KpiCell icon={<PendingActionsIcon fontSize="small" />} label="AWAITING"
              value={kpi.awaiting} color={theme.palette.warning.main} divider />
            <KpiCell icon={<ShoppingBagIcon fontSize="small" />} label="RECEIVED"
              value={`${Math.round(kpi.receivedPct)}%`} color={theme.palette.success.main} divider />
            <KpiCell icon={<EventBusyIcon fontSize="small" />} label="DAYS TO DELIVERY"
              value={kpi.daysToDelivery == null ? '—' : (kpi.daysToDelivery < 0 ? `${Math.abs(kpi.daysToDelivery)} overdue` : kpi.daysToDelivery)}
              color={kpi.daysToDelivery != null && kpi.daysToDelivery < 0 ? theme.palette.error.main : theme.palette.info.main} />
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {/* Left column — line items + supplier */}
          <Grid item xs={12} lg={8}>
            {/* Supplier card */}
            <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <PersonOutlineIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={800}>Supplier</Typography>
              </Stack>
              <Typography variant="h6" fontWeight={700}>{po.supplier?.name || '—'}</Typography>
              {po.supplier && (
                <Stack direction="row" spacing={2} sx={{ mt: 1, flexWrap: 'wrap' }}>
                  {po.supplier.gstin && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      GSTIN: {po.supplier.gstin}
                    </Typography>
                  )}
                  {po.supplier.phone && (
                    <Typography variant="caption" color="text.secondary">
                      {po.supplier.phone}
                    </Typography>
                  )}
                  {po.supplier.email && (
                    <Typography variant="caption" color="text.secondary">
                      {po.supplier.email}
                    </Typography>
                  )}
                </Stack>
              )}
              {po.supplier?.address && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {po.supplier.address}
                </Typography>
              )}
            </Paper>

            {/* Line items with receipt-progress bar per line */}
            <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={800}>Line Items</Typography>
                <Chip label={`${(po.items || []).length} line${(po.items || []).length === 1 ? '' : 's'}`} size="small" variant="outlined" />
              </Stack>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 900 }}>
                  <TableHead sx={{ bgcolor: alpha(theme.palette.text.primary, 0.04) }}>
                    <TableRow>
                      <TableCell sx={headerSx}>Item</TableCell>
                      <TableCell sx={headerSx}>HSN</TableCell>
                      <TableCell align="right" sx={headerSx}>Ordered</TableCell>
                      <TableCell align="right" sx={headerSx}>Received</TableCell>
                      <TableCell align="right" sx={headerSx}>Unit Cost</TableCell>
                      <TableCell align="right" sx={headerSx}>GST %</TableCell>
                      <TableCell align="right" sx={headerSx}>Line Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(po.items || []).map((it, i) => {
                      const ordered = Number(it.quantity) || 0;
                      const received = Number(it.receivedQuantity) || 0;
                      const pct = ordered > 0 ? Math.min(100, (received / ordered) * 100) : 0;
                      const complete = ordered > 0 && received >= ordered;
                      return (
                        <TableRow key={it.id || i}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>{it.name || 'Item'}</Typography>
                            {it.sku && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                {it.sku}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {it.hsnCode ? (
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{it.hsnCode}</Typography>
                            ) : (
                              <Typography variant="caption" color="text.disabled">—</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>{ordered}</Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ minWidth: 120 }}>
                            <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
                              <Typography variant="body2" fontWeight={600} color={complete ? 'success.main' : 'text.primary'}>
                                {received}/{ordered}
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={pct}
                              color={complete ? 'success' : 'primary'}
                              sx={{ mt: 0.5, height: 4, borderRadius: 1 }}
                            />
                          </TableCell>
                          <TableCell align="right">{inr(it.unitCost)}</TableCell>
                          <TableCell align="right">
                            {it.gstRate != null && Number(it.gstRate) > 0 ? `${it.gstRate}%` : '—'}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={700}>
                              {inr(it.lineTotal ?? (Number(it.unitCost) * Number(it.quantity)))}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {po.notes && (
              <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>Notes</Typography>
                <Typography variant="body2" color="text.secondary">{po.notes}</Typography>
              </Paper>
            )}
          </Grid>

          {/* Right column — summary + activity timeline */}
          <Grid item xs={12} lg={4}>
            {/* Summary */}
            <Paper variant="outlined" sx={{ borderRadius: 2, borderColor: 'divider', overflow: 'hidden', mb: 3 }}>
              <Box sx={{
                px: 2.5, py: 1.5,
                borderBottom: '1px solid', borderColor: 'divider',
                bgcolor: alpha(theme.palette.text.primary, 0.04),
              }}>
                <Typography variant="overline" fontWeight={800} sx={{ letterSpacing: 1, color: 'text.secondary' }}>
                  PO Summary
                </Typography>
              </Box>
              <Stack sx={{ p: 2.5 }} spacing={1}>
                <SummaryRow label="Subtotal (taxable)" value={inr(po.subtotal ?? 0)} />
                {Number(po.totalDiscount) > 0 && (
                  <SummaryRow label="Discount" value={`- ${inr(po.totalDiscount)}`} valueColor="error.main" />
                )}
                {igst > 0 ? (
                  <SummaryRow label="IGST" value={inr(igst)} />
                ) : (
                  Number(po.totalTax) > 0 && (
                    <>
                      <SummaryRow label="CGST" value={inr(cgst)} small />
                      <SummaryRow label="SGST" value={inr(sgst)} small />
                    </>
                  )
                )}
                {Number(po.freightCharges) > 0 && (
                  <SummaryRow label="Freight" value={`+ ${inr(po.freightCharges)}`} />
                )}
                {Number(po.roundOff) !== 0 && (
                  <SummaryRow
                    label="Round off"
                    value={`${Number(po.roundOff) > 0 ? '+' : ''}${inr(Math.abs(Number(po.roundOff) || 0))}`}
                    small
                  />
                )}
              </Stack>
              <Box sx={{
                px: 2.5, py: 2,
                borderTop: '1px solid', borderColor: 'divider',
                bgcolor: alpha(theme.palette.text.primary, 0.04),
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              }}>
                <Typography variant="subtitle1" fontWeight={900}>Grand Total</Typography>
                <Typography variant="h5" fontWeight={900} color="primary.main">
                  {inr(po.totalAmount)}
                </Typography>
              </Box>
            </Paper>

            {/* Activity timeline */}
            <Paper variant="outlined" sx={{ borderRadius: 2, borderColor: 'divider', overflow: 'hidden' }}>
              <Box sx={{
                px: 2.5, py: 1.5,
                borderBottom: '1px solid', borderColor: 'divider',
                bgcolor: alpha(theme.palette.text.primary, 0.04),
                display: 'flex', alignItems: 'center', gap: 1,
              }}>
                <HistoryIcon fontSize="small" color="action" />
                <Typography variant="overline" fontWeight={800} sx={{ letterSpacing: 1, color: 'text.secondary' }}>
                  Activity
                </Typography>
              </Box>
              <Box sx={{ p: 2.5 }}>
                {timeline.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No events recorded yet.</Typography>
                ) : (
                  <Stack spacing={2}>
                    {timeline.map((ev, idx) => (
                      <Box key={ev.key} sx={{ display: 'flex', gap: 1.5, position: 'relative' }}>
                        {/* Timeline connector */}
                        {idx < timeline.length - 1 && (
                          <Box sx={{
                            position: 'absolute', left: 15, top: 30, bottom: -14, width: 2,
                            bgcolor: 'divider',
                          }} />
                        )}
                        <Box sx={{
                          width: 32, height: 32, borderRadius: '50%',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          bgcolor: alpha(ev.color, 0.15), color: ev.color, flexShrink: 0, zIndex: 1,
                        }}>
                          {ev.icon}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
                          <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap">
                            <Typography variant="body2" fontWeight={700}>{ev.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {fmtDate(ev.at)}
                            </Typography>
                          </Stack>
                          {ev.detail && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {ev.detail}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Cancel dialog — reason required (BE @NotBlank, 500 char cap) */}
      <Dialog open={cancelDialog.open} onClose={() => setCancelDialog({ open: false, reason: '' })}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 480 } }}>
        <DialogTitle sx={{ p: 2.5, fontWeight: 800, color: 'error.main' }}>Cancel this purchase order?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>{po.poNumber}</strong> · {po.supplier?.name || 'supplier'}<br />
            Cancellation is permanent and audit-logged.
          </Typography>
          <TextField
            autoFocus fullWidth multiline minRows={2} maxRows={5}
            inputProps={{ maxLength: 500 }}
            label="Reason (required)"
            placeholder="e.g. Supplier out of stock, order duplicated…"
            value={cancelDialog.reason}
            onChange={(e) => setCancelDialog((s) => ({ ...s, reason: e.target.value }))}
            helperText={`${cancelDialog.reason.length}/500`}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, bgcolor: alpha(theme.palette.text.primary, 0.02) }}>
          <Button onClick={() => setCancelDialog({ open: false, reason: '' })}
            sx={{ textTransform: 'none', fontWeight: 600 }}>
            Keep PO
          </Button>
          <Button
            onClick={runCancel}
            variant="contained" color="error"
            disabled={actionBusy || !cancelDialog.reason.trim()}
            sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
          >
            Cancel PO
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send dialog */}
      <Dialog open={sendDialog} onClose={() => setSendDialog(false)}
        PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ p: 2.5, fontWeight: 800 }}>Mark as sent to supplier?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Stamps <strong>{po.poNumber}</strong> with today's date as the "sent" timestamp.
            Real email dispatch arrives in a later phase — this records the handover for reporting.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, bgcolor: alpha(theme.palette.text.primary, 0.02) }}>
          <Button onClick={() => setSendDialog(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button onClick={runSend} variant="contained" disabled={actionBusy}
            sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
            Mark sent
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mark received dialog */}
      <Dialog open={receivedDialog} onClose={() => setReceivedDialog(false)}
        PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ p: 2.5, fontWeight: 800 }}>Mark PO as fully received?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Manual close-out for <strong>{po.poNumber}</strong>. Use when the receiving flow can't
            fully match (supplier can't deliver the last N units, both sides agree). Normal receipts
            should flow through <strong>Receive</strong>.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, bgcolor: alpha(theme.palette.text.primary, 0.02) }}>
          <Button onClick={() => setReceivedDialog(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button onClick={runMarkReceived} variant="contained" color="success" disabled={actionBusy}
            sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
            Mark received
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

const headerSx = {
  fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem',
  letterSpacing: 0.5, color: 'text.secondary',
};

const SummaryRow = ({ label, value, valueColor, small }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
    <Typography variant={small ? 'caption' : 'body2'} color={small ? 'text.secondary' : 'text.primary'}>
      {label}
    </Typography>
    <Typography
      variant={small ? 'caption' : 'body2'}
      fontWeight={small ? 500 : 700}
      color={valueColor || 'text.primary'}
    >
      {value}
    </Typography>
  </Box>
);