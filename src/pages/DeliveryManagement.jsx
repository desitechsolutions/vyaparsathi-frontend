import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Button, Drawer, TextField, MenuItem, Select, InputLabel, FormControl,
  Chip, CircularProgress, Snackbar, Alert, Autocomplete, Divider, Avatar,
  Grid, Card, CardContent, Stack, Tab, Tabs, TablePagination, ToggleButton, ToggleButtonGroup,
  Accordion, AccordionSummary, AccordionDetails, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControlLabel, Checkbox, Switch, InputAdornment, Tooltip as MuiTooltip,
} from '@mui/material';
import {
  Visibility, Print, Close, FileDownload,
  ClearAll, Inbox, LocalShipping, CheckCircle, AccessTime, Search,
  Description, ExpandMore, Add, Edit, Delete, Report, Person,
  LocalAtm, PhotoCamera, VpnKey, TrackChanges, Speed, ViewKanban,
  ViewList, Refresh, EventNote, Payments,
} from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import { CSVLink } from 'react-csv';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import {
  fetchDeliveries, assignDeliveryPerson,
  updateDeliveryStatus, fetchDeliveryPersons, createDeliveryPerson,
  updateDeliveryPerson, deleteDeliveryPerson, getSaleById,
  getDeliveryChallanSignedUrl, downloadReceiptPdf,
  updateDeliveryDetails, capturePod, recordDeliveryAttempt, fetchDeliveryMetrics,
  uploadPodSignature, uploadPodPhoto, bulkAssignDeliveries,
} from '../services/api';
import PrintableDelivery from '../components/PrintableDelivery';
import { useAuthContext } from '../context/AuthContext';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

// ── Constants ─────────────────────────────────────────────────────────

const STATUS_ORDER = ['PENDING', 'PACKED', 'OUT_FOR_DELIVERY', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];

const STATUS_META = {
  PENDING:          { color: 'default',   icon: <AccessTime fontSize="small" />,   accent: '#94a3b8' },
  PACKED:           { color: 'warning',   icon: <Inbox fontSize="small" />,        accent: '#f59e0b' },
  OUT_FOR_DELIVERY: { color: 'info',      icon: <LocalShipping fontSize="small" />, accent: '#3b82f6' },
  IN_TRANSIT:       { color: 'secondary', icon: <LocalShipping fontSize="small" />, accent: '#8b5cf6' },
  DELIVERED:        { color: 'success',   icon: <CheckCircle fontSize="small" />,  accent: '#10b981' },
  CANCELLED:        { color: 'error',     icon: <Close fontSize="small" />,        accent: '#ef4444' },
};

