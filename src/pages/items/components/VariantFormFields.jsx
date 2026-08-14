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
  Card,
  Tooltip,
  Divider,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Inventory2 as InventoryIcon,
  ContentCopy as DuplicateIcon,
} from '@mui/icons-material';

import { styled } from '@mui/material/styles';
import {
  variantSpecs,
  variantColors,
  variantModels,
  variantFits,
  shopUnits,
} from '../../../ui/constants';

const GST_SLABS = ['0', '5', '12', '18', '28'];

const HSN_DEFAULTS_BY_INDUSTRY = {
  JEWELLERY:   ['7113', '7114', '7117'],
  ELECTRONICS: ['8517', '8471', '8528', '8544', '8518'],
  AUTOMOBILE:  ['8708', '4011', '8511', '8409'],
  CLOTHING:    ['6105', '6109', '6203', '6204', '6110'],
  HARDWARE:    ['7318', '8544', '8302', '3925'],
  STATIONERY:  ['4820', '9608', '9609'],
  GROCERY:     ['1006', '1701', '1902', '2101', '0401'],
  FOOTWEAR:    ['6403', '6404', '6405'],
  FURNITURE:   ['9401', '9403', '9404'],
  GENERAL:     [],
};
import { flattenOptions } from '../utils/flattenOptions';
import { API_BASE_URL, getSuppliers } from '../../../services/api';
import { useShop } from '../../../context/ShopContext';
import IndustrySlot from './IndustrySlot';

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

const DEFAULT_VARIANT_LABELS = {
  CLOTHING:   { size: 'Size', color: 'Color', design: 'Design', fit: 'Fit' },
  ELECTRONICS:{ size: 'Storage', color: 'Finish', design: 'Model', fit: 'Connectivity' },
  HARDWARE:   { size: 'Dimensions', color: 'Finish', design: 'Grade', fit: 'Mounting' },
  GROCERY:    { size: 'Weight/Vol', color: 'Origin', design: 'Quality', fit: 'Dietary' },
  AUTOMOBILE: { size: 'Specs', color: 'Color', design: 'Part No', fit: 'Position' },
  STATIONERY: { size: 'GSM/Size', color: 'Ink/Color', design: 'Binding', fit: 'Layout' },
  FOOTWEAR:   { size: 'Size', color: 'Color', design: 'Collection', fit: 'Width' },
  FURNITURE:  { size: 'Dimensions', color: 'Finish', design: 'Style', fit: 'Assembly' },
  JEWELLERY:  { size: 'Length/Size', color: 'Tone', design: 'Pattern', fit: 'Clasp' },
  GENERAL:    { size: 'Size', color: 'Color', design: 'Design', fit: 'Fit' },
};

