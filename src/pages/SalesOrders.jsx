import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, Chip, Table, TableBody, TableCell, TableHead,
  TableRow, TableContainer, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid, MenuItem, Select, FormControl, InputLabel, Stack,
  CircularProgress, TablePagination, Divider, Alert, Checkbox, FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ReactSelect from 'react-select';
import { useNavigate } from 'react-router-dom';

import {
  listSalesOrders,
  createSalesOrder,
  approveSalesOrder,
  cancelSalesOrder,
  convertSalesOrderToSale,
  getSalesOrder,
  getSalesOrderSignedUrl,
  downloadReceiptPdf,
  fetchCustomers,
  fetchItemVariants,
} from '../services/api';

const STATUS_COLORS = {
  DRAFT: 'default',
  APPROVED: 'info',
  PARTIALLY_FULFILLED: 'warning',
  FULFILLED: 'success',
  CANCELLED: 'error',
};

const STATUS_FILTERS = ['ALL', 'DRAFT', 'APPROVED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED'];

const emptyItem = () => ({
  itemVariantId: null,
  itemName: '',
  customItemName: '',
  customHsnSac: '',
  customUnit: '',
  qty: 1,
  unitPrice: 0,
  discount: 0,
  gstRate: 0,
  isCustom: false,
});

const SalesOrders = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [variants, setVariants] = useState([]);

  // Create form state
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    customerId: null,
    expectedDeliveryDate: '',
    isGstRequired: true,
    notes: '',
    terms: '',
    invoiceDiscount: 0,
    shippingCharges: 0,
    otherCharges: 0,
    items: [emptyItem()],
  });
  const [submitting, setSubmitting] = useState(false);

  // Convert dialog state
  const [convertTarget, setConvertTarget] = useState(null); // full SO object
  const [convertLines, setConvertLines] = useState({});     // { salesOrderItemId: qty }

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const status = statusFilter === 'ALL' ? null : statusFilter;
      const res = await listSalesOrders(page, rowsPerPage, status, null);
      setRows(res?.content ?? []);
      setTotalElements(res?.totalElements ?? 0);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to load sales orders');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    (async () => {
      try {
        const cs = await fetchCustomers();
        setCustomers(Array.isArray(cs) ? cs : (cs?.data ?? []));
      } catch { /* ignore */ }
      try {
        const vs = await fetchItemVariants();
        setVariants(Array.isArray(vs) ? vs : (vs?.data ?? []));
      } catch { /* ignore */ }
    })();
  }, []);

  const customerOptions = useMemo(
    () => customers.map((c) => ({ value: c.id, label: `${c.name}${c.phone ? ' — ' + c.phone : ''}`, raw: c })),
    [customers]
  );
  const variantOptions = useMemo(
    () => variants.map((v) => ({
      value: v.id,
      label: `${v.itemName || v.name || 'Item'}${v.sku ? ' [' + v.sku + ']' : ''} — ₹${v.pricePerUnit ?? v.sellingPrice ?? 0}`,
      raw: v,
    })),
    [variants]
  );

  const guarded = async (fn, msg) => {
    try {
      await fn();
      await loadData();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || `${msg} failed`);
    }
  };

  const handleDownload = async (row) => {
    try {
      const signedPath = await getSalesOrderSignedUrl(row.id);
      await downloadReceiptPdf(
        signedPath,
        `sales_order_${(row.orderNo || row.id).toString().replace(/[\/\\]/g, '_')}.pdf`,
      );
    } catch {
      setErrorMsg('Failed to download sales order PDF');
    }
  };

  // ── Convert helpers ────────────────────────────────────────
  const openConvertDialog = async (row) => {
    // Fetch full order so we have per-line remaining quantities
    try {
      const res = await getSalesOrder(row.id);
      const so = res?.data;
      if (!so) throw new Error('Sales order not found');
      const initialLines = {};
      (so.items || []).forEach((it) => {
        const remaining = Number(it.qty || 0) - Number(it.fulfilledQty || 0);
        if (remaining > 0) initialLines[it.id] = remaining;
      });
      setConvertTarget(so);
      setConvertLines(initialLines);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to load sales order');
    }
  };

  const submitConvert = async () => {
    if (!convertTarget) return;
    const lines = Object.entries(convertLines)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([salesOrderItemId, qty]) => ({ salesOrderItemId: Number(salesOrderItemId), qty: Number(qty) }));
    if (lines.length === 0) {
      setErrorMsg('Select at least one line to convert');
      return;
    }
    try {
      const res = await convertSalesOrderToSale(convertTarget.id, { lines });
      // Backend returns SalesOrderDto (wrapped in ApiResponse) with createdSaleId
      // populated after the conversion. Deep-link into the new draft so the user
      // lands in the cart ready to complete — otherwise fall back to history.
      const newSaleId = res?.data?.data?.createdSaleId ?? res?.data?.createdSaleId ?? null;
      setConvertTarget(null);
      setConvertLines({});
      await loadData();
      if (newSaleId) {
        navigate(`/sales?resumeId=${newSaleId}`);
      } else {
        navigate('/sales?tab=history');
      }
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Conversion failed');
    }
  };

  // ── Form handlers ───────────────────────────────────────────
  const resetForm = () => setForm({
    customerId: null,
    expectedDeliveryDate: '',
    isGstRequired: true,
    notes: '',
    terms: '',
    invoiceDiscount: 0,
    shippingCharges: 0,
    otherCharges: 0,
    items: [emptyItem()],
  });

  const handleAddCatalogItem = (index, option) => {
    const v = option?.raw;
    if (!v) return;
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = {
        ...items[index],
        itemVariantId: v.id,
        itemName: v.itemName || v.name || '',
        unitPrice: Number(v.pricePerUnit ?? v.sellingPrice ?? 0),
        gstRate: Number(v.gstRate ?? 0),
        isCustom: false,
      };
      return { ...prev, items };
    });
  };

  const handleToggleCustomItem = (index) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...emptyItem(), isCustom: true };
      return { ...prev, items };
    });
  };

  const handleItemChange = (index, field, value) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const handleAddRow = () => setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  const handleRemoveRow = (index) => setForm((prev) => ({
    ...prev,
    items: prev.items.filter((_, i) => i !== index).length ? prev.items.filter((_, i) => i !== index) : [emptyItem()],
  }));

  const rowTotal = (it) => {
    const qty = Number(it.qty) || 0;
    const price = Number(it.unitPrice) || 0;
    const discount = Number(it.discount) || 0;
    const taxable = Math.max(qty * price - discount, 0);
    const gst = form.isGstRequired ? (taxable * Number(it.gstRate || 0)) / 100 : 0;
    return taxable + gst;
  };

  const grandTotal = useMemo(() => {
    const lines = form.items.reduce((sum, it) => sum + rowTotal(it), 0);
    return Math.max(
      lines - Number(form.invoiceDiscount || 0) + Number(form.shippingCharges || 0) + Number(form.otherCharges || 0),
      0,
    ).toFixed(2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const payload = {
        customerId: form.customerId,
        expectedDeliveryDate: form.expectedDeliveryDate || null,
        isGstRequired: !!form.isGstRequired,
        notes: form.notes || null,
        terms: form.terms || null,
        invoiceDiscount: Number(form.invoiceDiscount || 0),
        shippingCharges: Number(form.shippingCharges || 0),
        otherCharges: Number(form.otherCharges || 0),
        items: form.items
          .filter((it) => (it.itemVariantId || (it.customItemName || '').trim()) && Number(it.qty) > 0)
          .map((it) => ({
            itemVariantId: it.itemVariantId || null,
            itemName: it.itemName || it.customItemName,
            qty: Number(it.qty),
            unitPrice: Number(it.unitPrice),
            discount: Number(it.discount || 0),
            gstRate: Number(it.gstRate || 0),
            customItemName: it.isCustom ? (it.customItemName || null) : null,
            customHsnSac: it.isCustom ? (it.customHsnSac || null) : null,
            customUnit: it.isCustom ? (it.customUnit || null) : null,
          })),
      };
      if (payload.items.length === 0) {
        setErrorMsg('Add at least one line item');
        setSubmitting(false);
        return;
      }
      await createSalesOrder(payload);
      setCreateOpen(false);
      resetForm();
      await loadData();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Create failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Sales Orders</Typography>
          <Stack direction="row" spacing={1}>
            <IconButton onClick={loadData}><RefreshIcon /></IconButton>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
              New Sales Order
            </Button>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
          {STATUS_FILTERS.map((s) => (
            <Chip
              key={s}
              label={s}
              onClick={() => { setStatusFilter(s); setPage(0); }}
              color={statusFilter === s ? 'primary' : 'default'}
              variant={statusFilter === s ? 'filled' : 'outlined'}
              size="small"
              sx={{ mb: 1 }}
            />
          ))}
        </Stack>

        {errorMsg && <Alert severity="error" onClose={() => setErrorMsg(null)} sx={{ mb: 2 }}>{errorMsg}</Alert>}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Order No</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Expected</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={22} /></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No sales orders yet. Click <strong>New Sales Order</strong> to create one.
                </TableCell></TableRow>
              ) : rows.map((so) => (
                <TableRow key={so.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{so.orderNo}</TableCell>
                  <TableCell>{so.orderDate ? new Date(so.orderDate).toLocaleDateString('en-IN') : '-'}</TableCell>
                  <TableCell>{so.customer?.name || 'Walk-in'}</TableCell>
                  <TableCell>{so.expectedDeliveryDate || '—'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>₹{Number(so.totalAmount || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip size="small" label={so.status} color={STATUS_COLORS[so.status] || 'default'} />
                    {so.quotationNo && (
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                        from {so.quotationNo}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Download PDF">
                      <IconButton size="small" onClick={() => handleDownload(so)}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {so.status === 'DRAFT' && (
                      <Tooltip title="Approve (reserves stock)">
                        <IconButton size="small" color="info" onClick={() => guarded(() => approveSalesOrder(so.id), 'Approve')}>
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {(so.status === 'APPROVED' || so.status === 'PARTIALLY_FULFILLED') && (
                      <Tooltip title="Convert to Sale (partial or full)">
                        <IconButton size="small" color="primary" onClick={() => openConvertDialog(so)}>
                          <ArrowForwardIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {so.status !== 'FULFILLED' && so.status !== 'CANCELLED' && (
                      <Tooltip title="Cancel">
                        <IconButton size="small" onClick={() => guarded(() => cancelSalesOrder(so.id), 'Cancel')}>
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={totalElements}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </Paper>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => !submitting && setCreateOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>New Sales Order</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="caption">Customer</Typography>
              <ReactSelect
                options={customerOptions}
                value={customerOptions.find((c) => c.value === form.customerId) || null}
                onChange={(opt) => setForm((p) => ({ ...p, customerId: opt?.value || null }))}
                isClearable
                placeholder="Select customer (optional)"
                menuPortalTarget={document.body}
                styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                label="Expected Delivery"
                type="date"
                value={form.expectedDeliveryDate}
                onChange={(e) => setForm((p) => ({ ...p, expectedDeliveryDate: e.target.value }))}
                fullWidth size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>GST</InputLabel>
                <Select
                  value={form.isGstRequired ? 'yes' : 'no'}
                  onChange={(e) => setForm((p) => ({ ...p, isGstRequired: e.target.value === 'yes' }))}
                  label="GST"
                >
                  <MenuItem value="yes">Apply GST</MenuItem>
                  <MenuItem value="no">No GST</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}><Divider sx={{ my: 1 }} /><Typography variant="subtitle2">Line Items</Typography></Grid>

            {form.items.map((it, i) => (
              <React.Fragment key={i}>
                <Grid item xs={12} md={5}>
                  {!it.isCustom ? (
                    <>
                      <Typography variant="caption">Product</Typography>
                      <ReactSelect
                        options={variantOptions}
                        value={variantOptions.find((v) => v.value === it.itemVariantId) || null}
                        onChange={(opt) => handleAddCatalogItem(i, opt)}
                        placeholder="Select product..."
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
                      />
                      <Button size="small" onClick={() => handleToggleCustomItem(i)} sx={{ mt: 0.5, textTransform: 'none' }}>
                        + Custom / service line instead
                      </Button>
                    </>
                  ) : (
                    <TextField label="Custom item description" value={it.customItemName}
                      onChange={(e) => handleItemChange(i, 'customItemName', e.target.value)}
                      fullWidth size="small" required />
                  )}
                </Grid>
                <Grid item xs={4} md={1}>
                  <TextField label="Qty" type="number" value={it.qty}
                    onChange={(e) => handleItemChange(i, 'qty', e.target.value)}
                    inputProps={{ min: 0, step: '0.01' }} fullWidth size="small" />
                </Grid>
                <Grid item xs={4} md={2}>
                  <TextField label="Unit Price" type="number" value={it.unitPrice}
                    onChange={(e) => handleItemChange(i, 'unitPrice', e.target.value)}
                    inputProps={{ min: 0, step: '0.01' }} fullWidth size="small" />
                </Grid>
                <Grid item xs={4} md={1}>
                  <TextField label="Disc" type="number" value={it.discount}
                    onChange={(e) => handleItemChange(i, 'discount', e.target.value)}
                    inputProps={{ min: 0, step: '0.01' }} fullWidth size="small" />
                </Grid>
                <Grid item xs={6} md={1.5}>
                  <TextField label="GST %" type="number" value={it.gstRate}
                    onChange={(e) => handleItemChange(i, 'gstRate', e.target.value)}
                    inputProps={{ min: 0, max: 28, step: 1 }} fullWidth size="small"
                    disabled={!form.isGstRequired} />
                </Grid>
                <Grid item xs={6} md={1.5} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ flex: 1, textAlign: 'right' }}>₹{rowTotal(it).toFixed(2)}</Typography>
                  <IconButton size="small" onClick={() => handleRemoveRow(i)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                </Grid>
              </React.Fragment>
            ))}

            <Grid item xs={12}><Button size="small" startIcon={<AddIcon />} onClick={handleAddRow}>Add line item</Button></Grid>
            <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

            <Grid item xs={12} md={4}>
              <TextField label="Invoice-level discount" type="number" value={form.invoiceDiscount}
                onChange={(e) => setForm((p) => ({ ...p, invoiceDiscount: e.target.value }))}
                inputProps={{ min: 0, step: '0.01' }} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Shipping" type="number" value={form.shippingCharges}
                onChange={(e) => setForm((p) => ({ ...p, shippingCharges: e.target.value }))}
                inputProps={{ min: 0, step: '0.01' }} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Other charges" type="number" value={form.otherCharges}
                onChange={(e) => setForm((p) => ({ ...p, otherCharges: e.target.value }))}
                inputProps={{ min: 0, step: '0.01' }} fullWidth size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Notes" value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                fullWidth size="small" multiline minRows={2} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Terms & conditions" value={form.terms}
                onChange={(e) => setForm((p) => ({ ...p, terms: e.target.value }))}
                fullWidth size="small" multiline minRows={2}
                helperText="Leave blank to use your shop's default terms" />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                <Typography variant="body1">Total:</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>₹{grandTotal}</Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={submitting}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}>
            {submitting ? 'Saving...' : 'Create Sales Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Convert-to-Sale Dialog with per-line qty */}
      <Dialog open={convertTarget !== null} onClose={() => setConvertTarget(null)} maxWidth="md" fullWidth>
        <DialogTitle>Convert to Sale</DialogTitle>
        <DialogContent dividers>
          {convertTarget && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter the quantity you want to invoice for each line. Leaving a qty at 0 skips that line.
                Partial fulfillment is allowed — remaining qty stays on the order for the next invoice.
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Ordered</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Already Fulfilled</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Fulfill Now</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(convertTarget.items || []).map((it) => {
                      const remaining = Number(it.qty || 0) - Number(it.fulfilledQty || 0);
                      return (
                        <TableRow key={it.id}>
                          <TableCell>{it.itemName}</TableCell>
                          <TableCell align="right">{Number(it.qty).toFixed(2)}</TableCell>
                          <TableCell align="right">{Number(it.fulfilledQty || 0).toFixed(2)}</TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number" size="small"
                              value={convertLines[it.id] ?? 0}
                              onChange={(e) => setConvertLines((prev) => ({ ...prev, [it.id]: e.target.value }))}
                              inputProps={{ min: 0, max: remaining, step: '0.01' }}
                              sx={{ width: 120 }}
                              disabled={remaining <= 0}
                              helperText={remaining > 0 ? `max ${remaining.toFixed(2)}` : 'fully fulfilled'}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={submitConvert}>Create Sale Draft</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesOrders;
