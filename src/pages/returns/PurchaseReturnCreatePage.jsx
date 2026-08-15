import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Box, Container, Typography, Paper, Button, Stack, TextField, Autocomplete,
  Stepper, Step, StepLabel, Alert, CircularProgress, Divider, Table, TableBody,
  TableCell, TableHead, TableRow, TableContainer, IconButton, Chip, Snackbar,
  MenuItem, Radio, RadioGroup, FormControlLabel, FormLabel, FormControl,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';

import {
  getSuppliers, fetchReceiving, fetchReceivingById, fetchItemVariants,
  createPurchaseReturn,
} from '../../services/api';

const STEPS = ['Header', 'Line entry', 'Review & submit'];

const REASON_CATEGORIES = [
  'Damaged in transit',
  'Wrong item shipped',
  'Quality defect / QC fail',
  'Expired / near-expiry',
  'Over-shipment',
  'Not as ordered (spec mismatch)',
  'Other',
];

const formatInr = (val) =>
  Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 });

const PurchaseReturnCreatePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedGrnId = searchParams.get('grnId');

  const [step, setStep] = useState(0);
  const [suppliers, setSuppliers] = useState([]);
  const [receivings, setReceivings] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [header, setHeader] = useState({
    supplier: null,
    receiving: null,
    returnDate: new Date().toISOString().slice(0, 10),
    reasonCategory: 'Damaged in transit',
    notes: '',
    source: 'FROM_GRN', // FROM_GRN | MANUAL
  });

  const [lines, setLines] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [sups, recs, vars] = await Promise.all([
          getSuppliers().catch(() => []),
          fetchReceiving().catch(() => []),
          fetchItemVariants().catch(() => []),
        ]);
        if (cancelled) return;
        setSuppliers(sups || []);
        const recList = recs?.content || (Array.isArray(recs) ? recs : []);
        setReceivings(recList);
        setVariants(vars || []);
        if (preselectedGrnId) {
          const grn = recList.find((r) => String(r.id) === String(preselectedGrnId));
          if (grn) {
            const supplier = (sups || []).find((s) => s.id === grn.supplier?.id);
            selectGrnAndSeedLines(grn, supplier);
          }
        }
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectGrnAndSeedLines = async (grn, supplier) => {
    setHeader((s) => ({
      ...s,
      receiving: grn,
      supplier: supplier || grn.supplier || null,
      source: 'FROM_GRN',
    }));
    setLoading(true);
    try {
      const detail = grn.receivingItems?.length ? grn : await fetchReceivingById(grn.id);
      const seededLines = (detail.receivingItems || [])
        .filter((it) => (Number(it.damagedQty || 0) + Number(it.rejectedQty || 0)) > 0)
        .map((it) => ({
          itemVariantId: it.itemVariantId,
          name: it.name || 'Item',
          sku: it.sku || '',
          batchNumber: it.batchNumber || '',
          quantity: Number(it.damagedQty || 0) + Number(it.rejectedQty || 0),
          maxQty: Number(it.damagedQty || 0) + Number(it.rejectedQty || 0),
          unitCost: Number(it.unitCost || 0),
          damagedQty: Number(it.damagedQty || 0),
          rejectedQty: Number(it.rejectedQty || 0),
          reason: [
            Number(it.damagedQty || 0) > 0 ? `Damaged: ${it.damageReason || it.damagedQty + ' units'}` : null,
            Number(it.rejectedQty || 0) > 0 ? `Rejected: ${it.rejectReason || it.rejectedQty + ' units'}` : null,
          ].filter(Boolean).join(' | ') || header.reasonCategory,
        }));
      setLines(seededLines);
    } finally { setLoading(false); }
  };

  const updateLine = (idx, patch) =>
    setLines((prev) => prev.map((l, i) => i === idx ? { ...l, ...patch } : l));

  const addLine = () => {
    setLines((prev) => [...prev, {
      itemVariantId: '', name: '', sku: '', batchNumber: '',
      quantity: 1, unitCost: 0, reason: header.reasonCategory,
    }]);
  };

  const removeLine = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const totals = useMemo(() => {
    let qty = 0, value = 0;
    lines.forEach((l) => {
      qty += Number(l.quantity || 0);
      value += Number(l.quantity || 0) * Number(l.unitCost || 0);
    });
    return { qty, value };
  }, [lines]);

  const canNextFromHeader = !!header.supplier;
  const canNextFromLines = lines.length > 0
    && lines.every((l) => l.itemVariantId && Number(l.quantity || 0) > 0);

  const scannedVariantByCode = (code) => {
    if (!code) return null;
    const term = code.toUpperCase().trim();
    return variants.find((v) => (v.sku || '').toUpperCase() === term
      || (v.barcode || '').toUpperCase() === term);
  };

  const handleScan = (input) => {
    const v = scannedVariantByCode(input);
    if (!v) { setError(`No variant matches "${input}".`); return; }
    // Increment existing line for this variant, else add a new one.
    const existingIdx = lines.findIndex((l) => l.itemVariantId === v.id);
    if (existingIdx >= 0) {
      updateLine(existingIdx, { quantity: Number(lines[existingIdx].quantity || 0) + 1 });
    } else {
      setLines((prev) => [...prev, {
        itemVariantId: v.id,
        name: v.name || v.itemName || 'Item',
        sku: v.sku || '',
        batchNumber: v.batchNumber || '',
        quantity: 1,
        unitCost: Number(v.pricePerUnit || v.unitCost || 0),
        reason: header.reasonCategory,
      }]);
    }
  };

  const submit = async () => {
    if (!header.supplier) { setError('Supplier is required.'); return; }
    if (!lines.length) { setError('At least one line is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        supplierId: header.supplier.id,
        purchaseOrderId: header.receiving?.purchaseOrderId || null,
        receivingId: header.receiving?.id || null,
        returnDate: header.returnDate ? `${header.returnDate}T${new Date().toTimeString().slice(0, 8)}` : null,
        notes: header.notes || null,
        items: lines.map((l) => ({
          itemVariantId: Number(l.itemVariantId),
          batchNumber: l.batchNumber && String(l.batchNumber).trim() !== '' ? String(l.batchNumber).trim() : null,
          quantity: Number(l.quantity || 0),
          unitCost: Number(l.unitCost || 0),
          reason: l.reason || header.reasonCategory,
        })),
      };
      const created = await createPurchaseReturn(payload);
      setSnackbar({ open: true, message: `Return ${created.returnNo || '#' + created.id} created.`, severity: 'success' });
      navigate(`/purchase-returns/${created.id}`);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to create return');
    } finally { setSaving(false); }
  };

  const filteredGrns = receivings.filter((r) =>
    !header.supplier || r.supplier?.id === header.supplier.id);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ pt: 3, pb: 4 }}>
        <Snackbar open={snackbar.open} autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
        </Snackbar>

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <IconButton onClick={() => navigate('/purchase-returns')} size="small"><BackIcon /></IconButton>
          <Typography variant="h5" fontWeight={800}>New Purchase Return</Typography>
        </Stack>

        <Paper elevation={0} sx={{
          p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider',
        }}>
          <Stepper activeStep={step} alternativeLabel>
            {STEPS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Paper elevation={0} sx={{
          p: { xs: 2, md: 3 }, borderRadius: 2, border: '1px solid', borderColor: 'divider',
        }}>
          {loading && step === 0 ? (
            <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress /></Stack>
          ) : step === 0 ? (
            <Stack spacing={3}>
              <FormControl>
                <FormLabel sx={{ fontWeight: 700, mb: 1 }}>How are you starting this return?</FormLabel>
                <RadioGroup row value={header.source}
                  onChange={(e) => setHeader((s) => ({ ...s, source: e.target.value, receiving: null }))}>
                  <FormControlLabel value="FROM_GRN" control={<Radio />}
                    label="From a GRN (auto-pulls damaged + rejected units)" />
                  <FormControlLabel value="MANUAL" control={<Radio />}
                    label="Manual (pick items yourself)" />
                </RadioGroup>
              </FormControl>

              <Autocomplete
                options={suppliers}
                value={header.supplier}
                onChange={(_, v) => setHeader((s) => ({ ...s, supplier: v, receiving: null }))}
                getOptionLabel={(o) => o ? `${o.name}${o.phone ? ' · ' + o.phone : ''}` : ''}
                isOptionEqualToValue={(a, b) => a?.id === b?.id}
                renderInput={(params) => (
                  <TextField {...params} label="Supplier *" helperText="Required. Filters the GRN list below." />
                )}
              />

              {header.source === 'FROM_GRN' && (
                <Autocomplete
                  options={filteredGrns}
                  value={header.receiving}
                  onChange={(_, v) => v ? selectGrnAndSeedLines(v, header.supplier) : setHeader((s) => ({ ...s, receiving: null }))}
                  getOptionLabel={(o) => o
                    ? `${o.grNumber || '#' + o.id} · ${o.poNumber || '—'} · ${new Date(o.receivedAt).toLocaleDateString()}`
                    : ''}
                  isOptionEqualToValue={(a, b) => a?.id === b?.id}
                  renderInput={(params) => (
                    <TextField {...params} label="Goods Receipt"
                      helperText={filteredGrns.length === 0 && header.supplier
                        ? 'No GRNs found for this supplier — switch to Manual mode.'
                        : 'Pick the GRN whose damaged/rejected units you\'re returning.'}
                    />
                  )}
                />
              )}

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField fullWidth type="date" label="Return date"
                  InputLabelProps={{ shrink: true }}
                  value={header.returnDate}
                  onChange={(e) => setHeader((s) => ({ ...s, returnDate: e.target.value }))} />
                <TextField fullWidth select label="Reason category"
                  value={header.reasonCategory}
                  onChange={(e) => setHeader((s) => ({ ...s, reasonCategory: e.target.value }))}>
                  {REASON_CATEGORIES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </TextField>
              </Stack>

              <TextField label="Notes / justification" fullWidth multiline minRows={2}
                value={header.notes}
                onChange={(e) => setHeader((s) => ({ ...s, notes: e.target.value }))} />

              {header.source === 'FROM_GRN' && header.receiving && lines.length === 0 && (
                <Alert severity="info">
                  This GRN has no damaged or rejected units recorded. Switch to Manual mode
                  to pick items freely, or return to the GRN and mark damage/rejection first.
                </Alert>
              )}
              {header.source === 'FROM_GRN' && lines.length > 0 && (
                <Alert severity="success">
                  Pulled {lines.length} line{lines.length === 1 ? '' : 's'} from GRN {header.receiving?.grNumber}.
                  Total: {totals.qty} units · ₹{formatInr(totals.value)}.
                </Alert>
              )}
            </Stack>
          ) : step === 1 ? (
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="center">
                <TextField size="small" fullWidth
                  placeholder="Scan SKU / barcode — Enter to add"
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter') return;
                    const scanned = e.target.value.trim();
                    if (!scanned) return;
                    handleScan(scanned);
                    e.target.value = '';
                  }}
                  sx={{ maxWidth: 480 }} />
                <Box sx={{ flexGrow: 1 }} />
                <Button variant="outlined" startIcon={<AddIcon />} onClick={addLine}
                  sx={{ textTransform: 'none', fontWeight: 700 }}>
                  Add line manually
                </Button>
              </Stack>

              <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: alpha(theme.palette.text.primary, 0.04) }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Item variant</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Batch</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, width: 100 }}>Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, width: 130 }}>Unit cost</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, width: 130 }}>Line total</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                      <TableCell align="right" sx={{ width: 50 }}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lines.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          No lines yet. Scan an SKU or click "Add line manually".
                        </TableCell>
                      </TableRow>
                    ) : lines.map((line, idx) => {
                      const overCap = line.maxQty && Number(line.quantity || 0) > line.maxQty;
                      return (
                        <TableRow key={idx} hover>
                          <TableCell>
                            {line.name ? (
                              <>
                                <Typography variant="body2" fontWeight={700}>{line.name}</Typography>
                                {line.sku && <Typography variant="caption" color="text.secondary">{line.sku}</Typography>}
                              </>
                            ) : (
                              <Autocomplete size="small" options={variants}
                                value={variants.find((v) => v.id === line.itemVariantId) || null}
                                onChange={(_, v) => v && updateLine(idx, {
                                  itemVariantId: v.id,
                                  name: v.name || v.itemName || 'Item',
                                  sku: v.sku || '',
                                  batchNumber: v.batchNumber || '',
                                  unitCost: Number(v.pricePerUnit || v.unitCost || 0),
                                })}
                                getOptionLabel={(o) => o ? `${o.sku || o.id} — ${o.name || o.itemName || 'Variant'}` : ''}
                                isOptionEqualToValue={(a, b) => a?.id === b?.id}
                                renderInput={(params) => <TextField {...params} label="Pick variant" />}
                                sx={{ minWidth: 220 }} />
                            )}
                          </TableCell>
                          <TableCell>
                            <TextField size="small" value={line.batchNumber}
                              onChange={(e) => updateLine(idx, { batchNumber: e.target.value })}
                              sx={{ width: 120 }} />
                          </TableCell>
                          <TableCell align="right">
                            <TextField size="small" type="number"
                              inputProps={{ min: 0, style: { textAlign: 'right', width: 72 } }}
                              value={line.quantity}
                              error={overCap}
                              helperText={overCap ? `max ${line.maxQty}` : ''}
                              onChange={(e) => updateLine(idx, { quantity: e.target.value })} />
                          </TableCell>
                          <TableCell align="right">
                            <TextField size="small" type="number"
                              inputProps={{ min: 0, step: '0.01', style: { textAlign: 'right', width: 96 } }}
                              value={line.unitCost}
                              onChange={(e) => updateLine(idx, { unitCost: e.target.value })} />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            ₹{formatInr(Number(line.quantity || 0) * Number(line.unitCost || 0))}
                          </TableCell>
                          <TableCell>
                            <TextField size="small" value={line.reason}
                              onChange={(e) => updateLine(idx, { reason: e.target.value })}
                              sx={{ minWidth: 180 }} />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" color="error" onClick={() => removeLine(idx)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <Stack direction="row" justifyContent="flex-end" spacing={3}>
                <Typography variant="body2" color="text.secondary">Total qty: <strong>{totals.qty}</strong></Typography>
                <Typography variant="body2" fontWeight={800}>Return value: ₹{formatInr(totals.value)}</Typography>
              </Stack>
            </Stack>
          ) : (
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">SUPPLIER</Typography>
                  <Typography variant="body1" fontWeight={700}>{header.supplier?.name}</Typography>
                  {header.supplier?.address && (
                    <Typography variant="body2" color="text.secondary">{header.supplier.address}</Typography>
                  )}
                  <Divider sx={{ my: 1 }} />
                  {header.receiving && (
                    <>
                      <Typography variant="caption" color="text.secondary">LINKED GRN</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                        {header.receiving.grNumber}
                      </Typography>
                    </>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" color="text.secondary">REASON</Typography>
                  <Typography variant="body2">{header.reasonCategory}</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">SUMMARY</Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }} flexWrap="wrap">
                    <Chip label={`Lines: ${lines.length}`} color="primary" />
                    <Chip label={`Units: ${totals.qty}`} color="info" />
                  </Stack>
                  <Typography variant="h5" sx={{ mt: 2 }} fontWeight={800}>
                    ₹{formatInr(totals.value)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Debit note will be issued for this amount on approval</Typography>
                </Paper>
              </Stack>

              <Alert severity="info" icon={<WarningIcon />}>
                Creating this return saves it as <strong>DRAFT</strong>. Approve from the detail page to
                deduct stock and issue the supplier debit note.
              </Alert>

              <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: alpha(theme.palette.text.primary, 0.04) }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Batch</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Unit cost</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lines.map((line, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>{line.name}</Typography>
                          {line.sku && <Typography variant="caption" color="text.secondary">{line.sku}</Typography>}
                        </TableCell>
                        <TableCell>{line.batchNumber || '—'}</TableCell>
                        <TableCell align="right">{line.quantity}</TableCell>
                        <TableCell align="right">₹{formatInr(line.unitCost)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          ₹{formatInr(Number(line.quantity || 0) * Number(line.unitCost || 0))}
                        </TableCell>
                        <TableCell>{line.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}

          <Divider sx={{ my: 3 }} />
          <Stack direction="row" justifyContent="space-between">
            <Button variant="text" startIcon={<BackIcon />}
              onClick={() => step === 0 ? navigate('/purchase-returns') : setStep((s) => s - 1)}
              sx={{ textTransform: 'none', fontWeight: 700 }}>
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button variant="contained" endIcon={<NextIcon />} onClick={() => setStep((s) => s + 1)}
                disabled={step === 0 ? !canNextFromHeader : !canNextFromLines}
                sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
                Next
              </Button>
            ) : (
              <Button variant="contained" startIcon={<SaveIcon />} onClick={submit} disabled={saving}
                sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
                {saving ? 'Saving…' : 'Create draft return'}
              </Button>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default PurchaseReturnCreatePage;
