import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Box, Container, Paper, Stack, Typography, Chip, Button, IconButton, Divider,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  Alert, Snackbar, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, List, ListItem, ListItemText,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  PriceChange as ApplyIcon,
  Cancel as CancelIcon,
  Undo as UndoIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  HourglassBottom as OutstandingIcon,
  CheckCircleOutline as AppliedIcon,
} from '@mui/icons-material';

import {
  getDebitNote, listDebitNoteApplications, applyDebitNote,
  reverseDebitNoteApplication, cancelDebitNote,
  getDebitNoteSignedUrl, downloadReceiptPdf,
} from '../../services/api';

const formatInr = (v) =>
  Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 });

const formatDate = (v) => v ? new Date(v).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric',
}) : '—';

const formatDateTime = (v) => v ? new Date(v).toLocaleString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
}) : '—';

const STATUS_META = {
  ISSUED:            { label: 'Issued',            tone: 'info' },
  PARTIALLY_APPLIED: { label: 'Partially applied', tone: 'warning' },
  FULLY_APPLIED:     { label: 'Fully applied',     tone: 'success' },
  CANCELLED:         { label: 'Cancelled',         tone: 'error' },
};

const StatusPill = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, tone: 'default' };
  return <Chip label={meta.label} size="small"
    color={meta.tone === 'default' ? undefined : meta.tone}
    variant={meta.tone === 'default' ? 'outlined' : 'filled'}
    sx={{ fontWeight: 700, borderRadius: 1, letterSpacing: 0.3, fontSize: '0.72rem' }} />;
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

const DebitNoteDetailPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();

  const [dn, setDn] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [applyDialog, setApplyDialog] = useState({ open: false, amount: '', purchaseInvoiceId: '', note: '' });
  const [cancelDialog, setCancelDialog] = useState({ open: false, note: '' });

  const showMessage = (message, severity = 'info') => setSnackbar({ open: true, message, severity });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [data, applications] = await Promise.all([
        getDebitNote(id),
        listDebitNoteApplications(id).catch(() => []),
      ]);
      setDn(data);
      setApps(Array.isArray(applications) ? applications : []);
    } catch (e) { showMessage('Failed to load debit note', 'error'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);

  const outstanding = useMemo(() => {
    if (!dn) return 0;
    return Number(dn.totalAmount || 0) - Number(dn.appliedAmount || 0);
  }, [dn]);

  const handleApply = async () => {
    if (!applyDialog.amount || Number(applyDialog.amount) <= 0) {
      showMessage('Amount must be positive.', 'warning'); return;
    }
    if (Number(applyDialog.amount) > outstanding) {
      showMessage(`Amount exceeds outstanding ₹${formatInr(outstanding)}.`, 'warning'); return;
    }
    setBusy(true);
    try {
      await applyDebitNote(dn.id, {
        amount: Number(applyDialog.amount),
        purchaseInvoiceId: applyDialog.purchaseInvoiceId || null,
        note: applyDialog.note || null,
      });
      setApplyDialog({ open: false, amount: '', purchaseInvoiceId: '', note: '' });
      showMessage('Applied.', 'success');
      refresh();
    } catch (e) { showMessage(e?.response?.data?.message || 'Apply failed', 'error'); }
    finally { setBusy(false); }
  };

  const handleReverse = async (appId) => {
    const note = window.prompt('Reason for reversal?', '');
    if (note == null) return;
    setBusy(true);
    try {
      await reverseDebitNoteApplication(appId, note);
      showMessage('Reversed.', 'info');
      refresh();
    } catch (e) { showMessage('Reverse failed', 'error'); }
    finally { setBusy(false); }
  };

  const handleCancel = async () => {
    setBusy(true);
    try {
      await cancelDebitNote(dn.id, cancelDialog.note || null);
      setCancelDialog({ open: false, note: '' });
      showMessage('Debit note cancelled.', 'info');
      refresh();
    } catch (e) { showMessage(e?.response?.data?.message || 'Cancel failed', 'error'); }
    finally { setBusy(false); }
  };

  const handleDownload = async () => {
    try {
      const path = await getDebitNoteSignedUrl(dn.id);
      await downloadReceiptPdf(path, `debit_note_${(dn.debitNoteNo || dn.id).toString().replace(/[\/\\]/g, '_')}.pdf`);
    } catch { showMessage('Download failed', 'error'); }
  };

  const handleEmail = async () => {
    try {
      const path = await getDebitNoteSignedUrl(dn.id);
      const abs = path ? (path.startsWith('http') ? path : `${window.location.origin}${path}`) : '';
      const subject = encodeURIComponent(`Debit Note ${dn.debitNoteNo || ''}`);
      const body = encodeURIComponent(
        [`Debit Note ${dn.debitNoteNo || ''}`,
         `Date: ${formatDate(dn.debitNoteDate)}`,
         `Total: ₹${formatInr(dn.totalAmount)}`,
         abs ? `\nPDF: ${abs}` : null].filter(Boolean).join('\n'));
      window.location.href = `mailto:${dn?.supplier?.email || ''}?subject=${subject}&body=${body}`;
    } catch { showMessage('Failed', 'error'); }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!dn) {
    return (
      <Container maxWidth="md" sx={{ pt: 4 }}>
        <Alert severity="error">Debit note not found.</Alert>
        <Button sx={{ mt: 2 }} startIcon={<BackIcon />} onClick={() => navigate('/debit-notes')}>
          Back
        </Button>
      </Container>
    );
  }

  const canApply = dn.status !== 'CANCELLED' && outstanding > 0;
  const canCancel = dn.status !== 'CANCELLED' && Number(dn.appliedAmount || 0) === 0;

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ pt: 3, pb: 4 }}>
        <Snackbar open={snackbar.open} autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
        </Snackbar>

        <Paper elevation={0} sx={{
          p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider',
        }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <IconButton size="small" onClick={() => navigate('/debit-notes')}><BackIcon /></IconButton>
              <Box>
                <Typography variant="h5" fontWeight={800}
                  sx={{ fontFamily: 'monospace', letterSpacing: -0.4 }}>
                  {dn.debitNoteNo || `#${dn.id}`}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {dn.supplier?.name || '—'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">·</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(dn.debitNoteDate)}
                  </Typography>
                </Stack>
              </Box>
              <StatusPill status={dn.status} />
            </Stack>
            <Stack direction="row" spacing={1}>
              {canApply && (
                <Button variant="contained" color="success" startIcon={<ApplyIcon />}
                  onClick={() => setApplyDialog({ open: true, amount: String(outstanding), purchaseInvoiceId: '', note: '' })}
                  sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
                  Apply against invoice
                </Button>
              )}
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownload}
                sx={{ textTransform: 'none', fontWeight: 700 }}>
                Download
              </Button>
              <Button variant="outlined" startIcon={<EmailIcon />} onClick={handleEmail}
                sx={{ textTransform: 'none', fontWeight: 700 }}>
                Email
              </Button>
              {canCancel && (
                <Button variant="outlined" color="error" startIcon={<CancelIcon />}
                  onClick={() => setCancelDialog({ open: true, note: '' })}
                  sx={{ textTransform: 'none', fontWeight: 700 }}>
                  Cancel
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{
          mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden',
        }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          }}>
            <KpiCell icon={<ReceiptIcon fontSize="small" />} label="TOTAL"
              value={`₹${formatInr(dn.totalAmount)}`} color={theme.palette.primary.main} divider />
            <KpiCell icon={<AppliedIcon fontSize="small" />} label="APPLIED"
              value={`₹${formatInr(dn.appliedAmount)}`} color={theme.palette.success.main} divider />
            <KpiCell icon={<OutstandingIcon fontSize="small" />} label="OUTSTANDING"
              value={`₹${formatInr(outstanding)}`} color={theme.palette.warning.main} divider />
            <KpiCell icon={<MoneyIcon fontSize="small" />} label="APPLICATIONS"
              value={apps.filter((a) => !a.reversed).length} color={theme.palette.info.main} />
          </Box>
        </Paper>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 3fr' }, gap: 3 }}>
          <Paper elevation={0} sx={{
            p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider',
          }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary"
              sx={{ letterSpacing: 0.6 }}>SUPPLIER</Typography>
            <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>
              {dn.supplier?.name || '—'}
            </Typography>
            {dn.supplier?.address && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {dn.supplier.address}
              </Typography>
            )}
            {dn.supplier?.gstin && (
              <Typography variant="caption" color="text.secondary">GSTIN: {dn.supplier.gstin}</Typography>
            )}
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1}>
              {dn.purchaseReturnId && (
                <Box>
                  <Typography variant="caption" color="text.secondary">FROM PURCHASE RETURN</Typography>
                  <Button size="small" variant="text"
                    onClick={() => navigate(`/purchase-returns/${dn.purchaseReturnId}`)}
                    sx={{ textTransform: 'none', fontFamily: 'monospace', fontWeight: 700, p: 0 }}>
                    {dn.purchaseReturnNo || `#${dn.purchaseReturnId}`}
                  </Button>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">REASON</Typography>
                <Typography variant="body2">{dn.reason || '—'}</Typography>
              </Box>
            </Stack>
            {dn.notes && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary">NOTES</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{dn.notes}</Typography>
              </>
            )}
          </Paper>

          <Box>
            <Paper elevation={0} sx={{
              borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 3,
            }}>
              <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider',
                bgcolor: alpha(theme.palette.text.primary, 0.04) }}>
                <Typography variant="overline" fontWeight={800} sx={{ letterSpacing: 1, color: 'text.secondary' }}>
                  Financial breakdown
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Taxable amount</TableCell>
                      <TableCell align="right">₹{formatInr(dn.taxableAmount)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>CGST</TableCell>
                      <TableCell align="right">₹{formatInr(dn.cgstAmount)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>SGST</TableCell>
                      <TableCell align="right">₹{formatInr(dn.sgstAmount)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>IGST</TableCell>
                      <TableCell align="right">₹{formatInr(dn.igstAmount)}</TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.text.primary, 0.04) }}>
                      <TableCell sx={{ fontWeight: 800 }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>₹{formatInr(dn.totalAmount)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper elevation={0} sx={{
              p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider',
            }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={800}>Application history</Typography>
                <Chip label={`${apps.filter((a) => !a.reversed).length} active`} size="small"
                  color={apps.some((a) => !a.reversed) ? 'success' : 'default'}
                  sx={{ fontWeight: 700, borderRadius: 1 }} />
              </Stack>
              {apps.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {canApply
                    ? 'No applications yet. Click "Apply against invoice" to net this against a supplier invoice.'
                    : 'No application history.'}
                </Typography>
              ) : (
                <List dense disablePadding>
                  {apps.map((a) => (
                    <ListItem key={a.id} disableGutters
                      secondaryAction={!a.reversed && (
                        <Button size="small" startIcon={<UndoIcon fontSize="small" />}
                          onClick={() => handleReverse(a.id)} disabled={busy}
                          sx={{ textTransform: 'none', fontWeight: 700 }}>
                          Reverse
                        </Button>
                      )}>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" fontWeight={700}>
                              ₹{formatInr(a.appliedAmount)}
                            </Typography>
                            {a.purchaseInvoiceId && (
                              <Chip label={`Invoice #${a.purchaseInvoiceId}`} size="small" variant="outlined"
                                sx={{ fontWeight: 600, borderRadius: 1, height: 20 }} />
                            )}
                            {a.reversed && (
                              <Chip label="REVERSED" size="small" color="error"
                                sx={{ fontWeight: 700, borderRadius: 1, height: 20 }} />
                            )}
                          </Stack>
                        }
                        secondary={
                          <>
                            {`${a.appliedBy || 'system'} · ${formatDateTime(a.appliedAt)}`}
                            {a.note && ` — ${a.note}`}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Box>
        </Box>

        <Dialog open={applyDialog.open} onClose={() => setApplyDialog({ open: false, amount: '', purchaseInvoiceId: '', note: '' })}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 460 } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>Apply against supplier invoice</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Outstanding balance: <strong>₹{formatInr(outstanding)}</strong>.
              Enter the amount to apply and (optionally) the purchase invoice being netted against.
            </Typography>
            <Stack spacing={2}>
              <TextField autoFocus fullWidth type="number" label="Amount (₹)"
                value={applyDialog.amount}
                onChange={(e) => setApplyDialog((s) => ({ ...s, amount: e.target.value }))} />
              <TextField fullWidth type="number" label="Purchase invoice ID (optional)"
                value={applyDialog.purchaseInvoiceId}
                onChange={(e) => setApplyDialog((s) => ({ ...s, purchaseInvoiceId: e.target.value }))} />
              <TextField fullWidth multiline minRows={2} label="Note (optional)"
                value={applyDialog.note}
                onChange={(e) => setApplyDialog((s) => ({ ...s, note: e.target.value }))} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setApplyDialog({ open: false, amount: '', purchaseInvoiceId: '', note: '' })}
              sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button onClick={handleApply} color="success" variant="contained" disabled={busy}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              {busy ? 'Working…' : 'Apply'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={cancelDialog.open} onClose={() => setCancelDialog({ open: false, note: '' })}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 420 } }}>
          <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>Cancel debit note?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Cancellation is permanent. Provide a reason for the audit log.
            </Typography>
            <TextField autoFocus fullWidth multiline minRows={3} label="Reason"
              value={cancelDialog.note}
              onChange={(e) => setCancelDialog((s) => ({ ...s, note: e.target.value }))} />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCancelDialog({ open: false, note: '' })} sx={{ textTransform: 'none' }}>Keep</Button>
            <Button onClick={handleCancel} color="error" variant="contained" disabled={busy}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              Cancel debit note
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default DebitNoteDetailPage;
