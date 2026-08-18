import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Container, Paper, Stack, Typography, Chip, Button, IconButton,
  TextField, InputAdornment, Skeleton, Alert, Snackbar, Menu, MenuItem, Divider, Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  HourglassBottom as HourglassIcon,
  CheckCircleOutline as AppliedIcon,
  AttachMoney as MoneyIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  MoreVert as MoreIcon,
  FilterAltOff as FilterClearIcon,
  PriceChange as ApplyIcon,
  Email as EmailIcon,
  AccountBalanceWallet as RefundIcon,
} from '@mui/icons-material';

import {
  listCreditNotes, getCreditNoteSignedUrl, downloadReceiptPdf,
  cancelCreditNote, fetchCustomers,
} from '../../services/api';

const formatInr = (val) =>
  Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 });

const formatDate = (val) => {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return '—'; }
};

const STATUS_META = {
  ISSUED:            { label: 'Open',               tone: 'info' },
  PARTIALLY_APPLIED: { label: 'Partially applied',  tone: 'warning' },
  FULLY_APPLIED:     { label: 'Closed',             tone: 'success' },
  CANCELLED:         { label: 'Cancelled',          tone: 'error' },
};
const STATUS_ORDER = ['ISSUED', 'PARTIALLY_APPLIED', 'FULLY_APPLIED', 'CANCELLED'];

