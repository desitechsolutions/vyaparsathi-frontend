import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import {
  Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle,
  CircularProgress, Box, Typography, Container, Alert, Autocomplete,
  InputAdornment, Paper, Chip, Stack, Snackbar, Grid, LinearProgress,
  Divider, Tooltip, IconButton, MenuItem, Tab, Tabs, Avatar, Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  Inventory as InventoryIcon,
  TrendingDown, TrendingUp,
  WarningAmber as WarningIcon,
  Search as SearchIcon,
  AttachMoney,
  ShowChart,
  BarChart,
  History as HistoryIcon,
  SettingsSuggest,
  FileDownload,
  InfoOutlined as InfoIcon,
  Assessment,
  Upload as UploadIcon,
  FileUpload as FileUploadIcon,
  Download as DownloadTemplateIcon,
  LayersOutlined as BatchIcon,
  SwapHoriz as SwapHorizIcon,
  EventBusy as ExpiryIcon,
  FilterAltOff as FilterAltOffIcon,
} from '@mui/icons-material';
import {
  fetchStock, addStock, fetchItemVariants,
  adjustStock, fetchStockMovements, exportStockReport,
  fetchBatchWiseStock, downloadStockImportTemplate, importStockFromExcel,
  updateItemVariant, fetchExpiryAlerts,
} from '../services/api';
import StockTransferModal from '../components/stock/StockTransferModal';
import CustomToolbar from './items/components/CustomToolbar';
import { useShop } from '../context/ShopContext';
import { useTranslation } from 'react-i18next';

const initialFormState = {
  itemVariantId: '', quantity: '', batch: '', costPerUnit: '',
  newRetailPrice: '', reason: '', manufacturingDate: '', expiryDate: '',
};

// Per-variant threshold fallback — matches the pre-redesign hardcoded value
// so any variant without a configured lowStockThreshold behaves the same as
// before. Once every variant has one, this constant can drop to 0.
const DEFAULT_LOW_STOCK_THRESHOLD = 10;

const formatCurrency = (val) =>
  Number(val || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

// Derives the low-stock threshold for a row, defaulting to the constant when
// the backend hasn't set one. Kept as a helper so the KPI stat, the row-level
// color, and the LinearProgress denominator all agree.
const thresholdOf = (row) =>
  row?.lowStockThreshold != null ? Number(row.lowStockThreshold) : DEFAULT_LOW_STOCK_THRESHOLD;

const stockStateOf = (row) => {
  const qty = Number(row?.totalQuantity || 0);
  const threshold = thresholdOf(row);
  if (qty <= 0) return 'OUT';
  if (qty < threshold) return 'LOW';
  return 'OK';
};

// Buckets an expiryDate string into one of five states used by the pill,
// the row filter, and the "Near expiry" KPI count.
const expiryStateOf = (expiry) => {
  if (!expiry) return 'NONE';
  const today = new Date();
  const d = new Date(expiry);
  const daysLeft = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return 'EXPIRED';
  if (daysLeft <= 30) return 'CRITICAL';
  if (daysLeft <= 90) return 'NEAR';
  return 'OK';
};

const daysLeftOf = (expiry) => {
  if (!expiry) return null;
  const today = new Date();
  const d = new Date(expiry);
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
};

// Industry-aware chip strip on the primary "Product" column. Values live on
// the flattened CurrentStockDto — new industry fields are added by the V76
// migration and surfaced via ItemMapper. Empty values are dropped so a
// grocery shop doesn't render "—" chips.
const industryChips = (row, industryType) => {
  const chips = [];
  const push = (label) => { if (label != null && String(label).trim() !== '') chips.push(String(label)); };
  switch (industryType) {
    case 'JEWELLERY':
      push(row.metalType);
      push(row.metalPurity);
      if (row.weightGrams) push(`${row.weightGrams}g`);
      break;
    case 'ELECTRONICS':
      push(row.serialNumber);
      if (row.warrantyMonths) push(`${row.warrantyMonths}m warranty`);
      break;
    case 'AUTOMOBILE':
      push(row.partNumber);
      break;
    case 'CLOTHING':
      push(row.color);
      push(row.size);
      push(row.fit);
      break;
    default:
      push(row.color);
      push(row.size);
      push(row.design);
  }
  return chips;
};

// Small reusable KPI cell — matches the KpiCell convention already inlined
// in ItemsPage.jsx / ProductOverview.jsx. Kept local per project convention
// (extract once a fourth consumer emerges).
const KpiCell = ({ icon, label, value, color, divider }) => (
  <Box
    sx={{
      p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
      borderRight: divider ? '1px solid' : 'none',
      borderColor: 'divider',
    }}
  >
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

// Solid-text pill for expiry states — avoids the layered-opacity bug the
// pre-redesign column had (bgcolor:<color> + opacity:0.15 on the same box
// made the text illegible on some themes).
const ExpiryPill = ({ expiry, muted }) => {
  const theme = useTheme();
  if (!expiry) {
    return <Typography variant="caption" color="text.disabled">N/A</Typography>;
  }
  const state = expiryStateOf(expiry);
  const daysLeft = daysLeftOf(expiry);
  let color = theme.palette.success.main;
  let label = new Date(expiry).toLocaleDateString('en-IN');
  if (state === 'EXPIRED') { color = theme.palette.error.main; label = 'EXPIRED'; }
  else if (state === 'CRITICAL') { color = theme.palette.error.main; label = `${daysLeft}d left`; }
  else if (state === 'NEAR') { color = theme.palette.warning.main; label = `${daysLeft}d left`; }
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', px: 1, py: 0.25,
      borderRadius: 1, bgcolor: alpha(color, muted ? 0.08 : 0.12),
    }}>
      <Typography variant="caption" fontWeight={700} sx={{ color }}>
        {label}
      </Typography>
    </Box>
  );
};

