import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import {
  Container, Typography, Box, Snackbar, Alert, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, InputAdornment, Stack, Paper, Chip,
  IconButton, Skeleton, MenuItem, Menu, Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Inventory2 as InventoryIcon,
  HourglassBottom as HourglassIcon,
  AttachMoney as MoneyIcon,
  ReportProblem as OverageIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  ReportGmailerrorred as TicketIcon,
  FilterAltOff as FilterClearIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';

import CustomToolbar from '../items/components/CustomToolbar';
import {
  fetchReceiving,
  getReceivingSignedUrl,
} from '../../services/api';

const formatInr = (val) =>
  Number(val || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });

const formatDate = (val) => {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return '—';
  }
};

const STATUS_META = {
  DRAFT:              { label: 'Draft',              tone: 'default' },
  PENDING:            { label: 'Pending',            tone: 'info' },
  PARTIALLY_RECEIVED: { label: 'Partially received', tone: 'warning' },
  COMPLETED:          { label: 'Completed',          tone: 'success' },
  DEFAULT:            { label: 'Pending',            tone: 'info' },
};

const STATUS_ORDER = ['DRAFT', 'PENDING', 'PARTIALLY_RECEIVED', 'COMPLETED'];

const KpiCell = ({ icon, label, value, color, divider }) => (
  <Box sx={{
    p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
    borderRight: divider ? '1px solid' : 'none',
    borderColor: 'divider',
    minWidth: 0,
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
      <Typography variant="h6" fontWeight={700} color="text.primary"
        sx={{ lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

const FilterChip = ({ active, onClick, label, count, color }) => (
  <Chip
    label={
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
        {label}
        <Box component="span" sx={{ opacity: 0.7, fontWeight: 500 }}>{count}</Box>
      </Box>
    }
    size="small" onClick={onClick} clickable
    variant={active ? 'filled' : 'outlined'}
    sx={{
      fontWeight: 600, borderRadius: 1,
      bgcolor: active ? (color || 'primary.main') : 'transparent',
      color: active ? 'common.white' : 'text.primary',
      borderColor: color || 'divider',
      '&:hover': {
        bgcolor: active
          ? (color || 'primary.main')
          : (color ? alpha(color, 0.08) : 'action.hover'),
      },
    }}
  />
);

const StatusPill = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, tone: 'default' };
  return (
    <Chip
      label={meta.label}
      size="small"
      color={meta.tone === 'default' ? undefined : meta.tone}
      variant={meta.tone === 'default' ? 'outlined' : 'filled'}
      sx={{ fontWeight: 700, borderRadius: 1, letterSpacing: 0.3, fontSize: '0.72rem' }}
    />
  );
};

// Item + overage tallies come from receivingItems on each row.
const itemCounts = (row) => {
  const items = row?.receivingItems || [];
  const totalLines = items.length;
  const overageLines = items.filter((it) => it?.isOveraged).length;
  const grnValue = items.reduce((sum, it) => {
    const qty = (it?.receivedQty || 0) + (it?.damagedQty || 0) + (it?.rejectedQty || 0);
    return sum + qty * Number(it?.unitCost || 0);
  }, 0);
  return { totalLines, overageLines, grnValue };
};

const isSameDay = (d) => {
  if (!d) return false;
  const a = new Date(d);
  const now = new Date();
  return a.getFullYear() === now.getFullYear()
    && a.getMonth() === now.getMonth()
    && a.getDate() === now.getDate();
};

const ReceivingListPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [rowMenu, setRowMenu] = useState({ anchor: null, row: null });
  const openRowMenu = (event, row) => setRowMenu({ anchor: event.currentTarget, row });
  const closeRowMenu = () => setRowMenu({ anchor: null, row: null });

  const showMessage = (message, severity = 'info') => setSnackbar({ open: true, message, severity });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchReceiving();
      const list = Array.isArray(data) ? data : data?.content || [];
      setRows(list);
    } catch (err) {
      showMessage('Failed to load receivings', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // ?poId from the PO detail "Receive Items" button routes users into a new GRN.
  useEffect(() => {
    const poId = searchParams.get('poId');
    if (poId) {
      navigate(`/receivings/new?poId=${poId}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openView = (row) => navigate(`/receivings/${row.id}`);
  const openCreate = () => navigate('/receivings/new');

  const handlePrint = async (row) => {
    if (!row?.id) return;
    try {
      const path = await getReceivingSignedUrl(row.id);
      if (path) window.open(path, '_blank', 'noopener,noreferrer');
    } catch (e) {
      showMessage('Failed to open GRN PDF', 'error');
    }
  };

  const handleEmail = async (row) => {
    if (!row?.id) return;
    try {
      const path = await getReceivingSignedUrl(row.id);
      const abs = path ? (path.startsWith('http') ? path : `${window.location.origin}${path}`) : '';
      const subject = encodeURIComponent(`Goods Receipt Note ${row.grNumber || ''}`);
      const body = encodeURIComponent(
        [
          `GRN ${row.grNumber || ''}`,
          `PO: ${row.poNumber || '—'}`,
          `Received on: ${formatDate(row.receivedAt)}`,
          abs ? `\nPDF: ${abs}` : null,
        ].filter(Boolean).join('\n')
      );
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    } catch {
      showMessage('Failed to prepare email link', 'error');
    }
  };

  const handleRaiseTicket = (row) => {
    if (row?.id) navigate(`/receivings/${row.id}?openTicket=1`);
  };

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : null;
    const to = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : null;
    return (rows || []).filter((r) => {
      if (q) {
        const hay = [r.grNumber, r.poNumber, r.supplier?.name, r.supplierInvoiceNo]
          .filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (from != null) {
        const t = r.receivedAt ? new Date(r.receivedAt).getTime() : 0;
        if (t < from) return false;
      }
      if (to != null) {
        const t = r.receivedAt ? new Date(r.receivedAt).getTime() : 0;
        if (t > to) return false;
      }
      return true;
    });
  }, [rows, searchText, statusFilter, dateFrom, dateTo]);

  const statusCounts = useMemo(() => {
    const counts = { ALL: rows.length };
    STATUS_ORDER.forEach((s) => { counts[s] = 0; });
    (rows || []).forEach((r) => {
      if (counts[r.status] != null) counts[r.status] += 1;
    });
    return counts;
  }, [rows]);

  const kpi = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    let todayCount = 0, pendingCount = 0, monthValue = 0, overageWeek = 0;
    const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    (rows || []).forEach((r) => {
      if (isSameDay(r.receivedAt)) todayCount += 1;
      if (r.status === 'DRAFT' || r.status === 'PENDING' || r.status === 'PARTIALLY_RECEIVED') pendingCount += 1;
      const receivedMs = r.receivedAt ? new Date(r.receivedAt).getTime() : 0;
      const { grnValue, overageLines } = itemCounts(r);
      if (receivedMs >= monthStart) monthValue += grnValue;
      if (receivedMs >= weekAgo && overageLines > 0) overageWeek += 1;
    });
    return { todayCount, pendingCount, monthValue, overageWeek };
  }, [rows]);

  const clearFilters = () => {
    setSearchText('');
    setStatusFilter('ALL');
    setDateFrom('');
    setDateTo('');
  };
  const filtersActive = !!(searchText || statusFilter !== 'ALL' || dateFrom || dateTo);

  const columns = useMemo(() => [
    {
      field: 'grNumber',
      headerName: 'GRN #',
      flex: 1, minWidth: 160,
      renderCell: (params) => (
        <Box
          onClick={(e) => { e.stopPropagation(); openView(params.row); }}
          sx={{
            display: 'flex', alignItems: 'center', cursor: 'pointer',
            '&:hover .grn-link': { textDecoration: 'underline' },
          }}
        >
          <Typography
            variant="body2" fontWeight={700} noWrap className="grn-link"
            sx={{ fontFamily: 'monospace', color: 'primary.main' }}
          >
            {params.value || '—'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'poNumber',
      headerName: 'PO #',
      flex: 0.9, minWidth: 130,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" noWrap sx={{ fontFamily: 'monospace' }}>
          {params.value || '—'}
        </Typography>
      ),
    },
    {
      field: 'supplierName',
      headerName: 'Supplier',
      flex: 1.2, minWidth: 160,
      valueGetter: (params) => params?.row?.supplier?.name || '—',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={500} noWrap>{params.value}</Typography>
      ),
    },
    {
      field: 'receivedAt',
      headerName: 'Received',
      flex: 0.7, minWidth: 120,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">{formatDate(params.value)}</Typography>
      ),
    },
    {
      field: 'items',
      headerName: 'Items',
      flex: 0.5, minWidth: 90,
      sortable: false,
      valueGetter: (params) => (params?.row?.receivingItems || []).length,
      renderCell: (params) => (
        <Typography variant="body2">{params.value}</Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.9, minWidth: 140,
      renderCell: (params) => <StatusPill status={params.value} />,
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false, filterable: false, disableColumnMenu: true,
      align: 'right', headerAlign: 'right',
      renderCell: (params) => (
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); openRowMenu(e, params.row); }}>
          <MoreIcon fontSize="small" />
        </IconButton>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ pt: 3, pb: 4 }}>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.4 }}>
              Goods Receipt Notes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Every receipt from your suppliers. Confirm, approve, and dispute — the audit trail is stamped as you go.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/receivings/reports')}
              sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none' }}
            >
              Reports
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/receivings/tickets')}
              sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none' }}
            >
              Disputes
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={openCreate}
              sx={{
                borderRadius: 1.5, fontWeight: 700, textTransform: 'none',
                boxShadow: 'none', '&:hover': { boxShadow: 'none' },
              }}
            >
              New GRN
            </Button>
          </Stack>
        </Stack>

        <Paper elevation={0} sx={{
          mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden',
        }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr 1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
          }}>
            <KpiCell icon={<InventoryIcon fontSize="small" />} label="TODAY'S GRNS"
              value={kpi.todayCount} color={theme.palette.primary.main} divider />
            <KpiCell icon={<HourglassIcon fontSize="small" />} label="PENDING GRNS"
              value={kpi.pendingCount} color={theme.palette.info.main} divider />
            <KpiCell icon={<MoneyIcon fontSize="small" />} label="THIS MONTH VALUE"
              value={`₹${formatInr(kpi.monthValue)}`} color={theme.palette.success.main} divider />
            <KpiCell icon={<OverageIcon fontSize="small" />} label="OVERAGES (7D)"
              value={kpi.overageWeek} color={theme.palette.warning.main} />
          </Box>
        </Paper>

        <Paper elevation={0} sx={{
          p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider',
        }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
            <TextField
              size="small"
              placeholder="Search GRN, PO, supplier, invoice #…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              sx={{ minWidth: { xs: '100%', md: 320 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField size="small" type="date" label="From"
              InputLabelProps={{ shrink: true }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              sx={{ minWidth: { xs: '100%', md: 150 } }}
            />
            <TextField size="small" type="date" label="To"
              InputLabelProps={{ shrink: true }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              sx={{ minWidth: { xs: '100%', md: 150 } }}
            />
            {filtersActive && (
              <Button
                size="small" variant="text"
                startIcon={<FilterClearIcon fontSize="small" />}
                onClick={clearFilters}
                sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
              >
                Clear
              </Button>
            )}
          </Stack>

          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
            <FilterChip
              active={statusFilter === 'ALL'}
              onClick={() => setStatusFilter('ALL')}
              label="All" count={statusCounts.ALL || 0}
            />
            {STATUS_ORDER.map((s) => (
              <FilterChip
                key={s}
                active={statusFilter === s}
                onClick={() => setStatusFilter(s)}
                label={STATUS_META[s].label}
                count={statusCounts[s] || 0}
                color={theme.palette[STATUS_META[s].tone === 'default' ? 'grey' : STATUS_META[s].tone]?.main}
              />
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
              autoHeight
              rows={filtered}
              columns={columns}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              rowHeight={54}
              onRowClick={(params) => openView(params.row)}
              initialState={{
                pagination: { paginationModel: { pageSize: 25 } },
                sorting: { sortModel: [{ field: 'receivedAt', sort: 'desc' }] },
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              slots={{ toolbar: CustomToolbar }}
              slotProps={{
                toolbar: { quickFilterProps: { debounceMs: 300 } },
              }}
              sx={{
                border: 0,
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: alpha(theme.palette.text.primary, 0.04),
                  textTransform: 'uppercase',
                  fontSize: '0.72rem',
                  letterSpacing: 0.5,
                  color: 'text.secondary',
                  fontWeight: 700,
                },
                '& .MuiDataGrid-row': { cursor: 'pointer' },
                '& .MuiDataGrid-row:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                },
                '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
                  outline: 'none',
                },
              }}
              localeText={{
                noRowsLabel: filtersActive
                  ? 'No GRNs match your filters.'
                  : 'No GRNs yet. Click New GRN to record your first receipt.',
              }}
            />
          )}
        </Paper>

        <Menu
          anchorEl={rowMenu.anchor}
          open={Boolean(rowMenu.anchor)}
          onClose={closeRowMenu}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => { openView(rowMenu.row); closeRowMenu(); }}>
            <ViewIcon fontSize="small" sx={{ mr: 1 }} /> View Details
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { handlePrint(rowMenu.row); closeRowMenu(); }}>
            <PrintIcon fontSize="small" sx={{ mr: 1 }} /> Print / Save as PDF
          </MenuItem>
          <MenuItem onClick={() => { handleEmail(rowMenu.row); closeRowMenu(); }}>
            <EmailIcon fontSize="small" sx={{ mr: 1 }} /> Email GRN
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { handleRaiseTicket(rowMenu.row); closeRowMenu(); }}>
            <TicketIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }} /> Raise Dispute
          </MenuItem>
        </Menu>
      </Container>
    </Box>
  );
};

export default ReceivingListPage;