const REASON_LABELS = {
  SALES_RETURN:       'Sales Return',
  POST_SALE_DISCOUNT: 'Post-sale Discount',
  DEFECTIVE_GOODS:    'Defective Goods',
  INVOICE_CORRECTION: 'Invoice Correction',
  OTHER:              'Other',
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

const FilterChip = ({ active, onClick, label, count, color }) => (
  <Chip label={<Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
    {label}
    <Box component="span" sx={{ opacity: 0.7, fontWeight: 500 }}>{count}</Box>
  </Box>}
    size="small" onClick={onClick} clickable
    variant={active ? 'filled' : 'outlined'}
    sx={{
      fontWeight: 600, borderRadius: 1,
      bgcolor: active ? (color || 'primary.main') : 'transparent',
      color: active ? 'common.white' : 'text.primary',
      borderColor: color || 'divider',
    }} />
);

const StatusPill = ({ status }) => {
  const meta = STATUS_META[status] || { label: status || 'Open', tone: 'default' };
  return <Chip label={meta.label} size="small"
    color={meta.tone === 'default' ? undefined : meta.tone}
    variant={meta.tone === 'default' ? 'outlined' : 'filled'}
    sx={{ fontWeight: 700, borderRadius: 1, letterSpacing: 0.3, fontSize: '0.72rem' }} />;
};

const CreditNotesListPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [customerFilter, setCustomerFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [rowMenu, setRowMenu] = useState({ anchor: null, row: null });

  const showMessage = (message, severity = 'info') => setSnackbar({ open: true, message, severity });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [cnPage, cRes] = await Promise.all([
        listCreditNotes(0, 500),
        fetchCustomers().catch(() => ({ data: [] })),
      ]);
      const payload = cnPage?.data ?? cnPage;
      setRows(payload?.content ?? []);
      const cData = cRes?.data ?? cRes ?? [];
      setCustomers(Array.isArray(cData) ? cData : (cData?.content ?? []));
    } catch (e) {
      showMessage('Failed to load credit notes', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : null;
    const to = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : null;
    return (rows || []).filter((r) => {
      if (q) {
        const hay = [r.creditNoteNo, r.customer?.name, r.invoiceNo, r.reason, r.reasonCode]
          .filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (customerFilter && String(r.customer?.id) !== String(customerFilter)) return false;
      if (reasonFilter && r.reasonCode !== reasonFilter) return false;
      const t = r.creditNoteDate ? new Date(r.creditNoteDate).getTime() : 0;
      if (from != null && t < from) return false;
      if (to != null && t > to) return false;
      return true;
    });
  }, [rows, searchText, statusFilter, customerFilter, reasonFilter, dateFrom, dateTo]);

  const counts = useMemo(() => {
    const c = { ALL: rows.length };
    STATUS_ORDER.forEach((s) => { c[s] = 0; });
    (rows || []).forEach((r) => { if (c[r.status] != null) c[r.status] += 1; });
    return c;
  }, [rows]);

  const kpi = useMemo(() => {
    let issued = 0, applied = 0, outstanding = 0, monthApplied = 0;
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    (rows || []).forEach((r) => {
      if (r.status === 'CANCELLED') return;
      const total = Number(r.totalAmount || 0);
      const app = Number(r.appliedAmount || 0);
      issued += total; applied += app; outstanding += (total - app);
      const t = r.creditNoteDate ? new Date(r.creditNoteDate).getTime() : 0;
      if (t >= monthStart) monthApplied += app;
    });
    return { issued, applied, outstanding, monthApplied };
  }, [rows]);

  const clearFilters = () => {
    setSearchText(''); setStatusFilter('ALL'); setCustomerFilter('');
    setReasonFilter(''); setDateFrom(''); setDateTo('');
  };
  const filtersActive = !!(searchText || statusFilter !== 'ALL' || customerFilter
    || reasonFilter || dateFrom || dateTo);

  const handleDownload = async (row) => {
    try {
      const signedPath = await getCreditNoteSignedUrl(row.id);
      await downloadReceiptPdf(signedPath,
        `credit_note_${(row.creditNoteNo || row.id).toString().replace(/[\/\\]/g, '_')}.pdf`);
    } catch { showMessage('Failed to download PDF', 'error'); }
  };

  const handleView = (row) => navigate(`/credit-notes/${row.id}`);

  const handleCancel = async (row) => {
    const note = window.prompt('Reason for cancellation?', '');
    if (note == null) return;
    try {
      await cancelCreditNote(row.id, note);
      showMessage('Credit note cancelled.', 'info');
      refresh();
    } catch (e) { showMessage(e?.response?.data?.message || 'Cancel failed', 'error'); }
  };

  const handleEmail = async (row) => {
    try {
      const path = await getCreditNoteSignedUrl(row.id);
      const abs = path ? (path.startsWith('http') ? path : `${window.location.origin}${path}`) : '';
      const subject = encodeURIComponent(`Credit Note ${row.creditNoteNo || ''}`);
      const body = encodeURIComponent(
        [`Credit Note ${row.creditNoteNo || ''}`,
         `Customer: ${row.customer?.name || '—'}`,
         `Date: ${formatDate(row.creditNoteDate)}`,
         `Total: INR ${formatInr(row.totalAmount)}`,
         abs ? `\nPDF: ${abs}` : null].filter(Boolean).join('\n'));
      window.location.href = `mailto:${row?.customer?.email || ''}?subject=${subject}&body=${body}`;
    } catch { showMessage('Failed', 'error'); }
  };

  const columns = useMemo(() => [
    {
      field: 'creditNoteNo', headerName: 'CN #', flex: 1, minWidth: 160,
      renderCell: (p) => (
        <Box onClick={(e) => { e.stopPropagation(); handleView(p.row); }}
          sx={{ cursor: 'pointer', '&:hover .cn-link': { textDecoration: 'underline' } }}>
          <Typography variant="body2" fontWeight={700} noWrap className="cn-link"
            sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
            {p.value}
          </Typography>
        </Box>
      ),
    },
    { field: 'creditNoteDate', headerName: 'Date', flex: 0.7, minWidth: 120,
      renderCell: (p) => formatDate(p.value) },
    {
      field: 'customerName', headerName: 'Customer', flex: 1.2, minWidth: 160,
      valueGetter: (p) => p?.row?.customer?.name || '—',
    },
    {
      field: 'invoiceNo', headerName: 'Against Invoice', flex: 0.9, minWidth: 140,
      renderCell: (p) => <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
        {p.value || '—'}
      </Typography>,
    },
    {
      field: 'reasonCode', headerName: 'Reason', flex: 0.9, minWidth: 140,
      renderCell: (p) => <Tooltip title={p.row.reason || ''}>
        <Typography variant="body2" color="text.secondary" noWrap>
          {REASON_LABELS[p.value] || p.row.reason || '—'}
        </Typography>
      </Tooltip>,
    },
    { field: 'totalAmount', headerName: 'Total', flex: 0.7, minWidth: 110,
      align: 'right', headerAlign: 'right',
      renderCell: (p) => <Typography variant="body2" fontWeight={700}>INR {formatInr(p.value)}</Typography> },
    { field: 'appliedAmount', headerName: 'Applied', flex: 0.7, minWidth: 100,
      align: 'right', headerAlign: 'right',
      renderCell: (p) => `INR ${formatInr(p.value)}` },
    {
      field: 'outstanding', headerName: 'Remaining', flex: 0.8, minWidth: 120,
      align: 'right', headerAlign: 'right',
      valueGetter: (p) => Number(p?.row?.totalAmount || 0) - Number(p?.row?.appliedAmount || 0),
      renderCell: (p) => <Typography variant="body2" fontWeight={700}
        color={Number(p.value) > 0 ? 'warning.main' : 'text.secondary'}>
        INR {formatInr(p.value)}
      </Typography>,
    },
    { field: 'status', headerName: 'Status', flex: 0.9, minWidth: 140,
      renderCell: (p) => <StatusPill status={p.value} /> },
    {
      field: 'actions', headerName: '', width: 60,
      sortable: false, filterable: false, disableColumnMenu: true,
      align: 'right', headerAlign: 'right',
      renderCell: (params) => (
        <IconButton size="small"
          onClick={(e) => { e.stopPropagation(); setRowMenu({ anchor: e.currentTarget, row: params.row }); }}>
          <MoreIcon fontSize="small" />
        </IconButton>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [navigate]);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ pt: 3, pb: 4 }}>
        <Snackbar open={snackbar.open} autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
        </Snackbar>

        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.4 }}>
              Credit Notes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Every credit issued to a customer — from sales returns, post-sale discounts, or invoice corrections. Apply against unpaid invoices or refund the remaining balance.
            </Typography>
          </Box>
        </Stack>

        <Paper elevation={0} sx={{
          mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden',
        }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          }}>
            <KpiCell icon={<ReceiptIcon fontSize="small" />} label="TOTAL ISSUED"
              value={`INR ${formatInr(kpi.issued)}`} color={theme.palette.primary.main} divider />
            <KpiCell icon={<AppliedIcon fontSize="small" />} label="APPLIED"
              value={`INR ${formatInr(kpi.applied)}`} color={theme.palette.success.main} divider />
            <KpiCell icon={<HourglassIcon fontSize="small" />} label="REMAINING"
              value={`INR ${formatInr(kpi.outstanding)}`} color={theme.palette.warning.main} divider />
            <KpiCell icon={<MoneyIcon fontSize="small" />} label="APPLIED THIS MONTH"
              value={`INR ${formatInr(kpi.monthApplied)}`} color={theme.palette.info.main} />
          </Box>
        </Paper>

        <Paper elevation={0} sx={{
          p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider',
        }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} flexWrap="wrap">
            <TextField size="small" placeholder="Search CN #, customer, invoice, reason…"
              value={searchText} onChange={(e) => setSearchText(e.target.value)}
              sx={{ minWidth: { xs: '100%', md: 300 } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment> }} />
            <TextField select size="small" label="Customer"
              value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)}
              sx={{ minWidth: { xs: '100%', md: 180 } }}
              InputLabelProps={{ shrink: true }}
              SelectProps={{ native: true, displayEmpty: true }}>
              <option value="">All customers</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </TextField>
            <TextField select size="small" label="Reason"
              value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)}
              sx={{ minWidth: { xs: '100%', md: 180 } }}
              InputLabelProps={{ shrink: true }}
              SelectProps={{ native: true, displayEmpty: true }}>
              <option value="">All reasons</option>
              {Object.entries(REASON_LABELS).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </TextField>
            <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }}
              value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              sx={{ minWidth: { xs: '100%', md: 140 } }} />
            <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }}
              value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              sx={{ minWidth: { xs: '100%', md: 140 } }} />
            {filtersActive && (
              <Button size="small" variant="text" startIcon={<FilterClearIcon fontSize="small" />}
                onClick={clearFilters}
                sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
                Clear
              </Button>
            )}
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
            <FilterChip active={statusFilter === 'ALL'} onClick={() => setStatusFilter('ALL')}
              label="All" count={counts.ALL || 0} />
            {STATUS_ORDER.map((s) => (
              <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}
                label={STATUS_META[s].label} count={counts[s] || 0}
                color={theme.palette[STATUS_META[s].tone === 'default' ? 'grey' : STATUS_META[s].tone]?.main} />
            ))}
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{
          borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden',
        }}>
          {loading ? (
            <Box sx={{ p: 2 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="rectangular" height={54} sx={{ mb: 1, borderRadius: 1 }} />
              ))}
            </Box>
          ) : (
            <DataGrid
              autoHeight rows={filtered} columns={columns} getRowId={(row) => row.id}
              disableRowSelectionOnClick rowHeight={54}
              onRowClick={(params) => handleView(params.row)}
              initialState={{
                pagination: { paginationModel: { pageSize: 25 } },
                sorting: { sortModel: [{ field: 'creditNoteDate', sort: 'desc' }] },
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              sx={{
                border: 0,
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: alpha(theme.palette.text.primary, 0.04),
                  textTransform: 'uppercase',
                  fontSize: '0.72rem', letterSpacing: 0.5, color: 'text.secondary', fontWeight: 700,
                },
                '& .MuiDataGrid-row': { cursor: 'pointer' },
                '& .MuiDataGrid-row:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
              }}
              localeText={{
                noRowsLabel: filtersActive
                  ? 'No credit notes match your filters.'
                  : 'No credit notes yet. They\'re auto-issued on sales returns / post-sale discounts.',
              }}
            />
          )}
        </Paper>

        <Menu anchorEl={rowMenu.anchor} open={Boolean(rowMenu.anchor)}
          onClose={() => setRowMenu({ anchor: null, row: null })}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
          <MenuItem onClick={() => { handleView(rowMenu.row); setRowMenu({ anchor: null, row: null }); }}>
            <ViewIcon fontSize="small" sx={{ mr: 1 }} /> View details
          </MenuItem>
          <MenuItem onClick={() => { handleDownload(rowMenu.row); setRowMenu({ anchor: null, row: null }); }}>
            <DownloadIcon fontSize="small" sx={{ mr: 1 }} /> Download PDF
          </MenuItem>
          <MenuItem onClick={() => { handleEmail(rowMenu.row); setRowMenu({ anchor: null, row: null }); }}>
            <EmailIcon fontSize="small" sx={{ mr: 1 }} /> Email customer
          </MenuItem>
          <Divider />
          {rowMenu.row?.status !== 'CANCELLED'
              && Number(rowMenu.row?.totalAmount || 0) > Number(rowMenu.row?.appliedAmount || 0) && (
            <MenuItem onClick={() => { handleView(rowMenu.row); setRowMenu({ anchor: null, row: null }); }}>
              <ApplyIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} /> Apply to invoice
            </MenuItem>
          )}
          {rowMenu.row?.status !== 'CANCELLED'
              && !rowMenu.row?.refunded
              && Number(rowMenu.row?.totalAmount || 0) > Number(rowMenu.row?.appliedAmount || 0) && (
            <MenuItem onClick={() => { handleView(rowMenu.row); setRowMenu({ anchor: null, row: null }); }}>
              <RefundIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }} /> Record refund
            </MenuItem>
          )}
          {rowMenu.row?.status !== 'CANCELLED' && Number(rowMenu.row?.appliedAmount || 0) === 0 && (
            <MenuItem onClick={() => { handleCancel(rowMenu.row); setRowMenu({ anchor: null, row: null }); }}>
              <CancelIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} /> Cancel credit note
            </MenuItem>
          )}
        </Menu>
      </Container>
    </Box>
  );
};

export default CreditNotesListPage;
