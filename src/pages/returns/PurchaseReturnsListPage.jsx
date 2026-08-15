import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Container, Paper, Stack, Typography, Chip, Button, IconButton,
  TextField, InputAdornment, Skeleton, Alert, Snackbar, Menu, MenuItem, Divider, Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Undo as UndoIcon,
  HourglassBottom as PendingIcon,
  CheckCircleOutline as ApprovedIcon,
  Cancel as CancelledIcon,
  AttachMoney as MoneyIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  MoreVert as MoreIcon,
  FilterAltOff as FilterClearIcon,
  Email as EmailIcon,
} from '@mui/icons-material';

import CustomToolbar from '../items/components/CustomToolbar';
import {
  fetchPurchaseReturns, approvePurchaseReturn, cancelPurchaseReturn,
  getSuppliers, getPurchaseReturnSignedUrl,
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
  DRAFT:     { label: 'Draft',     tone: 'default' },
  APPROVED:  { label: 'Approved',  tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'error' },
};

const STATUS_ORDER = ['DRAFT', 'APPROVED', 'CANCELLED'];

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

const FilterChip = ({ active, onClick, label, count, color }) => (
  <Chip
    label={<Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
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
    }}
  />
);

const StatusPill = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, tone: 'default' };
  return (
    <Chip label={meta.label} size="small"
      color={meta.tone === 'default' ? undefined : meta.tone}
      variant={meta.tone === 'default' ? 'outlined' : 'filled'}
      sx={{ fontWeight: 700, borderRadius: 1, letterSpacing: 0.3, fontSize: '0.72rem' }} />
  );
};

const PurchaseReturnsListPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [searchText, setSearchText] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [rowMenu, setRowMenu] = useState({ anchor: null, row: null });

  const showMessage = (message, severity = 'info') => setSnackbar({ open: true, message, severity });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [data, sups] = await Promise.all([
        fetchPurchaseReturns(supplierFilter || null, 0, 200),
        getSuppliers().catch(() => []),
      ]);
      const list = data?.content || (Array.isArray(data) ? data : []);
      setRows(list);
      setSuppliers(sups || []);
    } catch (e) {
      showMessage('Failed to load purchase returns', 'error');
    } finally { setLoading(false); }
  }, [supplierFilter]);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : null;
    const to = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : null;
    return (rows || []).filter((r) => {
      if (q) {
        const hay = [r.returnNo, r.supplierName, r.notes].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      const t = r.returnDate ? new Date(r.returnDate).getTime() : 0;
      if (from != null && t < from) return false;
      if (to != null && t > to) return false;
      return true;
    });
  }, [rows, searchText, statusFilter, dateFrom, dateTo]);

  const counts = useMemo(() => {
    const c = { ALL: rows.length };
    STATUS_ORDER.forEach((s) => { c[s] = 0; });
    (rows || []).forEach((r) => { if (c[r.status] != null) c[r.status] += 1; });
    return c;
  }, [rows]);

  const kpi = useMemo(() => {
    let draftValue = 0, approvedValue = 0;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    let thisMonth = 0;
    (rows || []).forEach((r) => {
      const v = Number(r.totalAmount || 0);
      if (r.status === 'DRAFT') draftValue += v;
      if (r.status === 'APPROVED') {
        approvedValue += v;
        const d = r.returnDate ? new Date(r.returnDate).getTime() : 0;
        if (d >= monthStart) thisMonth += v;
      }
    });
    return {
      draftCount: counts.DRAFT || 0,
      approvedCount: counts.APPROVED || 0,
      cancelledCount: counts.CANCELLED || 0,
      draftValue, approvedValue, thisMonth,
    };
  }, [rows, counts]);

  const handleApprove = async (row) => {
    if (!row?.id) return;
    if (!window.confirm(`Approve return ${row.returnNo}? This deducts stock and issues a debit note.`)) return;
    try {
      await approvePurchaseReturn(row.id);
      showMessage('Approved — debit note issued.', 'success');
      refresh();
    } catch (e) { showMessage(e?.response?.data?.message || 'Approval failed', 'error'); }
  };
  const handleCancel = async (row) => {
    if (!row?.id || !window.confirm(`Cancel draft return ${row.returnNo}?`)) return;
    try {
      await cancelPurchaseReturn(row.id);
      showMessage('Cancelled.', 'info');
      refresh();
    } catch (e) { showMessage('Cancel failed', 'error'); }
  };
  const handlePrint = async (row) => {
    if (!row?.id) return;
    try {
      const path = await getPurchaseReturnSignedUrl(row.id);
      if (path) window.open(path, '_blank', 'noopener,noreferrer');
    } catch { showMessage('Failed to open PDF', 'error'); }
  };
  const handleEmail = async (row) => {
    try {
      const path = await getPurchaseReturnSignedUrl(row.id);
      const abs = path ? (path.startsWith('http') ? path : `${window.location.origin}${path}`) : '';
      const subject = encodeURIComponent(`Goods Return Note ${row.returnNo || ''}`);
      const body = encodeURIComponent(
        [`Return ${row.returnNo || ''}`,
         `Supplier: ${row.supplierName || '—'}`,
         `Date: ${formatDate(row.returnDate)}`,
         `Total: ₹${formatInr(row.totalAmount)}`,
         abs ? `\nPDF: ${abs}` : null].filter(Boolean).join('\n'));
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    } catch { showMessage('Failed', 'error'); }
  };

  const clearFilters = () => {
    setSearchText(''); setSupplierFilter(''); setStatusFilter('ALL');
    setDateFrom(''); setDateTo('');
  };
  const filtersActive = !!(searchText || supplierFilter || statusFilter !== 'ALL' || dateFrom || dateTo);

  const columns = useMemo(() => [
    {
      field: 'returnNo', headerName: 'Return #', flex: 1, minWidth: 150,
      renderCell: (params) => (
        <Box onClick={(e) => { e.stopPropagation(); navigate(`/purchase-returns/${params.row.id}`); }}
          sx={{ cursor: 'pointer', '&:hover .rt-link': { textDecoration: 'underline' } }}>
          <Typography variant="body2" fontWeight={700} noWrap className="rt-link"
            sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    { field: 'supplierName', headerName: 'Supplier', flex: 1.2, minWidth: 160 },
    { field: 'returnDate', headerName: 'Return date', flex: 0.7, minWidth: 120,
      renderCell: (p) => formatDate(p.value) },
    { field: 'totalAmount', headerName: 'Value', flex: 0.7, minWidth: 110,
      align: 'right', headerAlign: 'right',
      renderCell: (p) => <Typography variant="body2" fontWeight={700}>₹{formatInr(p.value)}</Typography> },
    { field: 'status', headerName: 'Status', flex: 0.7, minWidth: 120,
      renderCell: (p) => <StatusPill status={p.value} /> },
    { field: 'notes', headerName: 'Notes', flex: 1.2, minWidth: 160,
      renderCell: (p) => (
        <Tooltip title={p.value || ''}>
          <Typography variant="body2" color="text.secondary" noWrap>{p.value || '—'}</Typography>
        </Tooltip>
      ) },
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
              Purchase Returns / Debit Notes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Return items to suppliers. Approving deducts stock and issues a debit note against the supplier's account.
            </Typography>
          </Box>
          <Button variant="contained" size="small" startIcon={<AddIcon />}
            onClick={() => navigate('/purchase-returns/new')}
            sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none',
                  boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}>
            New return
          </Button>
        </Stack>

        <Paper elevation={0} sx={{
          mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden',
        }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
          }}>
            <KpiCell icon={<PendingIcon fontSize="small" />} label="DRAFT"
              value={kpi.draftCount} color={theme.palette.warning.main} divider />
            <KpiCell icon={<ApprovedIcon fontSize="small" />} label="APPROVED"
              value={kpi.approvedCount} color={theme.palette.success.main} divider />
            <KpiCell icon={<CancelledIcon fontSize="small" />} label="CANCELLED"
              value={kpi.cancelledCount} color={theme.palette.error.main} divider />
            <KpiCell icon={<MoneyIcon fontSize="small" />} label="APPROVED VALUE"
              value={`₹${formatInr(kpi.approvedValue)}`} color={theme.palette.primary.main} divider />
            <KpiCell icon={<UndoIcon fontSize="small" />} label="THIS MONTH"
              value={`₹${formatInr(kpi.thisMonth)}`} color={theme.palette.info.main} />
          </Box>
        </Paper>

        <Paper elevation={0} sx={{
          p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider',
        }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
            <TextField size="small" placeholder="Search return #, supplier, notes…"
              value={searchText} onChange={(e) => setSearchText(e.target.value)}
              sx={{ minWidth: { xs: '100%', md: 320 } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment> }} />
            <TextField select size="small" label="Supplier"
              value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}
              sx={{ minWidth: { xs: '100%', md: 200 } }}
              SelectProps={{ native: true }}>
              <option value="">All suppliers</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </TextField>
            <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }}
              value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              sx={{ minWidth: { xs: '100%', md: 150 } }} />
            <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }}
              value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              sx={{ minWidth: { xs: '100%', md: 150 } }} />
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
              onRowClick={(params) => navigate(`/purchase-returns/${params.row.id}`)}
              initialState={{
                pagination: { paginationModel: { pageSize: 25 } },
                sorting: { sortModel: [{ field: 'returnDate', sort: 'desc' }] },
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              slots={{ toolbar: CustomToolbar }}
              slotProps={{ toolbar: { quickFilterProps: { debounceMs: 300 } } }}
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
                  ? 'No returns match your filters.'
                  : 'No purchase returns yet. Click New return to create one.',
              }}
            />
          )}
        </Paper>

        <Menu anchorEl={rowMenu.anchor} open={Boolean(rowMenu.anchor)}
          onClose={() => setRowMenu({ anchor: null, row: null })}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
          <MenuItem onClick={() => { navigate(`/purchase-returns/${rowMenu.row?.id}`); setRowMenu({ anchor: null, row: null }); }}>
            <ViewIcon fontSize="small" sx={{ mr: 1 }} /> View details
          </MenuItem>
          <MenuItem onClick={() => { handlePrint(rowMenu.row); setRowMenu({ anchor: null, row: null }); }}>
            <PrintIcon fontSize="small" sx={{ mr: 1 }} /> Print / Save PDF
          </MenuItem>
          <MenuItem onClick={() => { handleEmail(rowMenu.row); setRowMenu({ anchor: null, row: null }); }}>
            <EmailIcon fontSize="small" sx={{ mr: 1 }} /> Email supplier
          </MenuItem>
          {rowMenu.row?.status === 'DRAFT' && [
            <Divider key="d1" />,
            <MenuItem key="approve" onClick={() => { handleApprove(rowMenu.row); setRowMenu({ anchor: null, row: null }); }}>
              <ApprovedIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} /> Approve + issue debit note
            </MenuItem>,
            <MenuItem key="cancel" onClick={() => { handleCancel(rowMenu.row); setRowMenu({ anchor: null, row: null }); }}>
              <CancelledIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} /> Cancel draft
            </MenuItem>,
          ]}
        </Menu>
      </Container>
    </Box>
  );
};

export default PurchaseReturnsListPage;
