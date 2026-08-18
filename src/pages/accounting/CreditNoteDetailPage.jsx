import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Box, Container, Paper, Stack, Typography, Chip, Button, IconButton,
  Alert, Snackbar, CircularProgress, Divider, Table, TableBody, TableCell,
  TableHead, TableRow, Tooltip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
  Cancel as CancelIcon,
  PriceChange as ApplyIcon,
  AccountBalanceWallet as RefundIcon,
  Receipt as ReceiptIcon,
  CheckCircleOutline as AppliedIcon,
  HourglassBottom as HourglassIcon,
  Undo as ReverseIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';

import {
  getCreditNoteById, getCreditNoteSignedUrl, downloadReceiptPdf,
  listCreditNoteAllocations, reverseCreditNoteAllocation, cancelCreditNote,
  listCreditNotes,
} from '../../services/api';
import ApplyCreditModal from './ApplyCreditModal';
import RecordRefundModal from './RecordRefundModal';
import EInvoiceActionBar from '../../components/enterprise/EInvoiceActionBar';

const formatInr = (v) =>
  Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

const formatDate = (v) => {
  if (!v) return '—';
  try {
    return new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return '—'; }
};

const REASON_LABELS = {
  SALES_RETURN:       'Sales Return',
  POST_SALE_DISCOUNT: 'Post-sale Discount',
  DEFECTIVE_GOODS:    'Defective Goods',
  INVOICE_CORRECTION: 'Invoice Correction',
  OTHER:              'Other',
};

const STATUS_META = {
  ISSUED:            { label: 'Open',              tone: 'info' },
  PARTIALLY_APPLIED: { label: 'Partially applied', tone: 'warning' },
  FULLY_APPLIED:     { label: 'Closed',            tone: 'success' },
  CANCELLED:         { label: 'Cancelled',         tone: 'error' },
};