export default function VariantFormFields({
  shopCategory,
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
  const { industryType, industryConfig, customAttributes } = useShop();
  const isEditing = editingVariantIndex !== null;

  // Supplier list for the preferred/backup dropdowns. Fetched once on mount;
  // silent failure lets the form work in shops that don't use suppliers.
  const [suppliers, setSuppliers] = React.useState([]);
  React.useEffect(() => {
    let cancelled = false;
    getSuppliers()
      .then((data) => { if (!cancelled) setSuppliers(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setSuppliers([]); });
    return () => { cancelled = true; };
  }, []);

  const setSupplier = (key, supplier) => {
    setCurrentVariant((prev) => ({
      ...prev,
      [`${key}Id`]: supplier ? supplier.id : null,
      [`${key}Name`]: supplier ? supplier.name : null,
    }));
  };

  const industryRoot = (shopCategory || industryType || 'GENERAL').toUpperCase();
  const variantLabels = DEFAULT_VARIANT_LABELS[industryRoot] || DEFAULT_VARIANT_LABELS.GENERAL;
  const variantFields = industryConfig?.variant || [];

  // Convert ShopCustomAttributeDefDto[] → the FieldSpec shape IndustrySlot renders.
  const customFieldSpecs = React.useMemo(
    () =>
      (customAttributes || [])
        .filter((c) => c.active !== false)
        .map((c) => ({
          key: c.keyName,
          label: c.label,
          type: c.fieldType,
          required: !!c.required,
          options: c.options || [],
          helpText: c.helpText || '',
        })),
    [customAttributes]
  );

  const getOptions = (source) => flattenOptions(source[industryRoot] || []);
  const options = {
    size:  getOptions(variantSpecs),
    color: getOptions(variantColors),
    design: getOptions(variantModels),
    fit:   getOptions(variantFits),
    unit:  shopUnits[industryRoot] || ['PIECE'],
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      bgcolor: 'background.paper',
      '& fieldset': { borderColor: 'divider' },
      '&:hover fieldset': { borderColor: 'divider' },
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

  const handleSlotChange = (key, value) => {
    setCurrentVariant((prev) => ({ ...prev, [key]: value }));
  };

  const handleDuplicateVariant = (index) => {
    const sourceVariant = variantList[index];
    setCurrentVariant({ ...sourceVariant });
    setEditingVariantIndex(null);
  };

  const nonNegative = (e, allowMax) => {
    const v = parseFloat(e.target.value);
    if (isNaN(v)) return true;
    if (v < 0) return false;
    if (allowMax !== undefined && v > allowMax) return false;
    return true;
  };

  const guardedChange = (allowMax) => (e) => {
    if (!nonNegative(e, allowMax)) return;
    handleCurrentVariantChange(e);
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
            renderInput={(params) => <TextField {...params} label={variantLabels[field.id]} sx={inputSx} />}
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
          label="Barcode / EAN (Optional)"
          name="barcode"
          value={currentVariant.barcode || ''}
          onChange={handleCurrentVariantChange}
          placeholder="e.g. 8901234567890"
          fullWidth sx={inputSx}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label={t('itemsPage.form.pricePerUnit')}
          name="pricePerUnit"
          type="number"
          value={currentVariant.pricePerUnit || ''}
          onChange={guardedChange()}
          required fullWidth sx={inputSx}
          InputProps={{ inputProps: { min: 0, step: 'any' } }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <Autocomplete
          freeSolo
          options={HSN_DEFAULTS_BY_INDUSTRY[industryRoot] || []}
          value={currentVariant.hsn || ''}
          onChange={handleFreeSoloChange('hsn')}
          onInputChange={handleFreeSoloInput('hsn')}
          renderInput={(params) => (
            <TextField
              {...params}
              label="HSN Code"
              placeholder="e.g. 7113"
              helperText={`Suggested ${industryRoot} codes shown — override as needed`}
              sx={inputSx}
            />
          )}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <Autocomplete
          freeSolo
          options={GST_SLABS}
          value={currentVariant.gstRate != null ? String(currentVariant.gstRate) : ''}
          onChange={(_, v) => {
            const n = v === '' || v === null ? '' : parseFloat(v);
            if (n !== '' && (isNaN(n) || n < 0 || n > 28)) return;
            setCurrentVariant((prev) => ({ ...prev, gstRate: n === '' ? '' : n }));
          }}
          onInputChange={(_, v) => {
            const n = v === '' ? '' : parseFloat(v);
            if (v !== '' && (isNaN(n) || n < 0 || n > 28)) return;
            setCurrentVariant((prev) => ({ ...prev, gstRate: v === '' ? '' : n }));
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('itemsPage.form.gstRate')}
              sx={inputSx}
              helperText="Standard slabs: 0, 5, 12, 18, 28 — override if needed"
              type="number"
              inputProps={{ ...params.inputProps, min: 0, max: 28, step: 'any' }}
            />
          )}
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

      <Grid item xs={12}>
        <Divider sx={{ my: 0.5 }}>
          <Chip
            label="Traceability & MRP (Optional)"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
          />
        </Divider>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label={t('itemsPage.form.mrp')}
          name="mrp"
          type="number"
          value={currentVariant.mrp || ''}
          onChange={guardedChange()}
          fullWidth sx={inputSx}
          InputProps={{
            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            inputProps: { min: 0, step: 'any' },
          }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label={t('itemsPage.form.batchNumber')}
          name="batchNumber"
          value={currentVariant.batchNumber || ''}
          onChange={handleCurrentVariantChange}
          fullWidth sx={inputSx}
        />
      </Grid>

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

      {/* ── Reorder rules (V79) ────────────────────────────────────── */}
      <Grid item xs={12}>
        <Divider sx={{ my: 0.5 }}>
          <Chip label="Reorder Rules (Optional)" size="small" variant="outlined"
            sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
        </Divider>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label="Reorder point"
          name="reorderPoint" type="number"
          value={currentVariant.reorderPoint ?? ''}
          onChange={handleCurrentVariantChange}
          fullWidth sx={inputSx}
          InputProps={{ inputProps: { min: 0, step: 'any' } }}
          helperText="Trigger reorder when stock falls to this level"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Fixed reorder quantity"
          name="reorderQty" type="number"
          value={currentVariant.reorderQty ?? ''}
          onChange={handleCurrentVariantChange}
          fullWidth sx={inputSx}
          InputProps={{ inputProps: { min: 0, step: 'any' } }}
          helperText="Always buy this many — overrides the velocity formula"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Safety stock"
          name="safetyStock" type="number"
          value={currentVariant.safetyStock ?? ''}
          onChange={handleCurrentVariantChange}
          fullWidth sx={inputSx}
          InputProps={{ inputProps: { min: 0, step: 'any' } }}
          helperText="Buffer kept for demand uncertainty"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Max stock"
          name="maxStock" type="number"
          value={currentVariant.maxStock ?? ''}
          onChange={handleCurrentVariantChange}
          fullWidth sx={inputSx}
          InputProps={{ inputProps: { min: 0, step: 'any' } }}
          helperText="Advisory cap on how much to hold"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Lead time (days)"
          name="leadTimeDays" type="number"
          value={currentVariant.leadTimeDays ?? ''}
          onChange={handleCurrentVariantChange}
          fullWidth sx={inputSx}
          InputProps={{ inputProps: { min: 0, step: 1 } }}
          helperText="Days between placing a PO and receiving goods"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Autocomplete
          options={suppliers}
          getOptionLabel={(s) => s?.name || ''}
          isOptionEqualToValue={(a, b) => a?.id === b?.id}
          value={suppliers.find((s) => s.id === currentVariant.preferredSupplierId) || null}
          onChange={(_, v) => setSupplier('preferredSupplier', v)}
          renderInput={(params) => (
            <TextField {...params} label="Preferred supplier" sx={inputSx}
              helperText="Overrides the last-PO fallback" />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Autocomplete
          options={suppliers}
          getOptionLabel={(s) => s?.name || ''}
          isOptionEqualToValue={(a, b) => a?.id === b?.id}
          value={suppliers.find((s) => s.id === currentVariant.backupSupplierId) || null}
          onChange={(_, v) => setSupplier('backupSupplier', v)}
          renderInput={(params) => (
            <TextField {...params} label="Backup supplier" sx={inputSx}
              helperText="Fallback when the preferred one is unavailable" />
          )}
        />
      </Grid>

      {/* Industry-specific variant fields from server config */}
      {variantFields.length > 0 && (
        <Grid item xs={12}>
          <Divider sx={{ my: 0.5 }}>
            <Chip
              label={`${industryRoot} — Extra Details`}
              size="small"
              color="secondary"
              variant="outlined"
              sx={{ fontWeight: 700, fontSize: '0.7rem' }}
            />
          </Divider>
        </Grid>
      )}
      <IndustrySlot fields={variantFields} values={currentVariant} onChange={handleSlotChange} />

      {/* Per-shop custom attributes — stored under variant.customAttributes JSON map. */}
      {customFieldSpecs.length > 0 && (
        <Grid item xs={12}>
          <Divider sx={{ my: 0.5 }}>
            <Chip
              label="Custom Fields"
              size="small"
              variant="outlined"
              sx={{ fontWeight: 700, fontSize: '0.7rem' }}
            />
          </Divider>
        </Grid>
      )}
      <IndustrySlot
        fields={customFieldSpecs}
        values={currentVariant}
        onChange={handleSlotChange}
        valueContainerKey="customAttributes"
      />

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
          <Box sx={{ mt: 2, p: 1, bgcolor: 'action.hover', borderRadius: 3, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
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
        <Paper elevation={0} sx={{
          p: 3, borderRadius: 4, border: '2px solid',
          borderColor: isEditing ? 'success.main' : 'divider',
          bgcolor: isEditing ? 'action.selected' : 'background.paper',
        }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            {isEditing ? <EditIcon color="success" /> : <AddIcon color="primary" />}
            <Typography variant="h6" fontWeight={900} color="text.primary">
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
                <Card key={index} elevation={0} sx={{
                  p: 2, borderRadius: 3, border: '1px solid',
                  borderColor: editingVariantIndex === index ? 'primary.main' : 'divider',
                  bgcolor: editingVariantIndex === index ? 'action.selected' : 'background.paper',
                }}>
                  <Grid container alignItems="center">
                    <Grid item xs>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="subtitle2" fontWeight={900} color="text.primary">
                            ₹{variant.pricePerUnit}{' '}
                            <small style={{ fontWeight: 400, color: 'text.secondary' }}>/ {variant.unit}</small>
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
            <Box sx={{ py: 6, textAlign: 'center', border: '2px dashed', borderColor: 'divider', borderRadius: 4, bgcolor: 'action.hover' }}>
              <InventoryIcon sx={{ fontSize: 40, color: 'action.disabled', mb: 1 }} />
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
