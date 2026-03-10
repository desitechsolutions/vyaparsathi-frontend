import React, { useState, useEffect } from 'react';
import { 
  Grid, Card, CardContent, TextField, Button, Typography, 
  Box, Collapse, Tooltip, Paper, Chip,
  Alert, ToggleButton, ToggleButtonGroup, InputAdornment, CircularProgress
} from '@mui/material';
import Select from 'react-select';
import TuneIcon from '@mui/icons-material/Tune';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import MedicationIcon from '@mui/icons-material/Medication';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import { calcMrpDiscountPct } from '../../utils/salesUtils';
import { fetchBatchWiseStock } from '../../services/api';

const DEFAULT_PACK_SIZE = 10; // default tablets-per-strip when backend packSize is not set

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
  uniqueCompositions,
  searchParams,
  handleVariantSelect,
  handleSearchParamChange,
  handleAddItem,
  handleResetFilters,
  error,
  substitutes,
  onSelectSubstitute,
  isPharmacy,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSubstitutes, setShowSubstitutes] = useState(false);
  // Pharmacy: selling mode — 'PACK' = sell as strip/box, 'LOOSE' = sell individual tablets
  const [sellingMode, setSellingMode] = useState('PACK');
  const [packSize, setPackSize] = useState(DEFAULT_PACK_SIZE);
  // Pharmacy: batch selection
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Issue 1: When a new variant is selected, seed packSize from backend or fall back to DEFAULT_PACK_SIZE
  useEffect(() => {
    if (selectedVariant) {
      const backendPackSize = Number(selectedVariant.packSize) || DEFAULT_PACK_SIZE;
      setPackSize(backendPackSize);
      // If currently in LOOSE mode, recalculate unit price with new pack size
      if (sellingMode === 'LOOSE') {
        const newPrice = calcLooseUnitPrice(selectedVariant.pricePerUnit, backendPackSize);
        setItem(prev => ({ ...prev, unitPrice: newPrice, packSizeUsed: backendPackSize }));
      }
      // Issue 1: Fetch batch-wise stock for this variant (pharmacy only)
      if (isPharmacy) {
        setLoadingBatches(true);
        setSelectedBatch(null);
        fetchBatchWiseStock(selectedVariant.id)
          .then(res => {
            const allBatches = Array.isArray(res.data) ? res.data : [];
            // Filter batches for this variant (backend may return all or filtered)
            const variantBatches = allBatches
              .filter(b => !b.itemVariantId || Number(b.itemVariantId) === Number(selectedVariant.id))
              .filter(b => b.batchNumber); // Only batches with a batch number
            setBatches(variantBatches);
          })
          .catch(() => setBatches([]))
          .finally(() => setLoadingBatches(false));
      } else {
        setBatches([]);
        setSelectedBatch(null);
      }
    } else {
      setBatches([]);
      setSelectedBatch(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariant?.id, isPharmacy]);

  // Drug schedule info for the selected variant
  const drugSchedule = selectedVariant?.drugSchedule;
  const isControlledDrug = drugSchedule && ['SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X'].includes(drugSchedule);
  const isNarcotic = drugSchedule === 'SCHEDULE_X' || drugSchedule === 'SCHEDULE_H1';

  // Pharmacy loose selling: calculate per-tablet price
  const basePrice = selectedVariant?.pricePerUnit || 0;
  const calcLooseUnitPrice = (price, size) =>
    parseFloat((price / Math.max(1, size)).toFixed(2));
  const looseUnitPrice = sellingMode === 'LOOSE' && packSize > 0
    ? calcLooseUnitPrice(basePrice, packSize)
    : basePrice;

  // When selling mode or pack size changes, update item price if a variant is selected
  const handleSellingModeChange = (_, newMode) => {
    if (!newMode) return;
    setSellingMode(newMode);
    if (selectedVariant) {
      const newPrice = newMode === 'LOOSE'
        ? calcLooseUnitPrice(selectedVariant.pricePerUnit, packSize)
        : selectedVariant.pricePerUnit;
      setItem(prev => ({
       ...prev,
       unitPrice: newPrice,
       sellingMode: newMode,
       packSizeUsed: newMode === 'LOOSE' ? packSize : null,
     }));
    }
  };

  const handlePackSizeChange = (e) => {
    const size = Math.max(1, parseInt(e.target.value) || 1);
    setPackSize(size);
    if (selectedVariant && sellingMode === 'LOOSE') {
      const newPrice = calcLooseUnitPrice(selectedVariant.pricePerUnit, size);
      setItem(prev => ({ ...prev, unitPrice: newPrice, packSizeUsed: size }));
    }
  };

  // Issue 1: Parse Java LocalDate (array or string) to a formatted display string
  const parseBatchDate = (d) => {
    if (!d) return null;
    if (Array.isArray(d)) {
      const [y, m, day] = d;
      return new Date(y, m - 1, day);
    }
    return new Date(d);
  };

  const formatBatchDate = (d) => {
    const parsed = parseBatchDate(d);
    if (!parsed || isNaN(parsed)) return '?';
    return parsed.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  };

  // Issue 1: Build batch options for the Select dropdown
  const batchOptions = batches.map(b => {
    const expDate = parseBatchDate(b.expiryDate);
    const daysLeft = expDate ? Math.floor((expDate - new Date()) / 86400000) : null;
    const expiryLabel = b.expiryDate ? formatBatchDate(b.expiryDate) : 'No expiry';
    const expiryStatus = daysLeft === null ? '' : daysLeft <= 0 ? ' ⚠️ EXPIRED' : daysLeft <= 30 ? ' ⚠️ <30d' : '';
    return {
      value: b.batchNumber,
      label: `Batch: ${b.batchNumber} | Exp: ${expiryLabel}${expiryStatus} | MRP: ₹${Number(b.mrp || 0).toFixed(2)} | Stock: ${b.quantity ?? b.totalQuantity ?? '?'}`,
      ...b,
      _daysLeft: daysLeft,
    };
  });

  const handleBatchSelect = (opt) => {
    setSelectedBatch(opt);
    if (opt) {
      setItem(prev => ({
        ...prev,
        batchNumber: opt.batchNumber,
        expiryDate: opt.expiryDate,
        mrp: opt.mrp || prev.mrp,
      }));
    } else {
      setItem(prev => ({ ...prev, batchNumber: null, expiryDate: null }));
    }
  };

  // 1. React-Select Custom Styling
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: '8px',
      borderColor: state.isFocused ? '#1976d2' : '#e0e0e0',
      boxShadow: state.isFocused ? '0 0 0 1px #1976d2' : 'none',
      '&:hover': { borderColor: '#1976d2' },
      minHeight: '45px',
    }),
    menuPortal: base => ({ ...base, zIndex: 9999 }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#e3f2fd',
      borderRadius: '4px',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#1976d2',
      fontWeight: 500,
    }),
  };

  // NEW: Internal helper to format the data for the parent's handleSearchParamChange
