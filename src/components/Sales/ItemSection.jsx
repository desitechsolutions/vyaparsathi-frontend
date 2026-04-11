import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Grid, Card, CardContent, TextField, Button, Typography, 
  Box, Collapse, Tooltip, Paper, Chip,
  Alert, ToggleButton, ToggleButtonGroup, InputAdornment, CircularProgress, alpha
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

// ============ CONSTANTS ============
const DEFAULT_PACK_SIZE = 10;

const CUSTOM_SELECT_STYLES = {
  control: (base, state) => ({
    ...base,
    borderRadius: '8px',
    borderColor: state.isFocused ? '#0f766e' : '#e0e0e0',
    boxShadow: state.isFocused ? '0 0 0 1px #0f766e' : 'none',
    '&:hover': { borderColor: '#0f766e' },
    minHeight: '45px',
  }),
  menuPortal: base => ({ ...base, zIndex: 9999 }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: alpha('#0f766e', 0.1),
    borderRadius: '4px',
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#0f766e',
    fontWeight: 500,
  }),
};

const INDUSTRY_FILTER_CONFIG = {
  PHARMACY: {
    main: [
      { label: 'Category', key: 'category', options: 'uniqueCategory', multi: false },
      { label: 'Strength / Size', key: 'size', options: 'uniqueSizes', multi: true },
      { label: 'Manufacturer', key: 'color', options: 'uniqueColors', multi: true },
    ],
    advanced: [
      { label: 'Brand Type', key: 'design', options: 'uniqueDesigns' },
      { label: 'Usage / Form', key: 'fit', options: 'uniqueFits' },
    ],
  },
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
  PHARMACY: 'Medicine Search',
  CLOTHING: 'Clothing & Apparel Search',
  ELECTRONICS: 'Electronics Search',
  HARDWARE: 'Hardware & Building Materials',
  AUTOMOBILE: 'Auto Parts Search',
  STATIONERY: 'Stationery Search',
  JEWELLERY: 'Jewellery Search',
};

// ============ HELPER FUNCTIONS ============

/**
 * Calculate loose unit price from pack price
 */
const calcLooseUnitPrice = (price, packSize) => {
  return parseFloat((price / Math.max(1, packSize)).toFixed(2));
};

/**
 * Parse Java LocalDate (array or string) to Date object
 */
const parseBatchDate = (d) => {
  if (!d) return null;
  if (Array.isArray(d)) {
    const [y, m, day] = d;
    return new Date(y, m - 1, day);
  }
  return new Date(d);
};

/**
 * Format batch date to display string
 */
