import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Container, Paper, Chip, Stack, IconButton, Tooltip,
  TextField, Autocomplete, InputAdornment, Button, Skeleton, useTheme,
  Alert, Avatar,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FileDownloadOutlined as FileDownloadIcon,
  FilterAltOff as FilterAltOffIcon,
  Inventory as InventoryIcon,
  CheckCircleOutline as InStockIcon,
  CurrencyRupee as RupeeIcon,
  ShowChart as PriceIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';

import { fetchProducts, API_BASE_URL } from '../services/api';
import { useShop } from '../context/ShopContext';

const STOCK_LEVELS = ['ALL', 'IN_STOCK', 'LOW', 'OUT'];

const StockDot = ({ level }) => {
  const theme = useTheme();
  const color =
    level === 'ok'   ? theme.palette.success.main :
    level === 'low'  ? theme.palette.warning.main :
    level === 'out'  ? theme.palette.error.main   :
    theme.palette.text.disabled;
  return (
    <Box component="span" sx={{
      width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
      bgcolor: color,
      boxShadow: `0 0 0 2px ${alpha(color, 0.16)}`,
    }} />
  );
};

export default function ProductOverview() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { industryType } = useShop();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [brandFilter, setBrandFilter] = useState(null);
  const [stockFilter, setStockFilter] = useState('ALL');
  const [urlParams] = useSearchParams();
  const urlSearchValue = urlParams.get('search');

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (urlSearchValue) setSearchQuery(urlSearchValue);
  }, [urlSearchValue]);

  // Ctrl/Cmd+K → focus search
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

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProducts();
      const rows = Array.isArray(res.data) ? res.data : [];
      setProducts(rows.map((r) => ({ ...r, id: r.itemVariantId })));
    } catch (err) {
      setError(t('productsOverview.errorFetch') || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // Derived filter option sets (from currently loaded data).
  const uniqueCategories = useMemo(
    () => Array.from(new Set(products.map((p) => p.categoryName).filter(Boolean))).sort(),
    [products]
  );
  const uniqueBrands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brandName).filter(Boolean))).sort(),
    [products]
  );

  const stockLevelOf = useCallback((p) => {
    const qty = Number(p.availableQuantity || 0);
    const thr = Number(p.lowStockThreshold || 5);
    if (qty <= 0) return 'out';
    if (qty <= thr) return 'low';
    return 'ok';
  }, []);

  // Apply all client-side filters (search + category + brand + stock).
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (q) {
        const hay = `${p.itemName || ''} ${p.sku || ''} ${p.brandName || ''} ${p.categoryName || ''} ${p.hsn || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (categoryFilter && p.categoryName !== categoryFilter) return false;
      if (brandFilter && p.brandName !== brandFilter) return false;
      if (stockFilter !== 'ALL') {
        const level = stockLevelOf(p);
        if (stockFilter === 'IN_STOCK' && level !== 'ok') return false;
        if (stockFilter === 'LOW' && level !== 'low') return false;
        if (stockFilter === 'OUT' && level !== 'out') return false;
      }
      return true;
    });
  }, [products, searchQuery, categoryFilter, brandFilter, stockFilter, stockLevelOf]);

  // KPIs — always over the FULL loaded set, not the filter, so the
  // totals stay stable when a user narrows the view.
  const kpi = useMemo(() => {
    const totalSku = products.length;
    let inStock = 0, invValue = 0, priceSum = 0, priceCount = 0;
    products.forEach((p) => {
      const qty = Number(p.availableQuantity || 0);
      const price = Number(p.pricePerUnit || 0);
      if (qty > 0) inStock++;
      invValue += qty * price;
      if (price > 0) { priceSum += price; priceCount++; }
    });
    return {
      totalSku,
      inStock,
      inventoryValue: invValue,
      avgPrice: priceCount ? priceSum / priceCount : 0,
    };
  }, [products]);

  const stockCounts = useMemo(() => {
    const c = { ALL: products.length, IN_STOCK: 0, LOW: 0, OUT: 0 };
    products.forEach((p) => {
      const level = stockLevelOf(p);
      if (level === 'ok') c.IN_STOCK++;
      else if (level === 'low') c.LOW++;
      else if (level === 'out') c.OUT++;
    });
    return c;
  }, [products, stockLevelOf]);

  const hasFilters = searchQuery !== '' || categoryFilter !== null || brandFilter !== null || stockFilter !== 'ALL';
  const clearAllFilters = () => {
    setSearchQuery('');
    setCategoryFilter(null);
    setBrandFilter(null);
    setStockFilter('ALL');
    setPaginationModel((p) => ({ ...p, page: 0 }));
  };

  const formatInr = (n) => (n == null || isNaN(n))
    ? '—'
    : `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const exportCsv = () => {
    if (filtered.length === 0) return;
    const header = ['Product', 'SKU', 'Category', 'Brand', 'Attributes', 'Unit', 'Price', 'MRP', 'HSN', 'GST %', 'Stock'];
    const lines = [header.join(',')];
    filtered.forEach((p) => {
      const attrs = [p.color, p.size, p.design, p.fit].filter(Boolean).join(' / ');
      const cells = [
        p.itemName, p.sku, p.categoryName || '', p.brandName || '',
        attrs, p.unit || '', p.pricePerUnit ?? '', p.mrp ?? '',
        p.hsn || '', p.gstRate ?? '', p.availableQuantity ?? 0,
      ];
      lines.push(cells.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = useMemo(() => [
    {
      field: 'itemName',
      headerName: 'Product',
      flex: 1.8, minWidth: 240,
      renderCell: (params) => {
        const p = params.row;
        const initials = (p.itemName || '?').slice(0, 2).toUpperCase();
        return (
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ py: 0.5, minWidth: 0 }}>
            {p.photoPath ? (
              <Avatar
                variant="rounded"
                src={`${API_BASE_URL}${p.photoPath}`}
                sx={{ width: 36, height: 36, bgcolor: alpha(theme.palette.primary.main, 0.1) }}
              >
                {initials}
              </Avatar>
            ) : (
              <Avatar
                variant="rounded"
                sx={{
                  width: 36, height: 36,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  fontWeight: 700, fontSize: '0.75rem',
                }}
              >
                {initials}
              </Avatar>
            )}
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>{p.itemName}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                {p.sku || '—'}
              </Typography>
            </Box>
          </Stack>
        );
      },
    },
    {
      field: 'categoryBrand',
      headerName: 'Category · Brand',
      flex: 1.1, minWidth: 160,
      sortable: false,
      valueGetter: (params) => `${params?.row?.categoryName || '—'} · ${params?.row?.brandName || '—'}`,
      renderCell: (params) => {
        const p = params.row;
        return (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={500} noWrap>{p.categoryName || '—'}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{p.brandName || '—'}</Typography>
          </Box>
        );
      },
    },
    {
      field: 'attributes',
      headerName: 'Attributes',
      flex: 1.2, minWidth: 160,
      sortable: false,
      renderCell: (params) => {
        const p = params.row;
        const items = [p.color, p.size, p.design, p.fit].filter(Boolean);
        if (items.length === 0) return <Typography variant="caption" color="text.disabled">—</Typography>;
        return (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
            {items.slice(0, 3).map((v, i) => (
              <Chip key={i} label={v} size="small" variant="outlined"
                    sx={{ fontWeight: 500, height: 20, fontSize: '0.7rem' }} />
            ))}
            {items.length > 3 && (
              <Chip label={`+${items.length - 3}`} size="small"
                    sx={{ height: 20, fontSize: '0.7rem', bgcolor: alpha(theme.palette.text.primary, 0.06) }} />
            )}
          </Stack>
        );
      },
    },
    {
      field: 'pricePerUnit',
      headerName: 'Price',
      width: 140,
      align: 'right', headerAlign: 'right',
      renderCell: (params) => {
        const p = params.row;
        const price = Number(p.pricePerUnit || 0);
        const mrp = Number(p.mrp || 0);
        const discountPct = mrp > 0 && price > 0 && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
        return (
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" fontWeight={700}>{formatInr(price)}</Typography>
            {mrp > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {discountPct > 0 ? (
                  <>MRP <s>{formatInr(mrp)}</s> · <Box component="span" sx={{ color: 'success.main', fontWeight: 700 }}>-{discountPct}%</Box></>
                ) : (
                  <>MRP {formatInr(mrp)}</>
                )}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: 'taxHsn',
      headerName: 'GST · HSN',
      width: 110, sortable: false,
      renderCell: (params) => {
        const p = params.row;
        return (
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {p.gstRate != null ? `${p.gstRate}%` : '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
              {p.hsn || '—'}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'availableQuantity',
      headerName: 'Stock',
      width: 140,
      renderCell: (params) => {
        const p = params.row;
        const qty = Number(p.availableQuantity || 0);
        const level = stockLevelOf(p);
        const label = level === 'ok' ? 'In stock' : level === 'low' ? 'Low' : 'Out';
        const c = level === 'ok' ? theme.palette.success.main :
                  level === 'low' ? theme.palette.warning.main :
                  theme.palette.error.main;
        return (
          <Stack direction="row" spacing={0.75} alignItems="center">
            <StockDot level={level} />
            <Box>
              <Typography variant="body2" fontWeight={600} sx={{ color: c }}>
                {label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {qty} {p.unit || ''}
              </Typography>
            </Box>
          </Stack>
        );
      },
    },
    {
      field: 'actions',
      headerName: '',
      width: 60, sortable: false, filterable: false, disableColumnMenu: true,
      renderCell: (params) => (
        <Tooltip title="Open in Items admin">
          <IconButton size="small" onClick={() => navigate(`/items?search=${encodeURIComponent(params.row.itemName || '')}`)}>
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ], [theme, stockLevelOf, navigate]);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 4 }}>
      <Container maxWidth="xl" sx={{ pt: 3 }}>

        {/* HEADER */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: -0.4 }}>
              {t('productsOverview.title') || 'Products'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {industryType ? `${industryType} · ` : ''}
              {kpi.totalSku} SKU{kpi.totalSku === 1 ? '' : 's'}
              {hasFilters && ` · showing ${filtered.length}`}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={exportCsv}
              disabled={filtered.length === 0}
              sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none' }}
            >
              Export CSV
            </Button>
            <Tooltip title={t('productsOverview.refreshTooltip') || 'Refresh'}>
              <IconButton
                size="small"
                onClick={loadProducts}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setError(null)}>{error}</Alert>}

        {/* KPI STRIP */}
        <Paper
          elevation={0}
          sx={{
            border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2,
            display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          }}
        >
          <KpiCell
            icon={<InventoryIcon fontSize="small" />}
            label="TOTAL SKUS"
            value={loading ? '—' : kpi.totalSku.toLocaleString('en-IN')}
            color={theme.palette.primary.main}
            divider
          />
          <KpiCell
            icon={<InStockIcon fontSize="small" />}
            label="IN STOCK"
            value={loading ? '—' : kpi.inStock.toLocaleString('en-IN')}
            color={theme.palette.success.main}
            divider
          />
          <KpiCell
            icon={<RupeeIcon fontSize="small" />}
            label="INVENTORY VALUE"
            value={loading ? '—' : formatInr(kpi.inventoryValue)}
            color={theme.palette.warning.main}
            divider
          />
          <KpiCell
            icon={<PriceIcon fontSize="small" />}
            label="AVG PRICE"
            value={loading ? '—' : formatInr(kpi.avgPrice)}
            color={theme.palette.info?.main || theme.palette.primary.main}
          />
        </Paper>

        {/* GRID */}
        <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Stack sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }} spacing={1.5}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
              <TextField
                inputRef={searchInputRef}
                placeholder="Search product, SKU, brand, HSN  ·  ⌘K"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                  ),
                }}
                sx={{ flex: 1 }}
              />
              <Autocomplete
                options={uniqueCategories}
                value={categoryFilter}
                onChange={(_, v) => { setCategoryFilter(v); setPaginationModel((p) => ({ ...p, page: 0 })); }}
                size="small"
                sx={{ minWidth: 180 }}
                renderInput={(p) => <TextField {...p} placeholder="All categories" />}
              />
              <Autocomplete
                options={uniqueBrands}
                value={brandFilter}
                onChange={(_, v) => { setBrandFilter(v); setPaginationModel((p) => ({ ...p, page: 0 })); }}
                size="small"
                sx={{ minWidth: 180 }}
                renderInput={(p) => <TextField {...p} placeholder="All brands" />}
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

            <Stack direction="row" spacing={1} flexWrap="wrap">
              {STOCK_LEVELS.map((lvl) => (
                <StockTab
                  key={lvl}
                  active={stockFilter === lvl}
                  onClick={() => { setStockFilter(lvl); setPaginationModel((p) => ({ ...p, page: 0 })); }}
                  label={lvl === 'ALL' ? 'All' : lvl === 'IN_STOCK' ? 'In stock' : lvl === 'LOW' ? 'Low' : 'Out'}
                  count={stockCounts[lvl]}
                  color={
                    lvl === 'IN_STOCK' ? theme.palette.success.main :
                    lvl === 'LOW'      ? theme.palette.warning.main :
                    lvl === 'OUT'      ? theme.palette.error.main :
                    null
                  }
                />
              ))}
            </Stack>
          </Stack>

          {loading ? (
            <Box sx={{ p: 2 }}>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={44} sx={{ mb: 1, borderRadius: 1 }} />
              ))}
            </Box>
          ) : (
            <DataGrid
              rows={filtered}
              columns={columns}
              autoHeight
              getRowId={(r) => r.id}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[10, 25, 50, 100]}
              disableRowSelectionOnClick
              density="standard"
              rowHeight={54}
              sx={{
                border: 0,
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: alpha(theme.palette.text.primary, 0.04),
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                },
                '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5 },
                '& .MuiDataGrid-cell': { borderBottom: '1px solid', borderColor: 'divider' },
                '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
                '& .MuiDataGrid-row:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
              }}
              localeText={{
                noRowsLabel: hasFilters ? 'No products match the current filters.' : 'No products yet.',
              }}
            />
          )}
        </Paper>
      </Container>
    </Box>
  );
}

const KpiCell = ({ icon, label, value, color, divider }) => (
  <Box sx={{
    p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
    borderRight: divider ? '1px solid' : 'none',
    borderColor: 'divider',
  }}>
    <Box sx={{
      display: 'inline-flex', p: 1, borderRadius: 1,
      bgcolor: alpha(color, 0.1), color,
      alignItems: 'center', justifyContent: 'center',
    }}>
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.6, fontSize: '0.65rem' }}>
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.2 }} noWrap>
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
        bgcolor: active ? (color || 'primary.main') : (color ? alpha(color, 0.08) : 'action.hover'),
      },
    }}
  />
);
