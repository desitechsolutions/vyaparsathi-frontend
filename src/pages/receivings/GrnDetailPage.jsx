import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Box, Container, Paper, Stack, Typography, Chip, Button, IconButton, Divider,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Menu,
  MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Alert, Snackbar, CircularProgress, List, ListItem, ListItemText, Tooltip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  MoreVert as MoreIcon,
  DoneAll as ApproveIcon,
  CheckCircleOutline as ConfirmIcon,
  ReportGmailerrorred as TicketIcon,
  History as HistoryIcon,
  Inventory2Outlined as InventoryIcon,
  AttachMoney as MoneyIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';

import {
  fetchReceivingById,
  confirmReceiving,
  approveReceiving,
  disputeReceiving,
  resolveReceivingTicket,
  cancelReceiving,
  getReceivingSignedUrl,
  getReceivingStatusHistory,
  getReceivingThreeWayMatch,
  getReceivingApprovals,
  approveReceivingStep,
  createApInvoice,
  getApInvoiceByReceiving,
  debitNoteFromTicket,
  createReturnFromReceiving,
  listQcSamples,
  recordQcSample,
  listTemperatureLogs,
  recordTemperature,
  listReceivingBins,
  assignReceivingBin,
  removeReceivingBin,
} from '../../services/api';

const STATUS_META = {
  DRAFT:              { label: 'Draft',              tone: 'default' },
  PENDING:            { label: 'Pending',            tone: 'info' },
  PARTIALLY_RECEIVED: { label: 'Partially received', tone: 'warning' },
  COMPLETED:          { label: 'Completed',          tone: 'success' },
  CANCELLED:          { label: 'Cancelled',          tone: 'error' },
  DEFAULT:            { label: 'Pending',            tone: 'info' },
};

const TICKET_TONE = {
  OPEN:        'warning',
  IN_PROGRESS: 'info',
  RESOLVED:    'success',
  CLOSED:      'default',
};

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

const formatDateTime = (val) => {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

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

const StatusPill = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, tone: 'default' };
  return (
    <Chip
      label={meta.label}
      size="small"
      color={meta.tone === 'default' ? undefined : meta.tone}
      variant={meta.tone === 'default' ? 'outlined' : 'filled'}
      sx={{ fontWeight: 700, borderRadius: 1, letterSpacing: 0.3, fontSize: '0.72rem' }}
    />
  );
};

const GrnDetailPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const [grn, setGrn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, note: '' });
  const [approveDialog, setApproveDialog] = useState({ open: false, note: '' });
  const [ticketDialog, setTicketDialog] = useState({ open: false, note: '' });
  const [resolveDialog, setResolveDialog] = useState({ open: false, ticket: null, note: '' });
  const [cancelDialog, setCancelDialog] = useState({ open: false, reason: '' });
  const [history, setHistory] = useState([]);
  const [threeWay, setThreeWay] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [apInvoice, setApInvoice] = useState(null);
  const [invoiceDialog, setInvoiceDialog] = useState({ open: false, invoiceNo: '', invoiceDate: '', totalAmount: '', notes: '' });
  const [qcSamples, setQcSamples] = useState([]);
  const [tempLogs, setTempLogs] = useState([]);
  const [qcDialog, setQcDialog] = useState({ open: false, itemVariantId: '', batchNumber: '', sampleSize: '', defectsFound: '', aqlThresholdPct: '2.5', notes: '' });
  const [tempDialog, setTempDialog] = useState({ open: false, temperatureC: '', humidityPct: '', location: '', minC: '', maxC: '', notes: '' });

  const showMessage = (message, severity = 'info') => setSnackbar({ open: true, message, severity });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [data, hist, match, appr, inv, qc, temps] = await Promise.all([
        fetchReceivingById(id),
        getReceivingStatusHistory(id).catch(() => []),
        getReceivingThreeWayMatch(id).catch(() => null),
        getReceivingApprovals(id).catch(() => []),
        getApInvoiceByReceiving(id).catch(() => null),
        listQcSamples(id).catch(() => []),
        listTemperatureLogs(id).catch(() => []),
      ]);
      setGrn(data);
      setHistory(Array.isArray(hist) ? hist : []);
      setThreeWay(match);
      setApprovals(Array.isArray(appr) ? appr : []);
      setApInvoice(inv);
      setQcSamples(Array.isArray(qc) ? qc : []);
      setTempLogs(Array.isArray(temps) ? temps : []);
    } catch (e) {
      setError('Failed to load GRN.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleRecordQc = async () => {
    if (!qcDialog.itemVariantId || !qcDialog.sampleSize) {
      showMessage('Variant + sample size required.', 'warning');
      return;
    }
    setBusy(true);
    try {
      await recordQcSample({
        receivingId: Number(id),
        itemVariantId: Number(qcDialog.itemVariantId),
        batchNumber: qcDialog.batchNumber || null,
        sampleSize: Number(qcDialog.sampleSize),
        defectsFound: Number(qcDialog.defectsFound || 0),
        aqlThresholdPct: qcDialog.aqlThresholdPct ? Number(qcDialog.aqlThresholdPct) : null,
        notes: qcDialog.notes || null,
      });
      setQcDialog({ open: false, itemVariantId: '', batchNumber: '', sampleSize: '', defectsFound: '', aqlThresholdPct: '2.5', notes: '' });
      showMessage('QC sample recorded.', 'success');
      refresh();
    } catch (e) {
      showMessage(e?.response?.data?.message || 'QC failed', 'error');
    } finally { setBusy(false); }
  };

  const handleRecordTemp = async () => {
    if (!tempDialog.temperatureC) {
      showMessage('Temperature is required.', 'warning');
      return;
    }
    setBusy(true);
    try {
      await recordTemperature({
        receivingId: Number(id),
        temperatureC: Number(tempDialog.temperatureC),
        humidityPct: tempDialog.humidityPct ? Number(tempDialog.humidityPct) : null,
        location: tempDialog.location || null,
        minC: tempDialog.minC ? Number(tempDialog.minC) : null,
        maxC: tempDialog.maxC ? Number(tempDialog.maxC) : null,
        notes: tempDialog.notes || null,
      });
      setTempDialog({ open: false, temperatureC: '', humidityPct: '', location: '', minC: '', maxC: '', notes: '' });
      showMessage('Temperature logged.', 'success');
      refresh();
    } catch (e) {
      showMessage(e?.response?.data?.message || 'Log failed', 'error');
    } finally { setBusy(false); }
  };

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (searchParams.get('openTicket') === '1') {
      setTicketDialog({ open: true, note: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    const items = grn?.receivingItems || [];
    let received = 0, damaged = 0, rejected = 0, value = 0, overages = 0;
    items.forEach((it) => {
      const r = Number(it.receivedQty || 0);
      const d = Number(it.damagedQty || 0);
      const rj = Number(it.rejectedQty || 0);
      received += r; damaged += d; rejected += rj;
      value += (r + d + rj) * Number(it.unitCost || 0);
      if (it.isOveraged) overages += 1;
    });
    return {
      accepted: received,
      damaged, rejected, value, overages,
      lines: items.length,
    };
  }, [grn]);

  const handlePrint = async () => {
    if (!grn?.id) return;
    try {
      const path = await getReceivingSignedUrl(grn.id);
      if (path) window.open(path, '_blank', 'noopener,noreferrer');
    } catch (e) {
      showMessage('Failed to open PDF', 'error');
    }
  };

  const handleEmail = async () => {
    if (!grn?.id) return;
    try {
      const path = await getReceivingSignedUrl(grn.id);
      const abs = path ? (path.startsWith('http') ? path : `${window.location.origin}${path}`) : '';
      const subject = encodeURIComponent(`Goods Receipt Note ${grn.grNumber || ''}`);
      const body = encodeURIComponent(
        [
          `GRN ${grn.grNumber || ''}`,
          `PO: ${grn.poNumber || '—'}`,
          `Received on: ${formatDate(grn.receivedAt)}`,
          abs ? `\nPDF: ${abs}` : null,
        ].filter(Boolean).join('\n')
      );
      window.location.href = `mailto:${grn.supplier?.email || ''}?subject=${subject}&body=${body}`;
    } catch {
      showMessage('Failed to prepare email', 'error');
    }
  };

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await confirmReceiving(grn.id, confirmDialog.note || null);
      setConfirmDialog({ open: false, note: '' });
      showMessage('GRN confirmed. Stock has been committed.', 'success');
      refresh();
    } catch (e) {
      showMessage(e?.response?.data?.message || 'Confirm failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async () => {
    setBusy(true);
    try {
      await approveReceiving(grn.id, approveDialog.note || null);
      setApproveDialog({ open: false, note: '' });
      showMessage('GRN approved.', 'success');
      refresh();
    } catch (e) {
      showMessage(e?.response?.data?.message || 'Approve failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRaiseTicket = async () => {
    if (!ticketDialog.note?.trim()) {
      showMessage('Description is required.', 'warning');
      return;
    }
    setBusy(true);
    try {
      await disputeReceiving(grn.id, ticketDialog.note.trim());
      setTicketDialog({ open: false, note: '' });
      showMessage('Dispute raised.', 'success');
      refresh();
    } catch (e) {
      showMessage(e?.response?.data?.message || 'Dispute failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleApprovalStep = async (approvalId) => {
    setBusy(true);
    try {
      await approveReceivingStep(approvalId);
      showMessage('Approval step recorded.', 'success');
      refresh();
    } catch (e) {
      showMessage(e?.response?.data?.message || 'Approval failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!invoiceDialog.invoiceNo || !invoiceDialog.invoiceDate) {
      showMessage('Invoice number and date are required.', 'warning');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        supplierId: grn.supplier?.id,
        receivingId: grn.id,
        invoiceNo: invoiceDialog.invoiceNo,
        invoiceDate: invoiceDialog.invoiceDate,
        totalAmount: Number(invoiceDialog.totalAmount || 0),
        notes: invoiceDialog.notes || null,
      };
      await createApInvoice(payload);
      showMessage('AP invoice linked. 3-way match will recompute.', 'success');
    } catch (e) {
      // Server-side idempotency treats a duplicate as a 200 (existing row); a
      // 409 here means the invoice number really is taken. Surface the message
      // and still close the modal so the user isn't stuck.
      const status = e?.response?.status;
      const msg = e?.response?.data?.message
        || (status === 409
              ? 'That invoice number already exists for this supplier.'
              : 'Failed to link invoice');
      showMessage(msg, status === 409 ? 'warning' : 'error');
    } finally {
      // Always close, always refresh — a stuck-open modal is the worst UX.
      setInvoiceDialog({ open: false, invoiceNo: '', invoiceDate: '', totalAmount: '', notes: '' });
      setBusy(false);
      refresh();
    }
  };

  const handleCreateReturn = async () => {
    setBusy(true);
    try {
      const ret = await createReturnFromReceiving(grn.id);
      showMessage(`Return ${ret.returnNo || '#' + ret.id} created.`, 'success');
      refresh();
    } catch (e) {
      showMessage(e?.response?.data?.message || 'Return failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleIssueDebitNote = async (ticket) => {
    if (!ticket?.id) return;
    setBusy(true);
    try {
      const dn = await debitNoteFromTicket(ticket.id);
      showMessage(`Debit note ${dn.debitNoteNo || '#' + dn.id} issued.`, 'success');
      refresh();
    } catch (e) {
      showMessage(e?.response?.data?.message || 'Debit note failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelDialog.reason?.trim()) {
      showMessage('Cancellation reason is required.', 'warning');
      return;
    }
    setBusy(true);
    try {
      await cancelReceiving(grn.id, cancelDialog.reason.trim());
      setCancelDialog({ open: false, reason: '' });
      showMessage('GRN cancelled and stock reversed.', 'success');
      refresh();
    } catch (e) {
      showMessage(e?.response?.data?.message || 'Cancel failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!resolveDialog.ticket?.id) return;
    setBusy(true);
    try {
      await resolveReceivingTicket(resolveDialog.ticket.id, resolveDialog.note || null);
      setResolveDialog({ open: false, ticket: null, note: '' });
      showMessage('Ticket resolved.', 'success');
      refresh();
    } catch (e) {
      showMessage(e?.response?.data?.message || 'Resolve failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!grn) {
    return (
      <Container maxWidth="md" sx={{ pt: 4 }}>
        <Alert severity="error">GRN not found.</Alert>
        <Button sx={{ mt: 2 }} startIcon={<BackIcon />} onClick={() => navigate('/receivings')}>
          Back to list
        </Button>
      </Container>
    );
  }

  const isDraft = grn.status === 'DRAFT';
  const isCancelled = grn.status === 'CANCELLED';
  const isApproved = !!grn.approvedByUserId;
  const canApprove = !isDraft && !isCancelled && !isApproved
    && (grn.status === 'PENDING' || grn.status === 'PARTIALLY_RECEIVED' || grn.status === 'COMPLETED');
  const canCancel = !isDraft && !isCancelled;

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ pt: 3, pb: 4 }}>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
        </Snackbar>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* Header strip */}
        <Paper elevation={0} sx={{
          p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider',
        }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <IconButton size="small" onClick={() => navigate('/receivings')}>
                <BackIcon />
              </IconButton>
              <Box>
                <Typography variant="h5" fontWeight={800} sx={{ fontFamily: 'monospace', letterSpacing: -0.4 }}>
                  {grn.grNumber || '—'}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    PO {grn.poNumber || '—'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">·</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Received {formatDate(grn.receivedAt)}
                  </Typography>
                </Stack>
              </Box>
              <StatusPill status={grn.status} />
              {isApproved && (
                <Chip label={`Approved by ${grn.approvedByUserName || 'admin'}`}
                  size="small" color="success" variant="outlined"
                  sx={{ borderRadius: 1, fontWeight: 600 }} />
              )}
            </Stack>
            <Stack direction="row" spacing={1}>
              {isDraft && (
                <>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/receivings/${grn.id}/edit`)}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Edit draft
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<ConfirmIcon />}
                    onClick={() => setConfirmDialog({ open: true, note: '' })}
                    sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
                  >
                    Confirm receipt
                  </Button>
                </>
              )}
              {!isDraft && !isCancelled && grn.status !== 'COMPLETED' && (
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/receivings/${grn.id}/edit`)}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Record qty
                </Button>
              )}
              {canApprove && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<ApproveIcon />}
                  onClick={() => setApproveDialog({ open: true, note: '' })}
                  sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
                >
                  Approve GRN
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Print
              </Button>
              <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
                <MoreIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Paper>

        {/* KPI strip */}
        <Paper elevation={0} sx={{
          mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden',
        }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          }}>
            <KpiCell icon={<InventoryIcon fontSize="small" />} label="LINES"
              value={totals.lines} color={theme.palette.primary.main} divider />
            <KpiCell icon={<ConfirmIcon fontSize="small" />} label="ACCEPTED QTY"
              value={totals.accepted} color={theme.palette.success.main} divider />
            <KpiCell icon={<WarningIcon fontSize="small" />} label="DAMAGED / REJECTED"
              value={totals.damaged + totals.rejected} color={theme.palette.warning.main} divider />
            <KpiCell icon={<MoneyIcon fontSize="small" />} label="GRN VALUE"
              value={`₹${formatInr(totals.value)}`} color={theme.palette.info.main} />
          </Box>
        </Paper>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 3fr' }, gap: 3 }}>
          {/* Supplier card */}
          <Paper elevation={0} sx={{
            p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider',
          }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary"
              sx={{ letterSpacing: 0.6 }}>SUPPLIER</Typography>
            <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>
              {grn.supplier?.name || '—'}
            </Typography>
            {grn.supplier?.address && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {grn.supplier.address}
              </Typography>
            )}
            {grn.supplier?.gstin && (
              <Typography variant="caption" color="text.secondary">GSTIN: {grn.supplier.gstin}</Typography>
            )}
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1}>
              <Box>
                <Typography variant="caption" color="text.secondary">SUPPLIER INVOICE</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {grn.supplierInvoiceNo || '—'}
                  {grn.supplierInvoiceDate && ` · ${formatDate(grn.supplierInvoiceDate)}`}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">VEHICLE / CHALLAN</Typography>
                <Typography variant="body2">
                  {grn.vehicleNo || '—'}{grn.deliveryChallanNo && ` · ${grn.deliveryChallanNo}`}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">RECEIVED BY</Typography>
                <Typography variant="body2">{grn.receivedBy || '—'}</Typography>
              </Box>
            </Stack>
            {grn.notes && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary">NOTES</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{grn.notes}</Typography>
              </>
            )}
          </Paper>

          {/* Line table + timeline + tickets */}
          <Box>
            <Paper elevation={0} sx={{
              borderRadius: 2, border: '1px solid', borderColor: 'divider',
              overflow: 'hidden', mb: 3,
            }}>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: alpha(theme.palette.text.primary, 0.04) }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Ordered</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Received</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Damaged</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Rejected</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Batch / Serial</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(grn.receivingItems || []).map((it) => {
                      const value = (Number(it.receivedQty || 0) + Number(it.damagedQty || 0) + Number(it.rejectedQty || 0))
                        * Number(it.unitCost || 0);
                      return (
                        <TableRow key={it.id || it.purchaseOrderItemId} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>{it.name || 'Item'}</Typography>
                            {it.sku && (
                              <Typography variant="caption" color="text.secondary">{it.sku}</Typography>
                            )}
                            {it.isOveraged && (
                              <Chip label="Overage" size="small" color="warning" variant="outlined"
                                sx={{ ml: 1, fontWeight: 600, borderRadius: 1, height: 20 }} />
                            )}
                          </TableCell>
                          <TableCell align="right">{it.expectedQty ?? '—'}</TableCell>
                          <TableCell align="right">{it.receivedQty ?? 0}</TableCell>
                          <TableCell align="right">{it.damagedQty ?? 0}</TableCell>
                          <TableCell align="right">{it.rejectedQty ?? 0}</TableCell>
                          <TableCell>
                            {it.batchNumber && (
                              <Typography variant="caption" display="block">Batch: {it.batchNumber}</Typography>
                            )}
                            {it.expiryDate && (
                              <Typography variant="caption" display="block">Exp: {formatDate(it.expiryDate)}</Typography>
                            )}
                            {it.serialNumber && (
                              <Typography variant="caption" display="block">S/N: {it.serialNumber}</Typography>
                            )}
                            {!it.batchNumber && !it.serialNumber && '—'}
                          </TableCell>
                          <TableCell align="right">₹{formatInr(value)}</TableCell>
                        </TableRow>
                      );
                    })}
                    {(!grn.receivingItems || grn.receivingItems.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          No line items recorded on this GRN yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {threeWay && (
              <Paper elevation={0} sx={{
                p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3,
              }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={800}>3-way match</Typography>
                  <Chip
                    label={threeWay.matchStatus}
                    color={threeWay.matchStatus === 'MATCHED' ? 'success'
                      : threeWay.matchStatus === 'VARIANCE' ? 'warning' : 'default'}
                    size="small" sx={{ fontWeight: 700, borderRadius: 1 }}
                  />
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <Chip label={`PO: ₹${formatInr(threeWay.poTotal)}`} variant="outlined" />
                  <Chip label={`GRN: ₹${formatInr(threeWay.grnTotal)}`} variant="outlined" />
                  <Chip label={`Invoice: ₹${formatInr(threeWay.invoiceTotal)}`} variant="outlined" />
                  <Chip label={`Variance: ₹${formatInr(threeWay.totalVariance)}`}
                    color={Math.abs(Number(threeWay.totalVariance || 0)) > 0 ? 'warning' : 'default'} />
                </Stack>
                {!apInvoice && (
                  <Button size="small" variant="outlined" sx={{ mt: 2, textTransform: 'none', fontWeight: 700 }}
                    onClick={() => setInvoiceDialog((s) => ({ ...s, open: true }))}>
                    Link supplier invoice
                  </Button>
                )}
                {apInvoice && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Invoice {apInvoice.invoiceNo} · {formatDate(apInvoice.invoiceDate)}
                    {apInvoice.dueDate && ` · due ${formatDate(apInvoice.dueDate)}`}
                  </Typography>
                )}
                {grn.costVarianceFlag && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Cost variance detected on one or more lines (&gt; 5% off PO price).
                  </Alert>
                )}
              </Paper>
            )}

            {approvals.length > 0 && (
              <Paper elevation={0} sx={{
                p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3,
              }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>Approvals</Typography>
                <List dense disablePadding>
                  {approvals.map((a) => (
                    <ListItem key={a.id} disableGutters
                      secondaryAction={a.status === 'PENDING' && (
                        <Button size="small" variant="contained" color="success"
                          onClick={() => handleApprovalStep(a.id)} disabled={busy}
                          sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
                          Approve L{a.level}
                        </Button>
                      )}>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip label={`L${a.level}`} size="small"
                              sx={{ fontWeight: 700, borderRadius: 1, height: 20 }} />
                            <Chip label={a.status} size="small"
                              color={a.status === 'APPROVED' ? 'success' : 'warning'}
                              sx={{ fontWeight: 700, borderRadius: 1, height: 20, fontSize: '0.65rem' }} />
                            <Typography variant="body2">{a.approverRole || '—'}</Typography>
                          </Stack>
                        }
                        secondary={a.approvedAt
                          ? `${formatDateTime(a.approvedAt)}${a.note ? ' — ' + a.note : ''}`
                          : (a.thresholdMin ? `Requires total > ₹${formatInr(a.thresholdMin)}` : 'Awaiting approval')}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            {/* QC + Temperature side-by-side */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={800}>QC samples</Typography>
                  <Button size="small" variant="outlined"
                    onClick={() => setQcDialog({ ...qcDialog, open: true,
                      itemVariantId: (grn.receivingItems || [])[0]?.itemVariantId || '' })}
                    sx={{ textTransform: 'none', fontWeight: 700 }}>
                    Record sample
                  </Button>
                </Stack>
                {qcSamples.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No QC samples recorded.</Typography>
                ) : (
                  <Stack spacing={1}>
                    {qcSamples.map((s) => (
                      <Stack key={s.id} direction="row" alignItems="center" spacing={1}>
                        <Chip label={s.verdict} size="small"
                          color={s.verdict === 'PASS' ? 'success' : s.verdict === 'FAIL' ? 'error' : 'warning'}
                          sx={{ fontWeight: 700, borderRadius: 1, height: 20, fontSize: '0.65rem' }} />
                        <Typography variant="body2">
                          #{s.itemVariantId} · {s.defectsFound}/{s.sampleSize} defective
                          {s.aqlPct != null && ` (AQL ${s.aqlPct}%)`}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Paper>

              <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={800}>Temperature log</Typography>
                  <Button size="small" variant="outlined"
                    onClick={() => setTempDialog({ ...tempDialog, open: true })}
                    sx={{ textTransform: 'none', fontWeight: 700 }}>
                    Record reading
                  </Button>
                </Stack>
                {tempLogs.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No temperature readings.</Typography>
                ) : (
                  <Stack spacing={1}>
                    {tempLogs.map((t) => (
                      <Stack key={t.id} direction="row" alignItems="center" spacing={1}>
                        <Chip label={t.withinSpec ? 'IN SPEC' : 'OUT OF SPEC'} size="small"
                          color={t.withinSpec ? 'success' : 'error'}
                          sx={{ fontWeight: 700, borderRadius: 1, height: 20, fontSize: '0.65rem' }} />
                        <Typography variant="body2">
                          {Number(t.temperatureC)}°C{t.humidityPct != null && ` · ${Number(t.humidityPct)}% RH`}
                          {t.location && ` · ${t.location}`}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Box>

            <Paper elevation={0} sx={{
              p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3,
            }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <HistoryIcon fontSize="small" color="action" />
                <Typography variant="subtitle2" fontWeight={800}>Activity timeline</Typography>
              </Stack>
              <List dense disablePadding>
                <ListItem disableGutters>
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight={600}>Created</Typography>}
                    secondary={`${grn.receivedBy || 'System'} · ${formatDateTime(grn.receivedAt)}`}
                  />
                </ListItem>
                {history.map((h) => (
                  <ListItem key={h.id} disableGutters>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={600}>
                          {h.fromStatus ? `${h.fromStatus} → ${h.toStatus}` : h.toStatus}
                        </Typography>
                      }
                      secondary={`${h.changedBy || 'system'} · ${formatDateTime(h.changedAt)}${h.note ? ` — ${h.note}` : ''}`}
                    />
                  </ListItem>
                ))}
                {history.length === 0 && grn.approvedAt && (
                  <ListItem disableGutters>
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight={600}>Approved</Typography>}
                      secondary={`${grn.approvedByUserName || 'admin'} · ${formatDateTime(grn.approvedAt)}${grn.approvalNote ? ` — ${grn.approvalNote}` : ''}`}
                    />
                  </ListItem>
                )}
                {grn.cancelledAt && (
                  <ListItem disableGutters>
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight={600} color="error">Cancelled</Typography>}
                      secondary={`${formatDateTime(grn.cancelledAt)}${grn.cancellationReason ? ` — ${grn.cancellationReason}` : ''}`}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>

            {/* Tickets */}
            <Paper elevation={0} sx={{
              p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider',
            }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <TicketIcon fontSize="small" color="warning" />
                  <Typography variant="subtitle2" fontWeight={800}>Dispute tickets</Typography>
                </Stack>
                <Button size="small" variant="outlined"
                  onClick={() => setTicketDialog({ open: true, note: '' })}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Raise ticket
                </Button>
              </Stack>
              {(grn.tickets && grn.tickets.length > 0) ? (
                <List dense disablePadding>
                  {grn.tickets.map((t) => (
                    <ListItem key={t.id} disableGutters
                      secondaryAction={
                        !['RESOLVED', 'CLOSED'].includes(t.status) && (
                          <Stack direction="row" spacing={1}>
                            {!t.debitNoteId && (
                              <Button size="small" variant="outlined" color="error"
                                onClick={() => handleIssueDebitNote(t)} disabled={busy}
                                sx={{ textTransform: 'none', fontWeight: 700 }}>
                                Debit note
                              </Button>
                            )}
                            <Button size="small" variant="text"
                              onClick={() => setResolveDialog({ open: true, ticket: t, note: '' })}
                              sx={{ textTransform: 'none', fontWeight: 700 }}
                            >
                              Resolve
                            </Button>
                          </Stack>
                        )
                      }
                    >
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip label={t.status || 'OPEN'} size="small"
                              color={TICKET_TONE[t.status] || 'default'}
                              variant="filled"
                              sx={{ fontWeight: 700, borderRadius: 1, height: 20, fontSize: '0.65rem' }} />
                            <Typography variant="body2" fontWeight={700}>{t.reason || 'Dispute'}</Typography>
                          </Stack>
                        }
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.secondary">
                              {t.description}
                            </Typography>
                            <Typography component="span" variant="caption" display="block" color="text.secondary">
                              Raised by {t.raisedBy || '—'} · {formatDateTime(t.raisedAt)}
                              {t.resolvedAt && ` · Resolved ${formatDateTime(t.resolvedAt)}`}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No disputes recorded on this GRN.
                </Typography>
              )}
            </Paper>
          </Box>
        </Box>

        {/* Header three-dot menu */}
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
          <MenuItem onClick={() => { handleEmail(); setMenuAnchor(null); }}>
            <EmailIcon fontSize="small" sx={{ mr: 1 }} /> Email GRN
          </MenuItem>
          <MenuItem onClick={() => { setTicketDialog({ open: true, note: '' }); setMenuAnchor(null); }}>
            <TicketIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }} /> Raise dispute
          </MenuItem>
          {canCancel && (
            <MenuItem onClick={() => { setCancelDialog({ open: true, reason: '' }); setMenuAnchor(null); }}>
              <WarningIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} /> Cancel GRN
            </MenuItem>
          )}
          {!isDraft && !isCancelled && (
            <MenuItem onClick={() => { handleCreateReturn(); setMenuAnchor(null); }} disabled={busy}>
              <TicketIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }} /> Return to supplier
            </MenuItem>
          )}
        </Menu>

        <Dialog open={qcDialog.open} onClose={() => setQcDialog({ ...qcDialog, open: false })}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 480 } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>Record QC sample</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField fullWidth type="number" label="Item variant ID"
                value={qcDialog.itemVariantId}
                onChange={(e) => setQcDialog((s) => ({ ...s, itemVariantId: e.target.value }))} />
              <TextField fullWidth label="Batch number (optional)"
                value={qcDialog.batchNumber}
                onChange={(e) => setQcDialog((s) => ({ ...s, batchNumber: e.target.value }))} />
              <Stack direction="row" spacing={2}>
                <TextField fullWidth type="number" label="Sample size"
                  value={qcDialog.sampleSize}
                  onChange={(e) => setQcDialog((s) => ({ ...s, sampleSize: e.target.value }))} />
                <TextField fullWidth type="number" label="Defects found"
                  value={qcDialog.defectsFound}
                  onChange={(e) => setQcDialog((s) => ({ ...s, defectsFound: e.target.value }))} />
              </Stack>
              <TextField fullWidth type="number" label="AQL threshold % (pass ≤)"
                value={qcDialog.aqlThresholdPct}
                onChange={(e) => setQcDialog((s) => ({ ...s, aqlThresholdPct: e.target.value }))} />
              <TextField fullWidth multiline minRows={2} label="Notes"
                value={qcDialog.notes}
                onChange={(e) => setQcDialog((s) => ({ ...s, notes: e.target.value }))} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setQcDialog({ ...qcDialog, open: false })} sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button onClick={handleRecordQc} variant="contained" disabled={busy}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              {busy ? 'Saving…' : 'Record'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={tempDialog.open} onClose={() => setTempDialog({ ...tempDialog, open: false })}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 480 } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>Record temperature reading</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Stack direction="row" spacing={2}>
                <TextField fullWidth type="number" label="Temperature (°C)"
                  value={tempDialog.temperatureC}
                  onChange={(e) => setTempDialog((s) => ({ ...s, temperatureC: e.target.value }))} />
                <TextField fullWidth type="number" label="Humidity (%)"
                  value={tempDialog.humidityPct}
                  onChange={(e) => setTempDialog((s) => ({ ...s, humidityPct: e.target.value }))} />
              </Stack>
              <TextField fullWidth label="Location"
                placeholder="e.g. Dock 2 · Cold storage"
                value={tempDialog.location}
                onChange={(e) => setTempDialog((s) => ({ ...s, location: e.target.value }))} />
              <Stack direction="row" spacing={2}>
                <TextField fullWidth type="number" label="Spec min (°C)"
                  value={tempDialog.minC}
                  onChange={(e) => setTempDialog((s) => ({ ...s, minC: e.target.value }))} />
                <TextField fullWidth type="number" label="Spec max (°C)"
                  value={tempDialog.maxC}
                  onChange={(e) => setTempDialog((s) => ({ ...s, maxC: e.target.value }))} />
              </Stack>
              <TextField fullWidth multiline minRows={2} label="Notes"
                value={tempDialog.notes}
                onChange={(e) => setTempDialog((s) => ({ ...s, notes: e.target.value }))} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setTempDialog({ ...tempDialog, open: false })} sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button onClick={handleRecordTemp} variant="contained" disabled={busy}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              {busy ? 'Saving…' : 'Log'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={invoiceDialog.open}
          onClose={() => setInvoiceDialog({ open: false, invoiceNo: '', invoiceDate: '', totalAmount: '', notes: '' })}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 480 } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>Link supplier invoice to GRN</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Feeds the 3-way match. Enter the invoice number, date, and total exactly as the supplier billed you.
            </Typography>
            {totals.accepted === 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                This GRN has no received quantities yet. Linking an invoice will show a
                negative variance (invoice value vs zero GRN value). Record the goods on this
                GRN first if you actually received them — otherwise the 3-way match will
                flag it as VARIANCE, which is correct: don't pay before the goods arrive.
              </Alert>
            )}
            <Stack spacing={2}>
              <TextField autoFocus fullWidth label="Invoice number"
                value={invoiceDialog.invoiceNo}
                onChange={(e) => setInvoiceDialog((s) => ({ ...s, invoiceNo: e.target.value }))} />
              <TextField fullWidth type="date" label="Invoice date"
                InputLabelProps={{ shrink: true }}
                value={invoiceDialog.invoiceDate}
                onChange={(e) => setInvoiceDialog((s) => ({ ...s, invoiceDate: e.target.value }))} />
              <TextField fullWidth type="number" label="Total amount (₹)"
                value={invoiceDialog.totalAmount}
                onChange={(e) => setInvoiceDialog((s) => ({ ...s, totalAmount: e.target.value }))} />
              <TextField fullWidth multiline minRows={2} label="Notes (optional)"
                value={invoiceDialog.notes}
                onChange={(e) => setInvoiceDialog((s) => ({ ...s, notes: e.target.value }))} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setInvoiceDialog({ open: false, invoiceNo: '', invoiceDate: '', totalAmount: '', notes: '' })} sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button onClick={handleCreateInvoice} variant="contained" disabled={busy}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              {busy ? 'Saving…' : 'Link invoice'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={cancelDialog.open}
          onClose={() => setCancelDialog({ open: false, reason: '' })}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 480 } }}>
          <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>Cancel this GRN?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Cancelling <strong>{grn.grNumber}</strong> reverses all stock movements
              committed by this GRN and re-opens the PO for another receipt.
              The reason is stamped on the audit log and shown to the supplier.
            </Typography>
            <TextField autoFocus fullWidth multiline minRows={3} label="Cancellation reason (required)"
              value={cancelDialog.reason}
              onChange={(e) => setCancelDialog((s) => ({ ...s, reason: e.target.value }))} />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCancelDialog({ open: false, reason: '' })} sx={{ textTransform: 'none' }}>Keep GRN</Button>
            <Button onClick={handleCancel} color="error" variant="contained" disabled={busy || !cancelDialog.reason.trim()}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              {busy ? 'Working…' : 'Cancel GRN'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Confirm dialog */}
        <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, note: '' })}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 420 } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>Confirm receipt?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Confirming commits stock and locks the line quantities. Add an optional note for the audit trail.
            </Typography>
            <TextField autoFocus fullWidth multiline minRows={2} label="Note (optional)"
              value={confirmDialog.note}
              onChange={(e) => setConfirmDialog((s) => ({ ...s, note: e.target.value }))} />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setConfirmDialog({ open: false, note: '' })} sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button onClick={handleConfirm} variant="contained" disabled={busy}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              {busy ? 'Working…' : 'Confirm'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Approve dialog */}
        <Dialog open={approveDialog.open} onClose={() => setApproveDialog({ open: false, note: '' })}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 420 } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>Approve GRN?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Approval stamps your user + timestamp on the GRN. Use the note for QC observations.
            </Typography>
            <TextField autoFocus fullWidth multiline minRows={2} label="Approval note (optional)"
              value={approveDialog.note}
              onChange={(e) => setApproveDialog((s) => ({ ...s, note: e.target.value }))} />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setApproveDialog({ open: false, note: '' })} sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button onClick={handleApprove} color="success" variant="contained" disabled={busy}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              {busy ? 'Working…' : 'Approve'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Ticket dialog */}
        <Dialog open={ticketDialog.open} onClose={() => setTicketDialog({ open: false, note: '' })}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 480 } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>Raise dispute on this GRN</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Describe the mismatch, damage, or short shipment. The supplier reference stays linked to this GRN.
            </Typography>
            <TextField autoFocus fullWidth multiline minRows={3} label="Description (required)"
              value={ticketDialog.note}
              onChange={(e) => setTicketDialog((s) => ({ ...s, note: e.target.value }))} />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setTicketDialog({ open: false, note: '' })} sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button onClick={handleRaiseTicket} color="warning" variant="contained" disabled={busy}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              {busy ? 'Working…' : 'Raise ticket'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Resolve ticket dialog */}
        <Dialog open={resolveDialog.open}
          onClose={() => setResolveDialog({ open: false, ticket: null, note: '' })}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 480 } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>
            Resolve ticket
            {resolveDialog.ticket?.reason && ` — ${resolveDialog.ticket.reason}`}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Log a resolution note explaining what happened (replacement, refund, closure).
            </Typography>
            <TextField autoFocus fullWidth multiline minRows={3} label="Resolution note"
              value={resolveDialog.note}
              onChange={(e) => setResolveDialog((s) => ({ ...s, note: e.target.value }))} />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setResolveDialog({ open: false, ticket: null, note: '' })}
              sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button onClick={handleResolveTicket} color="success" variant="contained" disabled={busy}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              {busy ? 'Working…' : 'Resolve'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default GrnDetailPage;
