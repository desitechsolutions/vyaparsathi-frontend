import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  Box,
  Autocomplete,
  TextField,
  Stack,
  alpha,
  Card,
  Tooltip,
  Divider,
  Chip,
  InputAdornment,
  Switch,
  FormControlLabel,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Inventory2 as InventoryIcon,
  ContentCopy as DuplicateIcon,
  Diamond as DiamondIcon,
  ElectricalServices as ElectronicsIcon,
  DirectionsCar as AutoIcon,
} from '@mui/icons-material';

import { styled } from '@mui/material/styles';
import {
  variantSpecs,
  variantColors,
  variantModels,
  variantFits,
  shopUnits,
  JEWELLERY_METAL_PURITIES,
  ELECTRONICS_WARRANTY_TERMS,
} from '../../../ui/constants';
import { flattenOptions } from '../utils/flattenOptions';
import { API_BASE_URL } from '../../../services/api';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export default function VariantFormFields({
  shopCategory = 'CLOTHING', 
  currentVariant,
  setCurrentVariant,
  variantList,
  editingVariantIndex,
  setEditingVariantIndex,
  handleCurrentVariantChange,
  handleCurrentVariantFileChange,
  addOrUpdateVariantToList,
  handleEditVariantInList,
  handleDeleteVariantInList,
}) {
  const { t } = useTranslation();
  const isEditing = editingVariantIndex !== null;

  const industryRoot = shopCategory || "GENERAL";
  console.log("VariantFormFields rendered", shopCategory);

  // --- DYNAMIC INDUSTRY CONFIG ---
  const industryConfig = {
    CLOTHING: { labels: { size: t('itemsPage.form.size'), color: t('itemsPage.form.color'), design: t('itemsPage.form.design'), fit: t('itemsPage.form.fit') } },
    ELECTRONICS: { labels: { size: 'Storage', color: 'Finish', design: 'Model', fit: 'Connectivity' } },
    HARDWARE: { labels: { size: 'Dimensions', color: 'Finish', design: 'Grade', fit: 'Mounting' } },
    PHARMACY: { labels: { size: 'Strength', color: 'Visual', design: 'Brand Type', fit: 'Usage' } },
    GROCERY: { labels: { size: 'Weight/Vol', color: 'Origin', design: 'Quality', fit: 'Dietary' } },
    AUTOMOBILE: { labels: { size: 'Specs', color: 'Color', design: 'Part No', fit: 'Position' } },
    STATIONERY: { labels: { size: 'GSM/Size', color: 'Ink/Color', design: 'Binding', fit: 'Layout' } },
    FOOTWEAR: { labels: { size: 'Size', color: 'Color', design: 'Collection', fit: 'Width' } },
    FURNITURE: { labels: { size: 'Dimensions', color: 'Finish', design: 'Style', fit: 'Assembly' } },
    JEWELLERY: { labels: { size: 'Length/Size', color: 'Tone', design: 'Pattern', fit: 'Clasp' } }
  };

  const config = industryConfig[industryRoot] || industryConfig.CLOTHING;

  const getOptions = (source, root) => flattenOptions(source[root] || []);

  const options = {
    size: getOptions(variantSpecs, industryRoot),
    color: getOptions(variantColors, industryRoot),
    design: getOptions(variantModels, industryRoot),
    fit: getOptions(variantFits, industryRoot),
    unit: shopUnits[industryRoot] || ['PIECE']
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      bgcolor: '#f8fafc',
      '& fieldset': { borderColor: '#e2e8f0' },
      '&:hover fieldset': { borderColor: '#cbd5e1' },
      '&.Mui-focused fieldset': { borderColor: isEditing ? 'success.main' : 'primary.main' },
    },
  };

  const handleFreeSoloChange = (field) => (event, newValue) => {
    const value = newValue && typeof newValue === 'string' ? newValue : newValue || '';
    setCurrentVariant((prev) => ({ ...prev, [field]: value }));
  };

  const handleFreeSoloInput = (field) => (event, newInputValue) => {
    setCurrentVariant((prev) => ({ ...prev, [field]: newInputValue }));
  };

  const handleDuplicateVariant = (index) => {
    const sourceVariant = variantList[index];
    setCurrentVariant({ ...sourceVariant }); 
    setEditingVariantIndex(null); 
  };

  const getVariantForm = () => (
    <Grid container spacing={2}>
      {[
        { id: 'size', opt: options.size },
        { id: 'color', opt: options.color },
        { id: 'design', opt: options.design },
        { id: 'fit', opt: options.fit },
      ].map((field) => (
        <Grid item xs={12} sm={6} key={field.id}>
          <Autocomplete
            freeSolo
            options={field.opt}
            value={currentVariant[field.id] || ''}
            onChange={handleFreeSoloChange(field.id)}
            onInputChange={handleFreeSoloInput(field.id)}
            renderInput={(params) => <TextField {...params} label={config.labels[field.id]} sx={inputSx} />}
          />
        </Grid>
      ))}

      <Grid item xs={12} sm={6}>
        <Autocomplete
          options={options.unit}
          value={currentVariant.unit || ''}
          onChange={handleFreeSoloChange('unit')}
          renderInput={(params) => (
            <TextField {...params} label={t('itemsPage.form.unit')} required sx={inputSx} />
          )}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label={t('itemsPage.form.pricePerUnit')}
          name="pricePerUnit"
          type="number"
          value={currentVariant.pricePerUnit || ''}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (value < 0) return; 
            handleCurrentVariantChange(e);
          }}
          required fullWidth sx={inputSx}
          InputProps={{ inputProps: { min: 0 } }} 
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label={t('itemsPage.form.gstRate')}
          name="gstRate"
          type="number"
          value={currentVariant.gstRate || ''}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (value < 0) return; 
            handleCurrentVariantChange(e);
          }}
          fullWidth sx={inputSx}
          InputProps={{ inputProps: { min: 0, max: 100 } }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label={t('itemsPage.form.lowStockThreshold')}
          name="lowStockThreshold"
          type="number"
          value={currentVariant.lowStockThreshold || ''}
          onChange={handleCurrentVariantChange}
          fullWidth sx={inputSx}
          InputProps={{ inputProps: { min: 0 } }}
        />
      </Grid>

      {/* Pharmacy-specific variant fields */}
      {shopCategory === 'PHARMACY' && (
        <>
          <Grid item xs={12}>
            <Divider sx={{ my: 0.5 }}>
              <Chip
                label={t('itemsPage.sections.pharmacyDetails')}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 700, fontSize: '0.7rem' }}
              />
            </Divider>
          </Grid>

          {/* MRP */}
          <Grid item xs={12} sm={6}>
            <TextField
              label={t('itemsPage.form.mrp')}
              name="mrp"
              type="number"
              value={currentVariant.mrp || ''}
              onChange={handleCurrentVariantChange}
              fullWidth sx={inputSx}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                inputProps: { min: 0 }
              }}
            />
          </Grid>

          {/* Batch Number */}
          <Grid item xs={12} sm={6}>
            <TextField
              label={t('itemsPage.form.batchNumber')}
              name="batchNumber"
              value={currentVariant.batchNumber || ''}
              onChange={handleCurrentVariantChange}
              fullWidth sx={inputSx}
            />
          </Grid>

          {/* Manufacturing Date */}
          <Grid item xs={12} sm={6}>
            <TextField
              label={t('itemsPage.form.manufacturingDate')}
              name="manufacturingDate"
              type="date"
              value={currentVariant.manufacturingDate || ''}
              onChange={handleCurrentVariantChange}
              fullWidth sx={inputSx}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Expiry Date */}
          <Grid item xs={12} sm={6}>
            <TextField
              label={t('itemsPage.form.expiryDate')}
              name="expiryDate"
              type="date"
              value={currentVariant.expiryDate || ''}
              onChange={handleCurrentVariantChange}
              fullWidth sx={inputSx}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Pack Size — shown when unit suggests strips/boxes or isLooseMedicine is true */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Pack Size (tablets/units per strip)"
              name="packSize"
              type="number"
              value={currentVariant.packSize || ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (value < 1) return;
                handleCurrentVariantChange(e);
              }}
              fullWidth sx={inputSx}
              InputProps={{
                endAdornment: <InputAdornment position="end">units</InputAdornment>,
                inputProps: { min: 1 }
              }}
              helperText="e.g. 10 for a strip of 10 tablets"
            />
          </Grid>

          {/* Is Loose Medicine toggle */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', pt: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!currentVariant.isLooseMedicine}
                    onChange={(e) =>
                      setCurrentVariant((prev) => ({ ...prev, isLooseMedicine: e.target.checked }))
                    }
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={700}>Loose Medicine</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Can be dispensed as individual units (tablets, capsules)
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Grid>
        </>
      )}

      {/* ---- JEWELLERY-SPECIFIC VARIANT FIELDS ---- */}
      {shopCategory === 'JEWELLERY' && (
        <>
          <Grid item xs={12}>
            <Divider sx={{ my: 0.5 }}>
              <Chip
                icon={<DiamondIcon fontSize="small" />}
                label="Jewellery Variant Details"
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ fontWeight: 700, fontSize: '0.7rem' }}
              />
            </Divider>
          </Grid>

          {/* Gross Weight */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Gross Weight (grams)"
              name="weightGrams"
              type="number"
              value={currentVariant.weightGrams || ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (value < 0) return;
                handleCurrentVariantChange(e);
              }}
              fullWidth sx={inputSx}
              InputProps={{
                endAdornment: <InputAdornment position="end">g</InputAdornment>,
                inputProps: { min: 0, step: 0.01 }
              }}
              helperText="Total weight including stones"
            />
          </Grid>

          {/* Net Weight (gold only) */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Net Metal Weight (grams)"
              name="netWeightGrams"
              type="number"
              value={currentVariant.netWeightGrams || ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (value < 0) return;
                handleCurrentVariantChange(e);
              }}
              fullWidth sx={inputSx}
              InputProps={{
                endAdornment: <InputAdornment position="end">g</InputAdornment>,
                inputProps: { min: 0, step: 0.01 }
              }}
              helperText="Weight of metal only (excluding stones)"
            />
          </Grid>

          {/* Metal Purity */}
          <Grid item xs={12} sm={6}>
            <Autocomplete
              freeSolo
              options={JEWELLERY_METAL_PURITIES}
              value={currentVariant.metalPurity || ''}
              onChange={(_, v) => setCurrentVariant((prev) => ({ ...prev, metalPurity: v || '' }))}
              onInputChange={(_, v) => setCurrentVariant((prev) => ({ ...prev, metalPurity: v }))}
              renderInput={(params) => (
                <TextField {...params} label="Metal Purity" sx={inputSx} />
              )}
            />
          </Grid>

          {/* Hallmark Number */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Hallmark / HUID Number"
              name="hallmarkNo"
              value={currentVariant.hallmarkNo || ''}
              onChange={handleCurrentVariantChange}
              fullWidth sx={inputSx}
              placeholder="6-character alphanumeric HUID"
              helperText="BIS Hallmark Unique ID (mandatory from Apr 2023)"
            />
          </Grid>

          {/* Making Charges Section — both ₹/gram and % of metal value */}
          <Grid item xs={12}>
            <Box sx={{ p: 2, bgcolor: '#fdf4ff', borderRadius: 2, border: '1px solid #e9d5ff' }}>
              <Typography variant="caption" fontWeight={800} color="secondary.dark" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Making Charges
              </Typography>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                {/* Making Charges per gram */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Making Charges (₹ per gram)"
                    name="makingChargesPerGram"
                    type="number"
                    value={currentVariant.makingChargesPerGram || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (value < 0) return;
                      handleCurrentVariantChange(e);
                    }}
                    fullWidth sx={inputSx}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      inputProps: { min: 0, step: 0.01 }
                    }}
                    helperText="Flat rate per gram of net metal weight"
                  />
                </Grid>

                {/* Making Charges as % of metal value */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Making Charges (% of metal value)"
                    name="makingChargesPct"
                    type="number"
                    value={currentVariant.makingChargesPct || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (value < 0 || value > 100) return;
                      handleCurrentVariantChange(e);
                    }}
                    fullWidth sx={inputSx}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      inputProps: { min: 0, max: 100, step: 0.1 }
                    }}
                    helperText="% of (metal weight × today's gold rate)"
                  />
                </Grid>

                {/* Live preview: calculated making charges when both weight and rate are filled */}
                {(currentVariant.makingChargesPerGram || currentVariant.makingChargesPct) && currentVariant.netWeightGrams && (
                  <Grid item xs={12}>
                    <Box sx={{ p: 1.5, bgcolor: 'white', borderRadius: 2, border: '1px dashed #c084fc' }}>
                      <Typography variant="caption" fontWeight={700} color="secondary.dark">
                        💡 Making Charges Preview (based on net weight {currentVariant.netWeightGrams}g)
                      </Typography>
                      {currentVariant.makingChargesPerGram && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                          Flat: ₹{(parseFloat(currentVariant.makingChargesPerGram) * parseFloat(currentVariant.netWeightGrams)).toFixed(2)}
                          {' '}(₹{currentVariant.makingChargesPerGram}/g × {currentVariant.netWeightGrams}g)
                        </Typography>
                      )}
                      {currentVariant.makingChargesPct && (
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                          % rate: {currentVariant.makingChargesPct}% of metal value — applied at billing using live gold rate
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Grid>

          {/* Stone Weight */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Stone Weight (carats)"
              name="stoneWeightCarats"
              type="number"
              value={currentVariant.stoneWeightCarats || ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (value < 0) return;
                handleCurrentVariantChange(e);
              }}
              fullWidth sx={inputSx}
              InputProps={{
                endAdornment: <InputAdornment position="end">ct</InputAdornment>,
                inputProps: { min: 0, step: 0.01 }
              }}
              helperText="Leave blank if no stones"
            />
          </Grid>
        </>
      )}

      {/* ---- ELECTRONICS-SPECIFIC VARIANT FIELDS ---- */}
      {shopCategory === 'ELECTRONICS' && (
        <>
          <Grid item xs={12}>
            <Divider sx={{ my: 0.5 }}>
              <Chip
                icon={<ElectronicsIcon fontSize="small" />}
                label="Electronics Variant Details"
                size="small"
                color="info"
                variant="outlined"
                sx={{ fontWeight: 700, fontSize: '0.7rem' }}
              />
            </Divider>
          </Grid>

          {/* IMEI / Serial Number */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="IMEI / Serial Number"
              name="serialNumber"
              value={currentVariant.serialNumber || ''}
              onChange={handleCurrentVariantChange}
              fullWidth sx={inputSx}
              placeholder="For individual unit tracking"
              helperText="Optional — for high-value tracking"
            />
          </Grid>

          {/* Warranty Period */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Warranty Period"
              name="warrantyMonths"
              value={currentVariant.warrantyMonths || ''}
              onChange={handleCurrentVariantChange}
              fullWidth sx={inputSx}
            >
              <MenuItem value=""><em>Not Specified</em></MenuItem>
              {ELECTRONICS_WARRANTY_TERMS.map((w) => (
                <MenuItem key={w.value} value={w.value}>{w.label}</MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* MRP */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="MRP (Max Retail Price)"
              name="mrp"
              type="number"
              value={currentVariant.mrp || ''}
              onChange={handleCurrentVariantChange}
              fullWidth sx={inputSx}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                inputProps: { min: 0 }
              }}
            />
          </Grid>
        </>
      )}

      {/* ---- AUTOMOBILE-SPECIFIC VARIANT FIELDS ---- */}
      {shopCategory === 'AUTOMOBILE' && (
        <>
          <Grid item xs={12}>
            <Divider sx={{ my: 0.5 }}>
              <Chip
                icon={<AutoIcon fontSize="small" />}
                label="Automobile Part Details"
                size="small"
                color="warning"
                variant="outlined"
                sx={{ fontWeight: 700, fontSize: '0.7rem' }}
              />
            </Divider>
          </Grid>

          {/* Part Number */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Variant Part Number"
              name="partNumber"
              value={currentVariant.partNumber || ''}
              onChange={handleCurrentVariantChange}
              fullWidth sx={inputSx}
              placeholder="e.g., SWF-SX16-07"
              helperText="SKU or OEM part reference for this variant"
            />
          </Grid>

          {/* OEM / Aftermarket */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Part Origin"
              name="partOrigin"
              value={currentVariant.partOrigin || ''}
              onChange={handleCurrentVariantChange}
              fullWidth sx={inputSx}
            >
              <MenuItem value=""><em>Not Specified</em></MenuItem>
              <MenuItem value="GENUINE">Genuine OEM</MenuItem>
              <MenuItem value="AFTERMARKET">Aftermarket</MenuItem>
              <MenuItem value="RECONDITIONED">Reconditioned</MenuItem>
            </TextField>
          </Grid>

          {/* MRP */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="MRP (Max Retail Price)"
              name="mrp"
              type="number"
              value={currentVariant.mrp || ''}
              onChange={handleCurrentVariantChange}
              fullWidth sx={inputSx}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                inputProps: { min: 0 }
              }}
            />
          </Grid>
        </>
      )}

      <Grid item xs={12}>
        <Button
          component="label"
          variant="outlined"
          startIcon={<CloudUploadIcon />}
          fullWidth
          sx={{ borderRadius: 2, py: 1.5, borderStyle: 'dashed', fontWeight: 700 }}
        >
          {t('itemsPage.form.uploadPhoto')}
          <VisuallyHiddenInput type="file" accept="image/*" onChange={handleCurrentVariantFileChange} />
        </Button>

        {(currentVariant.photoPreviewUrl || currentVariant.photoUrl) && (
          <Box sx={{ mt: 2, p: 1, bgcolor: '#f1f5f9', borderRadius: 3, textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <img
              src={currentVariant.photoPreviewUrl || `${API_BASE_URL}${currentVariant.photoUrl}`}
              alt="Preview"
              style={{ maxHeight: '120px', borderRadius: '8px', objectFit: 'contain' }}
            />
          </Box>
        )}
      </Grid>
    </Grid>
  );

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={6}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '2px solid', 
          borderColor: isEditing ? 'success.light' : '#e2e8f0',
          bgcolor: isEditing ? alpha('#f0fdf4', 0.5) : 'white' }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            {isEditing ? <EditIcon color="success" /> : <AddIcon color="primary" />}
            <Typography variant="h6" fontWeight={900}>
              {isEditing ? t('itemsPage.variant.editTitle') : t('itemsPage.variant.addTitle')}
            </Typography>
          </Stack>
          {getVariantForm()}
          <Button
            variant="contained"
            startIcon={isEditing ? <SaveIcon /> : <AddIcon />}
            onClick={addOrUpdateVariantToList}
            sx={{ mt: 3, borderRadius: 2, py: 1.5, fontWeight: 800, textTransform: 'none' }}
            color={isEditing ? 'success' : 'primary'}
            fullWidth
          >
            {isEditing ? t('itemsPage.variant.updateButton') : t('itemsPage.variant.addButton')}
          </Button>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Typography variant="overline" fontWeight={800} color="text.secondary" sx={{ letterSpacing: 1 }}>
          {t('itemsPage.variant.currentVariants')} ({variantList.length})
        </Typography>
        <Box sx={{ mt: 2, maxHeight: '650px', overflowY: 'auto', pr: 1 }}>
          {variantList.length > 0 ? (
            <Stack spacing={2}>
              {variantList.map((variant, index) => (
                <Card key={index} elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid',
                  borderColor: editingVariantIndex === index ? 'primary.main' : '#e2e8f0',
                  bgcolor: editingVariantIndex === index ? '#f0f9ff' : 'white' }}>
                  <Grid container alignItems="center">
                    <Grid item xs>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="subtitle2" fontWeight={900}>
                            ₹{variant.pricePerUnit} <small style={{ fontWeight: 400, color: '#64748b' }}>/ {variant.unit}</small>
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {[variant.size, variant.color, variant.design, variant.fit].filter(Boolean).join(' • ') || 'Standard'}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Duplicate">
                            <IconButton size="small" color="info" onClick={() => handleDuplicateVariant(index)}>
                              <DuplicateIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" color="primary" onClick={() => handleEditVariantInList(index)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleDeleteVariantInList(index)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    </Grid>
                  </Grid>
                </Card>
              ))}
            </Stack>
          ) : (
            <Box sx={{ py: 6, textAlign: 'center', border: '2px dashed #e2e8f0', borderRadius: 4 }}>
              <InventoryIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                {t('itemsPage.variant.noVariantsYet')}
              </Typography>
            </Box>
          )}
        </Box>
      </Grid>
    </Grid>
  );
}