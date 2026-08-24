import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Chip, IconButton, TextField, Grid,
  MenuItem, Select, FormControl, InputLabel, Stack, CircularProgress,
  Divider, Alert, Snackbar, Container, Table, TableBody, TableCell,
  TableHead, TableRow, TableContainer, Card, CardContent, InputAdornment,
  ToggleButton, ToggleButtonGroup, FormControlLabel, Switch, Autocomplete,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PercentIcon from '@mui/icons-material/Percent';
import BuildIcon from '@mui/icons-material/Build';
import dayjs from 'dayjs';

import {
  createQuotation,
  updateQuotation,
  getQuotation,
  sendQuotation,
  fetchCustomers,
  fetchItemVariants,
} from '../services/api';
import { numberToWords } from '../utils/numberToWords';
import { useShop } from '../context/ShopContext';

const STANDARD_GST_RATES = [0, 5, 12, 18, 28];
const STATUS_COLORS = {
  DRAFT: 'default', SENT: 'info', ACCEPTED: 'success',
  REJECTED: 'error', EXPIRED: 'warning', CANCELLED: 'error', CONVERTED: 'primary',
};

const emptyLine = () => ({
  itemVariantId: null,
  itemName: '',
  customItemName: '',
  customHsnSac: '',
  customUnit: '',
  hsnSac: '',
  unit: '',
  qty: 1,
  unitPrice: 0,
  discount: 0,
  gstRate: 18,
  isCustom: false,
});

