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
  Storefront as SupplierIcon,
  ToggleOn as ActiveIcon,
  ToggleOff as InactiveIcon,
  LocationOn as LocationIcon,
  VerifiedUser as GstIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  MoreVert as MoreIcon,
  FilterAltOff as FilterClearIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';

import { getSuppliers, toggleSupplierActive } from '../../services/api';
import SupplierEditDialog from './SupplierEditDialog';

const formatDate = (v) => {
  if (!v) return '—';
  try {
    return new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return '—'; }
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

const SuppliersListPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');   // ALL / ACTIVE / INACTIVE
  const [stateFilter, setStateFilter] = useState('');
  const [rowMenu, setRowMenu] = useState({ anchor: null, row: null });

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);  // supplier row or null for create

  const notify = (message, severity = 'info') => setSnackbar({ open: true, message, severity });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSuppliers();
      setRows(Array.isArray(data) ? data : (data?.content ?? []));
    } catch (e) { notify('Failed to load suppliers', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const isActive = (r) => r.active !== false;

  const stateOptions = useMemo(() => {
    const set = new Set();
    (rows || []).forEach((r) => { if (r.state) set.add(r.state); });
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return (rows || []).filter((r) => {
      if (q) {
        const hay = [r.name, r.legalName, r.tradeName, r.phone, r.email, r.gstin, r.pan,
          r.city, r.state, r.contactPerson].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (statusFilter === 'ACTIVE' && !isActive(r)) return false;
      if (statusFilter === 'INACTIVE' && isActive(r)) return false;
      if (stateFilter && r.state !== stateFilter) return false;
      return true;
    });
  }, [rows, searchText, statusFilter, stateFilter]);

  const counts = useMemo(() => ({
    ALL: rows.length,
    ACTIVE: rows.filter(isActive).length,
    INACTIVE: rows.filter((r) => !isActive(r)).length,
    GST: rows.filter((r) => r.gstin && r.gstin.length >= 15).length,
  }), [rows]);

  const clearFilters = () => { setSearchText(''); setStatusFilter('ACTIVE'); setStateFilter(''); };
  const filtersActive = !!(searchText || statusFilter !== 'ACTIVE' || stateFilter);

  const handleToggle = async (row) => {
    try {
      await toggleSupplierActive(row.id);
      notify(`Supplier ${row.name} ${isActive(row) ? 'deactivated' : 'reactivated'}.`, 'info');
      refresh();
    } catch (e) { notify(e?.response?.data?.message || 'Toggle failed', 'error'); }
  };

  const openCreate = () => { setEditing(null); setEditOpen(true); };
  const openEdit = (row) => { setEditing(row); setEditOpen(true); };
  const onSaved = () => { notify('Supplier saved.', 'success'); setEditOpen(false); refresh(); };

  const columns = useMemo(() => [
    {
      field: 'name', headerName: 'Supplier', flex: 1.3, minWidth: 200,
      renderCell: (p) => (
        <Box onClick={(e) => { e.stopPropagation(); navigate(`/suppliers/${p.row.id}`); }}
          sx={{ cursor: 'pointer', '&:hover .sup-link': { textDecoration: 'underline' } }}>
          <Typography variant="body2" fontWeight={700} noWrap className="sup-link"
            sx={{ color: 'primary.main' }}>
            {p.row.tradeName || p.row.name}
          </Typography>
          {p.row.legalName && p.row.legalName !== p.row.name && (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {p.row.legalName}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'contactPerson', headerName: 'Contact', flex: 1, minWidth: 150,
      renderCell: (p) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap>{p.row.contactPerson || '—'}</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            {p.row.phone && <Typography variant="caption" color="text.secondary" noWrap>{p.row.phone}</Typography>}
            {p.row.email && <Typography variant="caption" color="text.secondary" noWrap>{p.row.email}</Typography>}
          </Stack>
        </Box>
      ),
    },
    {
      field: 'gstin', headerName: 'GSTIN / PAN', flex: 1, minWidth: 160,
      renderCell: (p) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }} noWrap>{p.row.gstin || '—'}</Typography>
          {p.row.pan && <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{p.row.pan}</Typography>}
        </Box>
      ),
    },
    {
      field: 'city', headerName: 'Location', flex: 0.9, minWidth: 140,
      renderCell: (p) => (
        <Typography variant="body2" noWrap color="text.secondary">
          {[p.row.city, p.row.state].filter(Boolean).join(', ') || '—'}
        </Typography>
      ),
    },
    {
      field: 'active', headerName: 'Status', flex: 0.6, minWidth: 100,
      renderCell: (p) => (
        <Chip size="small" label={isActive(p.row) ? 'Active' : 'Inactive'}
          color={isActive(p.row) ? 'success' : 'default'}
          variant={isActive(p.row) ? 'filled' : 'outlined'}
          sx={{ fontWeight: 700, letterSpacing: 0.3, fontSize: '0.72rem', borderRadius: 1 }} />
      ),
    },
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
              Suppliers
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Every vendor you buy from — with GSTIN, credit terms, purchase history and outstanding payable.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
              sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none' }}>
              New supplier
            </Button>
          </Stack>
        </Stack>

        <Paper elevation={0} sx={{
          mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden',
        }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          }}>
            <KpiCell icon={<SupplierIcon fontSize="small" />} label="TOTAL SUPPLIERS"
              value={counts.ALL} color={theme.palette.primary.main} divider />
            <KpiCell icon={<ActiveIcon fontSize="small" />} label="ACTIVE"
              value={counts.ACTIVE} color={theme.palette.success.main} divider />
            <KpiCell icon={<InactiveIcon fontSize="small" />} label="INACTIVE"
              value={counts.INACTIVE} color={theme.palette.grey[600]} divider />
            <KpiCell icon={<GstIcon fontSize="small" />} label="GST REGISTERED"
              value={counts.GST} color={theme.palette.info.main} />
          </Box>
        </Paper>

        <Paper elevation={0} sx={{
          p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider',
        }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} flexWrap="wrap">
            <TextField size="small" placeholder="Search name, GSTIN, PAN, phone, email…"
              value={searchText} onChange={(e) => setSearchText(e.target.value)}
              sx={{ minWidth: { xs: '100%', md: 340 } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment> }} />
            <TextField select size="small" label="State"
              value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}
              sx={{ minWidth: { xs: '100%', md: 200 } }}
              InputLabelProps={{ shrink: true }}
              SelectProps={{ native: true, displayEmpty: true }}>
              <option value="">All states</option>
              {stateOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </TextField>
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
              label="All" count={counts.ALL} />
            <FilterChip active={statusFilter === 'ACTIVE'} onClick={() => setStatusFilter('ACTIVE')}
              label="Active" count={counts.ACTIVE} color={theme.palette.success.main} />
            <FilterChip active={statusFilter === 'INACTIVE'} onClick={() => setStatusFilter('INACTIVE')}
              label="Inactive" count={counts.INACTIVE} color={theme.palette.grey[500]} />
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
              disableRowSelectionOnClick rowHeight={62}
              onRowClick={(p) => navigate(`/suppliers/${p.row.id}`)}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
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
                  ? 'No suppliers match your filters.'
                  : 'No suppliers yet. Click "New supplier" to add one.',
              }}
            />
          )}
        </Paper>

        <Menu anchorEl={rowMenu.anchor} open={Boolean(rowMenu.anchor)}
          onClose={() => setRowMenu({ anchor: null, row: null })}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
          <MenuItem onClick={() => { navigate(`/suppliers/${rowMenu.row.id}`); setRowMenu({ anchor: null, row: null }); }}>
            <ViewIcon fontSize="small" sx={{ mr: 1 }} /> View details
          </MenuItem>
          <MenuItem onClick={() => { openEdit(rowMenu.row); setRowMenu({ anchor: null, row: null }); }}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit supplier
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { handleToggle(rowMenu.row); setRowMenu({ anchor: null, row: null }); }}>
            {isActive(rowMenu.row || {})
              ? <><InactiveIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }} /> Deactivate</>
              : <><ActiveIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} /> Reactivate</>}
          </MenuItem>
        </Menu>

        <SupplierEditDialog
          open={editOpen}
          supplier={editing}
          onClose={() => setEditOpen(false)}
          onSaved={onSaved}
        />
      </Container>
    </Box>
  );
};

export default SuppliersListPage;
