import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Grid,
  TextField,
  Autocomplete,
  Typography,
  Box,
  ListSubheader,
  MenuItem,
  Divider,
  Chip,
  FormControlLabel,
  Switch,
} from '@mui/material';

import { 
  variantMaterials, 
  variantUsage,
  DRUG_SCHEDULES,
} from '../../../ui/constants';

export default function ItemDetailsForm({
  shopCategory = 'CLOTHING', 
  itemFormData,
  setItemFormData,
  apiCategories,
}) {
  const { t } = useTranslation();

  const isPharmacy = shopCategory === 'PHARMACY';

  // --- DYNAMIC INDUSTRY CONFIG ---
  const industryLabels = {
    CLOTHING:    { attr1: t('itemsPage.form.fabric'), attr2: t('itemsPage.form.season') },
    ELECTRONICS: { attr1: 'Build Material', attr2: 'Warranty Period' },
    HARDWARE:    { attr1: 'Primary Material', attr2: 'Usage Environment' },
    PHARMACY:    { attr1: t('itemsPage.form.dosageForm'), attr2: t('itemsPage.form.storageReq') },
    GROCERY:     { attr1: 'Packaging Type', attr2: 'Dietary Info' },
    AUTOMOBILE:  { attr1: 'Material Type', attr2: 'Vehicle Compatibility' },
    STATIONERY:  { attr1: 'Material', attr2: 'Intended Use' },
    FOOTWEAR:    { attr1: 'Upper Material', attr2: 'Season' },
    FURNITURE:   { attr1: 'Frame Material', attr2: 'Room Type' },
    JEWELLERY:   { attr1: 'Metal Purity', attr2: 'Occasion' },
  };

  const labels = industryLabels[shopCategory] || { attr1: 'Material/Type', attr2: 'Usage/Category' };

  const options1 = variantMaterials[shopCategory] || [];
  const options2 = variantUsage[shopCategory] || [];

  const sortedCategories = React.useMemo(() => {
    return [...(apiCategories || [])].sort((a, b) => {
      const groupA = a.parentName || 'ROOT';
      const groupB = b.parentName || 'ROOT';
      return groupA.localeCompare(groupB);
    });
  }, [apiCategories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setItemFormData((prev) => ({ ...prev, [name]: value }));
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      bgcolor: '#f8fafc',
      '& fieldset': { borderColor: '#e2e8f0' },
      '&:hover fieldset': { borderColor: '#cbd5e1' },
      '&.Mui-focused fieldset': { borderColor: 'primary.main' },
    },
    '& .MuiInputLabel-root': { fontWeight: 500 },
  };

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" fontWeight={700} mb={2} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
        {t('itemsPage.sections.basicInfo')} - <span style={{ color: '#6366f1' }}>{shopCategory}</span>
      </Typography>
      
      <Grid container spacing={2.5}>
        {/* Product Name */}
        <Grid item xs={12} sm={6}>
          <TextField
            label={t('itemsPage.form.name')}
            name="name"
            value={itemFormData.name || ''}
            onChange={handleChange}
            required
            fullWidth
            variant="outlined"
            sx={inputSx}
          />
        </Grid>

        {/* Category Selection with Grouping */}
        <Grid item xs={12} sm={6}>
          <Autocomplete
            options={sortedCategories}
            groupBy={(option) => option.parentName || 'MAIN INDUSTRIES'}
            getOptionLabel={(option) => option.name || ''}
            isOptionEqualToValue={(option, value) => option.id === value?.id}
            value={apiCategories.find((cat) => cat.id === itemFormData.categoryId) || null}
            onChange={(_, newValue) =>
              setItemFormData((prev) => ({
                ...prev,
                categoryId: newValue ? newValue.id : '',
              }))
            }
            renderGroup={(params) => (
              <li key={params.key}>
                <ListSubheader sx={{ bgcolor: '#f1f5f9', fontWeight: 800, color: 'primary.main', lineHeight: '32px' }}>
                  {params.group}
                </ListSubheader>
                <Box sx={{ pl: 1 }}>{params.children}</Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('itemsPage.form.category')}
                required
                variant="outlined"
                sx={inputSx}
              />
            )}
          />
        </Grid>

        {/* Brand Name */}
        <Grid item xs={12} sm={6}>
          <TextField
            label={t('itemsPage.form.brandName')}
            name="brandName"
            value={itemFormData.brandName || ''}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            sx={inputSx}
          />
        </Grid>

        {/* Attribute 1 (Fabric/Material/Dosage Form) */}
        <Grid item xs={12} sm={6}>
          <Autocomplete
            freeSolo
            options={options1}
            value={itemFormData.attribute1 || ''}
            onInputChange={(_, newValue) => 
              setItemFormData((prev) => ({ ...prev, attribute1: newValue }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={labels.attr1}
                variant="outlined"
                sx={inputSx}
              />
            )}
          />
        </Grid>

        {/* Attribute 2 (Season/Warranty/Storage Req.) */}
        <Grid item xs={12} sm={6}>
          <Autocomplete
            freeSolo
            options={options2}
            value={itemFormData.attribute2 || ''}
            onInputChange={(_, newValue) => 
              setItemFormData((prev) => ({ ...prev, attribute2: newValue }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={labels.attr2}
                variant="outlined"
                sx={inputSx}
              />
            )}
          />
        </Grid>

        {/* Pharmacy-specific item fields */}
        {isPharmacy && (
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

            {/* Drug Schedule */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label={t('itemsPage.form.drugSchedule')}
                name="drugSchedule"
                value={itemFormData.drugSchedule || ''}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                sx={inputSx}
              >
                <MenuItem value="">
                  <em>{t('itemsPage.form.drugScheduleNone')}</em>
                </MenuItem>
                {DRUG_SCHEDULES.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Requires Prescription */}
            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!itemFormData.requiresPrescription}
                    onChange={(e) =>
                      setItemFormData((prev) => ({ ...prev, requiresPrescription: e.target.checked }))
                    }
                    color="primary"
                  />
                }
                label={t('itemsPage.form.requiresPrescription')}
              />
            </Grid>
          </>
        )}

        {/* Description */}
        <Grid item xs={12}>
          <TextField
            label={t('itemsPage.form.description')}
            name="description"
            value={itemFormData.description || ''}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            placeholder="Enter product details, specifications, etc..."
            sx={inputSx}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
