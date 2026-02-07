import React, { useState } from 'react';
import { 
  Grid, Card, CardContent, TextField, Button, Typography, 
  Box, Collapse, IconButton, Tooltip, Divider, Paper, Chip 
} from '@mui/material';
import Select from 'react-select';
import TuneIcon from '@mui/icons-material/Tune';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

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
  handleResetFilters,
  error,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  // 2. Filter Groups
  const mainFilters = [
    { label: 'Category', key: 'category', options: uniqueCategory, multi: false },
    { label: 'Colors', key: 'color', options: uniqueColors, multi: true },
    { label: 'Sizes', key: 'size', options: uniqueSizes, multi: true },
  ];

  const advancedFilters = [
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
              <SearchIcon color="primary" fontSize="large" />
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                Inventory Search
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
            <Grid item xs={12} md={6}>
              <Typography variant="caption" sx={{ fontWeight: 700, ml: 1, color: 'text.secondary' }}>PRODUCT NAME</Typography>
              <Select
                options={uniqueNames}
                value={uniqueNames.find(opt => opt.value === searchParams.name) || null}
                onChange={(opt) => handleChange('name', opt, false)}
                placeholder="Search by product name..."
                isClearable
                styles={customSelectStyles}
                menuPortalTarget={document.body}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" sx={{ fontWeight: 700, ml: 1, color: 'text.secondary' }}>SKU IDENTIFIER</Typography>
              <Select
                options={uniqueSkus}
                value={uniqueSkus.find(opt => opt.value === searchParams.sku) || null}
                onChange={(opt) => handleChange('sku', opt, false)}
                placeholder="Scan or type SKU..."
                isClearable
                styles={customSelectStyles}
                menuPortalTarget={document.body}
              />
            </Grid>
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
              <Chip label="Step 2" size="small" color="primary" /> Select Specific Variant
            </Typography>
            <Select
              options={variants}
              onChange={handleVariantSelect}
              placeholder="Finalize item selection..."
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

          {/* ITEM DETAILS & ADD BUTTON */}
          <Box sx={{ 
            mt: 3, 
            p: 3, 
            borderRadius: 4, 
            bgcolor: '#eff6ff', 
            border: '1px solid #bfdbfe',
            display: selectedVariant ? 'block' : 'none'
          }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={7}>
                <Grid container spacing={1}>
                  {[
                    { label: 'SKU', val: item.sku },
                    { label: 'Price', val: item.unitPrice ? `₹${item.unitPrice}` : '-' },
                    { label: 'Stock', val: item.currentStock },
                    { label: 'Color', val: item.color },
                    { label: 'Size', val: item.size }
                  ].map((d, i) => (
                    <Grid item xs={4} key={i}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{d.label}</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e3a8a' }}>{d.val || '—'}</Typography>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              <Grid item xs={6} md={2}>
                <TextField
                  label="Qty"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={item.qty}
                  onChange={(e) => setItem({ ...item, qty: e.target.value })}
                  onFocus={(e) => e.target.select()}
                  InputProps={{ sx: { borderRadius: 2, bgcolor: 'white', fontWeight: 800 } }}
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
                  Add Item
                </Button>
              </Grid>
            </Grid>
          </Box>

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