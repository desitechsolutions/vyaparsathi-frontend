import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  Tooltip,
  useTheme,
  useMediaQuery,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Checkbox,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  CloudUpload as ImportIcon,
  CloudDownload as ExportIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  ViewColumn as ViewColumnIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  CheckCircleOutline as ActiveIcon,
  CancelOutlined as InactiveIcon,
  Chat as WhatsAppIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  FilterList as FilterIcon,
  AutoAwesome as AdvancedFilterIcon,
} from '@mui/icons-material';

import { useResponsiveTouchTarget } from '../utils/touchTargets';
import { useCustomers } from '../hooks/useCustomers';
import { CustomerKpiStrip } from '../components/customers/CustomerKpiStrip';
import { CustomerBulkActionBar } from '../components/customers/CustomerBulkActionBar';
import { CustomerEditDialog } from '../components/customers/CustomerEditDialog';
import { CustomerCsvImportDialog } from '../components/customers/CustomerCsvImportDialog';
import CustomerFilterDrawer from '../components/customers/CustomerFilterDrawer';
import { inr, stringToColor } from '../utils/customerFormat';
import FilterBuilderDialog, { applyFilterState } from '../components/enterprise/FilterBuilderDialog';
import SavedViewsBar from '../components/enterprise/SavedViewsBar';
import { useSavedViews } from '../hooks/useSavedViews';

// ── Advanced filter field definitions for Customers ──────────────────────────
const CUSTOMER_FILTER_FIELDS = [
  { key: 'name',          label: 'Name',             type: 'text' },
  { key: 'tradeName',     label: 'Trade Name',       type: 'text' },
  { key: 'phone',         label: 'Phone',            type: 'text' },
  { key: 'email',         label: 'Email',            type: 'text' },
  { key: 'city',          label: 'City',             type: 'text' },
  { key: 'state',         label: 'State',            type: 'text' },
  { key: 'gstNumber',     label: 'GSTIN',            type: 'text' },
  { key: 'panNumber',     label: 'PAN',              type: 'text' },
  { key: 'customerType',  label: 'Customer Type',    type: 'select',
    options: [{ value: 'BUSINESS', label: 'B2B (GST)' }, { value: 'INDIVIDUAL', label: 'B2C Retail' }] },
  { key: 'active',        label: 'Active Status',    type: 'boolean' },
  { key: 'creditLimit',   label: 'Credit Limit (₹)', type: 'number' },
  { key: 'creditBalance', label: 'Credit Balance',   type: 'number' },
  { key: 'source',        label: 'Source',           type: 'select',
    options: [
      { value: 'WALK_IN',   label: 'Walk-in' },
      { value: 'REFERRAL',  label: 'Referral' },
      { value: 'ONLINE',    label: 'Online' },
      { value: 'MARKETING', label: 'Marketing' },
      { value: 'OTHER',     label: 'Other' },
    ] },
  { key: 'tags',          label: 'Tags',             type: 'text' },
];

/**
 * Filter chip — enterprise flavour. Neutral border in idle state
 * (color-coded borders looked consumer-app-y), a solid primary fill
 * only on the selected chip. Count sits in a subtle bubble instead
 * of parenthesized text so it reads as data, not caption.
 *
 * <p>The {@code color} prop is now ignored (kept in the signature so
 * call sites don't need to change) — active chip always uses the
 * theme primary so filter selection is uniform.</p>
 */
const FilterChip = ({ active, onClick, label, count }) => (
  <Chip
    label={
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
        {label}
        {count !== undefined && (
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 20,
              px: 0.75,
              height: 18,
              borderRadius: 9,
              bgcolor: active ? 'rgba(255,255,255,0.22)' : 'action.hover',
              color: active ? 'common.white' : 'text.secondary',
              fontSize: '0.7rem',
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {count}
          </Box>
        )}
      </Box>
    }
    size="small"
    onClick={onClick}
    clickable
    variant={active ? 'filled' : 'outlined'}
    color={active ? 'primary' : 'default'}
    sx={{
      fontWeight: 600,
      borderRadius: 1.5,
      borderColor: active ? 'primary.main' : 'divider',
      /* Ensure the clickable filter chip meets the 44 px touch-target standard */
      height: 36,
      px: 0.5,
      '& .MuiChip-label': { px: 1.5 },
      '&:hover': {
        bgcolor: active ? 'primary.main' : 'action.hover',
      },
    }}
  />
);

