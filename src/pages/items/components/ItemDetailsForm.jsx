import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Grid,
  TextField,
  Autocomplete,
  Typography,
  Box,
  ListSubheader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Divider,
} from '@mui/material';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { 
  variantMaterials, 
  variantUsage,
  DRUG_SCHEDULES,
} from '../../../ui/constants';

const DRUG_SCHEDULES = [
  { value: 'OTC', label: 'OTC (Over the Counter)' },
  { value: 'NON_SCHEDULED', label: 'Non-Scheduled' },
  { value: 'SCHEDULE_H', label: 'Schedule H (Prescription Required)' },
  { value: 'SCHEDULE_H1', label: 'Schedule H1 (Stricter Control)' },
  { value: 'SCHEDULE_X', label: 'Schedule X (Narcotic/Psychotropic)' },
];

const STORAGE_REQUIREMENTS = [
  'Room Temperature',
  'Cool Place (8–25°C)',
  'Refrigerated (2–8°C)',
  'Frozen (Below 0°C)',
  'Keep Away from Light',
  'Keep Away from Moisture',
];

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

        {/* ---- PHARMACY-SPECIFIC FIELDS ---- */}
        {shopCategory === 'PHARMACY' && (
          <>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip
                  icon={<MedicalServicesIcon fontSize="small" />}
                  label="Pharmacy Details"
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Divider>
            </Grid>

            {/* Composition / Salt */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Composition / Salt (e.g., Paracetamol 500mg)"
                name="composition"
                value={itemFormData.composition || ''}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                placeholder="Generic name & strength for substitute search"
                sx={inputSx}
                helperText="Used for substitute drug suggestions"
              />
            </Grid>

            {/* HSN Code */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="HSN Code"
                name="hsnCode"
                value={itemFormData.hsnCode || ''}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                placeholder="e.g., 3004"
                sx={inputSx}
                helperText="Required for GST filing"
              />
            </Grid>

            {/* Drug Schedule */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" sx={inputSx}>
                <InputLabel>Drug Schedule</InputLabel>
                <Select
                  name="drugSchedule"
                  value={itemFormData.drugSchedule || 'OTC'}
                  label="Drug Schedule"
                  onChange={handleChange}
                >
                  {DRUG_SCHEDULES.map((ds) => (
                    <MenuItem key={ds.value} value={ds.value}>
                      {ds.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Storage Requirement */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={STORAGE_REQUIREMENTS}
                value={itemFormData.storageRequirement || ''}
                onInputChange={(_, newValue) =>
                  setItemFormData((prev) => ({ ...prev, storageRequirement: newValue }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Storage Requirement"
                    variant="outlined"
                    sx={inputSx}
                    helperText="e.g., Refrigerated, Schedule H label"
                  />
                )}
              />
            </Grid>

            {/* Requires Prescription Toggle */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderRadius: 2, border: '1px solid', borderColor: itemFormData.requiresPrescription ? 'warning.main' : '#e2e8f0', bgcolor: itemFormData.requiresPrescription ? '#fff7ed' : '#f8fafc' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!itemFormData.requiresPrescription}
                      onChange={(e) => setItemFormData((prev) => ({ ...prev, requiresPrescription: e.target.checked }))}
                      color="warning"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <WarningAmberIcon fontSize="small" sx={{ color: itemFormData.requiresPrescription ? 'warning.main' : 'text.disabled' }} />
                      <Typography variant="body2" fontWeight={600}>Requires Prescription</Typography>
                    </Box>
                  }
                />
              </Box>
            </Grid>

            {/* Schedule Drug Warning Banner */}
            {(itemFormData.drugSchedule === 'SCHEDULE_H' || itemFormData.drugSchedule === 'SCHEDULE_H1' || itemFormData.drugSchedule === 'SCHEDULE_X') && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: '#fef3c7', borderRadius: 2, border: '1px solid #fcd34d', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningAmberIcon sx={{ color: '#d97706' }} />
                  <Typography variant="body2" fontWeight={700} color="#92400e">
                    {itemFormData.drugSchedule === 'SCHEDULE_X'
                      ? 'Schedule X Drug: Strict narcotics control. All sales will be logged in the Narcotics Register.'
                      : 'Schedule H Drug: Prescription mandatory. Customer will be warned at point of sale.'}
                  </Typography>
                </Box>
              </Grid>
            )}
          </>
        )}
      </Grid>
    </Box>
  );
}
