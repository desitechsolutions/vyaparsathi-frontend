import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, Chip, Table, TableBody, TableCell, TableHead,
  TableRow, TableContainer, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid, MenuItem, Select, FormControl, InputLabel, Stack,
  CircularProgress, TablePagination, Divider, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ReactSelect from 'react-select';
import { useNavigate } from 'react-router-dom';

import {
  listQuotations,
  createQuotation,
  sendQuotation,
  acceptQuotation,
  rejectQuotation,
  cancelQuotation,
  convertQuotationToSale,
  getQuotationSignedUrl,
  downloadReceiptPdf,
  fetchCustomers,
  fetchItemVariants,
} from '../services/api';

const STATUS_COLORS = {
  DRAFT: 'default',
  SENT: 'info',
  ACCEPTED: 'success',
  REJECTED: 'error',
  EXPIRED: 'warning',
  CANCELLED: 'error',
  CONVERTED: 'primary',
};

const STATUS_FILTERS = ['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED', 'CONVERTED'];

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

const Quotations = () => {
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
    expiryDate: '',
    isGstRequired: true,
    notes: '',
    terms: '',
    invoiceDiscount: 0,
    shippingCharges: 0,
    otherCharges: 0,
    items: [emptyItem()],
  });
  const [submitting, setSubmitting] = useState(false);

  // Reject dialog
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const status = statusFilter === 'ALL' ? null : statusFilter;
      const res = await listQuotations(page, rowsPerPage, status, null);
      setRows(res?.content ?? []);
      setTotalElements(res?.totalElements ?? 0);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to load quotations');
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

  // ── Row actions ─────────────────────────────────────────────
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
      const signedPath = await getQuotationSignedUrl(row.id);
      await downloadReceiptPdf(
        signedPath,
        `quotation_${(row.quotationNo || row.id).toString().replace(/[\/\\]/g, '_')}.pdf`,
      );
    } catch (err) {
      setErrorMsg('Failed to download quotation PDF');
    }
  };

  const handleConvert = async (row) => {
    try {
      const res = await convertQuotationToSale(row.id);
      const saleId = res?.data?.convertedToSaleId;
      if (saleId) {
        navigate(`/sales/drafts?resumeId=${saleId}`);
      } else {
        await loadData();
      }
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Conversion failed');
    }
  };

  // ── Form handlers ───────────────────────────────────────────
  const resetForm = () => setForm({
    customerId: null,
    expiryDate: '',
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
      await createQuotation(payload);
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
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Quotations</Typography>
          <Stack direction="row" spacing={1}>
            <IconButton onClick={loadData}><RefreshIcon /></IconButton>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
              New Quotation
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
                <TableCell sx={{ fontWeight: 700 }}>Quotation No</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Expiry</TableCell>
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
                  No quotations yet. Click <strong>New Quotation</strong> to create one.
                </TableCell></TableRow>
              ) : rows.map((q) => (
                <TableRow key={q.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{q.quotationNo}</TableCell>
                  <TableCell>{q.quotationDate ? new Date(q.quotationDate).toLocaleDateString('en-IN') : '-'}</TableCell>
                  <TableCell>{q.customer?.name || 'Walk-in'}</TableCell>
                  <TableCell>{q.expiryDate || '—'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>₹{Number(q.totalAmount || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip size="small" label={q.status} color={STATUS_COLORS[q.status] || 'default'} />
                    {q.convertedInvoiceNo && (
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                        → {q.convertedInvoiceNo}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Download PDF">
                      <IconButton size="small" onClick={() => handleDownload(q)}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {(q.status === 'DRAFT' || q.status === 'SENT') && (
                      <Tooltip title="Send to customer">
                        <IconButton size="small" color="info"
                          onClick={() => guarded(() => sendQuotation(q.id), 'Send')}>
                          <SendIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {(q.status === 'SENT' || q.status === 'DRAFT') && (
                      <Tooltip title="Mark as accepted">
                        <IconButton size="small" color="success"
                          onClick={() => guarded(() => acceptQuotation(q.id), 'Accept')}>
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {(q.status === 'SENT' || q.status === 'DRAFT') && (
                      <Tooltip title="Reject">
                        <IconButton size="small" color="error"
                          onClick={() => { setRejectTarget(q); setRejectReason(''); }}>
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {q.status !== 'CONVERTED' && q.status !== 'CANCELLED' && q.status !== 'REJECTED' && q.status !== 'EXPIRED' && (
                      <Tooltip title="Convert to Sale">
                        <IconButton size="small" color="primary" onClick={() => handleConvert(q)}>
                          <ArrowForwardIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {(q.status === 'DRAFT' || q.status === 'SENT' || q.status === 'ACCEPTED') && (
                      <Tooltip title="Cancel">
                        <IconButton size="small"
                          onClick={() => guarded(() => cancelQuotation(q.id), 'Cancel')}>
                          <DeleteIcon fontSize="small" />
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
        <DialogTitle>New Quotation</DialogTitle>
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
                label="Expiry Date"
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))}
                fullWidth
                size="small"
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

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2">Line Items</Typography>
            </Grid>

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
                    <TextField
                      label="Custom item description"
                      value={it.customItemName}
                      onChange={(e) => handleItemChange(i, 'customItemName', e.target.value)}
                      fullWidth size="small" required
                    />
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
                  <Typography variant="body2" sx={{ flex: 1, textAlign: 'right' }}>
                    ₹{rowTotal(it).toFixed(2)}
                  </Typography>
                  <IconButton size="small" onClick={() => handleRemoveRow(i)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Grid>
              </React.Fragment>
            ))}

            <Grid item xs={12}>
              <Button size="small" startIcon={<AddIcon />} onClick={handleAddRow}>Add line item</Button>
            </Grid>

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
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {submitting ? 'Saving...' : 'Create Quotation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectTarget !== null} onClose={() => setRejectTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Quotation</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Rejecting {rejectTarget?.quotationNo}.
          </Typography>
          <TextField
            label="Reason (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            fullWidth multiline minRows={2} autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={async () => {
            const id = rejectTarget.id;
            setRejectTarget(null);
            await guarded(() => rejectQuotation(id, rejectReason), 'Reject');
          }}>Reject</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Quotations;
