import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Container, Paper, Stack, Typography, Button, Alert, TextField, Table,
  TableBody, TableCell, TableHead, TableRow, TableContainer, CircularProgress,
  IconButton, Snackbar, Divider,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  CheckCircleOutline as ConfirmIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';

import {
  fetchReceivingById,
  updateReceiving,
  confirmReceiving,
  bulkImportReceiving,
  getApInvoiceByReceiving,
} from '../../services/api';

const formatInr = (val) =>
  Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 });

const GrnEditPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();

  const [grn, setGrn] = useState(null);
  const [lines, setLines] = useState([]);
  const [header, setHeader] = useState({
    supplierInvoiceNo: '',
    supplierInvoiceDate: '',
    vehicleNo: '',
    deliveryChallanNo: '',
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    (async () => {
      try {
        // Fetch the receiving and its linked AP invoice in parallel so the
        // header can fall back to invoice-level metadata for GRNs that were
        // created before the sync-on-link fix landed.
        const [data, apInvoice] = await Promise.all([
          fetchReceivingById(id),
          getApInvoiceByReceiving(id).catch(() => null),
        ]);
        // DRAFT is fully editable (stock not yet committed). PENDING /
        // PARTIALLY_RECEIVED are the auto-created state — allow updates so
        // the operator can record actual qtys, with a soft warning that
        // stock movements will be adjusted on save.
        if (data.status === 'COMPLETED' || data.status === 'CANCELLED') {
          setError(`${data.status} GRNs are read-only. Create a new GRN or cancel this one first.`);
        } else if (data.status !== 'DRAFT') {
          setError(`This GRN is ${data.status}. Editing quantities will emit stock delta movements on save.`);
        }
        setGrn(data);
        setHeader({
          supplierInvoiceNo: data.supplierInvoiceNo || apInvoice?.invoiceNo || '',
          supplierInvoiceDate: data.supplierInvoiceDate
            || (apInvoice?.invoiceDate ? String(apInvoice.invoiceDate).slice(0, 10) : ''),
          vehicleNo: data.vehicleNo || '',
          deliveryChallanNo: data.deliveryChallanNo || '',
          notes: data.notes || '',
        });
        setLines((data.receivingItems || []).map((it) => ({
          id: it.id,
          purchaseOrderItemId: it.purchaseOrderItemId,
          name: it.name || 'Item',
          sku: it.sku || '',
          unitCost: Number(it.unitCost || 0),
          expectedQty: Number(it.expectedQty || 0),
          receivedQty: Number(it.receivedQty || 0),
          damagedQty: Number(it.damagedQty || 0),
          rejectedQty: Number(it.rejectedQty || 0),
          damageReason: it.damageReason || '',
          rejectReason: it.rejectReason || '',
          batchNumber: it.batchNumber || '',
          expiryDate: it.expiryDate || '',
          serialNumber: it.serialNumber || '',
          overageReason: it.overageReason || '',
          isOveraged: !!it.isOveraged,
        })));
      } catch (e) {
        setError('Failed to load GRN.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const updateLine = (idx, patch) => {
    setLines((prev) => prev.map((line, i) => {
      if (i !== idx) return line;
      const merged = { ...line, ...patch };
      const total = Number(merged.receivedQty || 0) + Number(merged.damagedQty || 0) + Number(merged.rejectedQty || 0);
      merged.isOveraged = total > Number(merged.expectedQty || 0);
      return merged;
    }));
  };

  const submit = async ({ confirm }) => {
    if (!grn) return;
    const missingReason = lines.find((l) => l.isOveraged && !l.overageReason?.trim());
    if (missingReason) {
      setError(`Overage reason required for "${missingReason.name}".`);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const receivingItems = lines.map((l) => ({
        id: l.id,
        purchaseOrderItemId: l.purchaseOrderItemId,
        receivedQty: Number(l.receivedQty || 0),
        damagedQty: Number(l.damagedQty || 0),
        rejectedQty: Number(l.rejectedQty || 0),
        damageReason: l.damageReason || null,
        rejectReason: l.rejectReason || null,
        batchNumber: l.batchNumber || null,
        expiryDate: l.expiryDate || null,
        serialNumber: l.serialNumber || null,
        overageReason: l.overageReason || null,
        isOveraged: !!l.isOveraged,
      }));
      const payload = {
        id: grn.id,
        purchaseOrderId: grn.purchaseOrderId,
        shopId: grn.shopId,
        supplierInvoiceNo: header.supplierInvoiceNo || null,
        supplierInvoiceDate: header.supplierInvoiceDate || null,
        vehicleNo: header.vehicleNo || null,
        deliveryChallanNo: header.deliveryChallanNo || null,
        notes: header.notes || null,
        receivingItems,
      };
      const updated = await updateReceiving(grn.id, payload);
      if (confirm) {
        await confirmReceiving(updated.id, header.notes || null);
      }
      setSnackbar({ open: true, message: `GRN saved${confirm ? ' and confirmed' : ''}.`, severity: 'success' });
      navigate(`/receivings/${grn.id}`);
    } catch (e) {
      setError(e?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

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

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <IconButton size="small" onClick={() => navigate(`/receivings/${id}`)}>
            <BackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={800}>
            Edit draft GRN {grn?.grNumber || ''}
          </Typography>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label="Supplier invoice #" fullWidth
              value={header.supplierInvoiceNo}
              onChange={(e) => setHeader((s) => ({ ...s, supplierInvoiceNo: e.target.value }))} />
            <TextField label="Supplier invoice date" type="date" fullWidth
              InputLabelProps={{ shrink: true }}
              value={header.supplierInvoiceDate}
              onChange={(e) => setHeader((s) => ({ ...s, supplierInvoiceDate: e.target.value }))} />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2 }}>
            <TextField label="Vehicle #" fullWidth
              value={header.vehicleNo}
              onChange={(e) => setHeader((s) => ({ ...s, vehicleNo: e.target.value }))} />
            <TextField label="Delivery challan #" fullWidth
              value={header.deliveryChallanNo}
              onChange={(e) => setHeader((s) => ({ ...s, deliveryChallanNo: e.target.value }))} />
          </Stack>
          <TextField label="Notes" fullWidth multiline minRows={2} sx={{ mt: 2 }}
            value={header.notes}
            onChange={(e) => setHeader((s) => ({ ...s, notes: e.target.value }))} />
        </Paper>

        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: alpha(theme.palette.text.primary, 0.04) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Ordered</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Received</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Damaged</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Rejected</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Batch / Expiry</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((line, idx) => (
                  <React.Fragment key={line.id || line.purchaseOrderItemId}>
                    <TableRow hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>{line.name}</Typography>
                        {line.sku && <Typography variant="caption" color="text.secondary">{line.sku}</Typography>}
                      </TableCell>
                      <TableCell align="right">{line.expectedQty}</TableCell>
                      <TableCell align="right">
                        <TextField type="number" size="small"
                          inputProps={{ min: 0, style: { textAlign: 'right', width: 72 } }}
                          value={line.receivedQty}
                          onChange={(e) => updateLine(idx, { receivedQty: Number(e.target.value || 0) })} />
                      </TableCell>
                      <TableCell align="right">
                        <TextField type="number" size="small"
                          inputProps={{ min: 0, style: { textAlign: 'right', width: 72 } }}
                          value={line.damagedQty}
                          onChange={(e) => updateLine(idx, { damagedQty: Number(e.target.value || 0) })} />
                      </TableCell>
                      <TableCell align="right">
                        <TextField type="number" size="small"
                          inputProps={{ min: 0, style: { textAlign: 'right', width: 72 } }}
                          value={line.rejectedQty}
                          onChange={(e) => updateLine(idx, { rejectedQty: Number(e.target.value || 0) })} />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <TextField size="small" placeholder="Batch #" value={line.batchNumber}
                            onChange={(e) => updateLine(idx, { batchNumber: e.target.value })}
                            sx={{ width: 120 }} />
                          <TextField size="small" type="date"
                            InputLabelProps={{ shrink: true }}
                            value={line.expiryDate}
                            onChange={(e) => updateLine(idx, { expiryDate: e.target.value })}
                            sx={{ width: 150 }} />
                        </Stack>
                      </TableCell>
                    </TableRow>
                    {(line.damagedQty > 0 || line.rejectedQty > 0 || line.isOveraged) && (
                      <TableRow>
                        <TableCell colSpan={99} sx={{ bgcolor: alpha(theme.palette.warning.main, 0.06), py: 1 }}>
                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                            {line.damagedQty > 0 && (
                              <TextField size="small" fullWidth label="Damage reason"
                                value={line.damageReason}
                                onChange={(e) => updateLine(idx, { damageReason: e.target.value })} />
                            )}
                            {line.rejectedQty > 0 && (
                              <TextField size="small" fullWidth label="Rejection reason"
                                value={line.rejectReason}
                                onChange={(e) => updateLine(idx, { rejectReason: e.target.value })} />
                            )}
                            {line.isOveraged && (
                              <TextField size="small" fullWidth color="warning"
                                label="Overage reason (required)"
                                value={line.overageReason}
                                onChange={(e) => updateLine(idx, { overageReason: e.target.value })} />
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ my: 2 }} />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }}>
            <input
              type="file"
              accept=".csv,text/csv"
              id="grn-edit-bulk-import"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setSaving(true);
                try {
                  await bulkImportReceiving(grn.id, file);
                  setSnackbar({ open: true, message: 'CSV imported successfully. Refreshing lines…', severity: 'success' });
                  const fresh = await fetchReceivingById(grn.id);
                  setLines((fresh.receivingItems || []).map((it) => ({
                    id: it.id, purchaseOrderItemId: it.purchaseOrderItemId,
                    name: it.name || 'Item', sku: it.sku || '', unitCost: Number(it.unitCost || 0),
                    expectedQty: Number(it.expectedQty || 0),
                    receivedQty: Number(it.receivedQty || 0),
                    damagedQty: Number(it.damagedQty || 0),
                    rejectedQty: Number(it.rejectedQty || 0),
                    damageReason: it.damageReason || '', rejectReason: it.rejectReason || '',
                    batchNumber: it.batchNumber || '', expiryDate: it.expiryDate || '',
                    serialNumber: it.serialNumber || '', overageReason: it.overageReason || '',
                    isOveraged: !!it.isOveraged,
                  })));
                } catch (err) {
                  setSnackbar({ open: true, message: err?.response?.data?.message || 'Import failed', severity: 'error' });
                } finally {
                  setSaving(false);
                  e.target.value = '';
                }
              }}
            />
            <Button variant="text" onClick={() => document.getElementById('grn-edit-bulk-import').click()}
              sx={{ textTransform: 'none', fontWeight: 700 }}>
              Bulk import CSV
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
              Columns: purchaseOrderItemId, receivedQty, damagedQty, rejectedQty, batchNumber, expiryDate, serialNumber, notes
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button variant="text" onClick={() => navigate(`/receivings/${id}`)}
              sx={{ textTransform: 'none', fontWeight: 700 }}>
              Cancel
            </Button>
            <Button variant="outlined" startIcon={<SaveIcon />}
              onClick={() => submit({ confirm: false })} disabled={saving}
              sx={{ textTransform: 'none', fontWeight: 700 }}>
              Save draft
            </Button>
            <Button variant="contained" startIcon={<ConfirmIcon />}
              onClick={() => submit({ confirm: true })} disabled={saving}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              {saving ? 'Saving…' : 'Save & confirm'}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default GrnEditPage;
