import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Box, Container, Paper, Stack, Typography, Chip, Button, IconButton, Divider,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  Alert, Snackbar, CircularProgress, List, ListItem, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  CheckCircleOutline as ApproveIcon,
  Cancel as CancelIcon,
  Receipt as DebitNoteIcon,
  AttachMoney as MoneyIcon,
  Inventory2Outlined as InventoryIcon,
} from '@mui/icons-material';

import {
  fetchPurchaseReturnById, approvePurchaseReturn, cancelPurchaseReturn,
  getPurchaseReturnSignedUrl, findDebitNotesByPurchaseReturn,
} from '../../services/api';

const formatInr = (v) =>
  Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 });

const formatDateTime = (val) => {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
};

const STATUS_META = {
  DRAFT:     { label: 'Draft',     tone: 'default' },
  APPROVED:  { label: 'Approved',  tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'error' },
};

const KpiCell = ({ icon, label, value, color, divider }) => (
  <Box sx={{
    p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
    borderRight: divider ? '1px solid' : 'none',
    borderColor: 'divider', minWidth: 0,
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
      <Typography variant="h6" fontWeight={700}
        sx={{ lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

const StatusPill = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, tone: 'default' };
  return <Chip label={meta.label} size="small"
    color={meta.tone === 'default' ? undefined : meta.tone}
    variant={meta.tone === 'default' ? 'outlined' : 'filled'}
    sx={{ fontWeight: 700, borderRadius: 1, letterSpacing: 0.3, fontSize: '0.72rem' }} />;
};

const PurchaseReturnDetailPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();

  const [pr, setPr] = useState(null);
  const [debitNotes, setDebitNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [approveDialog, setApproveDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);

  const showMessage = (message, severity = 'info') => setSnackbar({ open: true, message, severity });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [data, notes] = await Promise.all([
        fetchPurchaseReturnById(id),
        findDebitNotesByPurchaseReturn(id).catch(() => []),
      ]);
      setPr(data);
      setDebitNotes(Array.isArray(notes) ? notes : []);
    } catch (e) {
      setError('Failed to load purchase return.');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);

  const totals = useMemo(() => {
    const items = pr?.items || [];
    let qty = 0, value = 0;
    items.forEach((it) => {
      qty += Number(it.quantity || 0);
      value += Number(it.totalCost || Number(it.quantity || 0) * Number(it.unitCost || 0));
    });
    return { lines: items.length, qty, value };
  }, [pr]);

  const handleApprove = async () => {
    setBusy(true);
    try {
      await approvePurchaseReturn(pr.id);
      setApproveDialog(false);
      showMessage('Approved. Stock deducted, debit note issued.', 'success');
      refresh();
    } catch (e) { showMessage(e?.response?.data?.message || 'Approval failed', 'error'); }
    finally { setBusy(false); }
  };
  const handleCancel = async () => {
    setBusy(true);
    try {
      await cancelPurchaseReturn(pr.id);
      setCancelDialog(false);
      showMessage('Cancelled.', 'info');
      refresh();
    } catch (e) { showMessage('Cancel failed', 'error'); }
    finally { setBusy(false); }
  };
  const handlePrint = async () => {
    try {
      const path = await getPurchaseReturnSignedUrl(pr.id);
      if (path) window.open(path, '_blank', 'noopener,noreferrer');
    } catch { showMessage('Failed to open PDF', 'error'); }
  };
  const handleEmail = async () => {
    try {
      const path = await getPurchaseReturnSignedUrl(pr.id);
      const abs = path ? (path.startsWith('http') ? path : `${window.location.origin}${path}`) : '';
      const subject = encodeURIComponent(`Goods Return Note ${pr.returnNo || ''}`);
      const body = encodeURIComponent(
        [`Return ${pr.returnNo || ''}`,
         `Return date: ${new Date(pr.returnDate).toLocaleDateString('en-IN')}`,
         `Total: ₹${formatInr(pr.totalAmount)}`,
         abs ? `\nPDF: ${abs}` : null].filter(Boolean).join('\n'));
      window.location.href = `mailto:${pr?.supplier?.email || ''}?subject=${subject}&body=${body}`;
    } catch { showMessage('Failed', 'error'); }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!pr) {
    return (
      <Container maxWidth="md" sx={{ pt: 4 }}>
        <Alert severity="error">Purchase return not found.</Alert>
        <Button sx={{ mt: 2 }} startIcon={<BackIcon />} onClick={() => navigate('/purchase-returns')}>
          Back to returns
        </Button>
      </Container>
    );
  }

  const isDraft = pr.status === 'DRAFT';

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ pt: 3, pb: 4 }}>
        <Snackbar open={snackbar.open} autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
        </Snackbar>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Paper elevation={0} sx={{
          p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider',
        }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <IconButton size="small" onClick={() => navigate('/purchase-returns')}><BackIcon /></IconButton>
              <Box>
                <Typography variant="h5" fontWeight={800}
                  sx={{ fontFamily: 'monospace', letterSpacing: -0.4 }}>
                  {pr.returnNo || `#${pr.id}`}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {pr.supplierName || pr.supplier?.name || '—'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">·</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Return date {new Date(pr.returnDate).toLocaleDateString('en-IN')}
                  </Typography>
                </Stack>
              </Box>
              <StatusPill status={pr.status} />
            </Stack>
            <Stack direction="row" spacing={1}>
              {isDraft && (
                <>
                  <Button variant="contained" color="success" startIcon={<ApproveIcon />}
                    onClick={() => setApproveDialog(true)}
                    sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
                    Approve + issue debit note
                  </Button>
                  <Button variant="outlined" color="error" startIcon={<CancelIcon />}
                    onClick={() => setCancelDialog(true)}
                    sx={{ textTransform: 'none', fontWeight: 700 }}>
                    Cancel
                  </Button>
                </>
              )}
              <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}
                sx={{ textTransform: 'none', fontWeight: 700 }}>
                Print
              </Button>
              <Button variant="outlined" startIcon={<EmailIcon />} onClick={handleEmail}
                sx={{ textTransform: 'none', fontWeight: 700 }}>
                Email supplier
              </Button>
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
            <KpiCell icon={<InventoryIcon fontSize="small" />} label="LINES"
              value={totals.lines} color={theme.palette.primary.main} divider />
            <KpiCell icon={<InventoryIcon fontSize="small" />} label="UNITS RETURNED"
              value={totals.qty} color={theme.palette.info.main} divider />
            <KpiCell icon={<MoneyIcon fontSize="small" />} label="RETURN VALUE"
              value={`₹${formatInr(pr.totalAmount || totals.value)}`} color={theme.palette.success.main} divider />
            <KpiCell icon={<DebitNoteIcon fontSize="small" />} label="DEBIT NOTES"
              value={debitNotes.length} color={theme.palette.warning.main} />
          </Box>
        </Paper>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 3fr' }, gap: 3 }}>
          <Paper elevation={0} sx={{
            p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider',
          }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary"
              sx={{ letterSpacing: 0.6 }}>SUPPLIER</Typography>
            <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>
              {pr.supplier?.name || pr.supplierName || '—'}
            </Typography>
            {pr.supplier?.address && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {pr.supplier.address}
              </Typography>
            )}
            {pr.supplier?.gstin && (
              <Typography variant="caption" color="text.secondary">GSTIN: {pr.supplier.gstin}</Typography>
            )}
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1}>
              {pr.purchaseOrder?.poNumber && (
                <Box>
                  <Typography variant="caption" color="text.secondary">LINKED PO</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                    <Button size="small" variant="text"
                      onClick={() => navigate(`/purchase-orders/${pr.purchaseOrder.id}`)}
                      sx={{ textTransform: 'none', fontFamily: 'monospace', fontWeight: 700, p: 0 }}>
                      {pr.purchaseOrder.poNumber}
                    </Button>
                  </Typography>
                </Box>
              )}
              {pr.receiving?.grNumber && (
                <Box>
                  <Typography variant="caption" color="text.secondary">LINKED GRN</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    <Button size="small" variant="text"
                      onClick={() => navigate(`/receivings/${pr.receiving.id}`)}
                      sx={{ textTransform: 'none', fontFamily: 'monospace', fontWeight: 700, p: 0 }}>
                      {pr.receiving.grNumber}
                    </Button>
                  </Typography>
                </Box>
              )}
              {pr.approvedByUserName && (
                <Box>
                  <Typography variant="caption" color="text.secondary">APPROVED BY</Typography>
                  <Typography variant="body2">{pr.approvedByUserName}</Typography>
                  {pr.approvedAt && (
                    <Typography variant="caption" color="text.secondary">{formatDateTime(pr.approvedAt)}</Typography>
                  )}
                </Box>
              )}
            </Stack>
            {pr.notes && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary">NOTES</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{pr.notes}</Typography>
              </>
            )}
          </Paper>

          <Box>
            <Paper elevation={0} sx={{
              borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 3,
            }}>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: alpha(theme.palette.text.primary, 0.04) }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Batch</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Unit cost</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Line total</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(pr.items || []).map((it) => (
                      <TableRow key={it.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>
                            {it.itemName || it.itemVariant?.item?.name || 'Item'}
                          </Typography>
                          {(it.sku || it.itemVariant?.sku) && (
                            <Typography variant="caption" color="text.secondary">
                              {it.sku || it.itemVariant?.sku}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{it.batchNumber || '—'}</TableCell>
                        <TableCell align="right">{it.quantity}</TableCell>
                        <TableCell align="right">₹{formatInr(it.unitCost)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          ₹{formatInr(it.totalCost || Number(it.quantity || 0) * Number(it.unitCost || 0))}
                        </TableCell>
                        <TableCell>{it.reason || '—'}</TableCell>
                      </TableRow>
                    ))}
                    {(!pr.items || pr.items.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          No line items on this return.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{
                px: 2.5, py: 2, borderTop: '1px solid', borderColor: 'divider',
                bgcolor: alpha(theme.palette.text.primary, 0.04),
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              }}>
                <Typography variant="subtitle1" fontWeight={900}>Grand Total</Typography>
                <Typography variant="h5" fontWeight={900} color="primary.main">
                  ₹{formatInr(pr.totalAmount || totals.value)}
                </Typography>
              </Box>
            </Paper>

            <Paper elevation={0} sx={{
              p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider',
            }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <DebitNoteIcon fontSize="small" color="action" />
                <Typography variant="subtitle2" fontWeight={800}>Debit notes</Typography>
              </Stack>
              {debitNotes.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {isDraft
                    ? 'A debit note will be issued automatically when this return is approved.'
                    : 'No debit notes linked yet.'}
                </Typography>
              ) : (
                <List dense disablePadding>
                  {debitNotes.map((dn) => (
                    <ListItem key={dn.id} disableGutters>
                      <ListItemText
                        primary={<Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                          {dn.debitNoteNo}
                        </Typography>}
                        secondary={`${new Date(dn.debitNoteDate).toLocaleDateString('en-IN')} · ₹${formatInr(dn.totalAmount)} · ${dn.status || 'ISSUED'}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Box>
        </Box>

        <Dialog open={approveDialog} onClose={() => setApproveDialog(false)}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 460 } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>Approve purchase return?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Approving will:
            </Typography>
            <Box component="ul" sx={{ pl: 3, my: 1 }}>
              <li><Typography variant="body2">Deduct {totals.qty} unit(s) from stock (batch-wise)</Typography></li>
              <li><Typography variant="body2">Auto-generate a debit note for ₹{formatInr(pr.totalAmount || totals.value)}</Typography></li>
              <li><Typography variant="body2">Lock the return from further edits</Typography></li>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setApproveDialog(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button onClick={handleApprove} color="success" variant="contained" disabled={busy}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              {busy ? 'Working…' : 'Approve'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 420 } }}>
          <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>Cancel draft return?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              The draft will be marked CANCELLED. No stock or debit note is created. This action can't be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCancelDialog(false)} sx={{ textTransform: 'none' }}>Keep draft</Button>
            <Button onClick={handleCancel} color="error" variant="contained" disabled={busy}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              Cancel return
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default PurchaseReturnDetailPage;
