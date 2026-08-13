import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Grid, TextField, Button, Typography,
  Box, Collapse, Tooltip, Paper, Chip,
  InputAdornment, alpha
} from '@mui/material';
import Select from 'react-select';
import TuneIcon from '@mui/icons-material/Tune';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import AddIcon from '@mui/icons-material/Add';
import CustomItemDialog from './CustomItemDialog';
import { calcMrpDiscountPct } from '../../utils/salesUtils';
import { lookupByBarcode } from '../../services/api';

import { useTheme } from '@mui/material/styles';

// ============ CONSTANTS ============

const getCustomSelectStyles = (theme) => {
  const isDark = theme?.palette?.mode === 'dark';
  const bg = theme?.palette?.background?.paper || '#ffffff';
  const text = theme?.palette?.text?.primary || '#111827';
  const textSecondary = theme?.palette?.text?.secondary || '#6b7280';
  const divider = theme?.palette?.divider || (isDark ? 'rgba(148,163,184,0.16)' : '#e0e0e0');
  const primary = theme?.palette?.primary?.main || '#0f766e';
  const hover = theme?.palette?.action?.hover || (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)');

  return {
    control: (base, state) => ({
      ...base,
      borderRadius: '8px',
      backgroundColor: bg,
      borderColor: state.isFocused ? primary : divider,
      boxShadow: state.isFocused ? `0 0 0 1px ${primary}` : 'none',
      color: text,
      '&:hover': { borderColor: primary },
      minHeight: '45px',
    }),
    menu: (base) => ({
      ...base,
      zIndex: 9999,
      backgroundColor: bg,
      border: `1px solid ${divider}`,
    }),
    menuList: (base) => ({
      ...base,
      backgroundColor: bg,
      maxHeight: 200,
      overflowY: 'auto',
    }),
    option: (base, state) => ({
      ...base,
      fontSize: '0.875rem',
      color: state.isSelected ? '#ffffff' : text,
      backgroundColor: state.isSelected ? primary : state.isFocused ? hover : bg,
    }),
    singleValue: (base) => ({ ...base, color: text }),
    placeholder: (base) => ({ ...base, color: textSecondary }),
    input: (base) => ({ ...base, color: text }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: hover,
      borderRadius: '4px',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: text,
    }),
    menuPortal: base => ({ ...base, zIndex: 9999 }),
  };
};

const INDUSTRY_FILTER_CONFIG = {
  CLOTHING: {
    main: [
      { label: 'Category', key: 'category', options: 'uniqueCategory', multi: false },
      { label: 'Size', key: 'size', options: 'uniqueSizes', multi: true },
      { label: 'Color', key: 'color', options: 'uniqueColors', multi: true },
    ],
    advanced: [
      { label: 'Design / Print', key: 'design', options: 'uniqueDesigns' },
      { label: 'Fabric', key: 'fabric', options: 'uniqueFabrics' },
      { label: 'Season', key: 'season', options: 'uniqueSeasons' },
      { label: 'Fit', key: 'fit', options: 'uniqueFits' },
    ],
  },
  ELECTRONICS: {
    main: [
      { label: 'Category', key: 'category', options: 'uniqueCategory', multi: false },
      { label: 'Storage / Config', key: 'size', options: 'uniqueSizes', multi: true },
      { label: 'Finish / Color', key: 'color', options: 'uniqueColors', multi: true },
    ],
    advanced: [
      { label: 'Model', key: 'design', options: 'uniqueDesigns' },
      { label: 'Connectivity', key: 'fit', options: 'uniqueFits' },
    ],
  },
  HARDWARE: {
    main: [
      { label: 'Category', key: 'category', options: 'uniqueCategory', multi: false },
      { label: 'Dimensions / Size', key: 'size', options: 'uniqueSizes', multi: true },
      { label: 'Finish / Material', key: 'color', options: 'uniqueColors', multi: true },
    ],
    advanced: [
      { label: 'Grade', key: 'design', options: 'uniqueDesigns' },
      { label: 'Mounting / Type', key: 'fit', options: 'uniqueFits' },
    ],
  },
  AUTOMOBILE: {
    main: [
      { label: 'Category', key: 'category', options: 'uniqueCategory', multi: false },
      { label: 'Specs / Size', key: 'size', options: 'uniqueSizes', multi: true },
      { label: 'Color', key: 'color', options: 'uniqueColors', multi: true },
    ],
    advanced: [
      { label: 'Part No. / Model', key: 'design', options: 'uniqueDesigns' },
      { label: 'Position (Front/Rear)', key: 'fit', options: 'uniqueFits' },
    ],
  },
  STATIONERY: {
    main: [
      { label: 'Category', key: 'category', options: 'uniqueCategory', multi: false },
      { label: 'Size / GSM', key: 'size', options: 'uniqueSizes', multi: true },
      { label: 'Ink / Color', key: 'color', options: 'uniqueColors', multi: true },
    ],
    advanced: [
      { label: 'Binding / Type', key: 'design', options: 'uniqueDesigns' },
      { label: 'Layout', key: 'fit', options: 'uniqueFits' },
    ],
  },
  JEWELLERY: {
    main: [
      { label: 'Category', key: 'category', options: 'uniqueCategory', multi: false },
      { label: 'Size / Length', key: 'size', options: 'uniqueSizes', multi: true },
      { label: 'Tone / Metal', key: 'color', options: 'uniqueColors', multi: true },
    ],
    advanced: [
      { label: 'Pattern / Design', key: 'design', options: 'uniqueDesigns' },
      { label: 'Clasp / Closure', key: 'fit', options: 'uniqueFits' },
    ],
  },
};

