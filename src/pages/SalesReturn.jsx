import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Grid, TextField, Button, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody, Stack, Alert, TableContainer,
  Card, CardContent, Chip, Divider, IconButton, InputAdornment, Snackbar,
  FormControlLabel, Switch, MenuItem,
} from '@mui/material';
import {
  ArrowBackIosNew, Search, Undo, Receipt, PersonOutline, CalendarToday, Send,
} from '@mui/icons-material';
import {
  fetchSalesHistory,
  getSaleById,
  processSaleReturn,
  findCreditNotesBySale,
  getCreditNoteSignedUrl,
  downloadReceiptPdf,
} from '../services/api';

const inr = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const RETURN_REASONS = [
  { value: 'DAMAGED', label: 'Damaged / Defective' },
  { value: 'WRONG_ITEM', label: 'Wrong item shipped' },
  { value: 'CUSTOMER_CHANGED_MIND', label: 'Customer changed mind' },
  { value: 'EXPIRED', label: 'Expired / near expiry' },
  { value: 'OTHER', label: 'Other' },
];

export default function SalesReturn() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('invoice') || '');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [sale, setSale] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [reason, setReason] = useState('');
  const [refundPayment, setRefundPayment] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', severity: 'info' });

  const showSnackbar = (msg, severity = 'info') => setSnackbar({ open: true, msg, severity });

  const handleSearch = async (invoiceQuery) => {
    const q = (invoiceQuery ?? query ?? '').trim();
    if (!q) return;
    setSearching(true);
    setSearchError('');
    setSale(null);
    setReturnItems([]);
    try {
      const res = await fetchSalesHistory({ q, size: 5 });
      const content = res?.data?.content || res?.data || [];
      if (!Array.isArray(content) || content.length === 0) {
        setSearchError(`No sale matches "${q}".`);
        return;
      }
      // Prefer exact invoice match if there are multiple partial hits.
      const exact = content.find(s => (s.invoiceNo || '').toLowerCase() === q.toLowerCase());
      const target = exact || content[0];
      const saleId = target.id || target.saleId;
      const detail = await getSaleById(saleId);
      const items = detail?.data?.items || [];
      setSale({ ...target, ...detail.data });
      setReturnItems(items.map(item => ({
        saleItemId: item.saleItemId,
        itemName: item.itemName,
        originalQty: Number(item.qty) || 0,
        returnedQty: Number(item.returnedQty || 0),
        netQty: item.netQty !== undefined ? Number(item.netQty) : (Number(item.qty) - Number(item.returnedQty || 0)),
        unitPrice: Number(item.unitPrice) || 0,
        returnQuantity: 0,
      })));
      if (content.length > 1 && !exact) {
        showSnackbar(`Loaded closest match "${target.invoiceNo}". Refine the search to pick another.`, 'warning');
      }
    } catch (err) {
      console.error('Return search error:', err);
      setSearchError(err?.response?.data?.message || err?.message || 'Failed to load sale.');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('invoice')) {
      handleSearch(searchParams.get('invoice'));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalReturnValue = useMemo(
    () => returnItems.reduce((sum, i) => sum + (Number(i.returnQuantity) || 0) * i.unitPrice, 0),
    [returnItems],
  );

  const handleQtyChange = (idx, raw) => {
    const parsed = raw === '' ? 0 : Math.max(0, Number(raw));
    setReturnItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const clamped = Math.min(parsed, it.netQty);
      return { ...it, returnQuantity: clamped };
    }));
  };

  const handleSubmit = async () => {
    const saleId = sale?.id || sale?.saleId;
    if (!saleId) return;
    const validItems = returnItems.filter(i => Number(i.returnQuantity) > 0);
    if (validItems.length === 0) {
      showSnackbar('Enter a return quantity for at least one item', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        saleId,
        reason,
        refundPayment,
        returnItems: validItems.map(i => ({
          saleItemId: i.saleItemId,
          returnQuantity: Number(i.returnQuantity),
        })),
      };
      await processSaleReturn(saleId, payload);
      showSnackbar('Return processed — downloading credit note', 'success');
      // Best-effort credit-note download.
      try {
        const notes = await findCreditNotesBySale(saleId);
        if (notes && notes.length > 0) {
          const latest = notes[0];
          const signedPath = await getCreditNoteSignedUrl(latest.id);
          await downloadReceiptPdf(
            signedPath,
            `credit_note_${(latest.creditNoteNo || latest.id).toString().replace(/[\/\\]/g, '_')}.pdf`,
          );
        }
      } catch (dlErr) {
        console.warn('Return succeeded but credit-note download failed', dlErr);
      }
      // Refresh the sale so the returnedQty column reflects the update.
      await handleSearch(sale.invoiceNo);
      // Head back to the history if the user came from there — keep them in
      // context after a successful action rather than stranding them on an empty form.
      setTimeout(() => navigate('/sales?tab=history'), 1200);
    } catch (err) {
      console.error('Return submit error:', err);
      showSnackbar(err?.response?.data?.message || 'Return failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Button
        startIcon={<ArrowBackIosNew sx={{ fontSize: '0.8rem !important' }} />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3, color: 'text.secondary', fontWeight: 700, textTransform: 'none' }}
      >
        Back
      </Button>

      <Stack direction="row" alignItems="center" spacing={2} mb={4}>
        <Undo sx={{ color: '#f97316', fontSize: 40 }} />
        <Box>
          <Typography variant="h4" fontWeight={900} color="text.primary">
            {t('salesReturn.title', 'Process Sales Return')}
          </Typography>
          <Typography color="text.secondary">
            {t('salesReturn.subtitle', 'Look up an invoice and issue a credit note against it.')}
          </Typography>
        </Box>
      </Stack>

      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              autoFocus
              fullWidth
              label="Invoice number"
              placeholder="e.g. INV/25-26/00042"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Receipt fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={() => handleSearch()}
              disabled={searching || !query.trim()}
              startIcon={searching ? <CircularProgress size={20} color="inherit" /> : <Search />}
              sx={{ height: 56, borderRadius: 2, fontWeight: 700 }}
            >
              {searching ? 'Searching...' : 'Load Sale'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {searchError && <Alert severity="warning" sx={{ mb: 4, borderRadius: 3 }}>{searchError}</Alert>}

      {sale && (
        <>
          {/* Sale header */}
          <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>INVOICE</Typography>
                  <Typography variant="h6" fontWeight={900} color="primary.main">{sale.invoiceNo}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PersonOutline fontSize="small" color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>CUSTOMER</Typography>
                      <Typography variant="body2" fontWeight={700}>{sale.customerName || sale.customer?.name || 'Walk-in'}</Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarToday fontSize="small" color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>DATE</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {sale.date ? new Date(sale.date).toLocaleDateString('en-IN') : '—'}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={2} sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL</Typography>
                  <Typography variant="h6" fontWeight={900}>{inr(sale.totalAmount || sale.grandTotal)}</Typography>
                </Grid>
              </Grid>
              {sale.status && (
                <Box sx={{ mt: 1 }}>
                  <Chip label={sale.status} size="small" color={sale.status === 'COMPLETED' ? 'success' : 'default'} sx={{ fontWeight: 700 }} />
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Return items table */}
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', mb: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Item</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Sold Qty</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Already Returned</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Available</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Unit Price</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, minWidth: 140 }}>Return Qty</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Refund</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {returnItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.disabled' }}>
                      No line items on this sale.
                    </TableCell>
                  </TableRow>
                ) : returnItems.map((it, idx) => {
                  const lineRefund = (Number(it.returnQuantity) || 0) * it.unitPrice;
                  const canReturn = it.netQty > 0;
                  return (
                    <TableRow key={it.saleItemId} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{it.itemName}</Typography>
                      </TableCell>
                      <TableCell align="right">{it.originalQty}</TableCell>
                      <TableCell align="right">
                        {it.returnedQty > 0 ? (
                          <Chip size="small" label={it.returnedQty} color="warning" variant="outlined" />
                        ) : '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={700} color={canReturn ? 'text.primary' : 'text.disabled'}>
                          {it.netQty}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{inr(it.unitPrice)}</TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={it.returnQuantity || ''}
                          onChange={e => handleQtyChange(idx, e.target.value)}
                          disabled={!canReturn}
                          inputProps={{ min: 0, max: it.netQty, style: { textAlign: 'right' } }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={700} color={lineRefund > 0 ? 'primary.main' : 'text.disabled'}>
                          {inr(lineRefund)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Return options + submit */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <TextField
                  select fullWidth
                  label="Reason for return"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                >
                  <MenuItem value=""><em>Select a reason</em></MenuItem>
                  {RETURN_REASONS.map(r => (
                    <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  sx={{ height: 56 }}
                  control={<Switch checked={refundPayment} onChange={e => setRefundPayment(e.target.checked)} />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={700}>Issue cash refund</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Off → adjusts customer ledger instead
                      </Typography>
                    </Box>
                  }
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL REFUND</Typography>
                  <Typography variant="h5" fontWeight={900} color="primary.main">
                    {inr(totalReturnValue)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" justifyContent="flex-end" spacing={2}>
              <Button variant="outlined" onClick={() => setReturnItems(prev => prev.map(i => ({ ...i, returnQuantity: 0 })))}>
                Reset
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <Send />}
                disabled={submitting || totalReturnValue === 0}
                onClick={handleSubmit}
                sx={{ fontWeight: 700, minWidth: 200 }}
              >
                {submitting ? 'Processing...' : 'Confirm Return'}
              </Button>
            </Stack>
          </Paper>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled">{snackbar.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
