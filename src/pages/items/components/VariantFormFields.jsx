import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Box,
  Autocomplete,
  TextField,
  Stack,
  Divider,
  alpha,
  Card,
} from '@mui/material';
import {
  Add as AddIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Inventory2 as InventoryIcon,
} from '@mui/icons-material';

import { styled } from '@mui/material/styles';
import {
  clothingSizes,
  clothingColors,
  clothingDesigns,
  clothingUnits,
  clothingFits,
  // Ensure these exist in your constants for other industries
  variantSpecs,
  variantColors,
  variantModels,
  variantFits,
  shopUnits,
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
  shopCategory = 'CLOTHING', // Added prop to handle dynamic industries
  currentVariant,
  setCurrentVariant,
  variantList,
  setVariantList,
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

  // --- DYNAMIC INDUSTRY CONFIG ---
  const fieldConfig = {
    CLOTHING: {
      labels: { size: t('itemsPage.form.size'), color: t('itemsPage.form.color'), design: t('itemsPage.form.design'), fit: t('itemsPage.form.fit') },
      options: {
        size: flattenOptions(clothingSizes),
        color: clothingColors,
        design: flattenOptions(clothingDesigns),
        fit: clothingFits,
        unit: clothingUnits
      }
    },
    ELECTRONICS: {
      labels: { size: 'Storage/Capacity', color: 'Color/Finish', design: 'Model Number', fit: 'Connectivity' },
      options: {
        size: variantSpecs?.ELECTRONICS || [],
        color: variantColors?.ELECTRONICS || [],
        design: variantModels?.ELECTRONICS || [],
        fit: variantFits?.ELECTRONICS || [],
        unit: shopUnits?.ELECTRONICS || ['PIECE', 'PACK']
      }
    },
    HARDWARE: {
      labels: { size: 'Dimensions', color: 'Material/Finish', design: 'Grade/Type', fit: 'Installation' },
      options: {
        size: variantSpecs?.HARDWARE || [],
        color: variantColors?.HARDWARE || [],
        design: variantModels?.HARDWARE || [],
        fit: variantFits?.HARDWARE || [],
        unit: shopUnits?.HARDWARE || ['PIECE', 'KG', 'METER']
      }
    }
  };

  const currentConfig = fieldConfig[shopCategory] || fieldConfig.CLOTHING;

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
    const value = newValue && typeof newValue === 'string' ? newValue : '';
    setCurrentVariant((prev) => ({ ...prev, [field]: value }));
  };

  const handleFreeSoloInput = (field) => (event, newInputValue) => {
    setCurrentVariant((prev) => ({ ...prev, [field]: newInputValue }));
  };

  const getVariantForm = () => (
    <Grid container spacing={2}>
      {/* Field 1: Size / Specs */}
      <Grid item xs={12} sm={6}>
        <Autocomplete
          freeSolo
          options={currentConfig.options.size}
          value={currentVariant.size || ''}
          onChange={handleFreeSoloChange('size')}
          onInputChange={handleFreeSoloInput('size')}
          renderInput={(params) => (
            <TextField {...params} label={currentConfig.labels.size} sx={inputSx} />
          )}
        />
      </Grid>

      {/* Field 2: Color / Finish */}
      <Grid item xs={12} sm={6}>
        <Autocomplete
          freeSolo
          options={currentConfig.options.color}
          value={currentVariant.color || ''}
          onChange={handleFreeSoloChange('color')}
          onInputChange={handleFreeSoloInput('color')}
          renderInput={(params) => (
            <TextField {...params} label={currentConfig.labels.color} sx={inputSx} />
          )}
        />
      </Grid>

      {/* Field 3: Design / Grade */}
      <Grid item xs={12} sm={6}>
        <Autocomplete
          freeSolo
          options={currentConfig.options.design}
          value={currentVariant.design || ''}
          onChange={handleFreeSoloChange('design')}
          onInputChange={handleFreeSoloInput('design')}
          renderInput={(params) => (
            <TextField {...params} label={currentConfig.labels.design} sx={inputSx} />
          )}
        />
      </Grid>

      {/* Field 4: Fit / Connectivity */}
      <Grid item xs={12} sm={6}>
        <Autocomplete
          freeSolo
          options={currentConfig.options.fit}
          value={currentVariant.fit || ''}
          onChange={handleFreeSoloChange('fit')}
          onInputChange={handleFreeSoloInput('fit')}
          renderInput={(params) => (
            <TextField {...params} label={currentConfig.labels.fit} sx={inputSx} />
          )}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <Autocomplete
          freeSolo
          options={currentConfig.options.unit}
          value={currentVariant.unit || ''}
          onChange={handleFreeSoloChange('unit')}
          onInputChange={handleFreeSoloInput('unit')}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('itemsPage.form.unit')}
              required
              sx={inputSx}
            />
          )}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label={t('itemsPage.form.pricePerUnit')}
          name="pricePerUnit"
          type="number"
          value={currentVariant.pricePerUnit || ''}
          onChange={handleCurrentVariantChange}
          required
          fullWidth
          sx={inputSx}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label={t('itemsPage.form.gstRate')}
          name="gstRate"
          type="number"
          value={currentVariant.gstRate || ''}
          onChange={handleCurrentVariantChange}
          fullWidth
          sx={inputSx}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label={t('itemsPage.form.lowStockThreshold')}
          name="lowStockThreshold"
          type="number"
          value={currentVariant.lowStockThreshold || ''}
          onChange={handleCurrentVariantChange}
          fullWidth
          sx={inputSx}
          InputProps={{ inputProps: { min: 0 } }}
        />
      </Grid>

      <Grid item xs={12}>
        <Button
          component="label"
          variant="outlined"
          startIcon={<CloudUploadIcon />}
          fullWidth
          sx={{ borderRadius: 2, py: 1.5, borderStyle: 'dashed', fontWeight: 700 }}
        >
          {t('itemsPage.form.uploadPhoto')}
          <VisuallyHiddenInput
            type="file"
            accept="image/*"
            onChange={handleCurrentVariantFileChange}
          />
        </Button>

        {(currentVariant.photoPreviewUrl || currentVariant.photoUrl) && (
          <Box
            sx={{
              mt: 2,
              p: 1,
              bgcolor: '#f1f5f9',
              borderRadius: 3,
              textAlign: 'center',
              border: '1px solid #e2e8f0',
            }}
          >
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
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            border: '2px solid',
            borderColor: isEditing ? 'success.light' : '#e2e8f0',
            bgcolor: isEditing ? alpha('#f0fdf4', 0.5) : 'white',
          }}
        >
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

        <Box sx={{ mt: 2, maxHeight: '550px', overflowY: 'auto', pr: 1 }}>
          {variantList.length > 0 ? (
            <Stack spacing={2}>
              {variantList.map((variant, index) => (
                <Card
                  key={variant.id || index}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: editingVariantIndex === index ? 'primary.main' : '#e2e8f0',
                    bgcolor: editingVariantIndex === index ? '#f0f9ff' : 'white',
                  }}
                >
                  <Grid container alignItems="center">
                    <Grid item xs>
                      <Typography variant="subtitle2" fontWeight={900}>
                        ₹{variant.pricePerUnit}{' '}
                        <small style={{ fontWeight: 400, color: '#64748b' }}>
                          / {variant.unit}
                        </small>
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {variant.size || '—'} • {variant.color || '—'} •{' '}
                        {variant.design || (shopCategory === 'CLOTHING' ? 'Standard' : 'N/A')}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title={t('itemsPage.actions.edit')}>
                          <IconButton
                            size="small"
                            sx={{ color: 'primary.main', bgcolor: alpha('#6366f1', 0.1) }}
                            onClick={() => handleEditVariantInList(index)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('itemsPage.actions.delete')}>
                          <IconButton
                            size="small"
                            sx={{ color: 'error.main', bgcolor: alpha('#ef4444', 0.1) }}
                            onClick={() => handleDeleteVariantInList(index)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Grid>
                  </Grid>
                </Card>
              ))}
            </Stack>
          ) : (
            <Box
              sx={{
                py: 6,
                textAlign: 'center',
                border: '2px dashed #e2e8f0',
                borderRadius: 4,
              }}
            >
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