const KpiCell = ({ icon, label, value, color, divider }) => (
  <Box sx={{
    p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
    borderRight: divider ? '1px solid' : 'none', borderColor: 'divider', minWidth: 0,
  }}>
    <Box sx={{
      display: 'inline-flex', p: 1, borderRadius: 1,
      bgcolor: alpha(color, 0.1), color,
      alignItems: 'center', justifyContent: 'center',
    }}>{icon}</Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={700}
        sx={{ letterSpacing: 0.6, fontSize: '0.65rem', display: 'block' }}>{label}</Typography>
      <Typography variant="h6" fontWeight={700}
        sx={{ lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

const CreditNoteDetailPage = () => {
  const { id } = useParams();
  const theme = useTheme();
  const navigate = useNavigate();

  const [cn, setCn] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const notify = (message, severity = 'info') => setSnackbar({ open: true, message, severity });

  /**
   * Two-tier hydration. First try the V101 detail endpoint; if it isn't
   * deployed yet or fails for any reason, fall back to scanning the list
   * endpoint (which existed before V101 and always works). Allocations are
   * a bonus — never gate the page on them.
   */
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    let detail = null;
    let detailErr = null;

    try {
      detail = await getCreditNoteById(id);
    } catch (e) { detailErr = e; }

    // Fallback for pre-V101 backends: hydrate from the list.
    if (!detail || !detail.id) {
      try {
        const page = await listCreditNotes(0, 500);
        const payload = page?.data ?? page;
        const rows = payload?.content ?? [];
        const found = rows.find((r) => String(r.id) === String(id));
        if (found) {
          // Shape the list row like the detail endpoint's map for UI parity.
          detail = {
            ...found,
            invoiceNo: found.invoiceNo || found.sale?.invoiceNo,
            invoiceDate: found.invoiceDate || found.sale?.date,
            outstanding: Math.max(
              Number(found.totalAmount || 0) - Number(found.appliedAmount || 0), 0),
          };
        }
      } catch { /* swallow — keep detailErr */ }
    }

    // Allocations best-effort; never fatal.
    let allocs = [];
    try { allocs = await listCreditNoteAllocations(id); }
    catch { allocs = []; }

    if (!detail || !detail.id) {
      const msg = detailErr?.response?.status === 404
        ? 'Credit note not found — it may have been cancelled or deleted.'
        : detailErr?.response?.data?.message
          || detailErr?.message
          || 'Failed to load credit note. The detail endpoint may not be deployed yet — restart the backend after V101 lands.';
      setLoadError(msg);
    } else {
      setCn(detail);
      setAllocations(Array.isArray(allocs) ? allocs : []);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const remaining = useMemo(() => {
    if (!cn) return 0;
    return Math.max(Number(cn.totalAmount || 0) - Number(cn.appliedAmount || 0), 0);
  }, [cn]);

  const canApply = cn && cn.status !== 'CANCELLED' && !cn.refunded && remaining > 0;
  const canRefund = cn && cn.status !== 'CANCELLED' && !cn.refunded && remaining > 0;
  const canCancel = cn && cn.status !== 'CANCELLED' && Number(cn.appliedAmount || 0) === 0;

  const handleDownload = async () => {
    try {
      const path = await getCreditNoteSignedUrl(cn.id);
      await downloadReceiptPdf(path,
        `credit_note_${(cn.creditNoteNo || cn.id).toString().replace(/[\/\\]/g, '_')}.pdf`);
    } catch { notify('Failed to download PDF', 'error'); }
  };

  const handleReverse = async (allocId) => {
    const note = window.prompt('Reason for reversing this allocation?', '');
    if (note == null) return;
    try {
      await reverseCreditNoteAllocation(allocId, note);
      notify('Allocation reversed.', 'info');
      load();
    } catch (e) { notify(e?.response?.data?.message || 'Reverse failed', 'error'); }
  };

  const handleCancel = async () => {
    const note = window.prompt('Reason for cancellation?', '');
    if (note == null) return;
    try {
      await cancelCreditNote(cn.id, note);
      notify('Credit note cancelled.', 'info');
      load();
    } catch (e) { notify(e?.response?.data?.message || 'Cancel failed', 'error'); }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!cn) {
    return (
      <Box sx={{ p: 4 }}>
        <Container maxWidth="md">
          <Alert severity="error" sx={{ mb: 2 }}>
            {loadError || 'Credit note not found.'}
          </Alert>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<BackIcon />}
              onClick={() => navigate('/credit-notes')}>
              Back to list
            </Button>
            <Button variant="outlined" onClick={load}>
              Retry
            </Button>
          </Stack>
        </Container>
      </Box>
    );
  }

  const meta = STATUS_META[cn.status] || { label: cn.status, tone: 'default' };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ pt: 3, pb: 4 }}>
        <Snackbar open={snackbar.open} autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
        </Snackbar>

        {/* Header */}
        <Paper elevation={0} sx={{
          mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', p: 3,
        }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <IconButton onClick={() => navigate('/credit-notes')} size="small"><BackIcon /></IconButton>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="h5" fontWeight={800}
                    sx={{ fontFamily: 'monospace', letterSpacing: -0.4 }}>
                    {cn.creditNoteNo}
                  </Typography>
                  <Chip size="small" label={meta.label}
                    color={meta.tone === 'default' ? undefined : meta.tone}
                    variant={meta.tone === 'default' ? 'outlined' : 'filled'}
                    sx={{ fontWeight: 700 }} />
                  {cn.refunded && (
                    <Chip size="small" label="REFUNDED" color="info" variant="outlined"
                      sx={{ fontWeight: 700 }} />
                  )}
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {REASON_LABELS[cn.reasonCode] || cn.reason || '—'}
                  {cn.invoiceNo && (
                    <> {' · '}Against invoice{' '}
                      <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                        {cn.invoiceNo}
                      </Box>
                    </>
                  )}
                  {' · '}Issued {formatDate(cn.creditNoteDate)}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {canApply && (
                <Button variant="contained" color="success" startIcon={<ApplyIcon />}
                  onClick={() => setApplyOpen(true)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                  Apply to invoices
                </Button>
              )}
              {canRefund && (
                <Button variant="outlined" color="warning" startIcon={<RefundIcon />}
                  onClick={() => setRefundOpen(true)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                  Record refund
                </Button>
              )}
              <Button variant="outlined" startIcon={<DownloadIcon />}
                onClick={handleDownload} sx={{ textTransform: 'none', fontWeight: 700 }}>
                PDF
              </Button>
              {canCancel && (
                <Button variant="outlined" color="error" startIcon={<CancelIcon />}
                  onClick={handleCancel} sx={{ textTransform: 'none', fontWeight: 700 }}>
                  Cancel
                </Button>
              )}
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
            <KpiCell icon={<ReceiptIcon fontSize="small" />} label="TOTAL CREDIT"
              value={`INR ${formatInr(cn.totalAmount)}`} color={theme.palette.primary.main} divider />
            <KpiCell icon={<AppliedIcon fontSize="small" />} label="AMOUNT USED"
              value={`INR ${formatInr(cn.appliedAmount)}`} color={theme.palette.success.main} divider />
            <KpiCell icon={<HourglassIcon fontSize="small" />} label="REMAINING BALANCE"
              value={`INR ${formatInr(remaining)}`} color={theme.palette.warning.main} divider />
            <KpiCell icon={<VerifiedIcon fontSize="small" />} label="REASON"
              value={REASON_LABELS[cn.reasonCode] || cn.reason || '—'} color={theme.palette.info.main} />
          </Box>
        </Paper>

        {/* Parties + doc info + statutory */}
        <Paper elevation={0} sx={{
          mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', p: 3,
        }}>
          <Stack direction={{ xs: 'column', md: 'row' }} divider={<Divider orientation="vertical" flexItem />} spacing={3}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}
                sx={{ letterSpacing: 0.6, textTransform: 'uppercase' }}>Customer</Typography>
              <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>
                {cn.customer?.name || '—'}
              </Typography>
              {cn.customer?.gstin && (
                <Typography variant="caption" color="text.secondary" display="block">
                  GSTIN: {cn.customer.gstin}
                </Typography>
              )}
              {cn.customer?.phone && (
                <Typography variant="caption" color="text.secondary" display="block">
                  {cn.customer.phone}
                </Typography>
              )}
              {cn.customer?.email && (
                <Typography variant="caption" color="text.secondary" display="block">
                  {cn.customer.email}
                </Typography>
              )}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}
                sx={{ letterSpacing: 0.6, textTransform: 'uppercase' }}>Original Invoice</Typography>
              <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5, fontFamily: 'monospace' }}>
                {cn.invoiceNo || '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Invoice date: {formatDate(cn.invoiceDate)}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}
                sx={{ letterSpacing: 0.6, textTransform: 'uppercase' }}>Tax breakdown</Typography>
              <Table size="small" sx={{ mt: 0.5, '& td': { border: 0, py: 0.25, px: 0 } }}>
                <TableBody>
                  <TableRow>
                    <TableCell><Typography variant="caption">Taxable</Typography></TableCell>
                    <TableCell align="right"><Typography variant="caption">INR {formatInr(cn.taxableAmount)}</Typography></TableCell>
                  </TableRow>
                  {Number(cn.cgstAmount || 0) > 0 && (
                    <TableRow>
                      <TableCell><Typography variant="caption">CGST</Typography></TableCell>
                      <TableCell align="right"><Typography variant="caption">INR {formatInr(cn.cgstAmount)}</Typography></TableCell>
                    </TableRow>
                  )}
                  {Number(cn.sgstAmount || 0) > 0 && (
                    <TableRow>
                      <TableCell><Typography variant="caption">SGST</Typography></TableCell>
                      <TableCell align="right"><Typography variant="caption">INR {formatInr(cn.sgstAmount)}</Typography></TableCell>
                    </TableRow>
                  )}
                  {Number(cn.igstAmount || 0) > 0 && (
                    <TableRow>
                      <TableCell><Typography variant="caption">IGST</Typography></TableCell>
                      <TableCell align="right"><Typography variant="caption">INR {formatInr(cn.igstAmount)}</Typography></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Stack>
          {cn.restockItems && (
            <Chip size="small" label="Items restocked" color="success" variant="outlined"
              sx={{ mt: 2, fontWeight: 700 }} />
          )}
          {cn.notes && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}
                sx={{ letterSpacing: 0.6, textTransform: 'uppercase' }}>Notes</Typography>
              <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{cn.notes}</Typography>
            </Box>
          )}
        </Paper>

        {/* Allocations table */}
        <Paper elevation={0} sx={{
          mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden',
        }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between"
            sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight={800}>
              Allocation history
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {allocations.length} event{allocations.length === 1 ? '' : 's'}
            </Typography>
          </Stack>
          {allocations.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="body2">
                No allocations yet. Apply this credit to an outstanding invoice or record a refund.
              </Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Ref</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>By</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Note</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allocations.map((a) => (
                  <TableRow key={a.id}
                    sx={{ opacity: a.reversed ? 0.55 : 1, textDecoration: a.reversed ? 'line-through' : 'none' }}>
                    <TableCell>{formatDate(a.allocatedAt)}</TableCell>
                    <TableCell>
                      <Chip size="small" label={a.allocationType}
                        color={a.allocationType === 'INVOICE' ? 'primary' : 'warning'}
                        variant="outlined" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>
                      {a.allocationType === 'INVOICE'
                        ? (a.saleId ? `Sale #${a.saleId}` : '—')
                        : (a.paymentMode ? `${a.paymentMode}${a.paymentReference ? ' · ' + a.paymentReference : ''}` : '—')}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      INR {formatInr(a.allocatedAmount)}
                    </TableCell>
                    <TableCell>{a.allocatedBy || '—'}</TableCell>
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Tooltip title={a.note || ''}>
                        <Typography variant="caption" noWrap
                          sx={{ display: 'block', color: 'text.secondary' }}>
                          {a.note || '—'}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      {a.reversed ? (
                        <Chip size="small" label="Reversed" color="default" variant="outlined" />
                      ) : cn.status !== 'CANCELLED' && (
                        <Tooltip title="Reverse this allocation">
                          <IconButton size="small" onClick={() => handleReverse(a.id)}>
                            <ReverseIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>

        {/* E-invoice / E-way bill */}
        <Box sx={{ mb: 3 }}>
          <EInvoiceActionBar
            documentType="CREDIT_NOTE"
            documentId={cn.id}
            documentNumber={cn.creditNoteNo}
          />
        </Box>

        <ApplyCreditModal
          open={applyOpen}
          onClose={() => setApplyOpen(false)}
          onApplied={() => { notify('Credit applied.', 'success'); load(); }}
          creditNote={cn}
        />
        <RecordRefundModal
          open={refundOpen}
          onClose={() => setRefundOpen(false)}
          onRefunded={() => { notify('Refund recorded.', 'success'); load(); }}
          creditNote={cn}
        />
      </Container>
    </Box>
  );
};

export default CreditNoteDetailPage;