const handleChange = (key, selectedOption, isMulti) => {
  if (isMulti) {
    // If user clears everything, selectedOption is null or []
    if (!selectedOption || selectedOption.length === 0) {
      handleSearchParamChange(key, { value: [] });
    } else {
      // Filter out any "All" dummy options if they exist in your unique list
      const values = selectedOption
        .map(opt => opt.value)
        .filter(v => v !== '' && v !== null);
      handleSearchParamChange(key, { value: values });
    }
  } else {
    // Single select handling
    handleSearchParamChange(key, selectedOption || { value: '' });
  }
};

  // 2. Filter Groups — labels are pharmacy-aware
  const mainFilters = isPharmacy
    ? [
        { label: 'Category', key: 'category', options: uniqueCategory, multi: false },
        { label: 'Strength / Size', key: 'size', options: uniqueSizes, multi: true },
        { label: 'Manufacturer', key: 'color', options: uniqueColors, multi: true },
      ]
    : [
        { label: 'Category', key: 'category', options: uniqueCategory, multi: false },
        { label: 'Colors', key: 'color', options: uniqueColors, multi: true },
        { label: 'Sizes', key: 'size', options: uniqueSizes, multi: true },
      ];

  const advancedFilters = isPharmacy
    ? [
        { label: 'Brand Type', key: 'design', options: uniqueDesigns },
        { label: 'Usage / Form', key: 'fit', options: uniqueFits },
      ]
    : [
        { label: 'Design', key: 'design', options: uniqueDesigns },
        { label: 'Fabric', key: 'fabric', options: uniqueFabrics },
        { label: 'Season', key: 'season', options: uniqueSeasons },
        { label: 'Fit', key: 'fit', options: uniqueFits },
      ];

  return (
    <Grid item xs={12}>
      <Card raised sx={{ borderRadius: 4, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', overflow: 'visible' }}>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          
          {/* HEADER SECTION */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {isPharmacy ? <LocalPharmacyIcon color="primary" fontSize="large" /> : <SearchIcon color="primary" fontSize="large" />}
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                {isPharmacy ? 'Medicine Search' : 'Inventory Search'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Reset all search criteria">
                <Button 
                  onClick={handleResetFilters} 
                  color="inherit" 
                  startIcon={<RestartAltIcon />}
                  sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
                >
                  Reset
                </Button>
              </Tooltip>
              <Button 
                variant={showAdvanced ? "contained" : "outlined"} 
                onClick={() => setShowAdvanced(!showAdvanced)}
                startIcon={<TuneIcon />}
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
              >
                {showAdvanced ? "Basic Filters" : "Advanced Filters"}
              </Button>
            </Box>
          </Box>

          {/* TIER 1: PRIMARY SEARCH (NAME & SKU) */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={isPharmacy ? 4 : 6}>
              <Typography variant="caption" sx={{ fontWeight: 700, ml: 1, color: 'text.secondary' }}>
                {isPharmacy ? 'MEDICINE NAME' : 'PRODUCT NAME'}
              </Typography>
              <Select
                options={uniqueNames}
                value={uniqueNames.find(opt => opt.value === searchParams.name) || null}
                onChange={(opt) => handleChange('name', opt, false)}
                placeholder={isPharmacy ? 'Search by medicine name...' : 'Search by product name...'}
                isClearable
                styles={customSelectStyles}
                menuPortalTarget={document.body}
              />
            </Grid>
            <Grid item xs={12} md={isPharmacy ? 4 : 6}>
              <Typography variant="caption" sx={{ fontWeight: 700, ml: 1, color: 'text.secondary' }}>
                {isPharmacy ? 'BATCH / SKU' : 'SKU IDENTIFIER'}
              </Typography>
              <Select
                options={uniqueSkus}
                value={uniqueSkus.find(opt => opt.value === searchParams.sku) || null}
                onChange={(opt) => handleChange('sku', opt, false)}
                placeholder={isPharmacy ? 'Search by batch or SKU...' : 'Scan or type SKU...'}
                isClearable
                styles={customSelectStyles}
                menuPortalTarget={document.body}
              />
            </Grid>
            {isPharmacy && (
              <Grid item xs={12} md={4}>
                <Typography variant="caption" sx={{ fontWeight: 700, ml: 1, color: 'text.secondary' }}>
                  COMPOSITION / SALT
                </Typography>
                <Select
                  options={uniqueCompositions || []}
                  value={(uniqueCompositions || []).find(opt => opt.value === searchParams.composition) || null}
                  onChange={(opt) => handleChange('composition', opt, false)}
                  placeholder="Search by composition..."
                  isClearable
                  styles={customSelectStyles}
                  menuPortalTarget={document.body}
                />
              </Grid>
            )}
          </Grid>

          {/* TIER 2: SMART FILTER BAR (CATEGORY, COLOR, SIZE) */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: '#f8f9fa', borderStyle: 'solid' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <FilterListIcon fontSize="small" color="action" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>Refine Results</Typography>
            </Box>
            
            <Grid container spacing={2}>
              {mainFilters.map((f) => (
                <Grid item xs={12} sm={4} key={f.key}>
                  <Select
                    isMulti={f.multi}
                    options={f.options}
                    // For multi: filter objects whose values are in the searchParams array
                    // For single: find the single matching object
value={
  f.multi
    ? (Array.isArray(searchParams[f.key]) && searchParams[f.key].length > 0
        ? f.options.filter((opt) => searchParams[f.key].includes(opt.value))
        : null) // Returning null shows the Placeholder
    : (f.options.find((opt) => opt.value === searchParams[f.key]) || null)
}
                    onChange={(opt) => handleChange(f.key, opt, f.multi)}
                    placeholder={f.label}
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                  />
                </Grid>
              ))}
            </Grid>

            {/* TIER 3: ADVANCED FILTERS (COLLAPSIBLE) */}
            <Collapse in={showAdvanced}>
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #ddd' }}>
                <Grid container spacing={2}>
                  {advancedFilters.map((f) => (
                    <Grid item xs={12} sm={3} key={f.key}>
                      <Select
                        options={f.options}
                        value={f.options.find(opt => opt.value === searchParams[f.key]) || null}
                        onChange={(opt) => handleChange(f.key, opt, false)}
                        placeholder={f.label}
                        styles={customSelectStyles}
                        menuPortalTarget={document.body}
                        isClearable
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Collapse>
          </Paper>

          {/* ITEM SELECTION AREA */}
          <Box sx={{ mt: 4, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="Step 2" size="small" color="primary" />
              {isPharmacy ? 'Select Medicine / Variant' : 'Select Specific Variant'}
            </Typography>
            <Select
              options={variants}
              onChange={handleVariantSelect}
              placeholder={isPharmacy ? 'Select medicine, strength or batch...' : 'Finalize item selection...'}
              value={selectedVariant}
              isClearable
              styles={{
                control: (base) => ({ 
                  ...base, 
                  borderRadius: '10px', 
                  border: '2px solid #1976d2', 
                  minHeight: '50px',
                  fontSize: '1.1rem' 
                }),
                menuPortal: base => ({ ...base, zIndex: 9999 })
              }}
              menuPortalTarget={document.body}
            />
          </Box>

          {/* PHARMACY: BATCH SELECTION */}
          {isPharmacy && selectedVariant && (
            <Box sx={{ mt: 2, mb: 1, p: 2, borderRadius: 3, bgcolor: '#fffbeb', border: '1px solid #fde68a' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip label="Step 3" size="small" color="warning" />
                <Typography variant="subtitle2" fontWeight={700} color="warning.dark">
                  Select Batch
                </Typography>
                {loadingBatches && <CircularProgress size={16} sx={{ ml: 1 }} />}
              </Box>
              {batches.length === 0 && !loadingBatches ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  No batch data found for this item. You can proceed without selecting a batch.
                </Alert>
              ) : (
                <Select
                  options={batchOptions}
                  value={selectedBatch}
                  onChange={handleBatchSelect}
                  placeholder="Select batch (Expiry Date, MRP)..."
                  isClearable
                  isLoading={loadingBatches}
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderRadius: '8px',
                      borderColor: state.isFocused ? '#f59e0b' : '#fcd34d',
                      boxShadow: state.isFocused ? '0 0 0 1px #f59e0b' : 'none',
                      minHeight: '44px',
                    }),
                    option: (base, { data }) => ({
                      ...base,
                      color: data._daysLeft !== null && data._daysLeft <= 0
                        ? '#dc2626'
                        : data._daysLeft !== null && data._daysLeft <= 30
                        ? '#d97706'
                        : base.color,
                    }),
                    menuPortal: base => ({ ...base, zIndex: 9999 }),
                  }}
                  menuPortalTarget={document.body}
                />
              )}
            </Box>
          )}

          {/* PHARMACY: LOOSE TABLETS SELLING MODE */}
          {isPharmacy && selectedVariant && (
            <Box sx={{ mt: 2, p: 2, borderRadius: 3, bgcolor: '#f0fdf4', border: '1px solid #86efac' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <MedicationIcon color="success" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={700} color="success.dark">
                  Dispensing Mode
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <ToggleButtonGroup
                  value={sellingMode}
                  exclusive
                  onChange={handleSellingModeChange}
                  size="small"
                  sx={{ bgcolor: 'white', borderRadius: 2 }}
                >
                  <ToggleButton value="PACK" sx={{ px: 2, fontWeight: 700, textTransform: 'none' }}>
                    Strip / Box
                  </ToggleButton>
                  <ToggleButton value="LOOSE" sx={{ px: 2, fontWeight: 700, textTransform: 'none' }}>
                    Loose Tablets
                  </ToggleButton>
                </ToggleButtonGroup>

                {sellingMode === 'LOOSE' && (
                  <TextField
                    label="Tablets per strip"
                    type="number"
                    size="small"
                    value={packSize}
                    onChange={handlePackSizeChange}
                    inputProps={{ min: 1, max: 1000 }}
                    sx={{ width: 160, bgcolor: 'white' }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">tabs</InputAdornment>,
                    }}
                  />
                )}

                {sellingMode === 'LOOSE' && (
                  <Chip
                    label={`₹${looseUnitPrice} per tablet`}
                    color="success"
                    size="small"
                    variant="outlined"
                    icon={<MedicationIcon />}
                  />
                )}
              </Box>
              {sellingMode === 'LOOSE' && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Strip price ₹{basePrice} ÷ {packSize} tabs = ₹{looseUnitPrice}/tablet. Enter number of tablets in Qty.
                </Typography>
              )}
            </Box>
          )}

          {/* ITEM DETAILS & ADD BUTTON */}
          <Box sx={{ 
            mt: 3, 
            p: 3, 
            borderRadius: 4, 
            bgcolor: '#eff6ff', 
            border: '1px solid #bfdbfe',
            display: selectedVariant ? 'block' : 'none'
          }}>
            {/* Issue 1: Show MRP discount % when selling below MRP */}
            {isPharmacy && selectedVariant?.mrp && calcMrpDiscountPct(selectedVariant.mrp, item.unitPrice) !== null && (
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={`MRP ₹${Number(selectedVariant.mrp).toFixed(2)}`}
                  size="small"
                  variant="outlined"
                  sx={{ color: '#64748b', borderColor: '#94a3b8', fontWeight: 600 }}
                />
                <Chip
                  label={`${calcMrpDiscountPct(selectedVariant.mrp, item.unitPrice)}% below MRP`}
                  size="small"
                  color="success"
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            )}
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={7}>
                <Grid container spacing={1}>
                  {(isPharmacy
                    ? [
                        { label: 'SKU / Batch', val: item.sku },
                        { label: sellingMode === 'LOOSE' ? 'Per Tablet' : 'Per Strip', val: item.unitPrice ? `₹${item.unitPrice}` : '-' },
                        { label: 'Stock (strips)', val: item.currentStock },
                        { label: 'Strength', val: item.size },
                        { label: 'Brand', val: item.color },
                        ...(selectedVariant?.composition ? [{ label: 'Composition', val: selectedVariant.composition }] : []),
                      ]
                    : [
                        { label: 'SKU', val: item.sku },
                        { label: 'Price', val: item.unitPrice ? `₹${item.unitPrice}` : '-' },
                        { label: 'Stock', val: item.currentStock },
                        { label: 'Color', val: item.color },
                        { label: 'Size', val: item.size },
                      ]
                  ).map((d, i) => (
                    <Grid item xs={isPharmacy && d.label === 'Composition' ? 12 : 4} key={i}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{d.label}</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e3a8a', wordBreak: 'break-word' }}>{d.val || '—'}</Typography>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              <Grid item xs={6} md={2}>
                <TextField
                  label={isPharmacy && sellingMode === 'LOOSE' ? 'Tablets' : 'Qty'}
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={item.qty}
                  onChange={(e) => setItem({ ...item, qty: e.target.value })}
                  onFocus={(e) => e.target.select()}
                  InputProps={{
                    sx: { borderRadius: 2, bgcolor: 'white', fontWeight: 800 },
                    ...(isPharmacy && sellingMode === 'LOOSE' ? { endAdornment: <InputAdornment position="end">tabs</InputAdornment> } : {}),
                  }}
                />
              </Grid>

              <Grid item xs={6} md={3}>
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
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)' 
                  }}
                >
                  {isPharmacy && sellingMode === 'LOOSE' ? 'Dispense Loose' : 'Add Item'}
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* DRUG SCHEDULE WARNING */}
          {selectedVariant && isControlledDrug && (
            <Alert
              severity={isNarcotic ? 'error' : 'warning'}
              icon={<WarningAmberIcon />}
              sx={{ mt: 2, borderRadius: 2, fontWeight: 600 }}
              action={
                isNarcotic && (
                  <Chip label="Narcotics Log" size="small" color="error" variant="outlined" />
                )
              }
            >
              {drugSchedule === 'SCHEDULE_X'
                ? 'Schedule X (Narcotic): Mandatory prescription required. This sale will be logged in the Narcotics Register.'
                : drugSchedule === 'SCHEDULE_H1'
                ? 'Schedule H1: Stricter prescription control. Verify patient details before adding.'
                : 'Schedule H Drug: Prescription required. Confirm the customer has a valid prescription.'}
            </Alert>
          )}

          {/* SUBSTITUTE SUGGESTIONS */}
          {substitutes && substitutes.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Button
                size="small"
                startIcon={<SyncAltIcon />}
                color="info"
                variant="outlined"
                onClick={() => setShowSubstitutes(!showSubstitutes)}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                {substitutes.length} Substitute{substitutes.length > 1 ? 's' : ''} Available
              </Button>
              <Collapse in={showSubstitutes}>
                <Paper variant="outlined" sx={{ mt: 1, p: 2, borderRadius: 2, bgcolor: '#f0f9ff', borderColor: '#bfdbfe' }}>
                  <Typography variant="caption" fontWeight={800} color="info.main" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Same Composition — Substitute Options
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {substitutes.map((sub) => (
                      <Tooltip key={sub.id} title={`Stock: ${sub.currentStock} | ₹${sub.pricePerUnit}`}>
                        <Chip
                          label={`${sub.itemName} — ₹${sub.pricePerUnit}`}
                          size="small"
                          color={sub.currentStock > 0 ? 'success' : 'default'}
                          variant="outlined"
                          onClick={() => onSelectSubstitute && onSelectSubstitute(sub)}
                          sx={{ cursor: 'pointer', fontWeight: 600 }}
                        />
                      </Tooltip>
                    ))}
                  </Box>
                </Paper>
              </Collapse>
            </Box>
          )}

          {error && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fef2f2', borderRadius: 2, border: '1px solid #fee2e2' }}>
              <Typography color="error" variant="body2" sx={{ textAlign: 'center', fontWeight: 600 }}>
                {error}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Grid>
  );
};

export default ItemSection;