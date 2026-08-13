import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Chip, Table, TableBody, TableCell, TableHead,
  TableRow, TableContainer, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack, CircularProgress, TablePagination, Alert,
  InputAdornment, LinearProgress, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  listSalesOrders,
  approveSalesOrder,
  cancelSalesOrder,
  convertSalesOrderToSale,
  getSalesOrder,
  getSalesOrderSignedUrl,
  downloadReceiptPdf,
} from '../services/api';

const STATUS_COLORS = {
  DRAFT: 'default',
  APPROVED: 'info',
  PARTIALLY_FULFILLED: 'warning',
  FULFILLED: 'success',
  CANCELLED: 'error',
};

const STATUS_LABELS = {
  DRAFT: 'Draft',
  APPROVED: 'Approved',
  PARTIALLY_FULFILLED: 'Partially Fulfilled',
  FULFILLED: 'Fulfilled',
  CANCELLED: 'Cancelled',
};

const STATUS_FILTERS = ['ALL', 'DRAFT', 'APPROVED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED'];
const EDITABLE = new Set(['DRAFT']);
const CONVERTIBLE = new Set(['APPROVED', 'PARTIALLY_FULFILLED']);

const inr = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const SalesOrders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [rows, setRows] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Convert-to-sale dialog (partial fulfillment)
  const [convertTarget, setConvertTarget] = useState(null);
  const [convertLines, setConvertLines] = useState({});
  const [converting, setConverting] = useState(false);

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

  // Deep-link support: /sales-orders?convert=<id> opens the convert dialog on load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const convertId = params.get('convert');
    if (convertId) {
      openConvertDialog({ id: Number(convertId) });
      // Clean the URL so refresh doesn't re-open
      window.history.replaceState({}, '', '/sales-orders');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const filteredRows = rows.filter((so) => {
    if (!searchTerm.trim()) return true;
    const needle = searchTerm.toLowerCase();
    return (
      (so.orderNo || '').toLowerCase().includes(needle) ||
      (so.customer?.name || '').toLowerCase().includes(needle) ||
      (so.customer?.phone || '').toLowerCase().includes(needle)
    );
  });

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

  const openConvertDialog = async (row) => {
    try {
      const res = await getSalesOrder(row.id);
      const so = res?.data?.data || res?.data;
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
      setErrorMsg('Enter a fulfill quantity on at least one line');
      return;
    }
    setConverting(true);
    try {
      const res = await convertSalesOrderToSale(convertTarget.id, { lines });
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
    } finally {
      setConverting(false);
    }
  };

  const convertTotal = convertTarget
    ? (convertTarget.items || []).reduce((sum, it) => {
        const qty = Number(convertLines[it.id] || 0);
        return sum + qty * Number(it.unitPrice || 0);
      }, 0)
    : 0;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} mb={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>Sales Orders</Typography>
            <Typography variant="body2" color="text.secondary">
              Confirmed customer orders. Approve → reserve stock → convert to sale (full or partial).
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Refresh">
              <IconButton onClick={loadData}><RefreshIcon /></IconButton>
            </Tooltip>
            <Button variant="contained" size="large" startIcon={<AddIcon />}
              onClick={() => navigate('/sales-orders/new')}
              sx={{ fontWeight: 700 }}
            >
              New Sales Order
            </Button>
          </Stack>
        </Stack>

        {/* Filters + search */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems={{ md: 'center' }}>
          <TextField size="small"
            placeholder="Search by order number, customer name or phone…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 280, flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ rowGap: 1 }}>
            {STATUS_FILTERS.map((s) => (
              <Chip key={s}
                label={s === 'ALL' ? 'ALL' : STATUS_LABELS[s]}
                onClick={() => { setStatusFilter(s); setPage(0); }}
                color={statusFilter === s ? 'primary' : 'default'}
                variant={statusFilter === s ? 'filled' : 'outlined'}
                size="small"
                sx={{ fontWeight: 700 }} />
            ))}
          </Stack>
        </Stack>

        {errorMsg && <Alert severity="error" onClose={() => setErrorMsg(null)} sx={{ mb: 2 }}>{errorMsg}</Alert>}

        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Order No</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Expected Delivery</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 800, minWidth: 180 }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={22} /></TableCell></TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    {rows.length === 0
                      ? <>No sales orders yet. Click <strong>New Sales Order</strong> to create one.</>
                      : 'No orders match your search.'}
                  </TableCell>
                </TableRow>
              ) : filteredRows.map((so) => {
                const totalQty = (so.items || []).reduce((s, it) => s + Number(it.qty || 0), 0);
                const filledQty = (so.items || []).reduce((s, it) => s + Number(it.fulfilledQty || 0), 0);
                const pct = totalQty > 0 ? (filledQty / totalQty) * 100 : 0;
                const showProgress = ['APPROVED', 'PARTIALLY_FULFILLED', 'FULFILLED'].includes(so.status);

                return (
                  <TableRow key={so.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{so.orderNo}</TableCell>
                    <TableCell>{so.orderDate ? new Date(so.orderDate).toLocaleDateString('en-IN') : '-'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{so.customer?.name || 'Walk-in'}</Typography>
                      {so.customer?.phone && <Typography variant="caption" color="text.secondary">{so.customer.phone}</Typography>}
                    </TableCell>
                    <TableCell>
                      {so.expectedDeliveryDate
                        ? <Typography variant="body2">{new Date(so.expectedDeliveryDate).toLocaleDateString('en-IN')}</Typography>
                        : <Typography variant="body2" color="text.disabled">—</Typography>}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>{inr(so.totalAmount)}</TableCell>
                    <TableCell>
                      <Chip size="small" label={STATUS_LABELS[so.status] || so.status}
                        color={STATUS_COLORS[so.status] || 'default'} sx={{ fontWeight: 700, mb: showProgress ? 0.5 : 0 }} />
                      {showProgress && totalQty > 0 && (
                        <Box sx={{ mt: 0.5 }}>
                          <LinearProgress variant="determinate"
                            value={Math.min(100, pct)}
                            sx={{ height: 4, borderRadius: 2 }}
                            color={pct >= 100 ? 'success' : pct > 0 ? 'warning' : 'primary'}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
                            {filledQty} / {totalQty} fulfilled
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {EDITABLE.has(so.status) ? (
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => navigate(`/sales-orders/${so.id}/edit`)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => navigate(`/sales-orders/${so.id}/edit`)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Download PDF">
                        <IconButton size="small" onClick={() => handleDownload(so)}>
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {so.status === 'DRAFT' && (
                        <Tooltip title="Approve (reserve stock)">
                          <IconButton size="small" color="success"
                            onClick={() => guarded(() => approveSalesOrder(so.id), 'Approve')}>
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {CONVERTIBLE.has(so.status) && (
                        <Tooltip title="Convert to Sale">
                          <IconButton size="small" color="primary" onClick={() => openConvertDialog(so)}>
                            <ArrowForwardIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {(so.status === 'DRAFT' || so.status === 'APPROVED' || so.status === 'PARTIALLY_FULFILLED') && (
                        <Tooltip title="Cancel">
                          <IconButton size="small" color="error"
                            onClick={() => guarded(() => cancelSalesOrder(so.id), 'Cancel')}>
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
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

      {/* Convert-to-Sale dialog (partial fulfillment) */}
      <Dialog open={convertTarget !== null}
        onClose={() => !converting && setConvertTarget(null)}
        maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Convert to Sale — {convertTarget?.orderNo}
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            Enter the quantity to fulfill on each line. Leave 0 to skip a line for now — you can convert the rest later. A DRAFT sale will be created for the selected quantities.
          </Alert>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Item</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Ordered</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Already Fulfilled</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Remaining</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, minWidth: 130 }}>Fulfill Now</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Line Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(convertTarget?.items || []).map((it) => {
                  const remaining = Math.max(0, Number(it.qty || 0) - Number(it.fulfilledQty || 0));
                  const qty = Number(convertLines[it.id] || 0);
                  const value = qty * Number(it.unitPrice || 0);
                  return (
                    <TableRow key={it.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{it.itemName}</Typography>
                        <Typography variant="caption" color="text.secondary">{inr(it.unitPrice)} / unit</Typography>
                      </TableCell>
                      <TableCell align="right">{it.qty}</TableCell>
                      <TableCell align="right">
                        {Number(it.fulfilledQty || 0) > 0
                          ? <Chip size="small" label={it.fulfilledQty} color="warning" variant="outlined" />
                          : '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={700} color={remaining > 0 ? 'text.primary' : 'text.disabled'}>
                          {remaining}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <TextField size="small" type="number"
                          value={convertLines[it.id] ?? ''}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const parsed = raw === '' ? 0 : Math.max(0, Math.min(remaining, Number(raw)));
                            setConvertLines((prev) => ({ ...prev, [it.id]: parsed }));
                          }}
                          inputProps={{ min: 0, max: remaining, style: { textAlign: 'right' } }}
                          disabled={remaining === 0}
                          sx={{ width: 100 }} />
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={700} color={value > 0 ? 'primary.main' : 'text.disabled'}>
                          {inr(value)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" justifyContent="space-between" alignItems="baseline">
            <Typography variant="subtitle1" fontWeight={800}>Draft Sale Value (excl. tax)</Typography>
            <Typography variant="h6" fontWeight={900} color="primary.main">{inr(convertTotal)}</Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Tax + discounts + shipping will be recalculated on the resulting sale.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConvertTarget(null)} disabled={converting}>Cancel</Button>
          <Button variant="contained" onClick={submitConvert}
            disabled={converting || convertTotal <= 0}
            startIcon={converting ? <CircularProgress size={16} color="inherit" /> : <ArrowForwardIcon />}>
            {converting ? 'Converting…' : 'Create Draft Sale'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesOrders;