const INDUSTRY_HEADER = {
  CLOTHING: 'Clothing & Apparel Search',
  ELECTRONICS: 'Electronics Search',
  HARDWARE: 'Hardware & Building Materials',
  AUTOMOBILE: 'Auto Parts Search',
  STATIONERY: 'Stationery Search',
  JEWELLERY: 'Jewellery Search',
};

// ============ SUB-COMPONENTS ============

/**
 * Filter Bar Component
 */
const FilterBar = ({
  filterConfig,
  searchParams,
  handleChange,
  showAdvanced,
  onToggleAdvanced,
  onReset,
  optionsMap,
}) => {
  const theme = useTheme();
  const selectStyles = getCustomSelectStyles(theme);

  return (
    <Box sx={{ mt: 4 }}>
      <Paper variant="outlined" sx={{
        p: 2.5,
        borderRadius: 3,
        bgcolor: 'action.hover',
        border: '1px solid',
        borderColor: 'divider',
      }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <FilterListIcon fontSize="small" sx={{ color: 'var(--color-teal)' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'var(--color-teal)' }}>
          Refine Results
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {filterConfig.main.map((f) => (
          <Grid item xs={12} sm={4} key={f.key}>
            <Select
              isMulti={f.multi}
              options={optionsMap[f.options]}
              value={
                f.multi
                  ? (Array.isArray(searchParams[f.key]) && searchParams[f.key].length > 0
                      ? optionsMap[f.options].filter((opt) => searchParams[f.key].includes(opt.value))
                      : null)
                  : (optionsMap[f.options].find((opt) => opt.value === searchParams[f.key]) || null)
              }
              onChange={(opt) => handleChange(f.key, opt, f.multi)}
              placeholder={f.label}
              styles={selectStyles}
              menuPortalTarget={document.body}
              isClearable
            />
          </Grid>
        ))}
      </Grid>

      <Collapse in={showAdvanced}>
        <Box sx={{ mt: 2, pt: 2, borderTop: `1px dashed ${alpha('#0f766e', 0.08)}` }}>
          <Grid container spacing={2}>
            {filterConfig.advanced.map((f) => (
              <Grid item xs={12} sm={3} key={f.key}>
                <Select
                  options={optionsMap[f.options]}
                  value={optionsMap[f.options].find(opt => opt.value === searchParams[f.key]) || null}
                  onChange={(opt) => handleChange(f.key, opt, false)}
                  placeholder={f.label}
                  styles={selectStyles}
                  menuPortalTarget={document.body}
                  isClearable
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  </Box>
);
};

/**
 * Item Details Display
 */
const ItemDetails = ({
  selectedVariant,
  item,
  itemDetailsRef,
  handleAddItem,
  onQtyChange,
  onDiscountChange,
  error,
}) => {
  const mrpDiscount = selectedVariant?.mrp
    ? calcMrpDiscountPct(selectedVariant.mrp, item.unitPrice)
    : null;

  const detailsConfig = [
    { label: 'SKU', val: item.sku },
    { label: 'Price', val: item.unitPrice ? `₹${item.unitPrice}` : '-' },
    { label: 'Stock', val: item.currentStock },
    { label: 'Color', val: item.color },
    { label: 'Size', val: item.size },
  ];

  return (
    <Box
      ref={itemDetailsRef}
      sx={{
        mt: 3,
        p: 3,
        borderRadius: 4,
        bgcolor: 'action.hover',
        border: '1px solid',
        borderColor: 'divider',
        display: selectedVariant ? 'block' : 'none',
      }}
    >
      {mrpDiscount !== null && (
        <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`MRP ₹${Number(selectedVariant.mrp).toFixed(2)}`}
            size="small"
            variant="outlined"
            sx={{ color: 'text.secondary', borderColor: 'divider', fontWeight: 600 }}
          />
          <Chip
            label={`${mrpDiscount}% below MRP`}
            size="small"
            color="success"
            sx={{ fontWeight: 700 }}
          />
        </Box>
      )}

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={5}>
          <Grid container spacing={1}>
            {detailsConfig.map((d, i) => (
              <Grid item xs={4} key={i}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: 'text.secondary' }}
                >
                  {d.label}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 700,
                    color: 'var(--color-teal)',
                    wordBreak: 'break-word',
                  }}
                >
                  {d.val || '—'}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid item xs={6} md={2}>
          <TextField
            label="Qty"
            type="number"
            fullWidth
            value={item.qty}
            onChange={onQtyChange}
            onFocus={(e) => e.target.select()}
            InputProps={{
              sx: { borderRadius: 2, bgcolor: 'background.paper', fontWeight: 800 },
            }}
          />
        </Grid>

        <Grid item xs={6} md={2}>
          <TextField
            label="Discount ₹"
            type="number"
            fullWidth
            value={item.discount ?? 0}
            onChange={onDiscountChange}
            onFocus={(e) => e.target.select()}
            inputProps={{ min: 0, step: '0.01' }}
            InputProps={{
              sx: { borderRadius: 2, bgcolor: 'background.paper', fontWeight: 800 },
            }}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<ShoppingCartIcon />}
            onClick={handleAddItem}
            disabled={!selectedVariant || !item.qty}
            sx={{
              borderRadius: 3,
              py: 2,
              textTransform: 'none',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
              boxShadow: `0 4px 12px ${alpha('#0f766e', 0.08)}`,
              '&:hover': {
                boxShadow: `0 6px 16px ${alpha('#0f766e', 0.08)}`,
              },
            }}
          >
            Add Item
          </Button>
        </Grid>
      </Grid>

      {error && (
        <Box sx={{ mt: 2, p: 1.5, bgcolor: alpha('#dc2626', 0.1), borderRadius: 2, border: `1px solid ${alpha('#dc2626', 0.1)}` }}>
          <Typography color="#dc2626" variant="body2" sx={{ textAlign: 'center', fontWeight: 600 }}>
            {error}
          </Typography>
        </Box>
      )}
    </Box>
  );
};



/**
 * Substitute Suggestions
 */
const SubstituteSuggestions = ({ substitutes, onSelectSubstitute, showSubstitutes, onToggleSubstitutes }) => {
  if (!substitutes || substitutes.length === 0) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Button
        size="small"
        startIcon={<SyncAltIcon />}
        color="info"
        variant="outlined"
        onClick={onToggleSubstitutes}
        sx={{ borderRadius: 2, fontWeight: 700 }}
      >
        {substitutes.length} Substitute{substitutes.length > 1 ? 's' : ''}
      </Button>
      <Collapse in={showSubstitutes}>
        <Paper variant="outlined" sx={{
          mt: 1,
          p: 2,
          borderRadius: 2,
          bgcolor: alpha('#0ea5e9', 0.08),
          border: `1.5px solid ${alpha('#0ea5e9', 0.3)}`,
        }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              color: '#0369a1',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Same Composition — Alternative Options
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {substitutes.map((sub) => (
              <Tooltip
                key={sub.id}
                title={`Stock: ${sub.currentStock} | ₹${sub.pricePerUnit}`}
              >
                <Chip
                  label={`${sub.itemName} — ₹${sub.pricePerUnit}`}
                  size="small"
                  color={sub.currentStock > 0 ? 'success' : 'default'}
                  variant="outlined"
                  onClick={() => onSelectSubstitute?.(sub)}
                  sx={{ cursor: 'pointer', fontWeight: 600 }}
                />
              </Tooltip>
            ))}
          </Box>
        </Paper>
      </Collapse>
    </Box>
  );
};

// ============ MAIN COMPONENT ============

const ItemSection = ({
  variants,
  selectedVariant,
  item,
  setItem,
  uniqueNames,
  uniqueSkus,
  uniqueColors,
  uniqueSizes,
  uniqueDesigns,
  uniqueCategory,
  uniqueFabrics,
  uniqueSeasons,
  uniqueFits,
  searchParams,
  handleVariantSelect,
  handleSearchParamChange,
  handleAddItem,
  handleAddCustomItem,
  handleResetFilters,
  error,
  substitutes,
  onSelectSubstitute,
  industryType,
}) => {
  const theme = useTheme();
  const selectStyles = useMemo(() => getCustomSelectStyles(theme), [theme]);

  // ── STATE ──
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSubstitutes, setShowSubstitutes] = useState(false);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);

  const itemDetailsRef = useRef(null);
  // Ref to the barcode/EAN input — the natural POS re-entry point after an
  // item is added. Restoring focus here keeps a scan-add-scan workflow entirely
  // hands-free on the keyboard.
  const barcodeInputRef = useRef(null);

  /**
   * Wraps the parent's Add-Item handler with a focus-return: after the item
   * is added and React clears the ItemDetails state, we hop back to the
   * barcode field so the next scan/type continues without clicking.
   */
  const handleAddAndRefocus = useCallback((...args) => {
    const result = handleAddItem?.(...args);
    setTimeout(() => {
      try { barcodeInputRef.current?.focus?.(); } catch (_) { /* ignore */ }
    }, 0);
    return result;
  }, [handleAddItem]);

  // ── MEMOIZED VALUES ──
  const industry = industryType || 'GENERAL';
  const filterConfig = useMemo(() => INDUSTRY_FILTER_CONFIG[industry] || INDUSTRY_FILTER_CONFIG.CLOTHING, [industry]);
  const headerTitle = useMemo(() => INDUSTRY_HEADER[industry] || 'Inventory Search', [industry]);

  const optionsMap = useMemo(() => ({
    uniqueCategory,
    uniqueColors,
    uniqueSizes,
    uniqueDesigns,
    uniqueFabrics,
    uniqueSeasons,
    uniqueFits,
  }), [uniqueCategory, uniqueColors, uniqueSizes, uniqueDesigns, uniqueFabrics, uniqueSeasons, uniqueFits]);

  // ── EFFECTS ──
  useEffect(() => {
    if (selectedVariant && itemDetailsRef.current) {
      const timer = setTimeout(() => {
        itemDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [selectedVariant]);

  // ── CALLBACKS ──
  const handleChange = useCallback((key, selectedOption, isMulti) => {
    if (isMulti) {
      if (!selectedOption || selectedOption.length === 0) {
        handleSearchParamChange(key, { value: [] });
      } else {
        const values = selectedOption
          .map(opt => opt.value)
          .filter(v => v !== '' && v !== null);
        handleSearchParamChange(key, { value: values });
      }
    } else {
      handleSearchParamChange(key, selectedOption || { value: '' });
    }
  }, [handleSearchParamChange]);

  const handleDiscountChange = useCallback((e) => {
    // Coerce to a non-negative number; blank input treated as 0 so the cart total
    // stays deterministic. Larger-than-line-total discounts are floored to line
    // total at line-total computation time in SalesSummary — no error toast here.
    const raw = e.target.value;
    const num = raw === '' ? 0 : Math.max(0, Number(raw) || 0);
    setItem(prev => ({ ...prev, discount: num }));
  }, [setItem]);

  const handleQtyChange = useCallback((e) => {
    setItem(prev => ({ ...prev, qty: e.target.value }));
  }, []);

  // ============ RENDER ============

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 } }}>
      {/* HEADER */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2,
        flexWrap: 'wrap',
        gap: 1,
      }}>
        <Typography variant="subtitle1" sx={{
          fontWeight: 700,
          color: 'text.primary',
        }}>
          {headerTitle}
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
          {handleAddCustomItem && (
            <Tooltip title="Add a one-off charge or service not in the catalog">
              <Button
                onClick={() => setCustomDialogOpen(true)}
                variant="text"
                size="small"
                startIcon={<AddIcon fontSize="small" />}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Custom Item
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Reset all filters">
            <Button
              onClick={handleResetFilters}
              variant="text"
              size="small"
              startIcon={<RestartAltIcon fontSize="small" />}
              sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
            >
              Reset
            </Button>
          </Tooltip>
          <Button
            variant="text"
            size="small"
            onClick={() => setShowAdvanced(!showAdvanced)}
            startIcon={<TuneIcon fontSize="small" />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {showAdvanced ? 'Basic filters' : 'Advanced filters'}
          </Button>
        </Box>
      </Box>

          {handleAddCustomItem && (
            <CustomItemDialog
              open={customDialogOpen}
              onClose={() => setCustomDialogOpen(false)}
              onSubmit={handleAddCustomItem}
            />
          )}

      {/* PRIMARY SEARCH & BARCODE SCANNER */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Typography variant="caption" sx={{
            fontWeight: 600,
            color: 'text.secondary',
            fontSize: '0.75rem',
          }}>
            Barcode / EAN
          </Typography>
              <TextField
                placeholder="Scan barcode or press Enter..."
                size="small"
                fullWidth
                inputRef={barcodeInputRef}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    try {
                      const found = await lookupByBarcode(e.target.value.trim());
                      if (found) {
                        handleVariantSelect(found);
                        e.target.value = '';
                      }
                    } catch (err) {
                      console.warn('Barcode not found:', err);
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2, bgcolor: 'background.paper', height: 45 }
                }}
              />
            </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>
            Product Name
          </Typography>
          <Select
            options={uniqueNames}
            value={uniqueNames.find(opt => opt.value === searchParams.name) || null}
            onChange={(opt) => handleChange('name', opt, false)}
            placeholder="Search by name..."
            isClearable
            styles={selectStyles}
            menuPortalTarget={document.body}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>
            SKU
          </Typography>
          <Select
            options={uniqueSkus}
            value={uniqueSkus.find(opt => opt.value === searchParams.sku) || null}
            onChange={(opt) => handleChange('sku', opt, false)}
            placeholder="SKU..."
            isClearable
            styles={selectStyles}
            menuPortalTarget={document.body}
          />
        </Grid>
      </Grid>

          {/* FILTER BAR */}
          <FilterBar
            filterConfig={filterConfig}
            searchParams={searchParams}
            handleChange={handleChange}
            showAdvanced={showAdvanced}
            onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
            onReset={handleResetFilters}
            optionsMap={optionsMap}
          />

      {/* VARIANT SELECTION */}
      <Box sx={{ mt: 2, mb: 2 }}>
        <Typography variant="caption" sx={{
          fontWeight: 600,
          color: 'text.secondary',
          fontSize: '0.75rem',
          display: 'block',
          mb: 0.5,
        }}>
          Select Variant
        </Typography>
            <Select
              options={variants}
              onChange={handleVariantSelect}
              placeholder="Select variant..."
              value={selectedVariant}
              isClearable
              styles={{
                control: (base, state) => ({
                  ...base,
                  borderRadius: '10px',
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  borderColor: state.isFocused ? theme.palette.primary.main : theme.palette.divider,
                  boxShadow: state.isFocused ? `0 0 0 1px ${theme.palette.primary.main}` : 'none',
                  minHeight: '50px',
                  fontSize: '1.1rem',
                  '&:hover': { borderColor: theme.palette.primary.main },
                }),
                menu: (base) => ({
                  ...base,
                  zIndex: 9999,
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                }),
                menuList: (base) => ({
                  ...base,
                  backgroundColor: theme.palette.background.paper,
                }),
                option: (base, state) => ({
                  ...base,
                  color: state.isSelected ? '#ffffff' : theme.palette.text.primary,
                  backgroundColor: state.isSelected
                    ? theme.palette.primary.main
                    : state.isFocused
                    ? theme.palette.action.hover
                    : theme.palette.background.paper,
                }),
                singleValue: (base) => ({ ...base, color: theme.palette.text.primary }),
                placeholder: (base) => ({ ...base, color: theme.palette.text.secondary }),
                input: (base) => ({ ...base, color: theme.palette.text.primary }),
                menuPortal: base => ({ ...base, zIndex: 9999 }),
              }}
              menuPortalTarget={document.body}
            />
          </Box>

          {/* ITEM DETAILS */}
          <ItemDetails
            selectedVariant={selectedVariant}
            item={item}
            itemDetailsRef={itemDetailsRef}
            handleAddItem={handleAddAndRefocus}
            onQtyChange={handleQtyChange}
            onDiscountChange={handleDiscountChange}
            error={error}
          />



      {/* SUBSTITUTES */}
      <SubstituteSuggestions
        substitutes={substitutes}
        onSelectSubstitute={onSelectSubstitute}
        showSubstitutes={showSubstitutes}
        onToggleSubstitutes={() => setShowSubstitutes(!showSubstitutes)}
      />
    </Box>
  );
};

export default ItemSection;