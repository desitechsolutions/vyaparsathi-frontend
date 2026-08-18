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
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  CloudUpload as ImportIcon,
  CloudDownload as ExportIcon,
  Refresh as RefreshIcon,
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
} from '@mui/icons-material';

import { useCustomers } from '../hooks/useCustomers';
import { CustomerKpiStrip } from '../components/customers/CustomerKpiStrip';
import { CustomerBulkActionBar } from '../components/customers/CustomerBulkActionBar';
import { CustomerEditDialog } from '../components/customers/CustomerEditDialog';
import { CustomerCsvImportDialog } from '../components/customers/CustomerCsvImportDialog';

const inr = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const stringToColor = (string) => {
  let hash = 0;
  for (let i = 0; i < (string || '').length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
};

const FilterChip = ({ active, onClick, label, count, color }) => (
  <Chip
    label={
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
        {label}
        {count !== undefined && <Box component="span" sx={{ opacity: 0.75, fontWeight: 600 }}>({count})</Box>}
      </Box>
    }
    size="small"
    onClick={onClick}
    clickable
    variant={active ? 'filled' : 'outlined'}
    sx={{
      fontWeight: 600,
      borderRadius: 2,
      bgcolor: active ? color || 'primary.main' : 'transparent',
      color: active ? 'common.white' : 'text.primary',
      borderColor: color || 'divider',
      '&:hover': {
        bgcolor: active ? color || 'primary.main' : color ? alpha(color, 0.08) : 'action.hover',
      },
    }}
  />
);

export default function Customers() {
  const theme = useTheme();
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

  const isAllSelected = customers.length > 0 && selectedIds.length === customers.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < customers.length;

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1600, mx: 'auto' }}>
      {/* ─── 1. PAGE HEADER ──────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -0.5, color: 'text.primary' }}>
            Customers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enterprise Client Management • B2B & B2C Accounts • Ledger & Receivables
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refreshData}
            disabled={isLoading}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
          >
            Refresh
          </Button>

          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportCsv}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
          >
            Export CSV
          </Button>

          <Button
            variant="outlined"
            startIcon={<ImportIcon />}
            onClick={() => setImportDialogOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
          >
            Import CSV
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 2.5, boxShadow: 'none' }}
          >
            Add Customer
          </Button>
        </Stack>
      </Box>

      {/* ─── 2. KPI STRIP ────────────────────────────────────────────────── */}
      <CustomerKpiStrip kpis={kpis} loading={isKpisLoading} />

      {/* ─── 3. FILTER & SEARCH TOOLBAR ─────────────────────────────────── */}
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

            <Box sx={{ width: 1, height: 20, bgcolor: 'divider', mx: 1 }} />

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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: filters.search && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearSearch}>
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
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={isSomeSelected}
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                </TableCell>

                <TableCell>
                  <TableSortLabel
                    active={filters.sortBy === 'name'}
                    direction={filters.sortBy === 'name' ? filters.sortDir : 'asc'}
                    onClick={() => handleSort('name')}
                    sx={{ fontWeight: 700 }}
                  >
                    Customer
                  </TableSortLabel>
                </TableCell>

                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>

                <TableCell>
                  <TableSortLabel
                    active={filters.sortBy === 'phone'}
                    direction={filters.sortBy === 'phone' ? filters.sortDir : 'asc'}
                    onClick={() => handleSort('phone')}
                    sx={{ fontWeight: 700 }}
                  >
                    Contact Info
                  </TableSortLabel>
                </TableCell>

                <TableCell sx={{ fontWeight: 700 }}>GSTIN / PAN</TableCell>

                <TableCell>
                  <TableSortLabel
                    active={filters.sortBy === 'city'}
                    direction={filters.sortBy === 'city' ? filters.sortDir : 'asc'}
                    onClick={() => handleSort('city')}
                    sx={{ fontWeight: 700 }}
                  >
                    Location
                  </TableSortLabel>
                </TableCell>

                <TableCell align="right">
                  <TableSortLabel
                    active={filters.sortBy === 'creditLimit'}
                    direction={filters.sortBy === 'creditLimit' ? filters.sortDir : 'asc'}
                    onClick={() => handleSort('creditLimit')}
                    sx={{ fontWeight: 700 }}
                  >
                    Credit Limit
                  </TableSortLabel>
                </TableCell>

                <TableCell align="right">
                  <TableSortLabel
                    active={filters.sortBy === 'creditBalance'}
                    direction={filters.sortBy === 'creditBalance' ? filters.sortDir : 'asc'}
                    onClick={() => handleSort('creditBalance')}
                    sx={{ fontWeight: 700 }}
                  >
                    Outstanding / Balance
                  </TableSortLabel>
                </TableCell>

                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  Status
                </TableCell>

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
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                    <PersonIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="h6" fontWeight={700} color="text.secondary">
                      No Customers Found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {filters.search
                        ? `No records matching "${filters.search}". Try clearing search filters.`
                        : 'Get started by creating your first customer.'}
                    </Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
                      Add Customer
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c) => {
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

                      {/* Contact */}
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

                      {/* GSTIN / PAN */}
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

                      {/* City */}
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

                      {/* Credit Limit */}
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

                      {/* Outstanding Balance */}
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

                      {/* Status */}
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={c.active ? 'Active' : 'Inactive'}
                          color={c.active ? 'success' : 'default'}
                          variant="outlined"
                          sx={{ fontWeight: 700, borderRadius: 1.5, fontSize: '0.7rem' }}
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          {c.phone && (
                            <Tooltip title="Chat on WhatsApp">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => window.open(`https://wa.me/91${c.phone.replace(/[^0-9]/g, '')}`, '_blank')}
                              >
                                <WhatsAppIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          <Tooltip title="View Profile 360°">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/customers/${c.id}`)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <IconButton
                            size="small"
                            onClick={(e) => handleOpenMenu(e, c)}
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
        onBulkDelete={handleBulkDelete}
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
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Customer Deletion</DialogTitle>
        <DialogContent>
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
