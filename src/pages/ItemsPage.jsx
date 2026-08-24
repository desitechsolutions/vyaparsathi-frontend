import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Button,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Tooltip,
  IconButton,
  Container,
  Stack,
  Divider,
  TextField,
  Autocomplete,
  InputAdornment,
  Skeleton,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import {
  Visibility as VisibilityIcon,
  Settings as SettingsIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  WarningAmber as WarningIcon,
  Add as AddIcon,
  DeleteSweep as DeleteSweepIcon,
  FileDownloadOutlined as FileDownloadIcon,
  FilterAltOff as FilterAltOffIcon,
  Percent as PriceFactorIcon,
  SwapHoriz as AssignCategoryIcon,
  AutoAwesome as AdvancedFilterIcon,
} from '@mui/icons-material';

import { useResponsiveTouchTarget } from '../utils/touchTargets';
import useItemsLogic from './items/hooks/useItemsLogic';
import CustomToolbar from './items/components/CustomToolbar';
import VariantDetailDisplay from './items/components/VariantDetailDisplay';
import ItemDetailsForm from './items/components/ItemDetailsForm';
import VariantFormFields from './items/components/VariantFormFields';
import ReviewStepContent from './items/components/ReviewStepContent';
import CategoryQuickCreate from './items/components/CategoryQuickCreate';
import FilterBuilderDialog, { applyFilterState } from '../components/enterprise/FilterBuilderDialog';
import SavedViewsBar from '../components/enterprise/SavedViewsBar';
import { useSavedViews } from '../hooks/useSavedViews';
import FloatingBulkActionBar from '../components/common/FloatingBulkActionBar';

const STOCK_LEVEL_COLORS = {
  ok:    'success',
  low:   'warning',
  out:   'error',
  empty: 'default',
};

// ── Advanced filter field definitions for Items ───────────────────────────────
const ITEMS_FILTER_FIELDS = [
  { key: 'name',         label: 'Item Name',    type: 'text' },
  { key: 'brandName',    label: 'Brand',        type: 'text' },
  { key: 'categoryName', label: 'Category',     type: 'text' },
  { key: 'description',  label: 'Description',  type: 'text' },
  { key: 'active',       label: 'Active',       type: 'boolean' },
];

