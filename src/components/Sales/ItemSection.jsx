import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Grid, TextField, Button, Typography, Box, Collapse, Tooltip, Paper, Chip,
  InputAdornment, alpha, Autocomplete, Popover, Badge, Stack, Divider,
} from '@mui/material';
import Select from 'react-select';
import TuneIcon from '@mui/icons-material/Tune';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SearchIcon from '@mui/icons-material/Search';
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
      minHeight: '42px',
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
      maxHeight: 220,
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
      { label: 'Fabric', key: 'attribute1', options: 'uniqueAttribute1' },
      { label: 'Season', key: 'attribute2', options: 'uniqueAttribute2' },
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
  CLOTHING: 'Clothing & Apparel',
  ELECTRONICS: 'Electronics',
  HARDWARE: 'Hardware & Building Materials',
  AUTOMOBILE: 'Auto Parts',
  STATIONERY: 'Stationery',
  JEWELLERY: 'Jewellery',
};

// ============ SUB-COMPONENTS ============

/**
 * Filters Popover — houses the tiered category/size/color/etc. selects
 * behind a single trigger, replacing the always-visible filter grid.
 */
const FiltersPopover = ({
  anchorEl,
  open,
  onClose,
  filterConfig,
  searchParams,
  handleChange,
  optionsMap,
  showAdvanced,
  onToggleAdvanced,
  onReset,
}) => {
  const theme = useTheme();
  const selectStyles = getCustomSelectStyles(theme);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      PaperProps={{
        sx: {
          mt: 1,
          p: 2.5,
          width: { xs: 320, sm: 460 },
          maxWidth: '95vw',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Refine results</Typography>
        <Button
          onClick={onReset}
          variant="text"
          size="small"
          startIcon={<RestartAltIcon fontSize="small" />}
          sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
        >
          Reset
        </Button>
      </Stack>

      <Grid container spacing={1.5}>
        {filterConfig.main.map((f) => {
          // Default to [] when the config references an option-map key that
          // hasn't been provided — happens when INDUSTRY_FILTER_CONFIG and
          // the parent's optionsMap drift (see the V76 attribute1/2 rename).
          const opts = optionsMap[f.options] || [];
          return (
            <Grid item xs={12} sm={6} key={f.key}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.72rem', display: 'block', mb: 0.5 }}>
                {f.label}
              </Typography>
              <Select
                isMulti={f.multi}
                options={opts}
                value={
                  f.multi
                    ? (Array.isArray(searchParams[f.key]) && searchParams[f.key].length > 0
                        ? opts.filter((opt) => searchParams[f.key].includes(opt.value))
                        : null)
                    : (opts.find((opt) => opt.value === searchParams[f.key]) || null)
                }
                onChange={(opt) => handleChange(f.key, opt, f.multi)}
                placeholder={`Any ${f.label.toLowerCase()}`}
                styles={selectStyles}
                menuPortalTarget={document.body}
                isClearable={false}
              />
            </Grid>
          );
        })}
      </Grid>

      {filterConfig.advanced?.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Button
            onClick={onToggleAdvanced}
            variant="text"
            size="small"
            sx={{ textTransform: 'none', fontWeight: 600, mb: showAdvanced ? 1 : 0 }}
          >
            {showAdvanced ? 'Hide advanced' : 'Show advanced'}
          </Button>
          <Collapse in={showAdvanced}>
            <Grid container spacing={1.5}>
              {filterConfig.advanced.map((f) => {
                const opts = optionsMap[f.options] || [];
                return (
                  <Grid item xs={12} sm={6} key={f.key}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.72rem', display: 'block', mb: 0.5 }}>
                      {f.label}
                    </Typography>
                    <Select
                      options={opts}
                      value={opts.find(opt => opt.value === searchParams[f.key]) || null}
                      onChange={(opt) => handleChange(f.key, opt, false)}
                      placeholder={`Any ${f.label.toLowerCase()}`}
                      styles={selectStyles}
                      menuPortalTarget={document.body}
                      isClearable={false}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </Collapse>
        </>
      )}

      <Stack direction="row" justifyContent="flex-end" mt={2}>
        <Button onClick={onClose} variant="contained" size="small" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
          Done
        </Button>
      </Stack>
    </Popover>
  );
};

/**
 * Item Details Display — populated when a variant is selected.
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
        mt: 2.5,
        p: 2.5,
        borderRadius: 3,
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
              borderRadius: 2,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 700,
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
        sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
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
  uniqueNames, // preserved for parent API compatibility; no longer surfaced as a separate filter
  uniqueSkus,  // ditto
  uniqueColors,
  uniqueSizes,
  uniqueDesigns,
  uniqueCategory,
  // Canonical (V76) prop names — parent passes attribute1/attribute2-derived options.
  uniqueAttribute1,
  uniqueAttribute2,
  // Legacy prop names — kept so any caller not yet migrated still works.
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
  showSnackbar,
}) => {
  const theme = useTheme();

  // ── STATE ──
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSubstitutes, setShowSubstitutes] = useState(false);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [filtersAnchor, setFiltersAnchor] = useState(null);
  const [searchInput, setSearchInput] = useState('');

  const itemDetailsRef = useRef(null);
  // Ref to the search input — the natural POS re-entry point after an
  // item is added. Restoring focus here keeps a scan-add-scan workflow entirely
  // hands-free on the keyboard.
  const searchInputRef = useRef(null);

  /**
   * Wraps the parent's Add-Item handler with a focus-return: after the item
   * is added and React clears the ItemDetails state, we hop back to the
   * search field so the next scan/type continues without clicking.
   */
  const handleAddAndRefocus = useCallback((...args) => {
    const result = handleAddItem?.(...args);
    setTimeout(() => {
      try { searchInputRef.current?.focus?.(); } catch (_) { /* ignore */ }
    }, 0);
    return result;
  }, [handleAddItem]);

  // ── MEMOIZED VALUES ──
  const industry = industryType || 'GENERAL';
  const filterConfig = useMemo(() => INDUSTRY_FILTER_CONFIG[industry] || INDUSTRY_FILTER_CONFIG.CLOTHING, [industry]);
  const headerTitle = useMemo(() => INDUSTRY_HEADER[industry] || 'Inventory', [industry]);

  // Resolve the V76 canonical prop first, falling back to the legacy prop
  // so a caller that still passes `uniqueFabrics`/`uniqueSeasons` keeps
  // working. Parent Sales.jsx passes the canonical names.
  const resolvedAttribute1 = uniqueAttribute1 || uniqueFabrics;
  const resolvedAttribute2 = uniqueAttribute2 || uniqueSeasons;

  const optionsMap = useMemo(() => ({
    uniqueCategory,
    uniqueColors,
    uniqueSizes,
    uniqueDesigns,
    uniqueFits,
    uniqueAttribute1: resolvedAttribute1,
    uniqueAttribute2: resolvedAttribute2,
    // Legacy keys — kept so any consumer still reading them resolves.
    uniqueFabrics: resolvedAttribute1,
    uniqueSeasons: resolvedAttribute2,
  }), [uniqueCategory, uniqueColors, uniqueSizes, uniqueDesigns, uniqueFits, resolvedAttribute1, resolvedAttribute2]);

  // Compute active-filter chip descriptors from searchParams. Only the keys
  // that appear in the industry filter config surface as chips — this keeps
  // hidden legacy fields (name/sku) from cluttering the summary row. Multi-value
  // filters emit one chip per selected value so each can be removed individually.
  const activeFilterChips = useMemo(() => {
    const configs = [...filterConfig.main, ...filterConfig.advanced];
    const chips = [];
    configs.forEach((f) => {
      const val = searchParams[f.key];
      if (Array.isArray(val)) {
        val.forEach((v) => {
          chips.push({ key: `${f.key}:${v}`, filterKey: f.key, name: f.label, value: v, isMulti: true });
        });
      } else if (val) {
        chips.push({ key: f.key, filterKey: f.key, name: f.label, value: val, isMulti: false });
      }
    });
    return chips;
  }, [filterConfig, searchParams]);

  const handleRemoveFilterValue = useCallback((filterKey, value, isMulti) => {
    if (isMulti) {
      const current = Array.isArray(searchParams[filterKey]) ? searchParams[filterKey] : [];
      handleSearchParamChange(filterKey, { value: current.filter((v) => v !== value) });
    } else {
      handleSearchParamChange(filterKey, { value: '' });
    }
  }, [searchParams, handleSearchParamChange]);

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
    const raw = e.target.value;
    const num = raw === '' ? 0 : Math.max(0, Number(raw) || 0);
    setItem(prev => ({ ...prev, discount: num }));
  }, [setItem]);

  const handleQtyChange = useCallback((e) => {
    setItem(prev => ({ ...prev, qty: e.target.value }));
  }, [setItem]);

  // Autocomplete filter: match against name, SKU, barcode, color, size.
  const filterVariantOptions = useCallback((options, { inputValue }) => {
    if (!inputValue) return options.slice(0, 100); // cap render list for perf on large catalogs
    const q = inputValue.toLowerCase();
    const matches = options.filter((v) =>
      String(v.itemName || '').toLowerCase().includes(q) ||
      String(v.sku || '').toLowerCase().includes(q) ||
      String(v.barcode || '').toLowerCase().includes(q) ||
      String(v.color || '').toLowerCase().includes(q) ||
      String(v.size || '').toLowerCase().includes(q)
    );
    return matches.slice(0, 100);
  }, []);

  const handleSearchEnter = useCallback(async (e) => {
    if (e.key !== 'Enter') return;
    const raw = (e.target.value || '').trim();
    if (!raw) return;

    // If the typed text matches any known variant, MUI Autocomplete's own
    // Enter handling picks the highlighted option — skip barcode lookup.
    const q = raw.toLowerCase();
    const localMatch = variants.some((v) =>
      String(v.itemName || '').toLowerCase().includes(q) ||
      String(v.sku || '').toLowerCase().includes(q) ||
      String(v.barcode || '').toLowerCase().includes(q)
    );
    if (localMatch) return;

    // No local match — treat as a barcode scan and hit the server.
    try {
      const found = await lookupByBarcode(raw);
      if (found) {
        handleVariantSelect(found);
        setSearchInput('');
        showSnackbar?.(`Scanned: ${found.itemName}`, 'success');
      } else {
        showSnackbar?.(`No item found for barcode ${raw}`, 'warning');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || `No item found for barcode ${raw}`;
      showSnackbar?.(msg, 'error');
    }
  }, [variants, handleVariantSelect, showSnackbar]);

  // ============ RENDER ============

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 } }}>
      {/* HEADER — title + action buttons */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        flexWrap="wrap"
        gap={1}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
          {headerTitle}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          {handleAddCustomItem && (
            <Tooltip title="Add a one-off charge or service not in the catalog">
              <Button
                onClick={() => setCustomDialogOpen(true)}
                variant="outlined"
                size="small"
                startIcon={<AddIcon fontSize="small" />}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
              >
                Custom item
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Refine results by category, size, color, and more">
            <Badge
              badgeContent={activeFilterChips.length}
              color="primary"
              overlap="rectangular"
              sx={{ '& .MuiBadge-badge': { fontWeight: 700, minWidth: 18, height: 18 } }}
            >
              <Button
                onClick={(e) => setFiltersAnchor(e.currentTarget)}
                variant="outlined"
                size="small"
                startIcon={<TuneIcon fontSize="small" />}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
              >
                Filters
              </Button>
            </Badge>
          </Tooltip>
        </Stack>
      </Stack>

      {/* MAIN SEARCH BAR — unified search over name/SKU/barcode/color/size */}
      <Autocomplete
        options={variants}
        value={selectedVariant || null}
        onChange={(_, val) => {
          if (val) {
            handleVariantSelect(val);
            setSearchInput('');
          } else {
            handleVariantSelect(null);
          }
        }}
        inputValue={searchInput}
        onInputChange={(_, val, reason) => {
          // 'reset' fires after a selection — MUI sets the input to the option label;
          // we want to clear it instead so scanning stays fluid.
          if (reason === 'reset') setSearchInput('');
          else setSearchInput(val);
        }}
        filterOptions={filterVariantOptions}
        getOptionLabel={(o) => (o?.itemName ? String(o.itemName) : '')}
        isOptionEqualToValue={(a, b) => a?.id === b?.id}
        noOptionsText="No matches — press Enter to look up barcode"
        renderOption={(props, opt) => (
          <Box component="li" {...props} key={opt.id} sx={{ py: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0, pr: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {opt.itemName}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {[opt.sku, opt.color, opt.size].filter(Boolean).join(' · ')}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'var(--color-teal)' }}>
                ₹{opt.pricePerUnit}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: (opt.currentStock > 0) ? 'success.main' : 'error.main',
                }}
              >
                {opt.currentStock > 0 ? `Stock ${opt.currentStock}` : 'Out of stock'}
              </Typography>
            </Box>
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            inputRef={searchInputRef}
            placeholder="Search by name, SKU, color, size, or scan barcode…"
            onKeyDown={handleSearchEnter}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="start" sx={{ ml: 0.5 }}>
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                  {params.InputProps.startAdornment}
                </>
              ),
              sx: {
                borderRadius: 2,
                bgcolor: 'background.paper',
                fontSize: '0.95rem',
              },
            }}
          />
        )}
      />

      {/* ACTIVE FILTER CHIPS */}
      {activeFilterChips.length > 0 && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 1.25, flexWrap: 'wrap' }}
          useFlexGap
          alignItems="center"
        >
          {activeFilterChips.map(({ key, filterKey, name, value, isMulti }) => (
            <Chip
              key={key}
              size="small"
              variant="outlined"
              label={
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 0.5 }}>
                  <Typography component="span" variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    {name}
                  </Typography>
                  <Typography component="span" variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {value}
                  </Typography>
                </Box>
              }
              onDelete={() => handleRemoveFilterValue(filterKey, value, isMulti)}
              sx={{ borderRadius: 1.5, borderColor: 'divider', bgcolor: 'background.paper' }}
            />
          ))}
          {activeFilterChips.length >= 2 && (
            <Button
              onClick={handleResetFilters}
              variant="text"
              size="small"
              sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
            >
              Clear all
            </Button>
          )}
        </Stack>
      )}

      {/* CUSTOM ITEM DIALOG */}
      {handleAddCustomItem && (
        <CustomItemDialog
          open={customDialogOpen}
          onClose={() => setCustomDialogOpen(false)}
          onSubmit={handleAddCustomItem}
        />
      )}

      {/* FILTERS POPOVER */}
      <FiltersPopover
        anchorEl={filtersAnchor}
        open={Boolean(filtersAnchor)}
        onClose={() => setFiltersAnchor(null)}
        filterConfig={filterConfig}
        searchParams={searchParams}
        handleChange={handleChange}
        optionsMap={optionsMap}
        showAdvanced={showAdvanced}
        onToggleAdvanced={() => setShowAdvanced(v => !v)}
        onReset={handleResetFilters}
      />

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