// Which target states can be picked from the drawer given the current state.
// Mirror of the backend DeliveryTransitions state machine — kept in sync manually.
const ALLOWED_TRANSITIONS = {
  PENDING:          ['PACKED', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  PACKED:           ['OUT_FOR_DELIVERY', 'IN_TRANSIT', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
  IN_TRANSIT:       ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
  DELIVERED:        [],
  CANCELLED:        [],
};

const ATTEMPT_REASONS = [
  'Customer not available',
  'Address incorrect',
  'Recipient refused',
  'Rescheduled by customer',
  'Vehicle breakdown',
  'Weather / route blocked',
  'Other',
];

const INR = (n) => (n === null || n === undefined) ? '₹0'
  : `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const HRS = (n) => n === null || n === undefined ? '—'
  : `${Number(n).toFixed(1)}h`;
const PCT = (n) => (n === null || n === undefined) ? '—' : `${Number(n).toFixed(1)}%`;

// ────────────────────────────────────────────────────────────────────────

const DeliveryManagement = () => {
  const { t } = useTranslation();

  // Localized labels for the status enums. Falls back to the raw enum when
  // the caller hasn't wired an i18n key yet — cheaper than crashing.
  const statusLabel = useCallback((s) => {
    const key = `deliveryPage.status${s}`;
    const v = t(key);
    return v === key ? s.replace(/_/g, ' ') : v;
  }, [t]);

  // ── Top-level state ────────────────────────────────────────────────
  const [tab, setTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const showSnackbar = (message, severity = 'info') => setSnackbar({ open: true, message, severity });

  // Shared delivery-persons list — used by drawer autocomplete AND Persons tab.
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const loadPersons = useCallback(async () => {
    try {
      const res = await fetchDeliveryPersons();
      setDeliveryPersons(res.data || []);
    } catch (e) { /* non-fatal on shared loader */ }
  }, []);
  useEffect(() => { loadPersons(); }, [loadPersons]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Snackbar
        open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>

      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
            {t('deliveryPage.title') === 'deliveryPage.title' ? 'Delivery Management' : t('deliveryPage.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track shipments, capture POD/COD, monitor operations, and manage delivery agents.
          </Typography>
        </Box>
      </Stack>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab icon={<LocalShipping />} iconPosition="start" label="Operations" />
          <Tab icon={<Speed />} iconPosition="start" label="Metrics" />
          <Tab icon={<Person />} iconPosition="start" label="Delivery Persons" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <OperationsTab
          statusLabel={statusLabel}
          deliveryPersons={deliveryPersons}
          onPersonsChanged={loadPersons}
          showSnackbar={showSnackbar}
        />
      )}
      {tab === 1 && <MetricsTab showSnackbar={showSnackbar} />}
      {tab === 2 && (
        <PersonsTab
          persons={deliveryPersons}
          onChanged={loadPersons}
          showSnackbar={showSnackbar}
        />
      )}
    </Box>
  );
};

// ═════════════════════════════════════════════════════════════════════
//  OPERATIONS TAB — filter, view toggle, table/kanban, drawer
// ═════════════════════════════════════════════════════════════════════

const OperationsTab = ({ statusLabel, deliveryPersons, onPersonsChanged, showSnackbar }) => {
  const { t } = useTranslation();

  // Filters & pagination
  const [filters, setFilters] = useState({
    status: '',
    deliveryPersonId: '',
    from: '',
    to: '',
    q: '',
  });
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);
  const [pageInfo, setPageInfo] = useState({ totalElements: 0, totalPages: 1 });
  const [view, setView] = useState('table');

  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Row selection for bulk operations
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const clearSelection = () => setSelectedIds([]);

  // Drawer state
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const printRef = useRef();

  const loadDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page, size,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.deliveryPersonId ? { deliveryPersonId: filters.deliveryPersonId } : {}),
        ...(filters.from ? { from: filters.from } : {}),
        ...(filters.to ? { to: filters.to } : {}),
        ...(filters.q ? { q: filters.q } : {}),
      };
      const res = await fetchDeliveries(params);
      const rows = (res.data || []).map(d => ({ ...d, deliveryId: d.id ?? d.deliveryId }));
      setDeliveries(rows);
      setPageInfo(res.page || { totalElements: rows.length, totalPages: 1 });
      // Prune selections that fell off the current page — a partial view can't act on rows it doesn't have loaded.
      setSelectedIds(prev => prev.filter(id => rows.some(r => r.deliveryId === id)));
    } catch (err) {
      showSnackbar('Failed to load deliveries', 'error');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, filters.status, filters.deliveryPersonId, filters.from, filters.to, filters.q]);

  useEffect(() => { loadDeliveries(); }, [loadDeliveries]);

  const clearFilters = () => {
    setFilters({ status: '', deliveryPersonId: '', from: '', to: '', q: '' });
    setPage(0);
  };

  const openDrawer = useCallback(async (d) => {
    setSelected(d);
    setDrawerOpen(true);
    if (d?.saleId && (!d.saleItems || d.saleItems.length === 0)) {
      try {
        const saleRes = await getSaleById(d.saleId);
        const saleData = saleRes?.data || saleRes;
        const items = saleData?.items || saleData?.saleItems || [];
        setSelected((prev) => prev && prev.deliveryId === d.deliveryId ? { ...prev, saleItems: items } : prev);
      } catch (e) { /* soft-fail */ }
    }
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: selected ? `Delivery_${selected.invoiceNumber}` : 'Delivery',
    onAfterPrint: () => showSnackbar('Print prepared', 'success'),
  });

  const handleDownloadChallan = async () => {
    if (!selected?.id) return;
    try {
      const signedPath = await getDeliveryChallanSignedUrl(selected.id);
      const nameHint = selected.challanNo || selected.invoiceNumber || selected.id;
      await downloadReceiptPdf(signedPath, `delivery_challan_${nameHint.toString().replace(/[\/\\]/g, '_')}.pdf`);
    } catch (err) { showSnackbar('Failed to download delivery challan', 'error'); }
  };

  const csvHeaders = [
    { label: 'Order', key: 'invoiceNumber' },
    { label: 'Customer', key: 'customerName' },
    { label: 'Status', key: 'deliveryStatus' },
    { label: 'Agent', key: 'deliveryPerson.name' },
    { label: 'Created', key: 'createdAt' },
  ];

  return (
    <Box>
      {/* Off-screen printable */}
      <div className="no-print" style={{ position: 'absolute', left: '-9999px', top: 0, opacity: 0, pointerEvents: 'none' }}>
        <PrintableDelivery ref={printRef} delivery={selected} />
      </div>

      {/* Toolbar */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth size="small" placeholder="Search customer / address / tracking#"
              value={filters.q}
              onChange={(e) => { setPage(0); setFilters(p => ({ ...p, q: e.target.value })); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={filters.status} onChange={(e) => { setPage(0); setFilters(p => ({ ...p, status: e.target.value })); }}>
                <MenuItem value="">All</MenuItem>
                {STATUS_ORDER.map(s => <MenuItem key={s} value={s}>{statusLabel(s)}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Agent</InputLabel>
              <Select label="Agent" value={filters.deliveryPersonId} onChange={(e) => { setPage(0); setFilters(p => ({ ...p, deliveryPersonId: e.target.value })); }}>
                <MenuItem value="">Any</MenuItem>
                {deliveryPersons.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <TextField fullWidth size="small" type="date" label="From" InputLabelProps={{ shrink: true }}
              value={filters.from} onChange={(e) => { setPage(0); setFilters(p => ({ ...p, from: e.target.value })); }} />
          </Grid>
          <Grid item xs={6} md={1.5}>
            <TextField fullWidth size="small" type="date" label="To" InputLabelProps={{ shrink: true }}
              value={filters.to} onChange={(e) => { setPage(0); setFilters(p => ({ ...p, to: e.target.value })); }} />
          </Grid>
          <Grid item xs={12} md={2}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <MuiTooltip title="Refresh"><IconButton onClick={loadDeliveries}><Refresh /></IconButton></MuiTooltip>
              <Button variant="text" onClick={clearFilters} startIcon={<ClearAll />}>Clear</Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* View toggle + export */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)}>
          <ToggleButton value="table"><ViewList sx={{ mr: 1 }} fontSize="small" />Table</ToggleButton>
          <ToggleButton value="kanban"><ViewKanban sx={{ mr: 1 }} fontSize="small" />Kanban</ToggleButton>
        </ToggleButtonGroup>
        <CSVLink data={deliveries} headers={csvHeaders} filename="deliveries.csv" style={{ textDecoration: 'none' }}>
          <Button variant="outlined" size="small" startIcon={<FileDownload />}>Export (current page)</Button>
        </CSVLink>
      </Stack>

      {/* Bulk action bar (table view only — kanban actions happen per-card via drawer) */}
      {view === 'table' && selectedIds.length > 0 && (
        <Paper elevation={0} sx={{ p: 1.5, mb: 2, borderRadius: 3, border: '1px solid', borderColor: 'primary.main', bgcolor: 'primary.50' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" fontWeight={700}>{selectedIds.length} selected</Typography>
            <Button size="small" variant="contained" onClick={() => setBulkOpen(true)}>Assign to agent…</Button>
            <Button size="small" variant="text" onClick={clearSelection}>Clear</Button>
          </Stack>
        </Paper>
      )}

      {view === 'table' ? (
        <TableView
          deliveries={deliveries} loading={loading}
          statusLabel={statusLabel}
          onOpenRow={openDrawer}
          page={page} size={size} pageInfo={pageInfo}
          onPageChange={setPage} onSizeChange={(newSize) => { setSize(newSize); setPage(0); }}
          selectedIds={selectedIds} setSelectedIds={setSelectedIds}
        />
      ) : (
        <KanbanView deliveries={deliveries} loading={loading} statusLabel={statusLabel} onOpenCard={openDrawer} />
      )}

      <BulkAssignDialog
        open={bulkOpen}
        deliveryIds={selectedIds}
        persons={deliveryPersons}
        onClose={() => setBulkOpen(false)}
        onDone={(changed) => {
          setBulkOpen(false);
          clearSelection();
          showSnackbar(`${changed} deliveries reassigned`, 'success');
          loadDeliveries();
        }}
        onError={() => showSnackbar('Bulk assign failed', 'error')}
      />

      <DeliveryDrawer
        open={drawerOpen}
        delivery={selected}
        deliveryPersons={deliveryPersons}
        statusLabel={statusLabel}
        onClose={() => setDrawerOpen(false)}
        onSelectedUpdated={(updated) => setSelected(updated)}
        onNeedsReload={loadDeliveries}
        onPersonsChanged={onPersonsChanged}
        showSnackbar={showSnackbar}
        onPrint={handlePrint}
        onDownloadChallan={handleDownloadChallan}
      />
    </Box>
  );
};

// ── Table view ────────────────────────────────────────────────────────

const TableView = ({ deliveries, loading, statusLabel, onOpenRow, page, size, pageInfo, onPageChange, onSizeChange, selectedIds, setSelectedIds }) => {
  const selectable = deliveries.filter(d => d.deliveryStatus !== 'DELIVERED' && d.deliveryStatus !== 'CANCELLED');
  const allChecked = selectable.length > 0 && selectable.every(d => selectedIds.includes(d.deliveryId));
  const someChecked = selectable.some(d => selectedIds.includes(d.deliveryId));
  const toggleAll = () => {
    if (allChecked) setSelectedIds(prev => prev.filter(id => !selectable.some(d => d.deliveryId === id)));
    else setSelectedIds(prev => Array.from(new Set([...prev, ...selectable.map(d => d.deliveryId)])));
  };
  const toggleOne = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
  <>
    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Table stickyHeader size="medium">
        <TableHead>
          <TableRow sx={{ bgcolor: 'action.hover' }}>
            <TableCell padding="checkbox">
              <Checkbox indeterminate={someChecked && !allChecked} checked={allChecked} onChange={toggleAll} disabled={selectable.length === 0} />
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Order</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Agent</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>ETA</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Tracking</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={9} align="center" sx={{ py: 8 }}><CircularProgress size={28} /></TableCell></TableRow>
          ) : deliveries.length === 0 ? (
            <TableRow><TableCell colSpan={9} align="center" sx={{ py: 8 }}><Typography color="text.secondary">No deliveries match your filters.</Typography></TableCell></TableRow>
          ) : deliveries.map(d => (
            <TableRow key={d.deliveryId} hover selected={selectedIds.includes(d.deliveryId)} onClick={() => onOpenRow(d)} sx={{ cursor: 'pointer' }}>
              <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.includes(d.deliveryId)}
                  onChange={() => toggleOne(d.deliveryId)}
                  disabled={d.deliveryStatus === 'DELIVERED' || d.deliveryStatus === 'CANCELLED'}
                />
              </TableCell>
              <TableCell><b>#{d.invoiceNumber || d.saleId}</b></TableCell>
              <TableCell>
                <Chip icon={STATUS_META[d.deliveryStatus]?.icon}
                      label={statusLabel(d.deliveryStatus)}
                      color={STATUS_META[d.deliveryStatus]?.color || 'default'}
                      size="small" />
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{d.customerName}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 220, display: 'inline-block' }}>{d.deliveryAddress}</Typography>
              </TableCell>
              <TableCell>
                {d.deliveryPerson ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>{d.deliveryPerson.name?.[0]}</Avatar>
                    <Typography variant="body2">{d.deliveryPerson.name}</Typography>
                  </Stack>
                ) : <Typography variant="caption" color="error">Not assigned</Typography>}
              </TableCell>
              <TableCell>{d.estimatedDeliveryDate ? dayjs(d.estimatedDeliveryDate).format('DD MMM') : '—'}</TableCell>
              <TableCell><Typography variant="caption" fontFamily="monospace">{d.trackingNumber || '—'}</Typography></TableCell>
              <TableCell>{dayjs(d.createdAt).format('DD MMM, YYYY')}</TableCell>
              <TableCell align="center">
                <IconButton color="primary" size="small"><Visibility fontSize="small" /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    <TablePagination
      component="div"
      count={pageInfo.totalElements || 0}
      page={page}
      onPageChange={(_, p) => onPageChange(p)}
      rowsPerPage={size}
      rowsPerPageOptions={[10, 25, 50, 100]}
      onRowsPerPageChange={(e) => onSizeChange(parseInt(e.target.value, 10))}
    />
  </>
  );
};

// ── Kanban view ───────────────────────────────────────────────────────

const KanbanView = ({ deliveries, loading, statusLabel, onOpenCard }) => {
  const grouped = useMemo(() => {
    const g = Object.fromEntries(STATUS_ORDER.map(s => [s, []]));
    deliveries.forEach(d => { if (g[d.deliveryStatus]) g[d.deliveryStatus].push(d); });
    return g;
  }, [deliveries]);

  if (loading) return <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
      {STATUS_ORDER.map(status => (
        <Paper key={status} elevation={0} sx={{
          minWidth: 280, flex: '0 0 auto', p: 1.5, borderRadius: 3,
          border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover',
          borderTop: `4px solid ${STATUS_META[status].accent}`,
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={800}>{statusLabel(status)}</Typography>
            <Chip size="small" label={grouped[status].length} />
          </Stack>
          <Stack spacing={1}>
            {grouped[status].map(d => (
              <Card key={d.deliveryId} sx={{ borderRadius: 2, cursor: 'pointer', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }} onClick={() => onOpenCard(d)}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="body2" fontWeight={700}>#{d.invoiceNumber || d.saleId}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{d.customerName}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{d.deliveryAddress}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center">
                    {d.deliveryPerson && <Chip size="small" avatar={<Avatar>{d.deliveryPerson.name?.[0]}</Avatar>} label={d.deliveryPerson.name} />}
                    {d.trackingNumber && <Chip size="small" icon={<TrackChanges fontSize="small" />} label={d.trackingNumber} />}
                    {d.estimatedDeliveryDate && <Chip size="small" icon={<EventNote fontSize="small" />} label={dayjs(d.estimatedDeliveryDate).format('DD MMM')} />}
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {grouped[status].length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>Empty</Typography>
            )}
          </Stack>
        </Paper>
      ))}
    </Box>
  );
};

// ═════════════════════════════════════════════════════════════════════
//  DRAWER — accordions for every lifecycle stage
// ═════════════════════════════════════════════════════════════════════

const DeliveryDrawer = ({
  open, delivery, deliveryPersons, statusLabel,
  onClose, onSelectedUpdated, onNeedsReload, onPersonsChanged,
  showSnackbar, onPrint, onDownloadChallan,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusPick, setStatusPick] = useState('');
  const [assignMode, setAssignMode] = useState(false);
  const [assignPerson, setAssignPerson] = useState({ name: '', phone: '', notes: '' });
  const [attemptOpen, setAttemptOpen] = useState(false);

  // Reset transient state each time the drawer opens with a different row.
  useEffect(() => {
    setStatusPick('');
    setAssignMode(false);
    setAssignPerson({ name: '', phone: '', notes: '' });
  }, [delivery?.deliveryId]);

  if (!delivery) {
    return <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100vw', sm: 520 } } }} />;
  }

  const allowedNext = ALLOWED_TRANSITIONS[delivery.deliveryStatus] || [];
  const isTerminal = delivery.deliveryStatus === 'DELIVERED' || delivery.deliveryStatus === 'CANCELLED';

  const guardedRun = async (fn) => {
    setIsSubmitting(true);
    try { await fn(); }
    finally { setIsSubmitting(false); }
  };

  const handleUpdateStatus = () => guardedRun(async () => {
    if (!statusPick || statusPick === delivery.deliveryStatus) return;
    try {
      const res = await updateDeliveryStatus(delivery.deliveryId, statusPick);
      onSelectedUpdated({ ...delivery, ...res.data });
      showSnackbar(`Status updated to ${statusLabel(statusPick)}`, 'success');
      setStatusPick('');
      onNeedsReload();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data || 'Status update failed';
      showSnackbar(typeof msg === 'string' ? msg : 'Status update failed', 'error');
    }
  });

  const handleAssign = () => guardedRun(async () => {
    if (!assignPerson.name || !assignPerson.phone) {
      showSnackbar('Name and phone are required', 'warning');
      return;
    }
    try {
      let toAssign = assignPerson;
      if (!assignPerson.id) {
        const createRes = await createDeliveryPerson({
          name: assignPerson.name, phone: assignPerson.phone,
          notes: assignPerson.notes,
        });
        toAssign = createRes.data;
        onPersonsChanged();
      }
      const res = await assignDeliveryPerson(delivery.deliveryId, toAssign);
      onSelectedUpdated({ ...delivery, ...res.data });
      showSnackbar('Delivery agent updated', 'success');
      setAssignMode(false);
      onNeedsReload();
    } catch (e) { showSnackbar('Failed to assign agent', 'error'); }
  });

  const handleSaveDetails = (patch) => guardedRun(async () => {
    try {
      const res = await updateDeliveryDetails(delivery.deliveryId, patch);
      onSelectedUpdated({ ...delivery, ...res.data });
      showSnackbar('Details updated', 'success');
      onNeedsReload();
    } catch (e) { showSnackbar('Failed to save details', 'error'); }
  });

  const handleSavePod = (podFields) => guardedRun(async () => {
    try {
      const res = await capturePod(delivery.deliveryId, podFields);
      onSelectedUpdated({ ...delivery, ...res.data });
      showSnackbar('Proof of delivery saved', 'success');
      onNeedsReload();
    } catch (e) { showSnackbar('Failed to save POD', 'error'); }
  });

  const handleUploadSignature = (file) => guardedRun(async () => {
    try {
      const res = await uploadPodSignature(delivery.deliveryId, file);
      onSelectedUpdated({ ...delivery, ...res.data });
      showSnackbar('Signature uploaded', 'success');
      onNeedsReload();
    } catch (e) { showSnackbar('Signature upload failed', 'error'); }
  });

  const handleUploadPhoto = (file) => guardedRun(async () => {
    try {
      const res = await uploadPodPhoto(delivery.deliveryId, file);
      onSelectedUpdated({ ...delivery, ...res.data });
      showSnackbar('Photo uploaded', 'success');
      onNeedsReload();
    } catch (e) { showSnackbar('Photo upload failed', 'error'); }
  });

  const handleAttempt = (reason) => guardedRun(async () => {
    try {
      const res = await recordDeliveryAttempt(delivery.deliveryId, reason);
      onSelectedUpdated({ ...delivery, ...res.data });
      showSnackbar('Attempt logged', 'success');
      setAttemptOpen(false);
      onNeedsReload();
    } catch (e) { showSnackbar('Failed to log attempt', 'error'); }
  });

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
            PaperProps={{ sx: { width: { xs: '100vw', sm: 520 }, mt: '64px', height: 'calc(100% - 64px)' } }}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2.5, bgcolor: STATUS_META[delivery.deliveryStatus]?.accent || '#1a237e', color: 'white' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.8 }}>Delivery details</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>#{delivery.invoiceNumber || delivery.saleId}</Typography>
              <Typography variant="caption">
                {statusLabel(delivery.deliveryStatus)} · created {dayjs(delivery.createdAt).format('DD MMM, hh:mm A')}
              </Typography>
            </Box>
            <IconButton onClick={onClose} sx={{ color: 'white' }}><Close /></IconButton>
          </Stack>
        </Box>

        <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
          {/* Overview */}
          <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="primary" gutterBottom>Customer</Typography>
              <Typography variant="body1" fontWeight={700}>{delivery.customerName}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {delivery.deliveryAddressSnapshot || delivery.deliveryAddress}
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Shipping fee</Typography>
                <Typography variant="body2" fontWeight={700}>{INR(delivery.deliveryCharge)}</Typography>
              </Stack>
              {delivery.deliveryPaidBy && (
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  <Typography variant="body2">Paid by</Typography>
                  <Typography variant="body2" fontWeight={700}>{delivery.deliveryPaidBy}</Typography>
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* Status & agent */}
          <Section title="Status & agent" icon={<LocalShipping color="primary" fontSize="small" />}>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <FormControl fullWidth size="small">
                <Select value={statusPick} onChange={(e) => setStatusPick(e.target.value)} displayEmpty>
                  <MenuItem value="" disabled>Change status…</MenuItem>
                  {STATUS_ORDER.map(s => (
                    <MenuItem key={s} value={s} disabled={s === delivery.deliveryStatus || (!allowedNext.includes(s) && s !== delivery.deliveryStatus)}>
                      {statusLabel(s)} {s === delivery.deliveryStatus ? '(current)' : (!allowedNext.includes(s) ? '(blocked)' : '')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="contained" onClick={handleUpdateStatus}
                      disabled={!statusPick || statusPick === delivery.deliveryStatus || isSubmitting}>Update</Button>
            </Stack>

            {!assignMode ? (
              <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Person fontSize="small" />
                  <Typography variant="body2">{delivery.deliveryPerson ? delivery.deliveryPerson.name : 'No agent assigned'}</Typography>
                </Stack>
                <Button size="small" onClick={() => setAssignMode(true)} disabled={isTerminal}>
                  {delivery.deliveryPerson ? 'Reassign' : 'Assign'}
                </Button>
              </Box>
            ) : (
              <Box sx={{ p: 1.5, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                <Autocomplete
                  freeSolo
                  options={deliveryPersons}
                  getOptionLabel={(opt) => typeof opt === 'string' ? opt : (opt.name || '')}
                  onInputChange={(_, v) => setAssignPerson(p => ({ ...p, name: v }))}
                  onChange={(_, v) => {
                    if (typeof v === 'string') setAssignPerson(p => ({ ...p, name: v, id: null }));
                    else if (v && v.name) setAssignPerson(v);
                  }}
                  renderInput={(params) => <TextField {...params} label="Agent name" size="small" />}
                />
                <TextField fullWidth size="small" label="Phone" sx={{ mt: 1 }}
                           value={assignPerson.phone} onChange={(e) => setAssignPerson(p => ({ ...p, phone: e.target.value }))} />
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Button fullWidth variant="contained" size="small" onClick={handleAssign} disabled={isSubmitting}>
                    {isSubmitting ? <CircularProgress size={20} /> : 'Save assignment'}
                  </Button>
                  <Button fullWidth variant="outlined" size="small" onClick={() => setAssignMode(false)}>Cancel</Button>
                </Stack>
              </Box>
            )}

            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button variant="outlined" color="warning" fullWidth size="small" startIcon={<Report />} onClick={() => setAttemptOpen(true)} disabled={isTerminal}>
                Log failed attempt
              </Button>
            </Stack>
          </Section>

          <LogisticsSection delivery={delivery} onSave={handleSaveDetails} isSubmitting={isSubmitting} />
          <PodSection
            delivery={delivery}
            onSave={handleSavePod}
            onSignatureUploaded={handleUploadSignature}
            onPhotoUploaded={handleUploadPhoto}
            isSubmitting={isSubmitting}
          />
          <CodSection delivery={delivery} onSave={handleSaveDetails} onSavePod={handleSavePod} isSubmitting={isSubmitting} />
          <HistorySection history={delivery.statusHistory || []} statusLabel={statusLabel} />
        </Box>

        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={1}>
            <Button fullWidth variant="contained" startIcon={<Print />} onClick={onPrint} sx={{ py: 1.2, borderRadius: 2 }}>Print label</Button>
            <Button fullWidth variant="outlined" startIcon={<Description />} onClick={onDownloadChallan} sx={{ py: 1.2, borderRadius: 2 }}>Download challan PDF</Button>
          </Stack>
        </Box>
      </Box>

      <AttemptDialog open={attemptOpen} onClose={() => setAttemptOpen(false)} onConfirm={handleAttempt} isSubmitting={isSubmitting} />
    </Drawer>
  );
};

// ── Drawer sections ───────────────────────────────────────────────────

const Section = ({ title, icon, defaultExpanded = true, children }) => (
  <Accordion defaultExpanded={defaultExpanded} elevation={0} sx={{ mb: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, '&:before': { display: 'none' } }}>
    <AccordionSummary expandIcon={<ExpandMore />}>
      <Stack direction="row" spacing={1} alignItems="center">
        {icon}
        <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
      </Stack>
    </AccordionSummary>
    <AccordionDetails>{children}</AccordionDetails>
  </Accordion>
);

const LogisticsSection = ({ delivery, onSave, isSubmitting }) => {
  const [form, setForm] = useState({});
  useEffect(() => {
    setForm({
      estimatedDeliveryDate: delivery.estimatedDeliveryDate || '',
      trackingNumber: delivery.trackingNumber || '',
      courierPartner: delivery.courierPartner || '',
      ewayBillNo: delivery.ewayBillNo || '',
    });
  }, [delivery.deliveryId, delivery.estimatedDeliveryDate, delivery.trackingNumber, delivery.courierPartner, delivery.ewayBillNo]);
  const dirty = ['estimatedDeliveryDate','trackingNumber','courierPartner','ewayBillNo']
    .some(k => (form[k] || '') !== (delivery[k] || ''));

  return (
    <Section title="Logistics" icon={<TrackChanges color="primary" fontSize="small" />} defaultExpanded={false}>
      <Stack spacing={1.5}>
        <TextField label="Estimated delivery date" size="small" type="date" InputLabelProps={{ shrink: true }}
          value={form.estimatedDeliveryDate || ''}
          onChange={(e) => setForm(p => ({ ...p, estimatedDeliveryDate: e.target.value }))} />
        <TextField label="Tracking number" size="small"
          value={form.trackingNumber || ''}
          onChange={(e) => setForm(p => ({ ...p, trackingNumber: e.target.value }))} />
        <TextField label="Courier partner" size="small"
          value={form.courierPartner || ''}
          onChange={(e) => setForm(p => ({ ...p, courierPartner: e.target.value }))} />
        <TextField label="e-Way bill no" size="small"
          value={form.ewayBillNo || ''}
          onChange={(e) => setForm(p => ({ ...p, ewayBillNo: e.target.value }))} />
        <Button variant="contained" size="small" disabled={!dirty || isSubmitting} onClick={() => onSave(form)}>Save logistics</Button>
      </Stack>
    </Section>
  );
};

const PodSection = ({ delivery, onSave, onSignatureUploaded, onPhotoUploaded, isSubmitting }) => {
  const [form, setForm] = useState({ recipientName: '', podOtp: '', podSignatureUrl: '', podPhotoUrl: '' });
  useEffect(() => {
    setForm({
      recipientName: delivery.recipientName || '',
      podOtp: delivery.podOtp || '',
      podSignatureUrl: delivery.podSignatureUrl || '',
      podPhotoUrl: delivery.podPhotoUrl || '',
    });
  }, [delivery.deliveryId, delivery.recipientName, delivery.podOtp, delivery.podSignatureUrl, delivery.podPhotoUrl]);

  return (
    <Section title="Proof of delivery" icon={<VpnKey color="primary" fontSize="small" />} defaultExpanded={false}>
      <Stack spacing={1.5}>
        <TextField label="Recipient name" size="small" value={form.recipientName}
          onChange={(e) => setForm(p => ({ ...p, recipientName: e.target.value }))} />
        <TextField label="OTP entered by recipient" size="small" value={form.podOtp}
          onChange={(e) => setForm(p => ({ ...p, podOtp: e.target.value }))} />

        <SignaturePad
          existingUrl={form.podSignatureUrl}
          onUpload={(file) => onSignatureUploaded(file)}
          isSubmitting={isSubmitting}
        />

        <PhotoUpload
          existingUrl={form.podPhotoUrl}
          onUpload={(file) => onPhotoUploaded(file)}
          isSubmitting={isSubmitting}
        />

        {delivery.podCollectedAt && (
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            POD collected on {dayjs(delivery.podCollectedAt).format('DD MMM YYYY, hh:mm A')}
          </Alert>
        )}
        <Button variant="contained" size="small" disabled={isSubmitting} onClick={() => onSave({ recipientName: form.recipientName, podOtp: form.podOtp })}>Save recipient + OTP</Button>
      </Stack>
    </Section>
  );
};

/**
 * Minimal pointer/touch signature pad. Renders a canvas the user draws on,
 * exposes a "Save signature" button that turns the canvas into a PNG Blob and
 * hands it to the parent for upload. Empty check skips saving a blank canvas.
 */
const SignaturePad = ({ existingUrl, onUpload, isSubmitting }) => {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const dirtyRef = useRef(false);

  const draw = useCallback((e, isStart) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    const x = point.clientX - rect.left;
    const y = point.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111';
    if (isStart) { ctx.beginPath(); ctx.moveTo(x, y); }
    else { ctx.lineTo(x, y); ctx.stroke(); }
    dirtyRef.current = true;
  }, []);
  const startDraw = (e) => { e.preventDefault(); drawingRef.current = true; draw(e, true); };
  const moveDraw = (e) => { if (!drawingRef.current) return; e.preventDefault(); draw(e, false); };
  const endDraw = () => { drawingRef.current = false; };
  const clearPad = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    dirtyRef.current = false;
  };
  const submitPad = () => {
    if (!dirtyRef.current) return;
    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      // Wrap Blob in a File so multipart uploads carry a filename the backend
      // can log; keeps parity with a "real" file input.
      const file = new File([blob], `signature-${Date.now()}.png`, { type: 'image/png' });
      onUpload(file);
      clearPad();
    }, 'image/png');
  };

  return (
    <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 1 }}>Signature</Typography>
      <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 1, bgcolor: '#fafafa' }}>
        <canvas
          ref={canvasRef}
          width={440}
          height={140}
          style={{ width: '100%', height: 140, display: 'block', touchAction: 'none', cursor: 'crosshair' }}
          onMouseDown={startDraw} onMouseMove={moveDraw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={moveDraw} onTouchEnd={endDraw}
        />
      </Box>
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <Button size="small" variant="outlined" onClick={clearPad}>Clear</Button>
        <Button size="small" variant="contained" onClick={submitPad} disabled={isSubmitting}>Save signature</Button>
      </Stack>
      {existingUrl && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Existing:&nbsp;
          <a href={existingUrl} target="_blank" rel="noopener noreferrer">{existingUrl}</a>
        </Typography>
      )}
    </Box>
  );
};

/** File picker → hands the selected file to the parent for upload. */
const PhotoUpload = ({ existingUrl, onUpload, isSubmitting }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!file) { setPreviewUrl(''); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 1 }}>Delivery photo</Typography>
      <Button
        component="label" size="small" variant="outlined"
        startIcon={<PhotoCamera fontSize="small" />}
      >
        Pick photo
        <input type="file" accept="image/*" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </Button>
      {previewUrl && (
        <Box sx={{ mt: 1 }}>
          <img src={previewUrl} alt="preview" style={{ maxWidth: '100%', maxHeight: 140, borderRadius: 4, border: '1px solid #ddd' }} />
        </Box>
      )}
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <Button
          size="small" variant="contained"
          disabled={!file || isSubmitting}
          onClick={() => { onUpload(file); setFile(null); }}
        >
          Upload photo
        </Button>
      </Stack>
      {existingUrl && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Existing:&nbsp;
          <a href={existingUrl} target="_blank" rel="noopener noreferrer">{existingUrl}</a>
        </Typography>
      )}
    </Box>
  );
};

const BulkAssignDialog = ({ open, deliveryIds, persons, onClose, onDone, onError }) => {
  const [personId, setPersonId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { if (open) setPersonId(''); }, [open]);

  const submit = async () => {
    if (!personId) return;
    setSubmitting(true);
    try {
      const res = await bulkAssignDeliveries(deliveryIds, personId);
      onDone(res.data?.changed ?? deliveryIds.length);
    } catch (e) { onError(); }
    finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Assign {deliveryIds.length} deliveries</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Agent</InputLabel>
            <Select label="Agent" value={personId} onChange={(e) => setPersonId(e.target.value)}>
              {persons.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Deliveries already DELIVERED or CANCELLED will be skipped.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!personId || submitting} onClick={submit}>Assign</Button>
      </DialogActions>
    </Dialog>
  );
};

const CodSection = ({ delivery, onSave, onSavePod, isSubmitting }) => {
  const { user } = useAuthContext();
  const isPrivileged = user?.role === 'OWNER' || user?.role === 'ADMIN';
  const isLocked = !!delivery.codCollected; // locked once COD is marked collected

  const [amount, setAmount] = useState(delivery.codAmount ?? '');
  const [collected, setCollected] = useState(!!delivery.codCollected);

  // Override-confirmation dialog state (ADMIN/OWNER only)
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [pendingAmount, setPendingAmount] = useState(null);

  useEffect(() => {
    setAmount(delivery.codAmount ?? '');
    setCollected(!!delivery.codCollected);
  }, [delivery.deliveryId, delivery.codAmount, delivery.codCollected]);

  const handleSaveAmount = () => {
    const newAmount = amount === '' ? null : Number(amount);
    if (isLocked && isPrivileged) {
      // Open confirmation dialog before overriding a collected amount
      setPendingAmount(newAmount);
      setOverrideReason('');
      setOverrideOpen(true);
    } else {
      onSave({ codAmount: newAmount });
    }
  };

  const confirmOverride = () => {
    // Pass reason as a note via the patch — backend will log it
    onSave({ codAmount: pendingAmount, codAmountChangeReason: overrideReason });
    setOverrideOpen(false);
  };

  const markCollected = () => onSavePod({ codCollected: true });

  return (
    <Section title="Cash on delivery" icon={<Payments color="primary" fontSize="small" />} defaultExpanded={false}>
      <Stack spacing={1.5}>
        {/* ── Amount field — locked for STAFF once collected ───────────── */}
        {isLocked && !isPrivileged ? (
          // STAFF: fully read-only view
          <Stack direction="row" spacing={1} alignItems="center"
                 sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
            <LockOutlinedIcon fontSize="small" color="disabled" />
            <Box>
              <Typography variant="caption" color="text.secondary">COD Amount (locked)</Typography>
              <Typography variant="body2" fontWeight={700}>
                {delivery.codAmount != null ? `₹${Number(delivery.codAmount).toLocaleString('en-IN')}` : '—'}
              </Typography>
            </Box>
            <MuiTooltip title="COD has been collected and the amount is locked. Contact your Admin to make corrections.">
              <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto', cursor: 'help', textDecoration: 'underline dotted' }}>
                Why is this locked?
              </Typography>
            </MuiTooltip>
          </Stack>
        ) : (
          // ADMIN / OWNER (or not yet collected): editable
          <TextField
            label={isLocked ? 'COD amount (admin override)' : 'COD amount'}
            size="small" type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><LocalAtm fontSize="small" /></InputAdornment>,
              endAdornment: isLocked
                ? <InputAdornment position="end"><LockOutlinedIcon fontSize="small" color="warning" /></InputAdornment>
                : null,
            }}
            helperText={isLocked ? 'COD already collected — saving will create an audit log entry.' : ''}
            FormHelperTextProps={{ sx: { color: 'warning.main' } }}
          />
        )}

        <FormControlLabel
          control={<Checkbox checked={collected} onChange={(e) => setCollected(e.target.checked)} disabled={isLocked} />}
          label="Cash collected from recipient"
        />
        {delivery.codCollectedAt && (
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            Collected on {dayjs(delivery.codCollectedAt).format('DD MMM YYYY, hh:mm A')} — a payment record was created.
          </Alert>
        )}

        {/* ── Action buttons ──────────────────────────────────────────── */}
        <Stack direction="row" spacing={1}>
          {(!isLocked || isPrivileged) && (
            <Button variant="outlined" size="small" onClick={handleSaveAmount}
                    disabled={isSubmitting || (String(amount) === String(delivery.codAmount ?? ''))}>
              {isLocked ? 'Override amount' : 'Save amount'}
            </Button>
          )}
          <Button variant="contained" size="small" onClick={markCollected}
                  disabled={isSubmitting || !collected || delivery.codCollected}>Mark collected</Button>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Marking COD collected and moving the delivery to DELIVERED will auto-create a Payment against this sale.
        </Typography>
      </Stack>

      {/* ── Admin override confirmation dialog ───────────────────────── */}
      <Dialog open={overrideOpen} onClose={() => setOverrideOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="warning" /> Override collected COD amount
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              This delivery's COD has already been collected (₹{delivery.codAmount ?? 0}). Changing the amount will
              update the metrics and create an audit log entry.
            </Alert>
            <TextField
              label="Reason for change *"
              size="small"
              multiline
              rows={2}
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Incorrect amount entered during collection"
              helperText="Required — will be saved in the audit trail."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOverrideOpen(false)}>Cancel</Button>
          <Button variant="contained" color="warning"
                  disabled={!overrideReason.trim() || isSubmitting}
                  onClick={confirmOverride}>
            Confirm override
          </Button>
        </DialogActions>
      </Dialog>
    </Section>
  );
};

const HistorySection = ({ history, statusLabel }) => (
  <Section title="Audit trail" icon={<EventNote color="primary" fontSize="small" />} defaultExpanded={false}>
    {history.length === 0 ? (
      <Typography variant="body2" color="text.secondary">No events yet.</Typography>
    ) : (
      <Box sx={{ pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}>
        {[...history].reverse().map((h, i) => (
          <Box key={i} sx={{ position: 'relative', mb: 2, pl: 2 }}>
            <Box sx={{ position: 'absolute', left: -25, top: 4, width: 12, height: 12, borderRadius: '50%', bgcolor: STATUS_META[h.status]?.accent || 'primary.main' }} />
            <Typography variant="caption" color="text.secondary">{dayjs(h.changedAt).format('DD MMM, hh:mm A')} · {h.eventType || 'STATUS_CHANGE'}</Typography>
            <Typography variant="body2" fontWeight={700}>{statusLabel(h.status)}</Typography>
            {h.note && <Typography variant="caption" display="block" color="text.secondary">{h.note}</Typography>}
            <Typography variant="caption" color="text.secondary">by {h.changedBy || 'system'}</Typography>
          </Box>
        ))}
      </Box>
    )}
  </Section>
);

const AttemptDialog = ({ open, onClose, onConfirm, isSubmitting }) => {
  const [reason, setReason] = useState('');
  const [custom, setCustom] = useState('');
  useEffect(() => { if (open) { setReason(''); setCustom(''); } }, [open]);
  const effective = reason === 'Other' ? custom : reason;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Log failed attempt</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Reason</InputLabel>
            <Select label="Reason" value={reason} onChange={(e) => setReason(e.target.value)}>
              {ATTEMPT_REASONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
          {reason === 'Other' && (
            <TextField label="Details" size="small" value={custom} onChange={(e) => setCustom(e.target.value)} multiline rows={2} />
          )}
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            This logs a failed attempt on the audit trail. It does not change the delivery status —
            you can transition after (retry via OUT_FOR_DELIVERY or cancel via CANCELLED).
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!effective || isSubmitting} onClick={() => onConfirm(effective)}>Log attempt</Button>
      </DialogActions>
    </Dialog>
  );
};

// ═════════════════════════════════════════════════════════════════════
//  METRICS TAB
// ═════════════════════════════════════════════════════════════════════

const MetricsTab = ({ showSnackbar }) => {
  const [from, setFrom] = useState(dayjs().subtract(29, 'day').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchDeliveryMetrics({ from, to });
      setMetrics(res.data);
    } catch (e) { showSnackbar('Failed to load metrics', 'error'); }
    finally { setLoading(false); }
  }, [from, to, showSnackbar]);
  useEffect(() => { load(); }, [load]);

  return (
    <Box>
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField label="From" size="small" type="date" InputLabelProps={{ shrink: true }} value={from} onChange={(e) => setFrom(e.target.value)} />
          <TextField label="To" size="small" type="date" InputLabelProps={{ shrink: true }} value={to} onChange={(e) => setTo(e.target.value)} />
          <Button variant="outlined" onClick={load} startIcon={<Refresh />}>Refresh</Button>
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box>
      ) : !metrics ? (
        <Alert severity="info">No metrics available for this range.</Alert>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <MetricTile icon={<LocalShipping />} color="primary.main" label="Total" value={metrics.totalDeliveries} />
            <MetricTile icon={<CheckCircle />} color="#10b981" label="Delivered" value={metrics.delivered} />
            <MetricTile icon={<Speed />} color="#3b82f6" label="On-time %" value={PCT(metrics.onTimePct)} />
            <MetricTile icon={<AccessTime />} color="#f59e0b" label="Avg lead time" value={HRS(metrics.avgLeadTimeHours)} />
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">COD collected in range</Typography>
                  <Typography variant="h4" fontWeight={800} color="success.main">{INR(metrics.codCollectedTotal)}</Typography>
                  <Typography variant="caption" color="text.secondary">Across {metrics.codCollectedCount} deliveries</Typography>
                  <Divider sx={{ my: 1.5 }} />
                  <Stack direction="row" justifyContent="space-between"><Typography variant="caption">Cancelled</Typography><Typography variant="caption" fontWeight={700}>{metrics.cancelled}</Typography></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography variant="caption">In progress</Typography><Typography variant="caption" fontWeight={700}>{metrics.inProgress}</Typography></Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={8}>
              <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Per-agent leaderboard</Typography>
                  {(!metrics.perPerson || metrics.perPerson.length === 0) ? (
                    <Typography variant="body2" color="text.secondary">No per-agent data.</Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Agent</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Delivered</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>In progress</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>On-time %</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Avg hrs</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {metrics.perPerson.map(p => (
                            <TableRow key={p.personId}>
                              <TableCell>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>{p.personName?.[0]}</Avatar>
                                  <span>{p.personName}</span>
                                </Stack>
                              </TableCell>
                              <TableCell align="right"><b>{p.delivered}</b></TableCell>
                              <TableCell align="right">{p.inProgress}</TableCell>
                              <TableCell align="right">{PCT(p.onTimePct)}</TableCell>
                              <TableCell align="right">{HRS(p.avgLeadTimeHours)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

const MetricTile = ({ icon, color, label, value }) => (
  <Grid item xs={6} sm={3}>
    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: color }}>{icon}</Avatar>
        <Box>
          <Typography variant="h5" fontWeight={800}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  </Grid>
);

// ═════════════════════════════════════════════════════════════════════
//  DELIVERY PERSONS TAB — CRUD
// ═════════════════════════════════════════════════════════════════════

const PersonsTab = ({ persons, onChanged, showSnackbar }) => {
  const [editingOpen, setEditingOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const openNew = () => { setEditing({ name: '', phone: '', notes: '', vehicleNumber: '', licenseNumber: '', employeeId: '', active: true }); setEditingOpen(true); };
  const openEdit = (p) => { setEditing({ ...p }); setEditingOpen(true); };
  const [isSubmitting, setIsSubmitting] = useState(false);

  const save = async () => {
    if (!editing.name || !editing.phone) { showSnackbar('Name and phone are required', 'warning'); return; }
    setIsSubmitting(true);
    try {
      if (editing.id) await updateDeliveryPerson(editing.id, editing);
      else await createDeliveryPerson(editing);
      setEditingOpen(false);
      onChanged();
      showSnackbar(editing.id ? 'Agent updated' : 'Agent created', 'success');
    } catch (e) { showSnackbar('Save failed', 'error'); }
    finally { setIsSubmitting(false); }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete ${p.name}?`)) return;
    try {
      await deleteDeliveryPerson(p.id);
      onChanged();
      showSnackbar('Agent removed', 'success');
    } catch (e) { showSnackbar('Delete failed', 'error'); }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={800}>Delivery persons</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openNew}>New agent</Button>
      </Stack>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Vehicle</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>License</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Emp ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Active</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {persons.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8 }}><Typography color="text.secondary">No delivery persons yet.</Typography></TableCell></TableRow>
            ) : persons.map(p => (
              <TableRow key={p.id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 28, height: 28, fontSize: 13 }}>{p.name?.[0]}</Avatar>
                    <b>{p.name}</b>
                  </Stack>
                </TableCell>
                <TableCell>{p.phone}</TableCell>
                <TableCell>{p.vehicleNumber || '—'}</TableCell>
                <TableCell>{p.licenseNumber || '—'}</TableCell>
                <TableCell>{p.employeeId || '—'}</TableCell>
                <TableCell><Chip size="small" color={p.active === false ? 'default' : 'success'} label={p.active === false ? 'Inactive' : 'Active'} /></TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(p)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => remove(p)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={editingOpen} onClose={() => setEditingOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>{editing?.id ? 'Edit agent' : 'New delivery agent'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Name" value={editing?.name || ''} onChange={(e) => setEditing(p => ({ ...p, name: e.target.value }))} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Phone" value={editing?.phone || ''} onChange={(e) => setEditing(p => ({ ...p, phone: e.target.value }))} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Vehicle number" value={editing?.vehicleNumber || ''} onChange={(e) => setEditing(p => ({ ...p, vehicleNumber: e.target.value }))} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="License number" value={editing?.licenseNumber || ''} onChange={(e) => setEditing(p => ({ ...p, licenseNumber: e.target.value }))} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Employee ID" value={editing?.employeeId || ''} onChange={(e) => setEditing(p => ({ ...p, employeeId: e.target.value }))} /></Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel control={<Switch checked={editing?.active !== false} onChange={(e) => setEditing(p => ({ ...p, active: e.target.checked }))} />} label="Active" />
            </Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Notes" multiline rows={2} value={editing?.notes || ''} onChange={(e) => setEditing(p => ({ ...p, notes: e.target.value }))} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={isSubmitting} onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeliveryManagement;