const Stock = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { industryType } = useShop();

  const [stock, setStock] = useState([]);
  const [batchStock, setBatchStock] = useState([]);
  const [serverExpiryCount, setServerExpiryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  // 0 = Summary view, 1 = Batch-wise view
  const [viewTab, setViewTab] = useState(0);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    reportType: 'current',
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    format: 'excel',
  });

  const [formData, setFormData] = useState(initialFormState);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [itemVariants, setItemVariants] = useState([]);

  // Filter state
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [brandFilter, setBrandFilter] = useState(null);
  const [expiryFilter, setExpiryFilter] = useState('ALL'); // ALL | EXPIRED | CRITICAL | NEAR | OK | NONE
  const [stockFilter, setStockFilter] = useState('ALL');  // ALL | OK | LOW | OUT | EXPIRED | NEAR

  const searchInputRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [stockRes, variantsRes, batchRes, expiryRes] = await Promise.all([
        fetchStock(), fetchItemVariants(), fetchBatchWiseStock(),
        fetchExpiryAlerts(90).catch(() => ({ data: [] })),
      ]);
      if (Array.isArray(stockRes.data)) {
        setStock(stockRes.data.map((item) => ({ ...item, id: item.itemVariantId })));
      }
      setItemVariants(variantsRes.data || []);
      if (batchRes && Array.isArray(batchRes.data)) {
        setBatchStock(batchRes.data.map((b, i) => ({
          ...b,
          id: `${b.itemVariantId}-${b.batchNumber || 'nobatch'}-${i}`,
        })));
      }
      const expiryList = Array.isArray(expiryRes?.data) ? expiryRes.data : [];
      setServerExpiryCount(expiryList.length);
    } catch (err) {
      setError(t('stock.errorFetch'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadData(); }, [loadData]);

  // ⌘K / Ctrl+K → focus the search box (matches ItemsPage behavior).
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Real-time inventory updates ──────────────────────────────────────────────
  // Listens for ws:inventory CustomEvents dispatched by useWebSocket when the
  // backend pushes a stock change to /topic/shop/{shopId}/inventory.
  // Payload: { itemId, newQty, warehouseId }
  // Reloads the grid with a short debounce to handle bursts of updates.
  const stockReloadTimerRef = useRef(null);
  useEffect(() => {
    const handleInventory = () => {
      if (stockReloadTimerRef.current) clearTimeout(stockReloadTimerRef.current);
      stockReloadTimerRef.current = setTimeout(() => { loadData(); }, 600);
    };
    window.addEventListener('ws:inventory', handleInventory);
    return () => {
      window.removeEventListener('ws:inventory', handleInventory);
      if (stockReloadTimerRef.current) clearTimeout(stockReloadTimerRef.current);
    };
  }, [loadData]);

  // Derive category & brand option lists from the loaded stock so the filter
  // dropdowns never lag behind the grid.
  const categoryOptions = useMemo(() => {
    const set = new Set();
    stock.forEach((s) => { if (s.categoryName) set.add(s.categoryName); });
    return Array.from(set).sort();
  }, [stock]);

  const brandOptions = useMemo(() => {
    const set = new Set();
    stock.forEach((s) => { if (s.brandName) set.add(s.brandName); });
    return Array.from(set).sort();
  }, [stock]);

  const hasFilters = Boolean(
    searchText || categoryFilter || brandFilter ||
    expiryFilter !== 'ALL' || stockFilter !== 'ALL'
  );

  const clearAllFilters = () => {
    setSearchText('');
    setCategoryFilter(null);
    setBrandFilter(null);
    setExpiryFilter('ALL');
    setStockFilter('ALL');
  };

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return stock.filter((row) => {
      if (q) {
        const hay = `${row.itemName || ''} ${row.sku || ''} ${row.brandName || ''} ${row.hsn || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (categoryFilter && row.categoryName !== categoryFilter) return false;
      if (brandFilter && row.brandName !== brandFilter) return false;
      if (expiryFilter !== 'ALL' && expiryStateOf(row.expiryDate) !== expiryFilter) return false;
      if (stockFilter !== 'ALL') {
        const s = stockStateOf(row);
        if (stockFilter === 'EXPIRED' || stockFilter === 'NEAR') {
          const es = expiryStateOf(row.expiryDate);
          if (stockFilter === 'EXPIRED' && es !== 'EXPIRED') return false;
          if (stockFilter === 'NEAR' && !(es === 'CRITICAL' || es === 'NEAR')) return false;
        } else if (s !== stockFilter) {
          return false;
        }
      }
      return true;
    });
  }, [stock, searchText, categoryFilter, brandFilter, expiryFilter, stockFilter]);

  const stats = useMemo(() => {
    const totalItems = stock.length;
    const lowStock = stock.filter((s) => stockStateOf(s) === 'LOW' || stockStateOf(s) === 'OUT').length;
    const nearExpiry = stock.filter((s) => {
      const es = expiryStateOf(s.expiryDate);
      return es === 'EXPIRED' || es === 'CRITICAL' || es === 'NEAR';
    }).length;
    const totalValue = stock.reduce(
      (acc, curr) => acc + (Number(curr.totalQuantity || 0) * Number(curr.costPerUnit || 0)), 0);
    const potentialRevenue = stock.reduce(
      (acc, curr) => acc + (Number(curr.totalQuantity || 0) * Number(curr.pricePerUnit || 0)), 0);
    return {
      totalItems, lowStock, nearExpiry,
      totalValue, potentialRevenue,
      projectedProfit: potentialRevenue - totalValue,
    };
  }, [stock]);

  const stockChipCounts = useMemo(() => ({
    ALL: stock.length,
    OK: stock.filter((s) => stockStateOf(s) === 'OK').length,
    LOW: stock.filter((s) => stockStateOf(s) === 'LOW').length,
    OUT: stock.filter((s) => stockStateOf(s) === 'OUT').length,
    EXPIRED: stock.filter((s) => expiryStateOf(s.expiryDate) === 'EXPIRED').length,
    NEAR: stock.filter((s) => {
      const es = expiryStateOf(s.expiryDate);
      return es === 'CRITICAL' || es === 'NEAR';
    }).length,
  }), [stock]);

  const selectedVariant = useMemo(
    () => itemVariants.find((v) => v.id === formData.itemVariantId),
    [formData.itemVariantId, itemVariants],
  );

  // Industry-aware option label for the "Select variant" Autocomplete —
  // clothing shows color/size, jewellery shows metal/purity/weight, etc.
  const variantOptionLabel = useCallback((v) => {
    if (!v) return '';
    const chips = industryChips(v, industryType);
    const tail = chips.length ? ` — ${chips.join(' · ')}` : '';
    return `${v.itemName || ''}${tail}`;
  }, [industryType]);

  // ── Handlers (behavior identical to the pre-redesign page) ─────────

  const handleSubmit = async () => {
    if (!formData.itemVariantId || !formData.quantity || !formData.costPerUnit) {
      setError(t('stock.errorRequiredFields'));
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        itemVariantId: formData.itemVariantId,
        quantity: Number(formData.quantity),
        costPerUnit: Number(formData.costPerUnit),
        batch: formData.batch || null,
        manufacturingDate: formData.manufacturingDate || null,
        expiryDate: formData.expiryDate || null,
      };
      await addStock(payload);
      if (formData.newRetailPrice && Number(formData.newRetailPrice) > 0) {
        const variant = itemVariants.find(v => v.id === formData.itemVariantId);
        if (variant) {
          await updateItemVariant(formData.itemVariantId, {
            ...variant,
            pricePerUnit: Number(formData.newRetailPrice),
          });
        }
      }
      setSuccessMsg(t('stock.successAdd'));
      setOpen(false); setFormData(initialFormState); loadData();
    } catch (err) {
      setError(t('stock.errorAdd'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustSubmit = async () => {
    if (!formData.itemVariantId || !formData.quantity || !formData.reason) {
      setError(t('stock.errorRequiredFields'));
      return;
    }
    setIsSubmitting(true);
    try {
      await adjustStock({
        itemVariantId: formData.itemVariantId,
        adjustmentQuantity: Number(formData.quantity),
        reason: formData.reason,
      });
      setSuccessMsg(t('stock.successAdjust'));
      setAdjustOpen(false); setFormData(initialFormState); loadData();
    } catch (err) {
      setError(t('stock.errorAdjust'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async () => {
    setIsSubmitting(true);
    try {
      let response;
      let filename;
      if (exportConfig.reportType === 'movement') {
        const startIso = `${exportConfig.startDate}T00:00:00`;
        const endIso = `${exportConfig.endDate}T23:59:59`;
        response = await exportStockReport(startIso, endIso, exportConfig.format);
        filename = `Stock_Movements_${exportConfig.startDate}_to_${exportConfig.endDate}`;
      } else {
        response = await exportStockReport(null, null, exportConfig.format);
        filename = `Current_Inventory_Status_${new Date().toISOString().split('T')[0]}`;
      }
      const blob = new Blob([response.data], {
        type: exportConfig.format === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : exportConfig.format === 'pdf' ? 'application/pdf' : 'text/csv',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const ext = exportConfig.format === 'excel' ? 'xlsx' : exportConfig.format;
      link.setAttribute('download', `${filename}.${ext}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportDialogOpen(false);
      setSuccessMsg(t('stock.successExport') || 'Report downloaded successfully');
    } catch (err) {
      setError(t('stock.errorExport'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewHistory = async (variantId) => {
    try {
      const res = await fetchStockMovements(variantId);
      setSelectedHistory(res.data); setHistoryOpen(true);
    } catch (err) {
      setError(t('stock.errorHistory'));
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await downloadStockImportTemplate();
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'stock_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(t('stock.import.failedToDownload'));
    }
  };

  const handleImportSubmit = async () => {
    if (!importFile) { setError(t('stock.import.selectFileError')); return; }
    setIsImporting(true);
    setImportResult(null);
    try {
      const res = await importStockFromExcel(importFile);
      setImportResult(res.data);
      if (res.data.errorCount === 0) {
        setSuccessMsg(t('stock.import.successCount', { count: res.data.successCount }));
        setImportDialogOpen(false);
        loadData();
      }
    } catch (err) {
      setError(err.response?.data?.message || t('stock.import.importFailed'));
    } finally {
      setIsImporting(false);
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Column visibility defaults per industry ────────────────────────
  //
  // Expiry / MRP make no sense for durable-goods industries; the user can
  // still enable them via the CustomToolbar "Columns" menu. HSN + GST are
  // hidden by default across the board — they're compliance data, not
  // day-to-day inventory data.
  const isPerishable = industryType === 'CLOTHING' || industryType === 'GROCERY'
    || industryType === 'FOOTWEAR' || industryType === 'STATIONERY'
    || industryType === 'GENERAL' || !industryType;
  const summaryColumnVisibility = {
    mrp: isPerishable,
    expiryDate: isPerishable,
    hsn: false,
    gstRate: false,
  };

  // ── Column definitions ─────────────────────────────────────────────

  const summaryColumns = [
    {
      field: 'itemName',
      headerName: t('stock.columns.productDetails'),
      flex: 1.5, minWidth: 260,
      renderCell: (params) => {
        const chips = industryChips(params.row, industryType);
        const initials = (params.value || 'x').trim().slice(0, 1).toUpperCase();
        return (
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.5, width: '100%' }}>
            <Avatar
              src={params.row.photoPath || undefined}
              variant="rounded"
              sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main', fontWeight: 700 }}
            >
              {initials}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" fontWeight={700} noWrap>{params.value}</Typography>
              <Typography variant="caption" color="text.secondary" component="span">
                {t('stock.columns.skuLabel')} {params.row.sku}
              </Typography>
              {chips.length > 0 && (
                <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap" useFlexGap>
                  {chips.slice(0, 3).map((c, i) => (
                    <Chip key={`${c}-${i}`} label={c} size="small"
                      sx={{ height: 18, fontSize: '0.65rem', borderRadius: 0.75, bgcolor: 'action.selected' }} />
                  ))}
                </Stack>
              )}
            </Box>
          </Stack>
        );
      },
    },
    {
      field: 'categoryName',
      headerName: 'Category · Brand',
      flex: 1, minWidth: 160,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={600} noWrap>
            {params.row.categoryName || '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {params.row.brandName || '—'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'totalQuantity',
      headerName: t('stock.columns.inventoryStatus'),
      flex: 1, minWidth: 160,
      renderCell: (params) => {
        const qty = Number(params.value || 0);
        const threshold = thresholdOf(params.row);
        const state = stockStateOf(params.row);
        const color = state === 'OUT' ? 'error.main'
          : state === 'LOW' ? 'warning.main'
          : 'success.main';
        // Denominator = 2× threshold so a variant at the threshold reads as
        // ~50% full and one well-stocked variant hits 100%.
        const pct = threshold > 0 ? Math.min((qty / (threshold * 2)) * 100, 100) : 0;
        const barColor = state === 'OUT' ? 'error' : state === 'LOW' ? 'warning' : 'success';
        return (
          <Tooltip title={`Threshold: ${threshold}`} arrow>
            <Box sx={{ width: '100%' }}>
              <Typography variant="body2" fontWeight={800} sx={{ color }} mb={0.5}>
                {qty} {params.row.unit}
              </Typography>
              <LinearProgress
                variant="determinate" value={pct} color={barColor}
                sx={{ height: 4, borderRadius: 2, bgcolor: 'background.default' }}
              />
            </Box>
          </Tooltip>
        );
      },
    },
    {
      field: 'mrp',
      headerName: 'MRP',
      flex: 0.7, minWidth: 100,
      renderCell: (params) => params.value
        ? <Typography variant="body2" color="text.secondary">₹{formatCurrency(params.value)}</Typography>
        : <Typography variant="caption" color="text.disabled">—</Typography>,
    },
    {
      field: 'costPerUnit',
      headerName: t('stock.columns.purchasePrice'),
      flex: 0.8, minWidth: 130,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">₹{formatCurrency(params.value)}</Typography>
      ),
    },
    {
      field: 'pricePerUnit',
      headerName: t('stock.columns.sellingPrice'),
      flex: 0.8, minWidth: 120,
      renderCell: (params) => <Typography variant="body2" fontWeight={700}>₹{formatCurrency(params.value)}</Typography>,
    },
    {
      field: 'margin',
      headerName: t('stock.columns.margin'),
      flex: 0.6, minWidth: 90,
      // DataGrid v6 signature: single params object. Enables sort/filter on
      // the derived margin field so users can sort products by profit %.
      valueGetter: (params) => {
        const cost = Number(params.row?.costPerUnit || 0);
        const price = Number(params.row?.pricePerUnit || 0);
        if (price === 0) return 0;
        return ((price - cost) / price) * 100;
      },
      renderCell: (params) => {
        const cost = Number(params.row.costPerUnit || 0);
        const price = Number(params.row.pricePerUnit || 0);
        if (cost === 0 || price === 0) {
          return <Typography variant="caption" color="text.disabled">{t('stock.columns.nA')}</Typography>;
        }
        const margin = params.value;
        const positive = margin > 0;
        return (
          <Stack direction="row" alignItems="center" spacing={0.5}
            sx={{ color: positive ? 'success.main' : 'error.main' }}>
            {positive ? <TrendingUp sx={{ fontSize: 16 }} /> : <TrendingDown sx={{ fontSize: 16 }} />}
            <Typography variant="body2" fontWeight={700}>{margin.toFixed(0)}%</Typography>
          </Stack>
        );
      },
    },
    {
      field: 'expiryDate',
      headerName: 'Expiry',
      flex: 0.9, minWidth: 130,
      renderCell: (params) => <ExpiryPill expiry={params.value} />,
    },
    {
      field: 'hsn',
      headerName: 'HSN',
      flex: 0.6, minWidth: 100,
      renderCell: (params) => (
        <Typography variant="caption" sx={{ fontFamily: 'monospace' }} color="text.secondary">
          {params.value || '—'}
        </Typography>
      ),
    },
    {
      field: 'gstRate',
      headerName: 'GST %',
      flex: 0.5, minWidth: 80,
      renderCell: (params) => (
        <Typography variant="caption" color="text.secondary">
          {params.value != null ? `${params.value}%` : '—'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: t('stock.columns.actions'),
      flex: 0.5, minWidth: 100,
      sortable: false, filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={t('stock.tooltips.viewHistory')}>
            <IconButton size="small" aria-label={t('stock.tooltips.viewHistory')}
              onClick={() => viewHistory(params.row.itemVariantId)}>
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('stock.tooltips.adjustStock')}>
            <IconButton size="small" color="primary" aria-label={t('stock.tooltips.adjustStock')}
              onClick={() => {
                setFormData({ ...initialFormState, itemVariantId: params.row.itemVariantId });
                setAdjustOpen(true);
              }}>
              <SettingsSuggest fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const batchColumns = [
    {
      field: 'itemName',
      headerName: 'Product',
      flex: 1.5, minWidth: 220,
      renderCell: (params) => (
        <Box sx={{ py: 0.5 }}>
          <Typography variant="body2" fontWeight={700} noWrap>{params.value}</Typography>
          <Typography variant="caption" color="text.secondary">SKU: {params.row.sku}</Typography>
        </Box>
      ),
    },
    {
      field: 'batchNumber',
      headerName: 'Batch / Lot No.',
      flex: 1, minWidth: 130,
      renderCell: (params) => (
        <Chip
          label={params.value || 'No Batch'}
          size="small"
          icon={<BatchIcon />}
          variant="outlined"
          color={params.value ? 'primary' : 'default'}
          sx={{ fontWeight: 600, borderRadius: 1 }}
        />
      ),
    },
    {
      field: 'quantity',
      headerName: 'Qty in Batch',
      flex: 0.8, minWidth: 120,
      renderCell: (params) => {
        const qty = Number(params.value || 0);
        return (
          <Box sx={{ width: '100%' }}>
            <Typography variant="body2" fontWeight={800}
              color={qty <= 0 ? 'error.main' : 'success.main'}>
              {qty} {params.row.unit}
            </Typography>
            <LinearProgress variant="determinate"
              value={Math.min((qty / (DEFAULT_LOW_STOCK_THRESHOLD * 2)) * 100, 100)}
              color={qty <= 0 ? 'error' : 'success'}
              sx={{ height: 4, borderRadius: 2, bgcolor: 'background.default', mt: 0.5 }} />
          </Box>
        );
      },
    },
    {
      field: 'expiryDate',
      headerName: 'Expiry Date',
      flex: 1, minWidth: 140,
      renderCell: (params) => <ExpiryPill expiry={params.value} />,
    },
    {
      field: 'costPerUnit',
      headerName: 'Cost/Unit',
      flex: 0.8, minWidth: 110,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">₹{formatCurrency(params.value)}</Typography>
      ),
    },
    {
      field: 'mrp',
      headerName: 'MRP',
      flex: 0.8, minWidth: 100,
      renderCell: (params) => params.value
        ? <Typography variant="body2" fontWeight={700}>₹{formatCurrency(params.value)}</Typography>
        : <Typography variant="caption" color="text.disabled">—</Typography>,
    },
  ];

  const batchFiltered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return batchStock;
    return batchStock.filter((b) => {
      const hay = `${b.itemName || ''} ${b.sku || ''} ${b.batchNumber || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [batchStock, searchText]);

  // Shared DataGrid style — mirrors the ItemsPage / ProductOverview convention.
  const dataGridSx = {
    border: 0,
    '& .MuiDataGrid-columnHeaders': {
      bgcolor: alpha(theme.palette.text.primary, 0.04),
      borderBottom: '1px solid',
      borderColor: 'divider',
    },
    '& .MuiDataGrid-columnHeaderTitle': {
      fontWeight: 700, fontSize: '0.72rem',
      textTransform: 'uppercase', letterSpacing: 0.5,
    },
    '& .MuiDataGrid-cell': { borderBottom: '1px solid', borderColor: 'divider' },
    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
    '& .MuiDataGrid-row:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 4 }}>
      <Container maxWidth="xl" sx={{ pt: 3 }}>

        {/* ── Header ────────────────────────────────────── */}
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between"
          alignItems={{ md: 'center' }} mb={2.5} spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={700} color="text.primary"
              sx={{ letterSpacing: -0.4 }}>
              {t('stock.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('stock.subtitle')}
              {industryType ? ` · ${industryType}` : ''}
              {` · ${stats.totalItems} variants`}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button variant="outlined" size="small" startIcon={<SwapHorizIcon />}
              onClick={() => setTransferOpen(true)}
              sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none' }}>
              Stock Transfers
            </Button>
            <Button variant="outlined" size="small" startIcon={<FileDownload />}
              onClick={() => setExportDialogOpen(true)}
              sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none' }}>
              {t('stock.actions.export')}
            </Button>
            <Button variant="outlined" size="small" color="secondary" startIcon={<FileUploadIcon />}
              onClick={() => { setImportResult(null); setImportDialogOpen(true); }}
              sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none' }}>
              {t('stock.actions.bulkImport')}
            </Button>
            <Button variant="outlined" size="small" onClick={() => navigate('/stock/reports')}
              sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none' }}>
              Reports
            </Button>
            <Button variant="outlined" size="small" onClick={() => navigate('/stock/cycle-counts')}
              sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none' }}>
              Stocktake
            </Button>
            <Button variant="outlined" size="small" onClick={() => navigate('/stock/recalls')}
              sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none' }}>
              Recalls
            </Button>
            <Button variant="outlined" size="small" onClick={() => navigate('/stock/adjustment-approvals')}
              sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none' }}>
              Approvals
            </Button>
            <Button variant="outlined" size="small" onClick={() => navigate('/stock/labels')}
              sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none' }}>
              Labels
            </Button>
            <Button variant="outlined" size="small" onClick={() => navigate('/stock/bundles')}
              sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none' }}>
              Bundles
            </Button>
            <Button variant="outlined" size="small" onClick={() => navigate('/stock/uom')}
              sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none' }}>
              UOM
            </Button>
            <Button variant="outlined" size="small" startIcon={<ShowChart />}
              onClick={() => setAnalyticsOpen(true)}
              sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none' }}>
              {t('stock.actions.analytics')}
            </Button>
            <Button variant="contained" size="small" startIcon={<AddIcon />}
              onClick={() => setOpen(true)}
              sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none' }}>
              {t('stock.actions.addNewStock')}
            </Button>
          </Stack>
        </Stack>

        {/* ── KPI strip ─────────────────────────────────── */}
        <Paper elevation={0}
          sx={{
            border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
          }}>
          <KpiCell icon={<InventoryIcon fontSize="small" />} label="ACTIVE VARIANTS"
            value={loading ? '—' : stats.totalItems.toLocaleString('en-IN')}
            color={theme.palette.primary.main} divider />
          <KpiCell icon={<WarningIcon fontSize="small" />} label="LOW / OUT OF STOCK"
            value={loading ? '—' : stats.lowStock}
            color={stats.lowStock > 0 ? theme.palette.error.main : theme.palette.text.secondary} divider />
          <KpiCell icon={<ExpiryIcon fontSize="small" />} label="NEAR EXPIRY (≤ 90D)"
            value={loading ? '—' : serverExpiryCount}
            color={serverExpiryCount > 0 ? theme.palette.warning.main : theme.palette.text.secondary} divider />
          <KpiCell icon={<AttachMoney fontSize="small" />} label="INVESTMENT VALUE"
            value={loading ? '—' : `₹${formatCurrency(stats.totalValue)}`}
            color={theme.palette.success.main} divider />
          <KpiCell icon={<BarChart fontSize="small" />} label="POTENTIAL REVENUE"
            value={loading ? '—' : `₹${formatCurrency(stats.potentialRevenue)}`}
            color={theme.palette.info.main} />
        </Paper>

        {/* ── Grid + filters ────────────────────────────── */}
        <Paper elevation={0} sx={{
          borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden',
        }}>
          <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
            <Tabs value={viewTab} onChange={(_, v) => setViewTab(v)}
              sx={{ px: 2, minHeight: 40, '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', minHeight: 40 } }}>
              <Tab label={t('stock.tabs.summaryView')} />
              <Tab label={t('stock.tabs.batchWiseView')}
                icon={<BatchIcon fontSize="small" />} iconPosition="start" />
            </Tabs>
          </Box>

          <Stack sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }} spacing={1.5}>
            {/* Row 1 — search + category + brand + expiry */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}
              alignItems={{ md: 'center' }}>
              <TextField
                inputRef={searchInputRef}
                placeholder={`${t('stock.searchPlaceholder')}  ·  ⌘K`}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ flex: 1 }}
              />
              {viewTab === 0 && (
                <>
                  <Autocomplete
                    options={categoryOptions}
                    value={categoryFilter}
                    onChange={(_, v) => setCategoryFilter(v)}
                    size="small"
                    sx={{ minWidth: 200 }}
                    renderInput={(p) => <TextField {...p} placeholder="All categories" />}
                  />
                  <Autocomplete
                    options={brandOptions}
                    value={brandFilter}
                    onChange={(_, v) => setBrandFilter(v)}
                    size="small"
                    sx={{ minWidth: 180 }}
                    renderInput={(p) => <TextField {...p} placeholder="All brands" />}
                  />
                </>
              )}
              {hasFilters && (
                <Button size="small" startIcon={<FilterAltOffIcon fontSize="small" />}
                  onClick={clearAllFilters}
                  sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
                  Clear
                </Button>
              )}
            </Stack>

            {/* Row 2 — stock-state chips (summary tab only) */}
            {viewTab === 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" useFlexGap>
                <StockTab active={stockFilter === 'ALL'} onClick={() => setStockFilter('ALL')}
                  label="All" count={stockChipCounts.ALL} />
                <StockTab active={stockFilter === 'OK'} onClick={() => setStockFilter('OK')}
                  label="In stock" count={stockChipCounts.OK} color={theme.palette.success.main} />
                <StockTab active={stockFilter === 'LOW'} onClick={() => setStockFilter('LOW')}
                  label="Low" count={stockChipCounts.LOW} color={theme.palette.warning.main} />
                <StockTab active={stockFilter === 'OUT'} onClick={() => setStockFilter('OUT')}
                  label="Out" count={stockChipCounts.OUT} color={theme.palette.error.main} />
                <StockTab active={stockFilter === 'NEAR'} onClick={() => setStockFilter('NEAR')}
                  label="Near expiry" count={stockChipCounts.NEAR} color={theme.palette.warning.dark} />
                <StockTab active={stockFilter === 'EXPIRED'} onClick={() => setStockFilter('EXPIRED')}
                  label="Expired" count={stockChipCounts.EXPIRED} color={theme.palette.error.dark} />
                <Box sx={{ flex: 1 }} />
                {hasFilters && (
                  <Typography variant="caption" color="text.secondary">
                    Showing {filteredRows.length} of {stock.length}
                  </Typography>
                )}
              </Stack>
            )}
          </Stack>

          {loading ? (
            <Box sx={{ p: 2 }}>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={44}
                  sx={{ mb: 1, borderRadius: 1 }} />
              ))}
            </Box>
          ) : viewTab === 0 ? (
            <Box sx={{ width: '100%' }}>
              <DataGrid
                rows={filteredRows}
                columns={summaryColumns}
                autoHeight
                disableRowSelectionOnClick
                rowHeight={64}
                density="standard"
                initialState={{
                  columns: { columnVisibilityModel: summaryColumnVisibility },
                  pagination: { paginationModel: { pageSize: 25, page: 0 } },
                }}
                pageSizeOptions={[10, 25, 50, 100]}
                slots={{ toolbar: CustomToolbar }}
                sx={dataGridSx}
                localeText={{
                  noRowsLabel: hasFilters ? 'No variants match the current filters.' : t('stock.noData'),
                  columnHeaderSortIconLabel: t('stock.sort'),
                }}
              />
            </Box>
          ) : (
            <Box sx={{ width: '100%' }}>
              <DataGrid
                rows={batchFiltered}
                columns={batchColumns}
                autoHeight
                disableRowSelectionOnClick
                rowHeight={56}
                density="standard"
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
                slots={{ toolbar: CustomToolbar }}
                sx={dataGridSx}
                localeText={{ noRowsLabel: t('stock.noBatchStock') }}
              />
            </Box>
          )}
        </Paper>
      </Container>

      {/* ── Bulk Import Dialog ─────────────────────────── */}
      <Dialog open={importDialogOpen}
        onClose={() => { setImportDialogOpen(false); setImportResult(null); setImportFile(null); }}
        fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ p: 2.5, fontWeight: 700, fontSize: '1.15rem' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <FileUploadIcon color="secondary" fontSize="small" />
            {t('stock.import.dialogTitle')}
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <Alert severity="info" sx={{ borderRadius: 1.5 }}>
              {t('stock.import.infoText')}
            </Alert>
            <Button variant="outlined" size="small" startIcon={<DownloadTemplateIcon />}
              onClick={handleDownloadTemplate}
              sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none', alignSelf: 'flex-start' }}>
              {t('stock.import.downloadTemplate')}
            </Button>
            <Box
              sx={{
                border: '2px dashed', borderColor: importFile ? 'success.main' : 'divider',
                borderRadius: 2, p: 3, textAlign: 'center', cursor: 'pointer',
                bgcolor: importFile ? alpha(theme.palette.success.main, 0.06) : 'background.default',
                transition: 'all 0.2s',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".xlsx" style={{ display: 'none' }}
                onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
              <UploadIcon sx={{
                fontSize: 36,
                color: importFile ? 'success.main' : 'text.secondary',
                mb: 0.5,
              }} />
              <Typography variant="body2" fontWeight={700}
                color={importFile ? 'success.main' : 'text.secondary'}>
                {importFile ? importFile.name : t('stock.import.clickToSelect')}
              </Typography>
              {importFile && (
                <Typography variant="caption" color="text.secondary">
                  {(importFile.size / 1024).toFixed(1)} KB
                </Typography>
              )}
            </Box>
            {importResult && (
              <Box>
                <Alert severity={importResult.errorCount === 0 ? 'success' : 'warning'}
                  sx={{ borderRadius: 1.5, mb: 1 }}>
                  {t('stock.import.successCount', { count: importResult.successCount })}
                  {importResult.errorCount > 0
                    ? `, ${t('stock.import.errorCount', { count: importResult.errorCount })}`
                    : ''}
                </Alert>
                {importResult.errors && importResult.errors.length > 0 && (
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, maxHeight: 200, overflowY: 'auto' }}>
                    {importResult.errors.map((e, i) => (
                      <Typography key={i} variant="caption" color="error" display="block">
                        • {e}
                      </Typography>
                    ))}
                  </Paper>
                )}
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{
          p: 2, bgcolor: alpha(theme.palette.text.primary, 0.02),
          borderTop: '1px solid', borderColor: 'divider', gap: 1,
        }}>
          <Button
            onClick={() => { setImportDialogOpen(false); setImportResult(null); setImportFile(null); }}
            sx={{ fontWeight: 600, textTransform: 'none', color: 'text.secondary' }}>
            {importResult?.errorCount === 0 ? t('common.close') : t('common.cancel')}
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" onClick={handleImportSubmit}
            disabled={!importFile || isImporting}
            startIcon={isImporting ? <CircularProgress size={16} /> : <FileUploadIcon />}
            sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none' }}>
            {isImporting ? t('stock.import.importing') : t('stock.import.importStock')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Export Dialog ──────────────────────────────── */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}
        fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ p: 2.5, fontWeight: 700, fontSize: '1.15rem' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Assessment color="primary" fontSize="small" />
            {t('stock.actions.export') || 'Generate Report'}
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField select label={t('stock.form.reportType') || 'Report Type'}
              value={exportConfig.reportType} size="small"
              onChange={(e) => setExportConfig({ ...exportConfig, reportType: e.target.value })}
              fullWidth>
              <MenuItem value="current">{t('stock.form.reportSummary') || 'Current Inventory Summary'}</MenuItem>
              <MenuItem value="movement">{t('stock.form.auditLogReport') || 'Stock Movement Audit Log'}</MenuItem>
            </TextField>
            {exportConfig.reportType === 'movement' && (
              <>
                <TextField label={t('stock.form.from') || 'From Date'} type="date" size="small"
                  value={exportConfig.startDate}
                  onChange={(e) => setExportConfig({ ...exportConfig, startDate: e.target.value })}
                  fullWidth InputLabelProps={{ shrink: true }} />
                <TextField label={t('stock.form.to') || 'To Date'} type="date" size="small"
                  value={exportConfig.endDate}
                  onChange={(e) => setExportConfig({ ...exportConfig, endDate: e.target.value })}
                  fullWidth InputLabelProps={{ shrink: true }} />
              </>
            )}
            <TextField select label={t('stock.form.format') || 'File Format'} size="small"
              value={exportConfig.format}
              onChange={(e) => setExportConfig({ ...exportConfig, format: e.target.value })}
              fullWidth>
              <MenuItem value="excel">Excel (.xlsx)</MenuItem>
              <MenuItem value="csv">CSV (.csv)</MenuItem>
              <MenuItem value="pdf">PDF (.pdf)</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{
          p: 2, bgcolor: alpha(theme.palette.text.primary, 0.02),
          borderTop: '1px solid', borderColor: 'divider', gap: 1,
        }}>
          <Button onClick={() => setExportDialogOpen(false)}
            sx={{ fontWeight: 600, textTransform: 'none', color: 'text.secondary' }}>
            {t('common.cancel')}
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" onClick={handleExport} disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : <FileDownload />}
            sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none' }}>
            {t('stock.actions.downloadReport') || 'Download'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Add Stock Dialog ───────────────────────────── */}
      <Dialog open={open} onClose={() => setOpen(false)}
        fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ p: 2.5, fontWeight: 700, fontSize: '1.15rem' }}>
          {t('stock.dialog.addStockTitle')}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <Autocomplete
              options={itemVariants}
              getOptionLabel={variantOptionLabel}
              value={itemVariants.find(v => v.id === formData.itemVariantId) || null}
              onChange={(_, v) => setFormData({ ...formData, itemVariantId: v?.id || '' })}
              renderOption={(props, option) => {
                const chips = industryChips(option, industryType);
                return (
                  <Box component="li" {...props} key={option.id}>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{option.itemName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        SKU: {option.sku} · Unit: {option.unit}
                        {chips.length > 0 ? ` · ${chips.join(' · ')}` : ''}
                      </Typography>
                    </Box>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField {...params} size="small"
                  label={t('stock.form.selectVariant')}
                  placeholder={t('stock.form.searchVariant')} />
              )}
            />
            {selectedVariant && (
              <Box sx={{
                p: 2, borderRadius: 1.5,
                bgcolor: alpha(theme.palette.info.main, 0.08),
                border: '1px dashed', borderColor: alpha(theme.palette.info.main, 0.4),
              }}>
                <Grid container alignItems="center">
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}
                      sx={{ letterSpacing: 0.6, fontSize: '0.65rem' }}>
                      {t('stock.form.retailPrice')}
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      ₹{formatCurrency(selectedVariant.pricePerUnit)}
                    </Typography>
                  </Grid>
                  {formData.costPerUnit && (
                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}
                        sx={{ letterSpacing: 0.6, fontSize: '0.65rem' }}>
                        {t('stock.form.estimatedMargin')}
                      </Typography>
                      {(() => {
                        const effectiveRetail = formData.newRetailPrice
                          ? Number(formData.newRetailPrice)
                          : selectedVariant.pricePerUnit;
                        const margin = effectiveRetail > 0
                          ? (((effectiveRetail - Number(formData.costPerUnit)) / effectiveRetail) * 100).toFixed(1)
                          : '0.0';
                        return (
                          <Typography variant="h6" fontWeight={700} color="success.main">
                            {margin}%
                          </Typography>
                        );
                      })()}
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label={t('stock.form.purchaseCost')}
                  type="number" value={formData.costPerUnit}
                  onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label={t('stock.form.quantity')}
                  type="number" value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
              </Grid>
            </Grid>
            <TextField fullWidth size="small"
              label="Update Retail / Selling Price (optional)"
              type="number" value={formData.newRetailPrice}
              onChange={(e) => setFormData({ ...formData, newRetailPrice: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
              helperText={selectedVariant
                ? `Current retail price: ₹${formatCurrency(selectedVariant.pricePerUnit)}. Leave blank to keep unchanged.`
                : 'Leave blank to keep current retail price unchanged.'}
              placeholder={selectedVariant ? String(selectedVariant.pricePerUnit || '') : ''} />
            <TextField fullWidth size="small" label={t('stock.form.batchNumber')}
              value={formData.batch}
              onChange={(e) => setFormData({ ...formData, batch: e.target.value })} />
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="Mfg Date" type="date"
                  value={formData.manufacturingDate || ''}
                  onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  helperText="Manufacturing date" />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="Expiry Date" type="date"
                  value={formData.expiryDate || ''}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  helperText="Leave blank if not applicable" />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{
          p: 2, bgcolor: alpha(theme.palette.text.primary, 0.02),
          borderTop: '1px solid', borderColor: 'divider', gap: 1,
        }}>
          <Button onClick={() => setOpen(false)}
            sx={{ fontWeight: 600, textTransform: 'none', color: 'text.secondary' }}>
            {t('common.cancel')}
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}
            sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none' }}>
            {isSubmitting ? <CircularProgress size={20} /> : t('stock.actions.completeEntry')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Adjust Stock Dialog ────────────────────────── */}
      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)}
        fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ p: 2.5, fontWeight: 700, fontSize: '1.15rem' }}>
          {t('stock.dialog.adjustStockTitle')}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            {selectedVariant && (
              <Paper variant="outlined" sx={{
                p: 2, borderRadius: 1.5,
                bgcolor: alpha(theme.palette.warning.main, 0.06),
                borderColor: alpha(theme.palette.warning.main, 0.4),
              }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <InfoIcon color="warning" fontSize="small" />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} noWrap>
                      {t('stock.dialog.adjusting')}: {selectedVariant.itemName} ({selectedVariant.sku})
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('stock.dialog.currentBalance')}:{' '}
                      <strong>
                        {stock.find(s => s.itemVariantId === selectedVariant.id)?.totalQuantity || 0}{' '}
                        {selectedVariant.unit}
                      </strong>
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            )}
            <Alert severity="info" sx={{ borderRadius: 1.5 }}>
              <strong>{t('stock.dialog.tip')}:</strong> {t('stock.dialog.tipContent')}
            </Alert>
            <TextField select fullWidth size="small" label={t('stock.form.reason')}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}>
              <MenuItem value="Damaged">{t('stock.reason.damaged')}</MenuItem>
              <MenuItem value="Correction">{t('stock.reason.correction')}</MenuItem>
              <MenuItem value="Return">{t('stock.reason.return')}</MenuItem>
              <MenuItem value="Sample">{t('stock.reason.sample')}</MenuItem>
            </TextField>
            <TextField fullWidth size="small" type="number"
              label={t('stock.form.adjustmentQuantity') || 'Adjustment Quantity'}
              placeholder={t('stock.form.adjustmentPlaceholder') || 'e.g. -5 or 10'}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{
          p: 2, bgcolor: alpha(theme.palette.text.primary, 0.02),
          borderTop: '1px solid', borderColor: 'divider', gap: 1,
        }}>
          <Button onClick={() => setAdjustOpen(false)}
            sx={{ fontWeight: 600, textTransform: 'none', color: 'text.secondary' }}>
            {t('common.cancel')}
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" color="warning" onClick={handleAdjustSubmit}
            disabled={isSubmitting || !formData.quantity || !formData.reason}
            sx={{ borderRadius: 1.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none' }}>
            {t('stock.actions.applyAdjustment')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Audit Log Dialog ───────────────────────────── */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)}
        fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ p: 2.5, fontWeight: 700, fontSize: '1.15rem' }}>
          {t('stock.dialog.historyTitle')}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          {selectedHistory.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">{t('stock.dialog.noHistory')}</Typography>
            </Box>
          ) : (
            selectedHistory.map((m, i) => (
              <Box key={i} sx={{
                display: 'flex', justifyContent: 'space-between', p: 2,
                borderBottom: '1px solid', borderColor: 'divider',
              }}>
                <Box>
                  <Typography variant="body2" fontWeight={700}>
                    {m.movementType} — {m.reason || t('stock.reason.purchased')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(m.timestamp).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" fontWeight={800}
                    color={m.quantity > 0 ? 'success.main' : 'error.main'}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </Typography>
                  <Typography variant="caption">
                    {t('stock.columns.wac')}: ₹{formatCurrency(m.costPerUnit)}
                  </Typography>
                </Box>
              </Box>
            ))
          )}
        </DialogContent>
        <DialogActions sx={{
          p: 2, bgcolor: alpha(theme.palette.text.primary, 0.02),
          borderTop: '1px solid', borderColor: 'divider',
        }}>
          <Button onClick={() => setHistoryOpen(false)}
            sx={{ fontWeight: 600, textTransform: 'none' }}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Analytics Popup ────────────────────────────── */}
      <Dialog open={analyticsOpen} onClose={() => setAnalyticsOpen(false)}
        fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ p: 2.5, fontWeight: 700, fontSize: '1.15rem' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <BarChart color="primary" fontSize="small" />
            {t('stock.dialog.analyticsTitle')}
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}
                sx={{ letterSpacing: 0.6, fontSize: '0.65rem' }}>
                {t('stock.stats.investmentValue')}
              </Typography>
              <Typography variant="h5" fontWeight={800}>₹{formatCurrency(stats.totalValue)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}
                sx={{ letterSpacing: 0.6, fontSize: '0.65rem' }}>
                {t('stock.stats.potentialRevenue')}
              </Typography>
              <Typography variant="h5" fontWeight={800} color="primary.main">
                ₹{formatCurrency(stats.potentialRevenue)}
              </Typography>
            </Box>
            <Divider />
            <Box sx={{
              p: 2, borderRadius: 1.5,
              bgcolor: alpha(theme.palette.success.main, 0.1),
              border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.3),
            }}>
              <Typography variant="caption" color="success.main" fontWeight={800}
                sx={{ letterSpacing: 0.6, fontSize: '0.65rem' }}>
                {t('stock.stats.estimatedProfit')}
              </Typography>
              <Typography variant="h4" fontWeight={800} color="success.dark">
                ₹{formatCurrency(stats.projectedProfit)}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{
          p: 2, bgcolor: alpha(theme.palette.text.primary, 0.02),
          borderTop: '1px solid', borderColor: 'divider',
        }}>
          <Button onClick={() => setAnalyticsOpen(false)} fullWidth variant="outlined"
            sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none' }}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>

      <StockTransferModal open={transferOpen} onClose={() => setTransferOpen(false)} />

      <Snackbar
        open={!!successMsg} autoHideDuration={3000} onClose={() => setSuccessMsg('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" sx={{ borderRadius: 1.5 }}>{successMsg}</Alert>
      </Snackbar>
      <Snackbar
        open={!!error} autoHideDuration={5000} onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="error" variant="filled" sx={{ borderRadius: 1.5 }}>{error}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Stock;
