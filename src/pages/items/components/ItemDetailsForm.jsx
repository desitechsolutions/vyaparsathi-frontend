import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Grid,
  TextField,
  Autocomplete,
  Typography,
  Box,
} from '@mui/material';

import { clothingFabrics, clothingSeasons } from '../../../ui/constants';

export default function ItemDetailsForm({
  itemFormData,
  setItemFormData,
  apiCategories,
}) {
  const { t } = useTranslation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setItemFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Styled Input Props to maintain consistency across the app
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

        {/* Category Selection */}
        <Grid item xs={12} sm={6}>
          <Autocomplete
            options={apiCategories || []}
            getOptionLabel={(option) => option.name || ''}
            isOptionEqualToValue={(option, value) => option.id === value?.id}
            value={apiCategories.find((cat) => cat.id === itemFormData.categoryId) || null}
            onChange={(_, newValue) =>
              setItemFormData((prev) => ({
                ...prev,
                categoryId: newValue ? newValue.id : '',
              }))
            }
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

        {/* Fabric (FreeSolo) */}
        <Grid item xs={12} sm={6}>
          <Autocomplete
            freeSolo
            options={clothingFabrics || []}
            value={itemFormData.fabric || ''}
            onInputChange={(_, newValue) => 
              setItemFormData((prev) => ({ ...prev, fabric: newValue }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('itemsPage.form.fabric')}
                variant="outlined"
                sx={inputSx}
              />
            )}
          />
        </Grid>

        {/* Season (FreeSolo) */}
        <Grid item xs={12} sm={6}>
          <Autocomplete
            freeSolo
            options={clothingSeasons || []}
            value={itemFormData.season || ''}
            onInputChange={(_, newValue) => 
              setItemFormData((prev) => ({ ...prev, season: newValue }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('itemsPage.form.season')}
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
            placeholder="Enter product details, care instructions, etc..."
            sx={inputSx}
          />
        </Grid>
      </Grid>
    </Box>
  );
}