const inr = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function QuotationEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { shop } = useShop();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', severity: 'info' });

  const [customers, setCustomers] = useState([]);
  const [variants, setVariants] = useState([]);
  const [existing, setExisting] = useState(null); // loaded quotation when editing

  const [form, setForm] = useState({
    customerId: null,
    customer: null,
    quotationDate: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
    expiryDate: dayjs().add(15, 'day').format('YYYY-MM-DD'),
    isGstRequired: true,
    notes: '',
    terms: '',
    invoiceDiscount: 0,
    shippingCharges: 0,
    otherCharges: 0,
    items: [emptyLine()],
  });

  // ── Load customers + variants once ─────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const cs = await fetchCustomers();
        setCustomers(Array.isArray(cs?.data) ? cs.data : Array.isArray(cs) ? cs : []);
      } catch { /* ignore */ }
      try {
        const vs = await fetchItemVariants();
        setVariants(Array.isArray(vs?.data) ? vs.data : Array.isArray(vs) ? vs : []);
      } catch { /* ignore */ }
    })();
  }, []);

  // ── Load existing quotation for edit ───────────────────────────
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getQuotation(id);
        const q = res?.data?.data || res?.data;
        if (!q || cancelled) return;
        setExisting(q);
        setForm({
          customerId: q.customerId ?? q.customer?.id ?? null,
          customer: q.customer || null,
          quotationDate: q.quotationDate || dayjs().format('YYYY-MM-DDTHH:mm:ss'),
          expiryDate: q.expiryDate || '',
          isGstRequired: q.isGstRequired ?? true,
          notes: q.notes || '',
          terms: q.terms || '',
          invoiceDiscount: Number(q.invoiceDiscount) || 0,
          shippingCharges: Number(q.shippingCharges) || 0,
          otherCharges: Number(q.otherCharges) || 0,
          items: (q.items || []).length > 0
            ? q.items.map((it) => ({
                id: it.id,
                itemVariantId: it.itemVariantId ?? null,
                itemName: it.itemName || '',
                customItemName: it.customItemName || '',
                customHsnSac: it.customHsnSac || '',
                customUnit: it.customUnit || '',
                hsnSac: it.hsnSac || '',
                unit: it.unit || '',
                qty: Number(it.qty) || 0,
                unitPrice: Number(it.unitPrice) || 0,
                discount: Number(it.discount) || 0,
                gstRate: Number(it.gstRate) || 0,
                isCustom: !it.itemVariantId,
              }))
            : [emptyLine()],
        });
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load quotation');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isEdit]);

  const editable = !isEdit
    || (existing && (existing.status === 'DRAFT' || existing.status === 'SENT'));

  // ── Handlers ───────────────────────────────────────────────────
  const setField = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const setLine = (index, patch) => setForm((prev) => {
    const items = [...prev.items];
    items[index] = { ...items[index], ...patch };
    return { ...prev, items };
  });

  const handlePickCatalogItem = (index, variant) => {
    if (!variant) return;
    setLine(index, {
      itemVariantId: variant.id,
      itemName: variant.itemName || variant.name || '',
      hsnSac: variant.hsn || variant.hsnCode || '',
      unit: variant.unit || '',
      unitPrice: Number(variant.pricePerUnit ?? variant.sellingPrice ?? 0),
      gstRate: Number(variant.gstRate ?? 18),
      isCustom: false,
    });
  };

  const toggleCustomLine = (index) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...emptyLine(), isCustom: true };
      return { ...prev, items };
    });
  };

  const addLine = () => setForm((prev) => ({ ...prev, items: [...prev.items, emptyLine()] }));

  const removeLine = (index) => setForm((prev) => {
    const items = prev.items.filter((_, i) => i !== index);
    return { ...prev, items: items.length ? items : [emptyLine()] };
  });

  // ── Line calculations ──────────────────────────────────────────
  const lineTaxable = (it) => Math.max(0, (Number(it.qty) || 0) * (Number(it.unitPrice) || 0) - (Number(it.discount) || 0));
  const lineGst = (it) => form.isGstRequired ? lineTaxable(it) * (Number(it.gstRate) || 0) / 100 : 0;
  const lineTotal = (it) => lineTaxable(it) + lineGst(it);

  const totals = useMemo(() => {
    // Intra-state (same state as shop) → CGST + SGST split; else IGST.
    // Server does the authoritative split; this mirrors it for on-screen preview.
    const shopState = (shop?.state || '').trim().toLowerCase();
    const custState = (form.customer?.state || '').trim().toLowerCase();
    const intraState = shopState && custState && shopState === custState;

    const taxable = form.items.reduce((s, it) => s + lineTaxable(it), 0);

    // Slab-wise breakdown: { rate → { taxable, tax } }
    const bySlab = new Map();
    if (form.isGstRequired) {
      for (const it of form.items) {
        const rate = Number(it.gstRate) || 0;
        if (rate <= 0) continue;
        const t = lineTaxable(it);
        const tax = lineGst(it);
        if (!bySlab.has(rate)) bySlab.set(rate, { rate, taxable: 0, tax: 0 });
        const row = bySlab.get(rate);
        row.taxable += t;
        row.tax += tax;
      }
    }
    const slabs = Array.from(bySlab.values()).sort((a, b) => a.rate - b.rate);
    const gst = slabs.reduce((s, r) => s + r.tax, 0);

    const netAfterInvDisc = Math.max(0, taxable + gst - Number(form.invoiceDiscount || 0));
    const withCharges = netAfterInvDisc + Number(form.shippingCharges || 0) + Number(form.otherCharges || 0);
    const grandRaw = Math.max(0, withCharges);
    // Round-off to nearest rupee — same convention the invoice PDF uses.
    const grand = Math.round(grandRaw);
    const roundOff = Number((grand - grandRaw).toFixed(2));

    return { taxable, gst, slabs, intraState, grand, roundOff };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, shop]);

  // ── Save ───────────────────────────────────────────────────────
  const buildPayload = () => ({
    customerId: form.customerId,
    quotationDate: form.quotationDate,
    expiryDate: form.expiryDate || null,
    isGstRequired: !!form.isGstRequired,
    notes: form.notes || null,
    terms: form.terms || null,
    invoiceDiscount: Number(form.invoiceDiscount || 0),
    shippingCharges: Number(form.shippingCharges || 0),
    otherCharges: Number(form.otherCharges || 0),
    items: form.items
      .filter((it) => (it.itemVariantId || (it.customItemName || '').trim()) && Number(it.qty) > 0)
      .map((it) => ({
        id: it.id,
        itemVariantId: it.itemVariantId || null,
        itemName: it.itemName || it.customItemName || 'Item',
        qty: Number(it.qty),
        unitPrice: Number(it.unitPrice),
        discount: Number(it.discount || 0),
        gstRate: Number(it.gstRate || 0),
        customItemName: it.isCustom ? (it.customItemName || null) : null,
        customHsnSac: it.isCustom ? (it.customHsnSac || null) : null,
        customUnit: it.isCustom ? (it.customUnit || null) : null,
      })),
  });

  const validate = (payload) => {
    if (payload.items.length === 0) return 'Add at least one line item with quantity > 0.';
    for (const it of payload.items) {
      if (!it.itemVariantId && !(it.customItemName && it.customItemName.trim())) {
        return 'Every line needs a product or a custom item name.';
      }
      if (Number(it.unitPrice) <= 0) return 'Unit price must be > 0 on every line.';
    }
    return null;
  };

  const handleSave = async ({ send = false } = {}) => {
    setError('');
    setSaving(true);
    try {
      const payload = buildPayload();
      const err = validate(payload);
      if (err) { setError(err); setSaving(false); return; }

      let savedId;
      if (isEdit) {
        const res = await updateQuotation(id, payload);
        savedId = res?.data?.data?.id || id;
      } else {
        const res = await createQuotation(payload);
        savedId = res?.data?.data?.id;
      }
      if (send && savedId) {
        try { await sendQuotation(savedId); } catch (_) { /* non-fatal */ }
      }
      setSnackbar({ open: true, msg: send ? 'Saved and sent' : 'Saved', severity: 'success' });
      setTimeout(() => navigate('/quotations'), 800);
    } catch (err) {
      setError(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton onClick={() => navigate('/quotations')} sx={{ bgcolor: 'background.paper' }}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <ReceiptLongIcon color="primary" />
                <Typography variant="h4" fontWeight={900}>
                  {isEdit ? existing?.quotationNo || 'Edit Quotation' : 'New Quotation'}
                </Typography>
                {isEdit && existing?.status && (
                  <Chip
                    label={existing.status}
                    color={STATUS_COLORS[existing.status] || 'default'}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                )}
              </Stack>
              <Typography color="text.secondary" variant="body2">
                {isEdit
                  ? (editable ? 'Editing — save to update this quotation.' : 'This quotation is locked; only DRAFT and SENT are editable.')
                  : 'Fill in the details below. Quotation number is assigned on save.'}
              </Typography>
            </Box>
          </Stack>
          <Button variant="outlined" onClick={() => navigate('/quotations')} disabled={saving}>
            Cancel
          </Button>
        </Stack>

        {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}
        {!editable && isEdit && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
            Read-only view — this quotation is in <strong>{existing?.status}</strong> and can no longer be edited.
          </Alert>
        )}

        <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
          {/* Main form */}
          <Grid item xs={12} lg={8}>
            {/* Customer & dates */}
            <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <PersonOutlineIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle1" fontWeight={800}>Customer &amp; Dates</Typography>
                </Stack>
                <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
                  <Grid item xs={12} sm={6} md={6}>
                    <Autocomplete
                      fullWidth
                      options={customers}
                      getOptionLabel={(c) => c ? `${c.name}${c.phone ? ' — ' + c.phone : ''}` : ''}
                      isOptionEqualToValue={(a, b) => a?.id === b?.id}
                      value={customers.find((c) => c.id === form.customerId) || null}
                      onChange={(_, v) => setField({ customerId: v?.id || null, customer: v })}
                      disabled={!editable}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Customer"
                          helperText="Leave blank for walk-in quote"
                          size="small"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Quotation Date"
                      type="date"
                      size="small"
                      fullWidth
                      value={form.quotationDate ? form.quotationDate.slice(0, 10) : ''}
                      onChange={(e) => setField({ quotationDate: e.target.value + 'T00:00:00' })}
                      InputLabelProps={{ shrink: true }}
                      disabled={!editable}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><CalendarMonthIcon fontSize="small" color="action" /></InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Valid Until"
                      type="date"
                      size="small"
                      fullWidth
                      value={form.expiryDate || ''}
                      onChange={(e) => setField({ expiryDate: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      disabled={!editable}
                      helperText="Auto-expires after this date"
                    />
                  </Grid>
                </Grid>
                <FormControlLabel
                  sx={{ mt: 1.5 }}
                  control={
                    <Switch
                      checked={!!form.isGstRequired}
                      onChange={(e) => setField({ isGstRequired: e.target.checked })}
                      disabled={!editable}
                    />
                  }
                  label={<Typography variant="body2" fontWeight={700}>Apply GST on this quotation</Typography>}
                />
              </CardContent>
            </Card>

            {/* Line items */}
            <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <BuildIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={800}>Line Items</Typography>
                    <Chip label={`${form.items.length} line${form.items.length === 1 ? '' : 's'}`} size="small" variant="outlined" />
                  </Stack>
                  {editable && (
                    <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={addLine}>
                      Add Line
                    </Button>
                  )}
                </Stack>

                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 900 }}>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, width: 40 }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 800, minWidth: 260 }}>Item / Description</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, width: 90 }}>Qty</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, width: 120 }}>Unit Price</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, width: 100 }}>Discount</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, width: 100 }}>GST %</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, width: 130 }}>Line Total</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800, width: 50 }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {form.items.map((it, i) => (
                        <TableRow key={i} sx={{ verticalAlign: 'top' }}>
                          <TableCell sx={{ pt: 2 }}>
                            <Chip size="small" label={i + 1} sx={{ fontWeight: 800 }} />
                          </TableCell>
                          <TableCell>
                            {!it.isCustom ? (
                              <>
                                <Autocomplete
                                  size="small"
                                  options={variants}
                                  getOptionLabel={(v) => v
                                    ? `${v.itemName || v.name || 'Item'}${v.sku ? ' [' + v.sku + ']' : ''}`
                                    : ''}
                                  isOptionEqualToValue={(a, b) => a?.id === b?.id}
                                  value={variants.find((v) => v.id === it.itemVariantId) || null}
                                  onChange={(_, v) => handlePickCatalogItem(i, v)}
                                  disabled={!editable}
                                  renderInput={(params) => (
                                    <TextField {...params} placeholder="Search catalog…" size="small" />
                                  )}
                                />
                                {editable && (
                                  <Button size="small" onClick={() => toggleCustomLine(i)} sx={{ mt: 0.5, textTransform: 'none', fontSize: '0.72rem' }}>
                                    + Custom / service line instead
                                  </Button>
                                )}
                                {it.hsnSac && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    HSN {it.hsnSac}{it.unit ? ' · ' + it.unit : ''}
                                  </Typography>
                                )}
                              </>
                            ) : (
                              <>
                                <TextField
                                  size="small" fullWidth placeholder="Custom item name"
                                  value={it.customItemName}
                                  onChange={(e) => setLine(i, { customItemName: e.target.value, itemName: e.target.value })}
                                  disabled={!editable}
                                />
                                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                  <TextField
                                    size="small" placeholder="HSN/SAC" sx={{ width: '50%' }}
                                    value={it.customHsnSac}
                                    onChange={(e) => setLine(i, { customHsnSac: e.target.value })}
                                    disabled={!editable}
                                  />
                                  <TextField
                                    size="small" placeholder="Unit" sx={{ width: '50%' }}
                                    value={it.customUnit}
                                    onChange={(e) => setLine(i, { customUnit: e.target.value })}
                                    disabled={!editable}
                                  />
                                </Stack>
                                {editable && (
                                  <Button size="small" onClick={() => setLine(i, { ...emptyLine() })} sx={{ mt: 0.5, textTransform: 'none', fontSize: '0.72rem' }}>
                                    ← Back to catalog picker
                                  </Button>
                                )}
                              </>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small" type="number"
                              value={it.qty}
                              onChange={(e) => setLine(i, { qty: e.target.value })}
                              inputProps={{ min: 0, step: '0.01', style: { textAlign: 'right' } }}
                              disabled={!editable}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small" type="number"
                              value={it.unitPrice}
                              onChange={(e) => setLine(i, { unitPrice: e.target.value })}
                              inputProps={{ min: 0, step: '0.01', style: { textAlign: 'right' } }}
                              disabled={!editable}
                              sx={{ width: 110 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small" type="number"
                              value={it.discount}
                              onChange={(e) => setLine(i, { discount: e.target.value })}
                              inputProps={{ min: 0, step: '0.01', style: { textAlign: 'right' } }}
                              disabled={!editable}
                              sx={{ width: 90 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <FormControl size="small" sx={{ width: 90 }}>
                              <Select
                                value={STANDARD_GST_RATES.includes(Number(it.gstRate)) ? Number(it.gstRate) : 'custom'}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (v === 'custom') return; // handled by TextField below
                                  setLine(i, { gstRate: Number(v) });
                                }}
                                disabled={!editable || !form.isGstRequired}
                                displayEmpty
                                endAdornment={<PercentIcon fontSize="small" sx={{ mr: 3, color: 'text.disabled' }} />}
                              >
                                {STANDARD_GST_RATES.map((r) => (
                                  <MenuItem key={r} value={r}>{r}%</MenuItem>
                                ))}
                                <MenuItem value="custom">Custom…</MenuItem>
                              </Select>
                            </FormControl>
                            {!STANDARD_GST_RATES.includes(Number(it.gstRate)) && (
                              <TextField
                                size="small" type="number"
                                value={it.gstRate}
                                onChange={(e) => setLine(i, { gstRate: e.target.value })}
                                inputProps={{ min: 0, max: 100, step: 0.5, style: { textAlign: 'right' } }}
                                sx={{ width: 90, mt: 0.5 }}
                                disabled={!editable || !form.isGstRequired}
                              />
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight={800} sx={{ pt: 1 }}>
                              {inr(lineTotal(it))}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              taxable {inr(lineTaxable(it))}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {editable && (
                              <IconButton size="small" onClick={() => removeLine(i)} color="error">
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {editable && (
                  <Box sx={{ mt: 2 }}>
                    <Button size="small" startIcon={<AddIcon />} variant="text" onClick={addLine}>
                      Add another line
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Charges + notes + terms */}
            <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>
                  Additional Charges &amp; Notes
                </Typography>
                <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="Invoice Discount"
                      type="number"
                      size="small"
                      fullWidth
                      value={form.invoiceDiscount}
                      onChange={(e) => setField({ invoiceDiscount: e.target.value })}
                      InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                      inputProps={{ min: 0, step: '0.01' }}
                      disabled={!editable}
                      helperText="Deducted from bill total"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="Shipping"
                      type="number"
                      size="small"
                      fullWidth
                      value={form.shippingCharges}
                      onChange={(e) => setField({ shippingCharges: e.target.value })}
                      InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                      inputProps={{ min: 0, step: '0.01' }}
                      disabled={!editable}
                      helperText="Added to bill total"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="Other Charges"
                      type="number"
                      size="small"
                      fullWidth
                      value={form.otherCharges}
                      onChange={(e) => setField({ otherCharges: e.target.value })}
                      InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                      inputProps={{ min: 0, step: '0.01' }}
                      disabled={!editable}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Notes (visible on PDF)"
                      value={form.notes}
                      onChange={(e) => setField({ notes: e.target.value })}
                      fullWidth
                      size="small"
                      multiline
                      minRows={2}
                      disabled={!editable}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Terms &amp; Conditions"
                      value={form.terms}
                      onChange={(e) => setField({ terms: e.target.value })}
                      fullWidth
                      size="small"
                      multiline
                      minRows={3}
                      helperText="Leave blank to use your shop's default terms"
                      disabled={!editable}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Sticky totals sidebar — Zoho-style light panel matching the PDF */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ position: { lg: 'sticky' }, top: 24 }}>
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  overflow: 'hidden',
                }}
              >
                {/* Header strip */}
                <Box sx={{
                  px: 2.5, py: 1.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'action.hover',
                }}>
                  <Typography variant="overline" fontWeight={800} sx={{ letterSpacing: 1, color: 'text.secondary' }}>
                    Quotation Summary
                  </Typography>
                </Box>

                {/* Subtotal + slab-wise GST + discount / shipping / other */}
                <Stack sx={{ p: 2.5 }} spacing={1}>
                  <SummaryRow label="Subtotal (taxable)" value={inr(totals.taxable)} />

                  {form.isGstRequired && totals.slabs.length > 0 && (
                    <>
                      <Divider sx={{ my: 0.5 }} textAlign="left">
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          {totals.intraState ? 'GST (CGST + SGST)' : 'GST (IGST)'}
                        </Typography>
                      </Divider>
                      {totals.slabs.map((r) => (
                        totals.intraState ? (
                          <React.Fragment key={r.rate}>
                            <SummaryRow
                              label={`CGST @ ${(r.rate / 2).toFixed(r.rate % 2 === 0 ? 0 : 1)}% on ${inr(r.taxable)}`}
                              value={inr(r.tax / 2)}
                              size="small"
                            />
                            <SummaryRow
                              label={`SGST @ ${(r.rate / 2).toFixed(r.rate % 2 === 0 ? 0 : 1)}% on ${inr(r.taxable)}`}
                              value={inr(r.tax / 2)}
                              size="small"
                            />
                          </React.Fragment>
                        ) : (
                          <SummaryRow
                            key={r.rate}
                            label={`IGST @ ${r.rate}% on ${inr(r.taxable)}`}
                            value={inr(r.tax)}
                            size="small"
                          />
                        )
                      ))}
                    </>
                  )}

                  {Number(form.invoiceDiscount) > 0 && (
                    <>
                      <Divider sx={{ my: 0.5 }} />
                      <SummaryRow
                        label="Invoice Discount"
                        value={`- ${inr(form.invoiceDiscount)}`}
                        valueColor="error.main"
                      />
                    </>
                  )}
                  {(Number(form.shippingCharges) > 0 || Number(form.otherCharges) > 0) && (
                    <>
                      {Number(form.invoiceDiscount) <= 0 && <Divider sx={{ my: 0.5 }} />}
                      {Number(form.shippingCharges) > 0 && (
                        <SummaryRow label="Shipping" value={`+ ${inr(form.shippingCharges)}`} />
                      )}
                      {Number(form.otherCharges) > 0 && (
                        <SummaryRow label="Other Charges" value={`+ ${inr(form.otherCharges)}`} />
                      )}
                    </>
                  )}

                  {totals.roundOff !== 0 && (
                    <SummaryRow
                      label="Round Off"
                      value={`${totals.roundOff > 0 ? '+' : ''}${inr(totals.roundOff)}`}
                      size="small"
                    />
                  )}
                </Stack>

                {/* Grand Total banner */}
                <Box sx={{
                  px: 2.5, py: 2,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'action.hover',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}>
                  <Typography variant="subtitle1" fontWeight={900}>Grand Total</Typography>
                  <Typography variant="h5" fontWeight={900} color="primary.main">
                    {inr(totals.grand)}
                  </Typography>
                </Box>

                {/* Amount in words */}
                {totals.grand > 0 && (
                  <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" fontWeight={700} sx={{ letterSpacing: 0.5, color: 'text.secondary', textTransform: 'uppercase' }}>
                      In Words
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5, fontStyle: 'italic' }}>
                      {numberToWords(totals.grand)}
                    </Typography>
                  </Box>
                )}

                {/* Valid until */}
                {form.expiryDate && (
                  <Box sx={{
                    px: 2.5, py: 1.5,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}>
                    <CalendarMonthIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      Valid until <strong>{dayjs(form.expiryDate).format('DD MMM YYYY')}</strong>
                    </Typography>
                  </Box>
                )}

                {/* Save actions IN the panel (Zoho pattern) */}
                {editable && (
                  <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                    <Stack spacing={1.2}>
                      <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                        onClick={() => handleSave({ send: true })}
                        disabled={saving}
                        sx={{ fontWeight: 800 }}
                      >
                        Save &amp; Send
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                        onClick={() => handleSave()}
                        disabled={saving}
                        sx={{ fontWeight: 700 }}
                      >
                        {isEdit ? 'Save Changes' : 'Save as Draft'}
                      </Button>
                    </Stack>
                  </Box>
                )}

                {/* Composition-scheme / no-GST caption */}
                {!form.isGstRequired && (
                  <Box sx={{
                    px: 2.5, py: 1.2,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'warning.light',
                    color: 'warning.contrastText',
                  }}>
                    <Typography variant="caption" fontWeight={700}>
                      GST not applied on this quotation.
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled">{snackbar.msg}</Alert>
      </Snackbar>
    </Box>
  );
}

const SummaryRow = ({ label, value, size = 'body', valueColor }) => {
  const labelVariant = size === 'small' ? 'caption' : 'body2';
  const valueVariant = size === 'small' ? 'caption' : 'body2';
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2 }}>
      <Typography variant={labelVariant} sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography variant={valueVariant} sx={{ fontWeight: size === 'small' ? 600 : 700, color: valueColor || 'text.primary' }}>
        {value}
      </Typography>
    </Box>
  );
};
