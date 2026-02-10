import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Grid,
  TextField,
  Autocomplete,
  Typography,
  Box,
  ListSubheader,
} from '@mui/material';

import { 
  clothingFabrics, 
  clothingSeasons,
  variantMaterials, 
  variantUsage 
} from '../../../ui/constants';

export default function ItemDetailsForm({
  shopCategory = 'CLOTHING', 
  itemFormData,
  setItemFormData,
  apiCategories,
}) {
  const { t } = useTranslation();

  // --- DYNAMIC INDUSTRY CONFIG ---
  const industryConfig = {
    CLOTHING: {
      label1: t('itemsPage.form.fabric'),
      label2: t('itemsPage.form.season'),
      options1: clothingFabrics || [],
      options2: clothingSeasons || [],
    },
    ELECTRONICS: {
      label1: 'Build Material',
      label2: 'Warranty Period',
      options1: variantMaterials?.ELECTRONICS || ['Plastic', 'Aluminum', 'Glass'],
      options2: variantUsage?.ELECTRONICS || ['1 Year', '2 Years', 'Limited Life-time'],
    },
    HARDWARE: {
      label1: 'Material',
      label2: 'Usage Environment',
      options1: variantMaterials?.HARDWARE || ['Steel', 'Wood', 'Brass', 'PVC'],
      options2: variantUsage?.HARDWARE || ['Indoor', 'Outdoor', 'Industrial', 'Marine'],
    }
  };

  const currentConfig = industryConfig[shopCategory] || industryConfig.CLOTHING;

  // --- GROUPING & SORTING CATEGORIES ---
  const sortedCategories = React.useMemo(() => {
    return [...(apiCategories || [])].sort((a, b) => {
      // Sort primarily by parent name to keep groups together
      const groupA = a.parentName || a.name;
      const groupB = b.parentName || b.name;
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
        {t('itemsPage.sections.basicInfo')}
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
            // This makes the group headers look much cleaner
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

        {/* Attribute 1 */}
        <Grid item xs={12} sm={6}>
          <Autocomplete
            freeSolo
            options={currentConfig.options1}
            value={itemFormData.attribute1 || itemFormData.fabric || ''}
            onInputChange={(_, newValue) => 
              setItemFormData((prev) => ({ ...prev, attribute1: newValue }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={currentConfig.label1}
                variant="outlined"
                sx={inputSx}
              />
            )}
          />
        </Grid>

        {/* Attribute 2 */}
        <Grid item xs={12} sm={6}>
          <Autocomplete
            freeSolo
            options={currentConfig.options2}
            value={itemFormData.attribute2 || itemFormData.season || ''}
            onInputChange={(_, newValue) => 
              setItemFormData((prev) => ({ ...prev, attribute2: newValue }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={currentConfig.label2}
                variant="outlined"
                sx={inputSx}
              />
            )}
          />
        </Grid>

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