export default function ItemsPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    loading,
    itemsWithVariants,
    itemsWithoutVariants,
    stockData,
    apiCategories,
    loadData,
    industryType,
    shopCategory,
    openAddDialog,
    openEditDialog,
    openDeleteConfirm,
    openViewVariantsDialog,
    variantsToView,
    setOpenDeleteConfirm,
    setOpenViewVariantsDialog,
    step,
    itemFormData,
    setItemFormData,
    variantList,
    setVariantList,
    currentVariant,
    setCurrentVariant,
    editingVariantIndex,
    setEditingVariantIndex,
    isSubmitting,
    dialogError,
    setDialogError,
    snackbar,
    handleSnackbarClose,
    handleDialogClose,
    handleAddItemClick,
    handleManageItem,
    handleViewVariants,
    handleDeleteVariant,
    confirmDeleteVariant,
    handleNext,
    handleBack,
    handleMultiStepSubmit,
    handleMultiStepUpdate,
    handleCurrentVariantChange,
    handleCurrentVariantFileChange,
    addOrUpdateVariantToList,
    handleEditVariantInList,
    handleDeleteVariantInList,
    columns,
    duplicateWarning,
    handleDuplicateViewUpdate,
    closeDuplicateWarning,
    selectedItemIds,
    setSelectedItemIds,
    openBulkDeleteConfirm,
    setOpenBulkDeleteConfirm,
    confirmBulkDelete,
    handleBulkPriceFactor,
    handleBulkAssignCategory,
    paginationModel,
    setPaginationModel,
    searchQuery,
    setSearchQuery,
    searchCategoryId,
    setSearchCategoryId,
    rowCount,
    stockFilter,
    setStockFilter,
    displayItems,
  } = useItemsLogic();

  const activeIndustry = industryType || shopCategory || 'GENERAL';
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const navigate = useNavigate();

  // ── Bulk operation dialog state ──────────────────────────────────────
  const [priceFactorDialog, setPriceFactorDialog] = useState({ open: false, factor: '1.1' });
  const [bulkCategoryDialog, setBulkCategoryDialog] = useState({ open: false, categoryId: null });
  const searchInputRef = useRef(null);

  // Advanced filter builder
  const [filterBuilderOpen, setFilterBuilderOpen] = useState(false);
  const [advancedFilter, setAdvancedFilter] = useState({ logic: 'AND', conditions: [] });
  const hasAdvancedFilter = advancedFilter.conditions?.some((c) => c.field && c.value);

  // Saved views
  const { savedViews, saveView, deleteView, exportViews } = useSavedViews('items');
  const [activeViewId, setActiveViewId] = useState(null);

  // Apply advanced filter on top of the logic-filtered displayItems
  const filteredDisplayItems = hasAdvancedFilter
    ? applyFilterState(displayItems, advancedFilter)
    : displayItems;

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

  const steps = [
    t('itemsPage.stepper.itemDetails'),
    t('itemsPage.stepper.addVariants'),
    t('itemsPage.stepper.reviewAndSave'),
  ];

  const hasFilters = searchQuery !== '' || searchCategoryId !== null || stockFilter !== 'ALL';
  const clearAllFilters = () => {
    setSearchQuery('');
    setSearchCategoryId(null);
    setStockFilter('ALL');
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  // Keyboard shortcut: Ctrl/Cmd+K focuses the search box.
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Real-time inventory updates ──────────────────────────────────────────────
  // The ws:inventory CustomEvent is dispatched by useWebSocket when the backend
  // pushes a stock change to /topic/shop/{shopId}/inventory.
  // Payload: { itemId, newQty, warehouseId }
  //
  // Strategy: reload stockData via loadData (debounced 600ms) so the DataGrid
  // always reflects server truth — no local-only patch that can drift.
  const inventoryReloadTimer = useRef(null);
  const [liveStockUpdate, setLiveStockUpdate] = useState(null); // banner text

  useEffect(() => {
    const handleInventory = (e) => {
      const update = e.detail;
      if (!update) return;

      // Show a brief "stock updated" notification banner
      setLiveStockUpdate(`Stock updated for item #${update.itemId} — new qty: ${update.newQty}`);

      // Debounce the reload so a burst of updates results in a single fetch
      if (inventoryReloadTimer.current) clearTimeout(inventoryReloadTimer.current);
      inventoryReloadTimer.current = setTimeout(() => {
        loadData();
        setLiveStockUpdate(null);
      }, 600);
    };

    window.addEventListener('ws:inventory', handleInventory);
    return () => {
      window.removeEventListener('ws:inventory', handleInventory);
      if (inventoryReloadTimer.current) clearTimeout(inventoryReloadTimer.current);
    };
  }, [loadData]);

  // KPI totals — sourced from the SERVER for accuracy (rowCount is the
  // total across all pages of the current search filter; apiCategories
  // and itemsWithoutVariants come from the full initial load).
  const kpi = useMemo(() => ({
    totalItems: rowCount,
    categories: apiCategories.length,
    awaitingVariants: itemsWithoutVariants.length,
  }), [rowCount, apiCategories.length, itemsWithoutVariants.length]);

  const exportCsv = () => {
    const rows = displayItems;
    if (rows.length === 0) return;
    const header = ['Name', 'SKU', 'Category', 'Brand', 'Variants', 'Min Price', 'Max Price', 'Stock'];
    const lines = [header.join(',')];
    rows.forEach((r) => {
      const vs = r.variants || [];
      const skus = vs.map((v) => v.sku).filter(Boolean).join(' | ');
      const prices = vs.map((v) => Number(v.pricePerUnit || 0));
      const min = prices.length ? Math.min(...prices) : '';
      const max = prices.length ? Math.max(...prices) : '';
      const totalStock = vs.reduce((s, v) => s + Number(v.currentStock || 0), 0);
      const cells = [r.name, skus, r.categoryName || '', r.brandName || '', vs.length, min, max, totalStock];
      lines.push(cells.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `items-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stockChipCountsCurrentPage = useMemo(() => {
    const counts = { ALL: itemsWithVariants.length, IN_STOCK: 0, LOW: 0, OUT: 0, AWAITING: 0 };
    itemsWithVariants.forEach((row) => {
      const vs = row.variants || [];
      if (vs.length === 0) { counts.AWAITING++; return; }
      const total = vs.reduce((s, v) => s + Number(v.currentStock || 0), 0);
      const anyLow = vs.some((v) => {
        const cur = Number(v.currentStock || 0);
        const thr = Number(v.lowStockThreshold || 5);
        return cur > 0 && cur <= thr;
      });
      if (total === 0) counts.OUT++;
      else if (anyLow) counts.LOW++;
      else counts.IN_STOCK++;
    });
    return counts;
  }, [itemsWithVariants]);

  const finalColumns = useMemo(
    () => [
      ...columns.slice(0, -3),
      {
        ...columns[columns.length - 3], // priceRange
        renderCell: (params) => (
          <Typography variant="body2" fontWeight={600} color="text.primary">
            {params.value?.label ?? '—'}
          </Typography>
        ),
      },
      {
        ...columns[columns.length - 2], // stockStatus
        renderCell: (params) => {
          const status = params.value || { label: '—', level: 'empty', total: 0 };
          const level = STOCK_LEVEL_COLORS[status.level] || 'default';
          const paletteColor =
            level === 'success' ? theme.palette.success.main :
            level === 'warning' ? theme.palette.warning.main :
            level === 'error'   ? theme.palette.error.main   :
            theme.palette.text.disabled;
          return (
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
              <Box
                component="span"
                sx={{
                  width: 8, height: 8, borderRadius: '50%',
                  bgcolor: paletteColor,
                  boxShadow: `0 0 0 2px ${alpha(paletteColor, 0.16)}`,
                }}
              />
              <Typography variant="body2" fontWeight={600} sx={{ color: paletteColor }}>
                {status.label}
                {status.total > 0 && (
                  <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400, ml: 0.5 }}>
                    · {status.total}
                  </Box>
                )}
              </Typography>
            </Box>
          );
        },
      },
      {
        ...columns[columns.length - 1], // actions
        renderCell: (params) => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title={t('itemsPage.actions.viewVariants')}>
              <IconButton
                size={{ xs: 'small', md: 'medium' }}
                onClick={() => handleViewVariants(params.row)}
                sx={{ minWidth: 44, minHeight: 44 }}
                aria-label={`View variants for ${params.row.name}`}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('itemsPage.actions.manageItem')}>
              <IconButton
                size={{ xs: 'small', md: 'medium' }}
                onClick={() => handleManageItem(params.row.id)}
                sx={{ minWidth: 44, minHeight: 44 }}
                aria-label={`Manage ${params.row.name}`}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [columns, t, handleViewVariants, handleManageItem, theme]
  );

  // Hide low-priority columns on mobile to reduce horizontal clutter.
  // Columns kept on ALL devices: name, sku, categoryName, stockStatus, variants, actions.
  // Columns hidden on xs/sm: brandName, priceRange.
  const columnVisibilityModel = useMemo(() => {
    if (!isMobile) return {};
    return {
      brandName: false,
      priceRange: false,
    };
  }, [isMobile]);

  const getStepContent = (currentStep) => {
    switch (currentStep) {
      case 0:
        return (
          <ItemDetailsForm
            itemFormData={itemFormData}
            setItemFormData={setItemFormData}
            apiCategories={apiCategories}
            shopCategory={activeIndustry}
            refreshCategories={loadData}
          />
        );
      case 1:
        return (
          <VariantFormFields
            currentVariant={currentVariant}
            setCurrentVariant={setCurrentVariant}
            variantList={variantList}
            setVariantList={setVariantList}
            editingVariantIndex={editingVariantIndex}
            setEditingVariantIndex={setEditingVariantIndex}
            handleCurrentVariantChange={handleCurrentVariantChange}
            handleCurrentVariantFileChange={handleCurrentVariantFileChange}
            addOrUpdateVariantToList={addOrUpdateVariantToList}
            handleEditVariantInList={handleEditVariantInList}
            handleDeleteVariantInList={handleDeleteVariantInList}
            shopCategory={activeIndustry}
          />
        );
      case 2:
        return (
          <ReviewStepContent
            itemFormData={itemFormData}
            variantList={variantList}
            apiCategories={apiCategories}
            shopCategory={activeIndustry}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 4 }}>
      <Container maxWidth="xl" sx={{ pt: 3 }}>

        {/* ── HEADER ───────────────────────────────────── */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
          <Box>
            <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ letterSpacing: -0.4 }}>
              {t('itemsPage.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeIndustry} · {kpi.totalItems} items · {kpi.categories} categories
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CategoryIcon />}
              onClick={() => setCategoryDialogOpen(true)}
              sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none', minHeight: 44, py: { xs: 1, md: 1.5 } }}
            >
              Categories
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<TuneIcon />}
              onClick={() => navigate('/settings/custom-fields')}
              sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none', minHeight: 44, py: { xs: 1, md: 1.5 } }}
            >
              Custom Fields
            </Button>
            <Tooltip title="Advanced filter builder">
              <Button
                variant={hasAdvancedFilter ? 'contained' : 'outlined'}
                color={hasAdvancedFilter ? 'warning' : 'inherit'}
                size="small"
                startIcon={<AdvancedFilterIcon fontSize="small" />}
                onClick={() => setFilterBuilderOpen(true)}
                sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none', minHeight: 44, py: { xs: 1, md: 1.5 } }}
              >
                Filter
                {hasAdvancedFilter && ' (active)'}
              </Button>
            </Tooltip>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={exportCsv}
              disabled={filteredDisplayItems.length === 0}
              sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none', minHeight: 44, py: { xs: 1, md: 1.5 } }}
            >
              Export CSV
            </Button>
            {selectedItemIds.length > 0 && (
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<DeleteSweepIcon />}
                onClick={() => setOpenBulkDeleteConfirm(true)}
                sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none', minHeight: 44, py: { xs: 1, md: 1.5 } }}
              >
                Deactivate ({selectedItemIds.length})
              </Button>
            )}
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddItemClick}
              sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none', minHeight: 44, py: { xs: 1, md: 1.5 } }}
            >
              {t('itemsPage.actions.addItem')}
            </Button>
          </Stack>
        </Stack>

        {/* ── KPI STRIP ────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2,
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          }}
        >
          <KpiCell
            icon={<InventoryIcon fontSize="small" />}
            label="TOTAL ITEMS"
            value={loading ? '—' : kpi.totalItems.toLocaleString('en-IN')}
            color={theme.palette.primary.main}
            divider
          />
          <KpiCell
            icon={<CategoryIcon fontSize="small" />}
            label="CATEGORIES"
            value={loading ? '—' : kpi.categories}
            color={theme.palette.success.main}
            divider
          />
          <KpiCell
            icon={<WarningIcon fontSize="small" />}
            label="AWAITING VARIANTS"
            value={loading ? '—' : kpi.awaitingVariants}
            color={kpi.awaitingVariants > 0 ? theme.palette.warning.main : theme.palette.text.secondary}
            interactive={kpi.awaitingVariants > 0}
            onClick={() => kpi.awaitingVariants > 0 && setStockFilter('AWAITING')}
          />
        </Paper>

        {/* ── SAVED VIEWS BAR ──────────────────────────── */}
        <SavedViewsBar
          savedViews={savedViews}
          activeViewId={activeViewId}
          onLoad={handleLoadView}
          onDelete={handleDeleteView}
          onSave={handleSaveView}
          onExport={exportViews}
          hasActiveFilter={hasAdvancedFilter}
        />

        {/* ── GRID + FILTERS ───────────────────────────── */}
        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Stack sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }} spacing={1.5}>
            {/* Row 1 — search + category */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
              <TextField
                inputRef={searchInputRef}
                placeholder="Search name or brand  ·  ⌘K"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPaginationModel((prev) => ({ ...prev, page: 0 }));
                }}
                size="small"
                inputProps={{ 'aria-label': 'Search items by name or brand' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                  ),
                }}
                sx={{ flex: 1 }}
              />
              <Autocomplete
                options={apiCategories}
                getOptionLabel={(o) => o.name || ''}
                isOptionEqualToValue={(o, v) => o.id === v?.id}
                value={apiCategories.find((c) => c.id === searchCategoryId) || null}
                onChange={(_, v) => {
                  setSearchCategoryId(v ? v.id : null);
                  setPaginationModel((prev) => ({ ...prev, page: 0 }));
                }}
                size="small"
                sx={{ minWidth: 220 }}
                renderInput={(p) => (
                  <TextField
                    {...p}
                    placeholder="All categories"
                    inputProps={{
                      ...p.inputProps,
                      'aria-label': 'Filter items by category',
                    }}
                  />
                )}
              />
              {hasFilters && (
                <Button
                  size="small"
                  startIcon={<FilterAltOffIcon fontSize="small" />}
                  onClick={clearAllFilters}
                  sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
                >
                  Clear
                </Button>
              )}
            </Stack>

            {/* Row 2 — stock-level tabs */}
            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
              <StockTab
                active={stockFilter === 'ALL'}
                onClick={() => setStockFilter('ALL')}
                label="All"
                count={stockChipCountsCurrentPage.ALL}
              />
              <StockTab
                active={stockFilter === 'IN_STOCK'}
                onClick={() => setStockFilter('IN_STOCK')}
                label="In stock"
                count={stockChipCountsCurrentPage.IN_STOCK}
                color={theme.palette.success.main}
              />
              <StockTab
                active={stockFilter === 'LOW'}
                onClick={() => setStockFilter('LOW')}
                label="Low"
                count={stockChipCountsCurrentPage.LOW}
                color={theme.palette.warning.main}
              />
              <StockTab
                active={stockFilter === 'OUT'}
                onClick={() => setStockFilter('OUT')}
                label="Out"
                count={stockChipCountsCurrentPage.OUT}
                color={theme.palette.error.main}
              />
              <StockTab
                active={stockFilter === 'AWAITING'}
                onClick={() => setStockFilter('AWAITING')}
                label="Awaiting variants"
                count={stockChipCountsCurrentPage.AWAITING}
                color={theme.palette.warning.dark}
              />
              <Box sx={{ flex: 1 }} />
              {stockFilter !== 'ALL' && (
                <Typography variant="caption" color="text.secondary">
                  Filter applied to the current page ({displayItems.length} of {itemsWithVariants.length} shown).
                </Typography>
              )}
            </Stack>
          </Stack>

          {loading ? (
            <Box sx={{ p: 2 }}>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={44} sx={{ mb: 1, borderRadius: 1 }} />
              ))}
            </Box>
          ) : (
            <>
              {isMobile && (
                <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', fontStyle: 'italic' }}
                  >
                    Swipe table or view details for more info
                  </Typography>
                </Box>
              )}
              <DataGrid
                aria-label="Items table"
                rows={filteredDisplayItems}
                columns={finalColumns}
                autoHeight
                getRowId={(row) => row.id}
                paginationMode="server"
                rowCount={hasAdvancedFilter ? filteredDisplayItems.length : rowCount}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 25, 50, 100]}
                checkboxSelection
                disableRowSelectionOnClick
                rowSelectionModel={selectedItemIds}
                onRowSelectionModelChange={(newSelection) => setSelectedItemIds(newSelection)}
                slots={{ toolbar: CustomToolbar }}
                slotProps={{ toolbar: { onAddItemClick: handleAddItemClick } }}
                density="standard"
                columnVisibilityModel={columnVisibilityModel}
                sx={{
                border: 0,
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: alpha(theme.palette.text.primary, 0.04),
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  fontWeight: 600,
                },
                '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 },
                '& .MuiDataGrid-cell': { borderBottom: '1px solid', borderColor: 'divider' },
                '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
                '& .MuiDataGrid-row:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
              }}
              />
            </>
          )}
        </Paper>
      </Container>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ borderRadius: 2 }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Real-time inventory update banner */}
      <Snackbar
        open={!!liveStockUpdate}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        autoHideDuration={4000}
        onClose={() => setLiveStockUpdate(null)}
      >
        <Alert
          severity="info"
          variant="filled"
          icon={<InventoryIcon fontSize="inherit" />}
          sx={{ borderRadius: 2 }}
          onClose={() => setLiveStockUpdate(null)}
        >
          {liveStockUpdate}
        </Alert>
      </Snackbar>

      {/* Multi-Step Add/Edit Dialog */}
      <Dialog
        open={openAddDialog || openEditDialog}
        onClose={handleDialogClose}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ p: 2.5, fontWeight: 700, fontSize: '1.15rem' }}>
          {openAddDialog ? t('itemsPage.addDialogTitle') : t('itemsPage.editDialogTitle')}
        </DialogTitle>
        <Divider />

        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Stepper activeStep={step} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {dialogError && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 1.5 }} onClose={() => setDialogError(null)}>
              {dialogError}
            </Alert>
          )}

          <Box sx={{ minHeight: '300px' }}>{getStepContent(step)}</Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: alpha(theme.palette.text.primary, 0.02), borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
          <Button onClick={handleDialogClose} disabled={isSubmitting} sx={{ fontWeight: 600, textTransform: 'none', color: 'text.secondary' }}>
            {t('itemsPage.actions.cancel')}
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="outlined" disabled={step === 0 || isSubmitting} onClick={handleBack} sx={{ fontWeight: 600, textTransform: 'none', borderRadius: 1.5 }}>
            {t('itemsPage.actions.back')}
          </Button>
          <Button
            variant="contained"
            onClick={
              step === steps.length - 1
                ? (openAddDialog ? handleMultiStepSubmit : handleMultiStepUpdate)
                : handleNext
            }
            disabled={isSubmitting}
            sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 1.5, px: 3, boxShadow: 'none' }}
          >
            {isSubmitting ? '...' : step === steps.length - 1
              ? (openAddDialog ? t('itemsPage.actions.save') : t('itemsPage.actions.update'))
              : t('itemsPage.actions.next')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Deactivate Confirmation */}
      <Dialog open={openBulkDeleteConfirm} onClose={() => setOpenBulkDeleteConfirm(false)} fullScreen={isMobile} PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Deactivate selected items?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>{selectedItemIds.length}</strong> item{selectedItemIds.length === 1 ? '' : 's'} will be marked inactive and hidden from the catalog.
            Historical sales still resolve their variant references, so reports and past invoices are unaffected.
            <br /><br />
            Items with stock cannot be deactivated — clear inventory first.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenBulkDeleteConfirm(false)} sx={{ textTransform: 'none' }}>{t('itemsPage.actions.cancel')}</Button>
          <Button onClick={confirmBulkDelete} color="error" variant="contained" sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none' }}>
            Deactivate {selectedItemIds.length}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Variant Confirmation */}
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)} fullScreen={isMobile} PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('itemsPage.deleteDialogTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The variant will be marked inactive. Historical sales still resolve their references.
            Variants with stock cannot be deactivated — clear inventory first.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteConfirm(false)} sx={{ textTransform: 'none' }}>{t('itemsPage.actions.cancel')}</Button>
          <Button onClick={confirmDeleteVariant} color="error" variant="contained" sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none' }}>
            {t('itemsPage.actions.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Variants Dialog */}
      <Dialog
        open={openViewVariantsDialog}
        onClose={() => setOpenViewVariantsDialog(false)}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', fontWeight: 700 }}>
          {t('itemsPage.variant.reviewTitle')} — {variantsToView?.name || ''}
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <VariantDetailDisplay
            item={variantsToView}
            stockData={stockData}
            onDeleteVariant={handleDeleteVariant}
            shopCategory={activeIndustry}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button variant="outlined" onClick={() => setOpenViewVariantsDialog(false)} sx={{ fontWeight: 600, textTransform: 'none', borderRadius: 1.5 }}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>

      <CategoryQuickCreate
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        categories={apiCategories}
        onChanged={loadData}
      />

      {/* ── Advanced filter builder dialog ───────────── */}
      <FilterBuilderDialog
        open={filterBuilderOpen}
        onClose={() => setFilterBuilderOpen(false)}
        fields={ITEMS_FILTER_FIELDS}
        value={advancedFilter}
        onApply={(state) => {
          setAdvancedFilter(state);
          setActiveViewId(null);
        }}
      />

      {/* Duplicate Item Warning Dialog */}
      <Dialog
        open={duplicateWarning.open}
        onClose={closeDuplicateWarning}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.25, fontWeight: 700 }}>
          <WarningIcon color="warning" sx={{ fontSize: 22 }} />
          Item Already Exists
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 1.5 }}>
            {duplicateWarning.message}
          </Alert>
          {duplicateWarning.existingItem && (
            <Box sx={{ p: 2, bgcolor: alpha(theme.palette.text.primary, 0.03), borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
              <Stack spacing={0.5}>
                <Typography variant="subtitle2" fontWeight={700}>{duplicateWarning.existingItem.name}</Typography>
                {duplicateWarning.existingItem.brandName && (
                  <Typography variant="caption" color="text.secondary">Brand: {duplicateWarning.existingItem.brandName}</Typography>
                )}
                {duplicateWarning.existingItem.categoryName && (
                  <Typography variant="caption" color="text.secondary">Category: {duplicateWarning.existingItem.categoryName}</Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  Variants: {duplicateWarning.existingItem.variants?.length || 0}
                </Typography>
              </Stack>
            </Box>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            View the existing item, or update it with new variants?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={closeDuplicateWarning} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
          <Button
            variant="outlined"
            onClick={() => handleDuplicateViewUpdate('view')}
            disabled={!duplicateWarning.existingItem}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
          >
            View Item
          </Button>
          <Button
            variant="contained"
            onClick={() => handleDuplicateViewUpdate('update')}
            disabled={!duplicateWarning.existingItem}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, boxShadow: 'none' }}
          >
            Update / Add Variants
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Floating Bulk Action Bar ─────────────────────── */}
      <FloatingBulkActionBar
        selectedCount={selectedItemIds.length}
        entityLabel="item"
        onClearSelection={() => setSelectedItemIds([])}
        actions={[
          {
            label: 'Deactivate',
            icon: <DeleteSweepIcon />,
            color: 'error',
            variant: 'outlined',
            onClick: () => setOpenBulkDeleteConfirm(true),
          },
          {
            label: 'Apply price factor',
            icon: <PriceFactorIcon />,
            color: 'primary',
            variant: 'outlined',
            onClick: () => setPriceFactorDialog({ open: true, factor: '1.1' }),
          },
          {
            label: 'Assign category',
            icon: <AssignCategoryIcon />,
            color: 'info',
            variant: 'outlined',
            onClick: () => setBulkCategoryDialog({ open: true, categoryId: null }),
          },
        ]}
      />

      {/* ── Bulk Price Factor Dialog ─────────────────────── */}
      <Dialog
        open={priceFactorDialog.open}
        onClose={() => setPriceFactorDialog({ open: false, factor: '1.1' })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Apply price factor to {selectedItemIds.length} item{selectedItemIds.length !== 1 ? 's' : ''}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter a multiplier to apply to <em>all variants</em> of the selected items.
            Use 1.1 for +10%, 0.9 for -10%, 2.0 to double prices.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Price factor"
            type="number"
            inputProps={{ min: 0.01, max: 100, step: 0.01 }}
            value={priceFactorDialog.factor}
            onChange={(e) => setPriceFactorDialog((s) => ({ ...s, factor: e.target.value }))}
            helperText={
              priceFactorDialog.factor && !isNaN(Number(priceFactorDialog.factor))
                ? `Prices will be multiplied by ${Number(priceFactorDialog.factor).toFixed(2)}x`
                : 'Enter a valid multiplier'
            }
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            onClick={() => setPriceFactorDialog({ open: false, factor: '1.1' })}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!priceFactorDialog.factor || isNaN(Number(priceFactorDialog.factor)) || Number(priceFactorDialog.factor) <= 0}
            onClick={() => {
              handleBulkPriceFactor(Number(priceFactorDialog.factor));
              setPriceFactorDialog({ open: false, factor: '1.1' });
            }}
          >
            Apply to {selectedItemIds.length}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Bulk Assign Category Dialog ──────────────────── */}
      <Dialog
        open={bulkCategoryDialog.open}
        onClose={() => setBulkCategoryDialog({ open: false, categoryId: null })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Assign category to {selectedItemIds.length} item{selectedItemIds.length !== 1 ? 's' : ''}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            All selected items will be moved to the chosen category. Their variants are unchanged.
          </Typography>
          <Autocomplete
            options={apiCategories}
            getOptionLabel={(o) => o?.name || ''}
            isOptionEqualToValue={(o, v) => o?.id === v?.id}
            value={apiCategories.find((c) => c.id === bulkCategoryDialog.categoryId) || null}
            onChange={(_, v) =>
              setBulkCategoryDialog((s) => ({ ...s, categoryId: v ? v.id : null }))
            }
            size="small"
            renderInput={(params) => (
              <TextField {...params} label="Category" placeholder="Select a category" />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            onClick={() => setBulkCategoryDialog({ open: false, categoryId: null })}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="info"
            disabled={!bulkCategoryDialog.categoryId}
            onClick={() => {
              handleBulkAssignCategory(bulkCategoryDialog.categoryId);
              setBulkCategoryDialog({ open: false, categoryId: null });
            }}
          >
            Assign to {selectedItemIds.length}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── Small enterprise cells ───────────────────────────────

const KpiCell = ({ icon, label, value, color, divider, interactive, onClick }) => (
  <Box
    onClick={interactive ? onClick : undefined}
    sx={{
      p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
      borderRight: divider ? '1px solid' : 'none',
      borderColor: 'divider',
      cursor: interactive ? 'pointer' : 'default',
      transition: 'background-color 0.15s',
      '&:hover': interactive ? { bgcolor: 'action.hover' } : {},
    }}
  >
    <Box sx={{
      display: 'inline-flex', p: 1, borderRadius: 1,
      bgcolor: alpha(color, 0.1), color, alignItems: 'center', justifyContent: 'center',
    }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.6, fontSize: '0.65rem' }}>
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.2 }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

const StockTab = ({ active, onClick, label, count, color }) => (
  <Chip
    label={
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
        {label}
        <Box component="span" sx={{ opacity: 0.7, fontWeight: 500 }}>{count}</Box>
      </Box>
    }
    size="small"
    onClick={onClick}
    clickable
    variant={active ? 'filled' : 'outlined'}
    sx={{
      fontWeight: 600,
      borderRadius: 1,
      /* Ensure the clickable stock filter chip meets the 44 px touch-target standard */
      height: 36,
      px: 0.5,
      '& .MuiChip-label': { px: 1.5 },
      bgcolor: active ? (color || 'primary.main') : 'transparent',
      color: active ? 'common.white' : 'text.primary',
      borderColor: color || 'divider',
      '&:hover': {
        bgcolor: active ? (color || 'primary.main') : (color ? alpha(color, 0.08) : 'action.hover'),
      },
    }}
  />
);
