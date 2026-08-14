import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Grid,
  TextField,
  Autocomplete,
  Typography,
  Box,
  ListSubheader,
  Button,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import { useShop } from '../../../context/ShopContext';
import IndustrySlot from './IndustrySlot';
import CategoryQuickCreate from './CategoryQuickCreate';
import { variantMaterials, variantUsage } from '../../../ui/constants';

const DEFAULT_ATTRIBUTE_LABELS = {
  attribute1: 'Material / Type',
  attribute2: 'Usage / Category',
};

export default function ItemDetailsForm({
  itemFormData,
  setItemFormData,
  apiCategories,
  shopCategory,
  refreshCategories,
}) {
  const { t } = useTranslation();
  const { industryConfig, industryType } = useShop();
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [pendingCategoryName, setPendingCategoryName] = useState('');

  const activeIndustry = shopCategory || industryType || 'GENERAL';
  const labels = { ...DEFAULT_ATTRIBUTE_LABELS, ...(industryConfig?.labels || {}) };
  const itemFields = industryConfig?.item || [];

  const options1 = variantMaterials[activeIndustry] || [];
  const options2 = variantUsage[activeIndustry] || [];

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

  const handleSlotChange = (key, value) => {
    setItemFormData((prev) => ({ ...prev, [key]: value }));
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      bgcolor: 'background.paper',
      '& fieldset': { borderColor: 'divider' },
      '&:hover fieldset': { borderColor: 'divider' },
      '&.Mui-focused fieldset': { borderColor: 'primary.main' },
    },
    '& .MuiInputLabel-root': { fontWeight: 500 },
  };

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" fontWeight={700} mb={2} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
        {t('itemsPage.sections.basicInfo')} — <span style={{ color: '#6366f1' }}>{activeIndustry}</span>
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}>
          <TextField
            label={t('itemsPage.form.name')}
            name="name"
            value={itemFormData.name || ''}
            onChange={handleChange}
            required fullWidth variant="outlined" sx={inputSx}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Autocomplete
            options={sortedCategories}
            groupBy={(option) => option.parentName || 'MAIN INDUSTRIES'}
            getOptionLabel={(option) => option.name || ''}
            isOptionEqualToValue={(option, value) => option.id === value?.id}
            value={apiCategories.find((cat) => cat.id === itemFormData.categoryId) || null}
            onChange={(_, newValue) =>
              setItemFormData((prev) => ({ ...prev, categoryId: newValue ? newValue.id : '' }))
            }
            renderGroup={(params) => (
              <li key={params.key}>
                <ListSubheader sx={{ bgcolor: 'action.hover', fontWeight: 800, color: 'primary.main', lineHeight: '32px' }}>
                  {params.group}
                </ListSubheader>
                <Box sx={{ pl: 1 }}>{params.children}</Box>
              </li>
            )}
            noOptionsText={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" color="text.secondary">No matching category.</Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon fontSize="small" />}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setPendingCategoryName('');
                    setCatDialogOpen(true);
                  }}
                >
                  Create
                </Button>
              </Stack>
            }
            renderInput={(params) => (
              <TextField {...params} label={t('itemsPage.form.category')} required variant="outlined" sx={inputSx} />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label={t('itemsPage.form.brandName')}
            name="brandName"
            value={itemFormData.brandName || ''}
            onChange={handleChange}
            fullWidth variant="outlined" sx={inputSx}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Autocomplete
            freeSolo
            options={options1}
            value={itemFormData.attribute1 || ''}
            onInputChange={(_, newValue) =>
              setItemFormData((prev) => ({ ...prev, attribute1: newValue }))
            }
            renderInput={(params) => (
              <TextField {...params} label={labels.attribute1} variant="outlined" sx={inputSx} />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Autocomplete
            freeSolo
            options={options2}
            value={itemFormData.attribute2 || ''}
            onInputChange={(_, newValue) =>
              setItemFormData((prev) => ({ ...prev, attribute2: newValue }))
            }
            renderInput={(params) => (
              <TextField {...params} label={labels.attribute2} variant="outlined" sx={inputSx} />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            label={t('itemsPage.form.description')}
            name="description"
            value={itemFormData.description || ''}
            onChange={handleChange}
            fullWidth
            multiline
            minRows={2}
            variant="outlined"
            sx={inputSx}
          />
        </Grid>

        {/* Industry-specific item-level fields from server config */}
        <IndustrySlot fields={itemFields} values={itemFormData} onChange={handleSlotChange} />
      </Grid>

      <CategoryQuickCreate
        open={catDialogOpen}
        onClose={() => setCatDialogOpen(false)}
        categories={apiCategories}
        initialName={pendingCategoryName}
        onChanged={refreshCategories}
        onCreated={(cat) => setItemFormData((prev) => ({ ...prev, categoryId: cat.id }))}
      />
    </Box>
  );
}