const formatBatchDate = (d) => {
  const parsed = parseBatchDate(d);
  if (!parsed || isNaN(parsed)) return '?';
  return parsed.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

/**
 * Calculate days until expiry
 */
const calcDaysUntilExpiry = (expiryDate) => {
  const expDate = parseBatchDate(expiryDate);
  if (!expDate) return null;
  return Math.floor((expDate - new Date()) / 86400000);
};

/**
 * Build batch label with expiry and stock info
 */
const buildBatchLabel = (batch) => {
  const daysLeft = calcDaysUntilExpiry(batch.expiryDate);
  const expiryLabel = batch.expiryDate ? formatBatchDate(batch.expiryDate) : 'No expiry';
  const expiryStatus = daysLeft === null ? '' : daysLeft <= 0 ? ' ⚠️ EXPIRED' : daysLeft <= 30 ? ' ⚠️ <30d' : '';
  const stock = batch.quantity ?? batch.totalQuantity ?? '?';
  
  return `Batch: ${batch.batchNumber} | Exp: ${expiryLabel}${expiryStatus} | MRP: ₹${Number(batch.mrp || 0).toFixed(2)} | Stock: ${stock}`;
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
  isPharmacy,
  optionsMap,
}) => (
  <Box sx={{ mt: 4 }}>
    <Paper variant="outlined" sx={{
      p: 2.5,
      borderRadius: 3,
      bgcolor: alpha('#0f766e', 0.02),
      border: `1.5px solid ${alpha('#0f766e', 0.15)}`,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <FilterListIcon fontSize="small" sx={{ color: '#0f766e' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f766e' }}>
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
              styles={CUSTOM_SELECT_STYLES}
              menuPortalTarget={document.body}
              isClearable
            />
          </Grid>
        ))}
      </Grid>

      <Collapse in={showAdvanced}>
        <Box sx={{ mt: 2, pt: 2, borderTop: `1px dashed ${alpha('#0f766e', 0.2)}` }}>
          <Grid container spacing={2}>
            {filterConfig.advanced.map((f) => (
              <Grid item xs={12} sm={3} key={f.key}>
                <Select
                  options={optionsMap[f.options]}
                  value={optionsMap[f.options].find(opt => opt.value === searchParams[f.key]) || null}
                  onChange={(opt) => handleChange(f.key, opt, false)}
                  placeholder={f.label}
                  styles={CUSTOM_SELECT_STYLES}
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

/**
 * Batch Selection Component (Pharmacy Only)
 */
const BatchSelector = ({
  batches,
  selectedBatch,
  onBatchSelect,
  loadingBatches,
}) => (
  <Box sx={{
    mt: 2,
    mb: 1,
    p: 2,
    borderRadius: 3,
    bgcolor: alpha('#f59e0b', 0.08),
    border: `1.5px solid ${alpha('#f59e0b', 0.3)}`,
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      <Chip label="Step 3" size="small" color="warning" />
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#92400e' }}>
        Select Batch
      </Typography>
      {loadingBatches && <CircularProgress size={16} sx={{ ml: 1 }} />}
    </Box>
    {batches.length === 0 && !loadingBatches ? (
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        No batch data available. Proceed without batch selection.
      </Alert>
    ) : (
      <Select
        options={batches.map(b => ({
          value: b.batchNumber,
          label: buildBatchLabel(b),
          ...b,
          _daysLeft: calcDaysUntilExpiry(b.expiryDate),
        }))}
        value={selectedBatch}
        onChange={onBatchSelect}
        placeholder="Select batch (Expiry, MRP, Stock)..."
        isClearable
        isLoading={loadingBatches}
        styles={{
          control: (base, state) => ({
            ...base,
            borderRadius: '8px',
            borderColor: state.isFocused ? '#f59e0b' : alpha('#f59e0b', 0.5),
            boxShadow: state.isFocused ? `0 0 0 1px #f59e0b` : 'none',
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
);

/**
 * Dispensing Mode Selector (Pharmacy Only)
 */
const DispensingMode = ({
  sellingMode,
  packSize,
  basePrice,
  looseUnitPrice,
  onModeChange,
  onPackSizeChange,
}) => (
  <Box sx={{
    mt: 2,
    p: 2,
    borderRadius: 3,
    bgcolor: alpha('#10b981', 0.08),
    border: `1.5px solid ${alpha('#10b981', 0.3)}`,
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
      <MedicationIcon sx={{ color: '#10b981' }} fontSize="small" />
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#065f46' }}>
        Dispensing Mode
      </Typography>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <ToggleButtonGroup
        value={sellingMode}
        exclusive
        onChange={onModeChange}
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
          onChange={onPackSizeChange}
          inputProps={{ min: 1, max: 1000 }}
          sx={{ width: 160, bgcolor: 'white', borderRadius: 1 }}
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
      <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#047857' }}>
        Strip ₹{basePrice} ÷ {packSize} tabs = ₹{looseUnitPrice}/tablet
      </Typography>
    )}
  </Box>
);

/**
 * Item Details Display
 */
const ItemDetails = ({
  selectedVariant,
  item,
  itemDetailsRef,
  isPharmacy,
  sellingMode,
  handleAddItem,
  onQtyChange,
  error,
}) => {
  const mrpDiscount = isPharmacy && selectedVariant?.mrp 
    ? calcMrpDiscountPct(selectedVariant.mrp, item.unitPrice) 
    : null;

  const detailsConfig = isPharmacy
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
      ];

  return (
    <Box
      ref={itemDetailsRef}
      sx={{
        mt: 3,
        p: 3,
        borderRadius: 4,
        bgcolor: alpha('#0f766e', 0.04),
        border: `1.5px solid ${alpha('#0f766e', 0.2)}`,
        display: selectedVariant ? 'block' : 'none',
      }}
    >
      {mrpDiscount !== null && (
        <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`MRP ₹${Number(selectedVariant.mrp).toFixed(2)}`}
            size="small"
            variant="outlined"
            sx={{ color: '#64748b', borderColor: '#cbd5e1', fontWeight: 600 }}
          />
          <Chip
            label={`${mrpDiscount}% below MRP`}
            size="small"
            color="success"
            sx={{ fontWeight: 700 }}
          />
        </Box>
      )}

      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} md={7}>
          <Grid container spacing={1}>
            {detailsConfig.map((d, i) => (
              <Grid item xs={isPharmacy && d.label === 'Composition' ? 12 : 4} key={i}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: '#64748b' }}
                >
                  {d.label}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 700,
                    color: '#0f766e',
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
            label={isPharmacy && sellingMode === 'LOOSE' ? 'Tablets' : 'Qty'}
            type="number"
            fullWidth
            value={item.qty}
            onChange={onQtyChange}
            onFocus={(e) => e.target.select()}
            InputProps={{
              sx: { borderRadius: 2, bgcolor: 'white', fontWeight: 800 },
              ...(isPharmacy && sellingMode === 'LOOSE'
                ? { endAdornment: <InputAdornment position="end">tabs</InputAdornment> }
                : {}),
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
              background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
              boxShadow: `0 4px 12px ${alpha('#0f766e', 0.3)}`,
              '&:hover': {
                boxShadow: `0 6px 16px ${alpha('#0f766e', 0.4)}`,
              },
            }}
          >
            {isPharmacy && sellingMode === 'LOOSE' ? 'Dispense' : 'Add Item'}
          </Button>
        </Grid>
      </Grid>

      {error && (
        <Box sx={{ mt: 2, p: 1.5, bgcolor: alpha('#dc2626', 0.1), borderRadius: 2, border: `1px solid ${alpha('#dc2626', 0.3)}` }}>
          <Typography color="#dc2626" variant="body2" sx={{ textAlign: 'center', fontWeight: 600 }}>
            {error}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

/**
 * Drug Schedule Alert
 */
const DrugScheduleAlert = ({ drugSchedule, isNarcotic }) => {
  if (!drugSchedule) return null;

  const isControlledDrug = ['SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X'].includes(drugSchedule);
  if (!isControlledDrug) return null;

  return (
    <Alert
      severity={isNarcotic ? 'error' : 'warning'}
      icon={<WarningAmberIcon />}
      sx={{
        mt: 2,
        borderRadius: 2,
        fontWeight: 600,
      }}
      action={
        isNarcotic && (
          <Chip label="Narcotics Log" size="small" color="error" variant="outlined" />
        )
      }
    >
      {drugSchedule === 'SCHEDULE_X'
        ? 'Schedule X (Narcotic): Mandatory prescription. This sale will be logged in the Narcotics Register.'
        : drugSchedule === 'SCHEDULE_H1'
        ? 'Schedule H1: Stricter prescription control. Verify patient details before adding.'
        : 'Schedule H: Prescription required. Confirm customer has valid prescription.'}
    </Alert>
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
  industryType,
}) => {
  // ── STATE ──
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSubstitutes, setShowSubstitutes] = useState(false);
  const [sellingMode, setSellingMode] = useState('PACK');
  const [packSize, setPackSize] = useState(DEFAULT_PACK_SIZE);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const itemDetailsRef = useRef(null);

  // ── MEMOIZED VALUES ──
  const industry = useMemo(() => industryType || (isPharmacy ? 'PHARMACY' : 'GENERAL'), [industryType, isPharmacy]);
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
    uniqueCompositions,
  }), [uniqueCategory, uniqueColors, uniqueSizes, uniqueDesigns, uniqueFabrics, uniqueSeasons, uniqueFits, uniqueCompositions]);

  const basePrice = selectedVariant?.pricePerUnit || 0;
  const looseUnitPrice = useMemo(
    () => sellingMode === 'LOOSE' && packSize > 0 ? calcLooseUnitPrice(basePrice, packSize) : basePrice,
    [sellingMode, packSize, basePrice]
  );

  const drugSchedule = selectedVariant?.drugSchedule;
  const isControlledDrug = useMemo(() => drugSchedule && ['SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X'].includes(drugSchedule), [drugSchedule]);
  const isNarcotic = useMemo(() => drugSchedule === 'SCHEDULE_X' || drugSchedule === 'SCHEDULE_H1', [drugSchedule]);

  // ── EFFECTS ──
  useEffect(() => {
    if (selectedVariant) {
      const backendPackSize = Number(selectedVariant.packSize) || DEFAULT_PACK_SIZE;
      setPackSize(backendPackSize);
      
      if (sellingMode === 'LOOSE') {
        const newPrice = calcLooseUnitPrice(selectedVariant.pricePerUnit, backendPackSize);
        setItem(prev => ({ ...prev, unitPrice: newPrice, packSizeUsed: backendPackSize }));
      }

      if (isPharmacy) {
        setLoadingBatches(true);
        setSelectedBatch(null);
        fetchBatchWiseStock(selectedVariant.id)
          .then(res => {
            const allBatches = Array.isArray(res.data) ? res.data : [];
            const variantBatches = allBatches
              .filter(b => !b.itemVariantId || Number(b.itemVariantId) === Number(selectedVariant.id))
              .filter(b => b.batchNumber);
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
  }, [selectedVariant?.id, isPharmacy, sellingMode]);

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

  const handleSellingModeChange = useCallback((_, newMode) => {
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
  }, [selectedVariant, packSize]);

  const handlePackSizeChange = useCallback((e) => {
    const size = Math.max(1, parseInt(e.target.value) || 1);
    setPackSize(size);
    if (selectedVariant && sellingMode === 'LOOSE') {
      const newPrice = calcLooseUnitPrice(selectedVariant.pricePerUnit, size);
      setItem(prev => ({ ...prev, unitPrice: newPrice, packSizeUsed: size }));
    }
  }, [selectedVariant, sellingMode]);

  const handleBatchSelect = useCallback((opt) => {
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
  }, []);

  const handleQtyChange = useCallback((e) => {
    setItem(prev => ({ ...prev, qty: e.target.value }));
  }, []);

  // ============ RENDER ============

  return (
    <Grid item xs={12}>
      <Card raised sx={{
        borderRadius: 4,
        boxShadow: `0 10px 30px ${alpha('#0f766e', 0.1)}`,
        overflow: 'visible',
        border: `1.5px solid ${alpha('#0f766e', 0.15)}`,
      }}>
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          {/* HEADER */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {isPharmacy ? (
                <LocalPharmacyIcon sx={{ color: '#0f766e', fontSize: 32 }} />
              ) : (
                <SearchIcon sx={{ color: '#0f766e', fontSize: 32 }} />
              )}
              <Typography variant="h5" sx={{
                fontWeight: 800,
                letterSpacing: '-0.5px',
                color: '#0f766e',
              }}>
                {headerTitle}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Reset all criteria">
                <Button
                  onClick={handleResetFilters}
                  color="inherit"
                  startIcon={<RestartAltIcon />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    color: '#64748b',
                  }}
                >
                  Reset
                </Button>
              </Tooltip>
              <Button
                variant={showAdvanced ? 'contained' : 'outlined'}
                onClick={() => setShowAdvanced(!showAdvanced)}
                startIcon={<TuneIcon />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  ...(showAdvanced && {
                    background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                  }),
                }}
              >
                {showAdvanced ? 'Basic' : 'Advanced'}
              </Button>
            </Box>
          </Box>

          {/* PRIMARY SEARCH */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={isPharmacy ? 4 : 6}>
              <Typography variant="caption" sx={{
                fontWeight: 700,
                ml: 1,
                color: '#64748b',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
              }}>
                {isPharmacy ? 'Medicine' : 'Product'} Name
              </Typography>
              <Select
                options={uniqueNames}
                value={uniqueNames.find(opt => opt.value === searchParams.name) || null}
                onChange={(opt) => handleChange('name', opt, false)}
                placeholder={isPharmacy ? 'Search by name...' : 'Search...'}
                isClearable
                styles={CUSTOM_SELECT_STYLES}
                menuPortalTarget={document.body}
              />
            </Grid>
            <Grid item xs={12} md={isPharmacy ? 4 : 6}>
              <Typography variant="caption" sx={{
                fontWeight: 700,
                ml: 1,
                color: '#64748b',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
              }}>
                {isPharmacy ? 'Batch / ' : ''}SKU
              </Typography>
              <Select
                options={uniqueSkus}
                value={uniqueSkus.find(opt => opt.value === searchParams.sku) || null}
                onChange={(opt) => handleChange('sku', opt, false)}
                placeholder={isPharmacy ? 'Batch or SKU...' : 'SKU...'}
                isClearable
                styles={CUSTOM_SELECT_STYLES}
                menuPortalTarget={document.body}
              />
            </Grid>
            {isPharmacy && (
              <Grid item xs={12} md={4}>
                <Typography variant="caption" sx={{
                  fontWeight: 700,
                  ml: 1,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                }}>
                  Composition
                </Typography>
                <Select
                  options={uniqueCompositions || []}
                  value={(uniqueCompositions || []).find(opt => opt.value === searchParams.composition) || null}
                  onChange={(opt) => handleChange('composition', opt, false)}
                  placeholder="Search..."
                  isClearable
                  styles={CUSTOM_SELECT_STYLES}
                  menuPortalTarget={document.body}
                />
              </Grid>
            )}
          </Grid>

          {/* FILTER BAR */}
          <FilterBar
            filterConfig={filterConfig}
            searchParams={searchParams}
            handleChange={handleChange}
            showAdvanced={showAdvanced}
            onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
            onReset={handleResetFilters}
            isPharmacy={isPharmacy}
            optionsMap={optionsMap}
          />

          {/* VARIANT SELECTION */}
          <Box sx={{ mt: 4, mb: 2 }}>
            <Typography variant="subtitle1" sx={{
              fontWeight: 700,
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: '#0f766e',
            }}>
              <Chip label="Step 2" size="small" sx={{ bgcolor: '#0f766e', color: 'white' }} />
              {isPharmacy ? 'Select Medicine' : 'Select Variant'}
            </Typography>
            <Select
              options={variants}
              onChange={handleVariantSelect}
              placeholder={isPharmacy ? 'Select medicine, strength...' : 'Select variant...'}
              value={selectedVariant}
              isClearable
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: '10px',
                  border: `2px solid #0f766e`,
                  minHeight: '50px',
                  fontSize: '1.1rem',
                }),
                menuPortal: base => ({ ...base, zIndex: 9999 }),
              }}
              menuPortalTarget={document.body}
            />
          </Box>

          {/* BATCH SELECTOR */}
          {isPharmacy && selectedVariant && (
            <BatchSelector
              batches={batches}
              selectedBatch={selectedBatch}
              onBatchSelect={handleBatchSelect}
              loadingBatches={loadingBatches}
            />
          )}

          {/* DISPENSING MODE */}
          {isPharmacy && selectedVariant && (
            <DispensingMode
              sellingMode={sellingMode}
              packSize={packSize}
              basePrice={basePrice}
              looseUnitPrice={looseUnitPrice}
              onModeChange={handleSellingModeChange}
              onPackSizeChange={handlePackSizeChange}
            />
          )}

          {/* ITEM DETAILS */}
          <ItemDetails
            ref={itemDetailsRef}
            selectedVariant={selectedVariant}
            item={item}
            itemDetailsRef={itemDetailsRef}
            isPharmacy={isPharmacy}
            sellingMode={sellingMode}
            handleAddItem={handleAddItem}
            onQtyChange={handleQtyChange}
            error={error}
          />

          {/* DRUG SCHEDULE ALERT */}
          {selectedVariant && (
            <DrugScheduleAlert
              drugSchedule={drugSchedule}
              isNarcotic={isNarcotic}
            />
          )}

          {/* SUBSTITUTES */}
          <SubstituteSuggestions
            substitutes={substitutes}
            onSelectSubstitute={onSelectSubstitute}
            showSubstitutes={showSubstitutes}
            onToggleSubstitutes={() => setShowSubstitutes(!showSubstitutes)}
          />
        </CardContent>
      </Card>
    </Grid>
  );
};

export default ItemSection;