import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box, Container, Typography, Paper, Stack, Chip, IconButton, Button,
  TextField, InputAdornment, Skeleton, Alert, Snackbar, Menu, MenuItem,
  Divider, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreIcon,
  ReportGmailerrorred as TicketIcon,
  CheckCircleOutline as ResolveIcon,
  Visibility as ViewIcon,
  FilterAltOff as FilterClearIcon,
  PlayArrow as ProgressIcon,
} from '@mui/icons-material';

import CustomToolbar from '../items/components/CustomToolbar';
import {
  fetchAllReceivingTickets,
  resolveReceivingTicket,
  updateReceivingTicket,
} from '../../services/api';

const STATUS_META = {
  OPEN:        { label: 'Open',        tone: 'warning' },
  IN_PROGRESS: { label: 'In progress', tone: 'info' },
  RESOLVED:    { label: 'Resolved',    tone: 'success' },
  CLOSED:      { label: 'Closed',      tone: 'default' },
};

const STATUS_ORDER = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const formatDateTime = (val) => {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

const StatusPill = ({ status }) => {
  const meta = STATUS_META[status] || { label: status || 'Open', tone: 'default' };
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

const ReceivingTicketsListPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [busy, setBusy] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [rowMenu, setRowMenu] = useState({ anchor: null, ticket: null });
  const openRowMenu = (event, ticket) => setRowMenu({ anchor: event.currentTarget, ticket });
  const closeRowMenu = () => setRowMenu({ anchor: null, ticket: null });

  const [resolveDialog, setResolveDialog] = useState({ open: false, ticket: null, note: '' });

  const showMessage = (message, severity = 'info') => setSnackbar({ open: true, message, severity });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllReceivingTickets();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      showMessage('Failed to load tickets', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return (rows || []).filter((t) => {
      if (statusFilter !== 'ALL' && (t.status || 'OPEN') !== statusFilter) return false;
      if (q) {
        const hay = [
          t.reason, t.description, t.raisedBy,
          t.receivingId != null ? String(t.receivingId) : '',
        ].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, searchText, statusFilter]);

  const counts = useMemo(() => {
    const c = { ALL: rows.length };
    STATUS_ORDER.forEach((s) => { c[s] = 0; });
    (rows || []).forEach((t) => {
      const s = t.status || 'OPEN';
      if (c[s] != null) c[s] += 1;
    });
    return c;
  }, [rows]);

  const markInProgress = async (ticket) => {
    if (!ticket?.id) return;
    setBusy(true);
    try {
      await updateReceivingTicket({
        id: ticket.id,
        reason: ticket.reason,
        description: ticket.description,
        raisedBy: ticket.raisedBy,
        status: 'IN_PROGRESS',
      });
      showMessage('Ticket picked up.', 'success');
      refresh();
    } catch (e) {
      showMessage('Failed to update ticket', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleResolve = async () => {
    if (!resolveDialog.ticket?.id) return;
    setBusy(true);
    try {
      await resolveReceivingTicket(resolveDialog.ticket.id, resolveDialog.note || null);
      setResolveDialog({ open: false, ticket: null, note: '' });
      showMessage('Ticket resolved.', 'success');
      refresh();
    } catch (e) {
      showMessage(e?.response?.data?.message || 'Resolve failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const clearFilters = () => {
    setSearchText('');
    setStatusFilter('ALL');
  };
  const filtersActive = !!(searchText || statusFilter !== 'ALL');

  const columns = useMemo(() => [
    {
      field: 'id',
      headerName: 'Ticket #',
      flex: 0.5, minWidth: 100,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
          #{params.value}
        </Typography>
      ),
    },
    {
      field: 'receivingId',
      headerName: 'GRN',
      flex: 0.6, minWidth: 110,
      renderCell: (params) => (
        <Button
          size="small" variant="text"
          onClick={(e) => { e.stopPropagation(); navigate(`/receivings/${params.value}`); }}
          sx={{ textTransform: 'none', fontWeight: 700, fontFamily: 'monospace' }}
        >
          {params.value || '—'}
        </Button>
      ),
    },
    {
      field: 'reason',
      headerName: 'Reason',
      flex: 1, minWidth: 160,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
          {String(params.value || '').toLowerCase().replace('_', ' ')}
        </Typography>
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1.5, minWidth: 220,
      renderCell: (params) => (
        <Tooltip title={params.value || ''}>
          <Typography variant="body2" color="text.secondary" noWrap>
            {params.value || '—'}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'raisedBy',
      headerName: 'Raised by',
      flex: 0.7, minWidth: 130,
      renderCell: (params) => (
        <Typography variant="body2">{params.value || '—'}</Typography>
      ),
    },
    {
      field: 'raisedAt',
      headerName: 'Raised',
      flex: 0.9, minWidth: 160,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">{formatDateTime(params.value)}</Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.7, minWidth: 130,
      renderCell: (params) => <StatusPill status={params.value || 'OPEN'} />,
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
  ], [navigate]);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ pt: 3, pb: 4 }}>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
        </Snackbar>

        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.4 }}>
              Receiving disputes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Every ticket raised against a GRN — pick one up, resolve with a note, close the loop.
            </Typography>
          </Box>
          <Button variant="outlined" startIcon={<TicketIcon />} onClick={() => navigate('/receivings')}
            sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none' }}>
            All GRNs
          </Button>
        </Stack>

        <Paper elevation={0} sx={{
          p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider',
        }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
            <TextField
              size="small"
              placeholder="Search by GRN, reason, or raiser…"
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
            <Chip
              label={<span>All <span style={{ opacity: 0.7 }}>{counts.ALL || 0}</span></span>}
              size="small" clickable
              variant={statusFilter === 'ALL' ? 'filled' : 'outlined'}
              onClick={() => setStatusFilter('ALL')}
              sx={{ fontWeight: 600, borderRadius: 1 }}
            />
            {STATUS_ORDER.map((s) => (
              <Chip
                key={s}
                label={<span>{STATUS_META[s].label} <span style={{ opacity: 0.7 }}>{counts[s] || 0}</span></span>}
                size="small" clickable
                variant={statusFilter === s ? 'filled' : 'outlined'}
                color={STATUS_META[s].tone === 'default' ? undefined : STATUS_META[s].tone}
                onClick={() => setStatusFilter(s)}
                sx={{ fontWeight: 600, borderRadius: 1 }}
              />
            ))}
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{
          borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden',
        }}>
          {loading ? (
            <Box sx={{ p: 2 }}>
              {[0, 1, 2, 3].map((i) => (
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
              initialState={{
                pagination: { paginationModel: { pageSize: 25 } },
                sorting: { sortModel: [{ field: 'raisedAt', sort: 'desc' }] },
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
                '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
                  outline: 'none',
                },
              }}
              localeText={{
                noRowsLabel: filtersActive ? 'No tickets match your filters.' : 'No dispute tickets.',
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
          <MenuItem onClick={() => { navigate(`/receivings/${rowMenu.ticket?.receivingId}`); closeRowMenu(); }}>
            <ViewIcon fontSize="small" sx={{ mr: 1 }} /> View GRN
          </MenuItem>
          <Divider />
          {rowMenu.ticket?.status !== 'IN_PROGRESS'
            && rowMenu.ticket?.status !== 'RESOLVED'
            && rowMenu.ticket?.status !== 'CLOSED' && (
            <MenuItem onClick={() => { markInProgress(rowMenu.ticket); closeRowMenu(); }} disabled={busy}>
              <ProgressIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }} /> Mark in progress
            </MenuItem>
          )}
          {rowMenu.ticket?.status !== 'RESOLVED' && rowMenu.ticket?.status !== 'CLOSED' && (
            <MenuItem onClick={() => {
              setResolveDialog({ open: true, ticket: rowMenu.ticket, note: '' });
              closeRowMenu();
            }}>
              <ResolveIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} /> Resolve
            </MenuItem>
          )}
        </Menu>

        <Dialog open={resolveDialog.open}
          onClose={() => setResolveDialog({ open: false, ticket: null, note: '' })}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 480 } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>
            Resolve ticket #{resolveDialog.ticket?.id}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Log the outcome. Common resolutions: replacement received, credit note issued,
              supplier confirmed, or invalid dispute.
            </Typography>
            <TextField autoFocus fullWidth multiline minRows={3} label="Resolution note"
              value={resolveDialog.note}
              onChange={(e) => setResolveDialog((s) => ({ ...s, note: e.target.value }))} />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setResolveDialog({ open: false, ticket: null, note: '' })}
              sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button onClick={handleResolve} color="success" variant="contained" disabled={busy}
              sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
              {busy ? 'Working…' : 'Resolve'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ReceivingTicketsListPage;