export default function Customers() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const {
    customers,
    kpis,
    isLoading,
    isKpisLoading,
    pagination,
    setPagination,
    filters,
    setFilters,
    selectedIds,
    setSelectedIds,
    refreshData,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleArchive,
    handleToggleActive,
    handleBulkToggleActive,
    handleBulkDelete,
    handleBulkTag,
    handleExportCsv,
    handleImportCsv,
    snackbar,
    handleSnackbarClose,
  } = useCustomers();

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);

  // Advanced filter builder
  const [filterBuilderOpen, setFilterBuilderOpen] = useState(false);
  const [advancedFilter, setAdvancedFilter] = useState({ logic: 'AND', conditions: [] });
  const hasAdvancedFilter = advancedFilter.conditions?.some((c) => c.field && c.value);

  // Saved views
  const { savedViews, saveView, deleteView, exportViews } = useSavedViews('customers');
  const [activeViewId, setActiveViewId] = useState(null);

  // Column visibility — persisted to localStorage so a shop keeps its
  // preference across sessions. All columns visible by default.
  const [columnVisibility, setColumnVisibility] = useState(() => {
    try {
      const raw = localStorage.getItem('vs.customers.columnVisibility');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const toggleColumn = (key) => {
    setColumnVisibility((prev) => {
      const next = { ...prev, [key]: !(prev[key] === false ? false : (prev[key] ?? true)) };
      try { localStorage.setItem('vs.customers.columnVisibility', JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  };
  const colVisible = (key) => columnVisibility[key] !== false;

  // Row Action Menu
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [menuTargetCustomer, setMenuTargetCustomer] = useState(null);

  // Delete Confirm Dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleOpenCreate = () => {
    setSelectedCustomer(null);
    setIsEditMode(false);
    setEditDialogOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setSelectedCustomer(customer);
    setIsEditMode(true);
    setEditDialogOpen(true);
  };

  const handleOpenMenu = (event, customer) => {
    setActionMenuAnchor(event.currentTarget);
    setMenuTargetCustomer(customer);
  };

  const handleCloseMenu = () => {
    setActionMenuAnchor(null);
    setMenuTargetCustomer(null);
  };

  const handleConfirmDeleteOpen = (customer) => {
    setDeleteTarget(customer);
    setDeleteConfirmOpen(true);
    handleCloseMenu();
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      await handleDelete(deleteTarget.id);
    }
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  // Row selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(customers.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSort = (property) => {
    const isAsc = filters.sortBy === property && filters.sortDir === 'asc';
    setFilters((prev) => ({
      ...prev,
      sortBy: property,
      sortDir: isAsc ? 'desc' : 'asc',
    }));
  };

  const handleSearchChange = (e) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
    setPagination((prev) => ({ ...prev, page: 0 }));
  };

  const handleClearSearch = () => {
    setFilters((prev) => ({ ...prev, search: '' }));
  };

  /**
   * Export just the currently-selected rows to CSV, client-side.
   * The full-tenant export still uses the backend endpoint (all rows);
   * this is for the "selection subset" case the bulk action bar exposes.
   */
  const handleExportSelected = () => {
    if (!selectedIds.length) return;
    const idSet = new Set(selectedIds);
    const rows = customers.filter((c) => idSet.has(c.id));
    if (rows.length === 0) return;
    const header = ['Name', 'Trade Name', 'Legal Name', 'Phone', 'Email', 'City', 'State', 'GSTIN', 'PAN', 'Customer Type', 'Credit Limit', 'Credit Balance', 'Active'];
    const escape = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [header.join(',')];
    rows.forEach((r) => {
      lines.push([
        r.name, r.tradeName, r.legalName, r.phone, r.email,
        r.city, r.state, r.gstNumber, r.panNumber, r.customerType,
        r.creditLimit, r.creditBalance, r.active ? 'YES' : 'NO',
      ].map(escape).join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_selected_${new Date().toISOString().slice(0, 10)}.csv`;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
  };

  // Apply advanced filter client-side on top of server-filtered results
  const displayedCustomers = hasAdvancedFilter
    ? applyFilterState(customers, advancedFilter)
    : customers;

  const isAllSelected = displayedCustomers.length > 0 && selectedIds.length === displayedCustomers.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < displayedCustomers.length;

  const handleLoadView = (view) => {
    setAdvancedFilter(view.filterState || { logic: 'AND', conditions: [] });
    setActiveViewId(view.id);
  };

  const handleDeleteView = (id) => {
    deleteView(id);
    if (activeViewId === id) {
      setActiveViewId(null);
      setAdvancedFilter({ logic: 'AND', conditions: [] });
    }
  };

  const handleSaveView = (name, description) => {
    saveView(name, advancedFilter, description);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1600, mx: 'auto' }}>
      {/* ─── Slim page header (Zoho Books / Xero pattern) ────────────────
          Small title, plain-english subtitle (not marketing copy), one
          primary CTA, secondary actions consolidated into an overflow
          menu — matches enterprise convention.
       */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
            Customers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {kpis && typeof kpis.total === 'number'
              ? `${kpis.total} total · ${kpis.active || 0} active`
              : 'Customer accounts, ledger and receivables'}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Quick filters">
            <IconButton
              onClick={() => setFilterDrawerOpen(true)}
              size={{ xs: 'small', md: 'medium' }}
              aria-label="Open filters"
              sx={{
                border: '1px solid',
                borderColor: (filters.city || filters.source || filters.tags || filters.creditStatus || (filters.segmentIds && filters.segmentIds.length))
                  ? 'primary.main' : 'divider',
                borderRadius: 2,
                minWidth: 44, minHeight: 44,
                color: (filters.city || filters.source || filters.tags || filters.creditStatus || (filters.segmentIds && filters.segmentIds.length))
                  ? 'primary.main' : 'inherit',
              }}
            >
              <FilterListIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Advanced filter builder">
            <IconButton
              onClick={() => setFilterBuilderOpen(true)}
              size={{ xs: 'small', md: 'medium' }}
              aria-label="Advanced filters"
              sx={{
                border: '1px solid',
                borderColor: hasAdvancedFilter ? 'warning.main' : 'divider',
                borderRadius: 2, minWidth: 44, minHeight: 44,
                color: hasAdvancedFilter ? 'warning.main' : 'inherit',
              }}
            >
              <AdvancedFilterIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Column visibility">
            <IconButton
              onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
              size={{ xs: 'small', md: 'medium' }}
              aria-label="Column visibility"
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, minWidth: 44, minHeight: 44 }}
            >
              <ViewColumnIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reload">
            <span>
              <IconButton
                onClick={refreshData}
                disabled={isLoading}
                size={{ xs: 'small', md: 'medium' }}
                aria-label="Reload customers"
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, minWidth: 44, minHeight: 44 }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Import CSV">
            <IconButton
              onClick={() => setImportDialogOpen(true)}
              size={{ xs: 'small', md: 'medium' }}
              aria-label="Import CSV"
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, minWidth: 44, minHeight: 44 }}
            >
              <ImportIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export CSV">
            <IconButton
              onClick={handleExportCsv}
              size={{ xs: 'small', md: 'medium' }}
              aria-label="Export CSV"
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, minWidth: 44, minHeight: 44 }}
            >
              <ExportIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            disableElevation
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 2, minHeight: 44, py: { xs: 1, md: 1.5 } }}
          >
            Add customer
          </Button>
        </Stack>
      </Stack>

      {/* ─── 2. KPI STRIP ────────────────────────────────────────────────── */}
      <CustomerKpiStrip kpis={kpis} loading={isKpisLoading} />

      {/* ─── 3. SAVED VIEWS BAR ──────────────────────────────────────────── */}
      <SavedViewsBar
        savedViews={savedViews}
        activeViewId={activeViewId}
        onLoad={handleLoadView}
        onDelete={handleDeleteView}
        onSave={handleSaveView}
        onExport={exportViews}
        hasActiveFilter={hasAdvancedFilter}
      />

      {/* ─── 4. FILTER & SEARCH TOOLBAR ─────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
        >
          {/* Status & Type Filter Chips */}

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mr: 0.5, textTransform: 'uppercase' }}>
              Status:
            </Typography>
            <FilterChip
              label="All"
              active={filters.active === null}
              onClick={() => setFilters((p) => ({ ...p, active: null }))}
              count={kpis?.totalCustomers}
            />
            <FilterChip
              label="Active"
              color={theme.palette.success.main}
              active={filters.active === true}
              onClick={() => setFilters((p) => ({ ...p, active: true }))}
              count={kpis?.activeCustomers}
            />
            <FilterChip
              label="Inactive"
              color={theme.palette.text.secondary}
              active={filters.active === false}
              onClick={() => setFilters((p) => ({ ...p, active: false }))}
              count={kpis?.inactiveCustomers}
            />

            {/* Vertical separator between STATUS and TYPE groups. Was
                previously `<Box sx={{ width: 1, ... }}/>` which MUI's sx
                interprets as `width: 100%` (fractional), so on wrap it
                rendered as a full-width grey bar spanning the row.
                Divider with orientation="vertical" + flexItem does the
                right thing at any wrap state. */}
            <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 0.5 }} />

            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mr: 0.5, textTransform: 'uppercase' }}>
              Type:
            </Typography>
            <FilterChip
              label="All Types"
              active={filters.customerType === ''}
              onClick={() => setFilters((p) => ({ ...p, customerType: '' }))}
            />
            <FilterChip
              label="B2B (GST)"
              color={theme.palette.info.main}
              active={filters.customerType === 'BUSINESS'}
              onClick={() => setFilters((p) => ({ ...p, customerType: 'BUSINESS' }))}
              count={kpis?.businessCustomers}
            />
            <FilterChip
              label="B2C Retail"
              color="#8b5cf6"
              active={filters.customerType === 'INDIVIDUAL'}
              onClick={() => setFilters((p) => ({ ...p, customerType: 'INDIVIDUAL' }))}
              count={kpis?.individualCustomers}
            />
          </Stack>

          {/* Search Box */}
          <Box sx={{ minWidth: { xs: '100%', md: 320 } }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search by name, phone, email, trade name..."
              value={filters.search}
              onChange={handleSearchChange}
              inputProps={{ 'aria-label': 'Search customers by name, phone, email, or trade name' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: filters.search && (
                  <InputAdornment position="end">
                    <IconButton
                      size={{ xs: 'small', md: 'medium' }}
                      onClick={handleClearSearch}
                      sx={{ minWidth: 44, minHeight: 44 }}
                      aria-label="Clear search"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Box>
        </Stack>
      </Paper>

      {/* ─── 4. CUSTOMER TABLE / DATAGRID ───────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        <TableContainer sx={{ minHeight: 400 }}>
          <Table stickyHeader aria-label="Customers table">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={isSomeSelected}
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    inputProps={{ 'aria-label': 'Select all customers' }}
                  />
                </TableCell>

                <TableCell
                  aria-sort={filters.sortBy === 'name' ? (filters.sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <TableSortLabel
                    active={filters.sortBy === 'name'}
                    direction={filters.sortBy === 'name' ? filters.sortDir : 'asc'}
                    onClick={() => handleSort('name')}
                    sx={{ fontWeight: 700 }}
                  >
                    Customer
                  </TableSortLabel>
                </TableCell>

                {colVisible('type') && <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>}

                {colVisible('contact') && (
                  <TableCell
                    aria-sort={filters.sortBy === 'phone' ? (filters.sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <TableSortLabel
                      active={filters.sortBy === 'phone'}
                      direction={filters.sortBy === 'phone' ? filters.sortDir : 'asc'}
                      onClick={() => handleSort('phone')}
                      sx={{ fontWeight: 700 }}
                    >
                      Contact Info
                    </TableSortLabel>
                  </TableCell>
                )}

                {colVisible('statutory') && <TableCell sx={{ fontWeight: 700 }}>GSTIN / PAN</TableCell>}

                {colVisible('location') && (
                  <TableCell
                    aria-sort={filters.sortBy === 'city' ? (filters.sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <TableSortLabel
                      active={filters.sortBy === 'city'}
                      direction={filters.sortBy === 'city' ? filters.sortDir : 'asc'}
                      onClick={() => handleSort('city')}
                      sx={{ fontWeight: 700 }}
                    >
                      Location
                    </TableSortLabel>
                  </TableCell>
                )}

                {colVisible('credit') && (
                  <TableCell
                    align="right"
                    aria-sort={filters.sortBy === 'creditLimit' ? (filters.sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <TableSortLabel
                      active={filters.sortBy === 'creditLimit'}
                      direction={filters.sortBy === 'creditLimit' ? filters.sortDir : 'asc'}
                      onClick={() => handleSort('creditLimit')}
                      sx={{ fontWeight: 700 }}
                    >
                      Credit Limit
                    </TableSortLabel>
                  </TableCell>
                )}

                {colVisible('balance') && (
                  <TableCell
                    align="right"
                    aria-sort={filters.sortBy === 'creditBalance' ? (filters.sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <TableSortLabel
                      active={filters.sortBy === 'creditBalance'}
                      direction={filters.sortBy === 'creditBalance' ? filters.sortDir : 'asc'}
                      onClick={() => handleSort('creditBalance')}
                      sx={{ fontWeight: 700 }}
                    >
                      Outstanding / Balance
                    </TableSortLabel>
                  </TableCell>
                )}

                {colVisible('status') && (
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Status
                  </TableCell>
                )}

                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={36} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                      Loading customer records...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : displayedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                    <PersonIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="h6" fontWeight={700} color="text.secondary">
                      No Customers Found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {filters.search || hasAdvancedFilter
                        ? 'No records match the current filters. Try adjusting or clearing them.'
                        : 'Get started by creating your first customer.'}
                    </Typography>
                    {hasAdvancedFilter && (
                      <Button
                        variant="outlined"
                        sx={{ mr: 1 }}
                        onClick={() => setAdvancedFilter({ logic: 'AND', conditions: [] })}
                      >
                        Clear advanced filter
                      </Button>
                    )}
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
                      Add Customer
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                displayedCustomers.map((c) => {
                  const isSelected = selectedIds.includes(c.id);
                  const isBusiness = c.customerType === 'BUSINESS';
                  const bal = c.creditBalance ?? 0;
                  const isOwed = bal < 0;

                  return (
                    <TableRow
                      key={c.id}
                      hover
                      selected={isSelected}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                      }}
                      onClick={() => navigate(`/customers/${c.id}`)}
                    >
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleSelectOne(c.id)}
                          inputProps={{ 'aria-label': `Select customer ${c.name}` }}
                        />
                      </TableCell>

                      {/* Customer Name + Avatar */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            sx={{
                              bgcolor: stringToColor(c.name),
                              fontWeight: 700,
                              width: 38,
                              height: 38,
                              fontSize: '0.9rem',
                            }}
                          >
                            {(c.name || 'C').charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="subtitle2"
                              fontWeight={700}
                              color="text.primary"
                              sx={{
                                '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                              }}
                            >
                              {c.name}
                            </Typography>
                            {c.tradeName && c.tradeName !== c.name && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {c.tradeName}
                              </Typography>
                            )}
                            {c.tags && (
                              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                                {c.tags.split(',').slice(0, 2).map((t, idx) => (
                                  <Chip
                                    key={idx}
                                    label={t.trim()}
                                    size="small"
                                    sx={{ fontSize: '0.65rem', height: 18 }}
                                  />
                                ))}
                              </Stack>
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Type */}
                      {colVisible('type') && (
                        <TableCell>
                          <Chip
                            size="small"
                            label={isBusiness ? 'B2B' : 'B2C'}
                            color={isBusiness ? 'info' : 'default'}
                            variant="filled"
                            sx={{
                              fontWeight: 700,
                              borderRadius: 1.5,
                              fontSize: '0.72rem',
                            }}
                          />
                        </TableCell>
                      )}

                      {/* Contact */}
                      {colVisible('contact') && (
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color="text.primary">
                            {c.phone ? `+91 ${c.phone}` : '—'}
                          </Typography>
                          {c.email && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {c.email}
                            </Typography>
                          )}
                        </TableCell>
                      )}

                      {/* GSTIN / PAN */}
                      {colVisible('statutory') && (
                        <TableCell>
                          {c.gstNumber ? (
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem' }}>
                              {c.gstNumber}
                            </Typography>
                          ) : c.panNumber ? (
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: '0.8rem' }}>
                              PAN: {c.panNumber}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.disabled">
                              Unregistered
                            </Typography>
                          )}
                        </TableCell>
                      )}

                      {/* City */}
                      {colVisible('location') && (
                        <TableCell>
                          <Typography variant="body2" color="text.primary">
                            {c.city || '—'}
                          </Typography>
                          {c.state && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {c.state}
                            </Typography>
                          )}
                        </TableCell>
                      )}

                      {/* Credit Limit */}
                      {colVisible('credit') && (
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {c.creditLimit > 0 ? inr(c.creditLimit) : '—'}
                          </Typography>
                          {c.creditDays ? (
                            <Typography variant="caption" color="text.secondary">
                              {c.creditDays} Days
                            </Typography>
                          ) : null}
                        </TableCell>
                      )}

                      {/* Outstanding Balance */}
                      {colVisible('balance') && (
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            fontWeight={800}
                            color={isOwed ? 'error.main' : bal > 0 ? 'success.main' : 'text.primary'}
                          >
                            {isOwed ? `-${inr(Math.abs(bal))}` : inr(bal)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {isOwed ? 'Customer Owes' : bal > 0 ? 'Advance Credit' : 'Settled'}
                          </Typography>
                        </TableCell>
                      )}

                      {/* Status */}
                      {colVisible('status') && (
                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={c.active ? 'Active' : 'Inactive'}
                            color={c.active ? 'success' : 'default'}
                            variant="outlined"
                            sx={{ fontWeight: 700, borderRadius: 1.5, fontSize: '0.7rem' }}
                          />
                        </TableCell>
                      )}

                      {/* Actions */}
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          {c.phone && (
                            <Tooltip title="Chat on WhatsApp">
                              <IconButton
                                size={{ xs: 'small', md: 'medium' }}
                                color="success"
                                onClick={() => window.open(`https://wa.me/91${c.phone.replace(/[^0-9]/g, '')}`, '_blank')}
                                sx={{ minWidth: 44, minHeight: 44 }}
                                aria-label={`Chat with ${c.name} on WhatsApp`}
                              >
                                <WhatsAppIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          <Tooltip title="View Profile 360°">
                            <IconButton
                              size={{ xs: 'small', md: 'medium' }}
                              color="primary"
                              onClick={() => navigate(`/customers/${c.id}`)}
                              sx={{ minWidth: 44, minHeight: 44 }}
                              aria-label={`View profile for ${c.name}`}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <IconButton
                            size={{ xs: 'small', md: 'medium' }}
                            onClick={(e) => handleOpenMenu(e, c)}
                            sx={{ minWidth: 44, minHeight: 44 }}
                            aria-label={`More actions for ${c.name}`}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Server Pagination */}
        <TablePagination
          component="div"
          count={pagination.totalElements}
          page={pagination.page}
          onPageChange={(_, newPage) => setPagination((p) => ({ ...p, page: newPage }))}
          rowsPerPage={pagination.size}
          onRowsPerPageChange={(e) =>
            setPagination((p) => ({ ...p, size: parseInt(e.target.value, 10), page: 0 }))
          }
          rowsPerPageOptions={[10, 25, 50, 100]}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      </Paper>

      {/* ─── 5. BULK ACTION FLOATING BAR ─────────────────────────────────── */}
      <CustomerBulkActionBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onBulkActivate={() => handleBulkToggleActive(true)}
        onBulkDeactivate={() => handleBulkToggleActive(false)}
        onBulkTag={handleBulkTag}
        onBulkDelete={handleBulkDelete}
        onBulkExport={handleExportSelected}
      />

      {/* ─── 6. ROW ACTION MENU ─────────────────────────────────────────── */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleCloseMenu}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 180, boxShadow: 6 } }}
      >
        <MenuItem
          onClick={() => {
            navigate(`/customers/${menuTargetCustomer?.id}`);
            handleCloseMenu();
          }}
        >
          <ListItemIcon>
            <ViewIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText primary="View 360° Profile" />
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleOpenEdit(menuTargetCustomer);
            handleCloseMenu();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit Profile" />
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (menuTargetCustomer) handleToggleActive(menuTargetCustomer.id);
            handleCloseMenu();
          }}
        >
          <ListItemIcon>
            {menuTargetCustomer?.active ? (
              <InactiveIcon fontSize="small" color="warning" />
            ) : (
              <ActiveIcon fontSize="small" color="success" />
            )}
          </ListItemIcon>
          <ListItemText primary={menuTargetCustomer?.active ? 'Deactivate' : 'Activate'} />
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (menuTargetCustomer) handleArchive(menuTargetCustomer.id);
            handleCloseMenu();
          }}
        >
          <ListItemIcon>
            <ArchiveIcon fontSize="small" color="action" />
          </ListItemIcon>
          <ListItemText primary="Archive" />
        </MenuItem>

        <MenuItem
          onClick={() => handleConfirmDeleteOpen(menuTargetCustomer)}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>

      {/* ─── 7. DELETE CONFIRMATION DIALOG ──────────────────────────────── */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: 3 } }}
        aria-labelledby="delete-customer-dialog-title"
        aria-describedby="delete-customer-dialog-description"
      >
        <DialogTitle id="delete-customer-dialog-title" sx={{ fontWeight: 700 }}>Confirm Customer Deletion</DialogTitle>
        <DialogContent id="delete-customer-dialog-description">
          <DialogContentText>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
            <br />
            <br />
            <em>
              Note: If this customer has existing sales invoices or ledger transactions, the system
              will safely archive the customer instead of hard-deleting to preserve audit records.
            </em>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Delete Customer
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── 8. ADD/EDIT CUSTOMER DIALOG ────────────────────────────────── */}
      <CustomerEditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        customer={selectedCustomer}
        isEdit={isEditMode}
        onSave={async (formData) => {
          if (isEditMode && selectedCustomer) {
            return await handleUpdate(selectedCustomer.id, formData);
          } else {
            return await handleCreate(formData);
          }
        }}
      />

      {/* ─── 9. CSV IMPORT DIALOG ───────────────────────────────────────── */}
      <CustomerCsvImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleImportCsv}
      />

      {/* ─── Faceted filter drawer ──────────────────────────────────────── */}
      <CustomerFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        onApply={(patch) => {
          setFilters((prev) => ({ ...prev, ...patch }));
          setPagination((prev) => ({ ...prev, page: 0 }));
        }}
      />

      {/* ─── Advanced filter builder dialog ─────────────────────────────── */}
      <FilterBuilderDialog
        open={filterBuilderOpen}
        onClose={() => setFilterBuilderOpen(false)}
        fields={CUSTOMER_FILTER_FIELDS}
        value={advancedFilter}
        onApply={(state) => {
          setAdvancedFilter(state);
          setActiveViewId(null);
        }}
      />

      {/* ─── Column visibility menu ─────────────────────────────────────── */}
      <Menu
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor)}
        onClose={() => setColumnMenuAnchor(null)}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 220 } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase' }}>
            Show columns
          </Typography>
        </Box>
        {[
          { key: 'type',        label: 'Type' },
          { key: 'contact',     label: 'Contact info' },
          { key: 'statutory',   label: 'GSTIN / PAN' },
          { key: 'location',    label: 'Location' },
          { key: 'credit',      label: 'Credit terms' },
          { key: 'balance',     label: 'Outstanding / Balance' },
          { key: 'status',      label: 'Status' },
        ].map((c) => (
          <MenuItem key={c.key} onClick={() => toggleColumn(c.key)} dense>
            <Checkbox size="small" checked={colVisible(c.key)} sx={{ p: 0.5, mr: 1 }} />
            <Typography variant="body2">{c.label}</Typography>
          </MenuItem>
        ))}
      </Menu>

      {/* ─── 10. SNACKBAR NOTIFICATIONS ─────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
