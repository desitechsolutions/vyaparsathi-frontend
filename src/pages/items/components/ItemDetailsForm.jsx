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
  InputAdornment,
} from '@mui/material';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DiamondIcon from '@mui/icons-material/Diamond';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import BuildIcon from '@mui/icons-material/Build';

import { 
  variantMaterials, 
  variantUsage,
  DRUG_SCHEDULES,
  JEWELLERY_METAL_TYPES,
  JEWELLERY_METAL_PURITIES,
  JEWELLERY_STONE_TYPES,
  ELECTRONICS_WARRANTY_TERMS,
  AUTOMOBILE_VEHICLE_TYPES,
} from '../../../ui/constants';

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

        {/* ---- JEWELLERY-SPECIFIC FIELDS ---- */}
        {shopCategory === 'JEWELLERY' && (
          <>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip
                  icon={<DiamondIcon fontSize="small" />}
                  label="Jewellery Details (BIS / Hallmark)"
                  color="secondary"
                  variant="outlined"
                  size="small"
                />
              </Divider>
            </Grid>

            {/* Metal Type */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" sx={inputSx}>
                <InputLabel>Metal Type</InputLabel>
                <Select
                  name="metalType"
                  value={itemFormData.metalType || ''}
                  label="Metal Type"
                  onChange={handleChange}
                >
                  {JEWELLERY_METAL_TYPES.map((m) => (
                    <MenuItem key={m} value={m}>{m}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Metal Purity */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={JEWELLERY_METAL_PURITIES}
                value={itemFormData.metalPurity || ''}
                onInputChange={(_, v) => setItemFormData((prev) => ({ ...prev, metalPurity: v }))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Metal Purity / Karat"
                    variant="outlined"
                    sx={inputSx}
                    helperText="e.g., 22K, 18K, 925 Silver, 950 Platinum"
                  />
                )}
              />
            </Grid>

            {/* Stone Type */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={JEWELLERY_STONE_TYPES}
                value={itemFormData.stoneType || ''}
                onInputChange={(_, v) => setItemFormData((prev) => ({ ...prev, stoneType: v }))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Stone Type"
                    variant="outlined"
                    sx={inputSx}
                    helperText="Diamond, Ruby, Emerald, Pearl, No Stone..."
                  />
                )}
              />
            </Grid>

            {/* BIS Hallmark Certificate No. */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="BIS Hallmark Certificate No."
                name="hallmarkCertNo"
                value={itemFormData.hallmarkCertNo || ''}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                sx={inputSx}
                placeholder="e.g., BISL-12345"
                helperText="Required for hallmarked gold/silver under BIS Act"
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
                sx={inputSx}
                placeholder="e.g., 7113 (Gold Jewellery)"
                helperText="Required for GST filing"
              />
            </Grid>

            {/* Making Charges — Default rate (both ₹/gram and %) */}
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: '#fdf4ff', borderRadius: 2, border: '1px solid #e9d5ff' }}>
                <Typography variant="caption" fontWeight={800} color="secondary.dark" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Default Making Charges (item-level default — can be overridden per variant)
                </Typography>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Making Charges (₹ per gram)"
                      name="makingChargesPerGram"
                      type="number"
                      value={itemFormData.makingChargesPerGram || ''}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                      sx={inputSx}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        inputProps: { min: 0, step: 0.01 }
                      }}
                      helperText="Flat making charge per gram of metal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Making Charges (% of metal value)"
                      name="makingChargesRate"
                      type="number"
                      value={itemFormData.makingChargesRate || ''}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                      sx={inputSx}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        inputProps: { min: 0, max: 100, step: 0.1 }
                      }}
                      helperText="% of (weight × today's gold rate) at billing"
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            {/* High-Value Transaction Notice */}
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: '#f0f9ff', borderRadius: 2, border: '1px solid #bae6fd' }}>
                <Typography variant="caption" fontWeight={700} color="primary.dark">
                  ℹ️ Indian Tax Compliance: For cash transactions above ₹2,00,000, PAN of the buyer is mandatory (IT Act Sec. 269ST). VyaparSathi will prompt for PAN at the time of billing.
                </Typography>
              </Box>
            </Grid>
          </>
        )}

        {/* ---- ELECTRONICS-SPECIFIC FIELDS ---- */}
        {shopCategory === 'ELECTRONICS' && (
          <>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip
                  icon={<ElectricalServicesIcon fontSize="small" />}
                  label="Electronics Details"
                  color="info"
                  variant="outlined"
                  size="small"
                />
              </Divider>
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
                sx={inputSx}
                placeholder="e.g., 8517 (Smartphones), 8471 (Laptops)"
                helperText="Required for GST filing"
              />
            </Grid>

            {/* Warranty Period */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" sx={inputSx}>
                <InputLabel>Warranty Period</InputLabel>
                <Select
                  name="warrantyPeriod"
                  value={itemFormData.warrantyPeriod || ''}
                  label="Warranty Period"
                  onChange={handleChange}
                >
                  <MenuItem value=""><em>Not Specified</em></MenuItem>
                  {ELECTRONICS_WARRANTY_TERMS.map((w) => (
                    <MenuItem key={w.value} value={w.value}>{w.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Warranty Terms / Service Center */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Warranty Terms / Service Center"
                name="warrantyTerms"
                value={itemFormData.warrantyTerms || ''}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                sx={inputSx}
                placeholder="e.g., Samsung Authorized Service"
                helperText="Printed on sale receipt"
              />
            </Grid>

            {/* Technical Specifications */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Technical Specifications"
                name="technicalSpecs"
                value={itemFormData.technicalSpecs || ''}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                sx={inputSx}
                placeholder="e.g., 6GB RAM, 128GB, 6.7 inch, Android 14"
                helperText="Key specs for product catalog"
              />
            </Grid>

            {/* Is Branded */}
            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!itemFormData.isBranded}
                    onChange={(e) => setItemFormData((prev) => ({ ...prev, isBranded: e.target.checked }))}
                    color="info"
                  />
                }
                label="Branded / Genuine Product"
              />
            </Grid>
          </>
        )}

        {/* ---- AUTOMOBILE-SPECIFIC FIELDS ---- */}
        {shopCategory === 'AUTOMOBILE' && (
          <>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip
                  icon={<DirectionsCarIcon fontSize="small" />}
                  label="Automobile Part Details"
                  color="warning"
                  variant="outlined"
                  size="small"
                />
              </Divider>
            </Grid>

            {/* Part Number */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="OEM Part Number"
                name="partNumber"
                value={itemFormData.partNumber || ''}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                sx={inputSx}
                placeholder="e.g., 04465-0K080"
                helperText="Original Equipment Manufacturer part code"
              />
            </Grid>

            {/* Part Type: OEM / Aftermarket / Genuine */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" sx={inputSx}>
                <InputLabel>Part Type</InputLabel>
                <Select
                  name="partType"
                  value={itemFormData.partType || ''}
                  label="Part Type"
                  onChange={handleChange}
                >
                  <MenuItem value=""><em>Not Specified</em></MenuItem>
                  <MenuItem value="GENUINE">Genuine (OEM)</MenuItem>
                  <MenuItem value="AFTERMARKET">Aftermarket</MenuItem>
                  <MenuItem value="RECONDITIONED">Reconditioned / Remanufactured</MenuItem>
                  <MenuItem value="PERFORMANCE">Performance Upgrade</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Vehicle Compatibility */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                multiple
                options={AUTOMOBILE_VEHICLE_TYPES}
                value={itemFormData.vehicleCompatibility ? itemFormData.vehicleCompatibility.split(',').map(s => s.trim()).filter(Boolean) : []}
                onChange={(_, newValue) =>
                  setItemFormData((prev) => ({ ...prev, vehicleCompatibility: newValue.join(', ') }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Vehicle Compatibility"
                    variant="outlined"
                    sx={inputSx}
                    helperText="Select all compatible vehicle types"
                  />
                )}
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
                sx={inputSx}
                placeholder="e.g., 8708 (Auto Parts)"
                helperText="Required for GST filing"
              />
            </Grid>

            {/* IS Certified */}
            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!itemFormData.isCertified}
                    onChange={(e) => setItemFormData((prev) => ({ ...prev, isCertified: e.target.checked }))}
                    color="warning"
                  />
                }
                label="IS / BIS Certified"
              />
            </Grid>
          </>
        )}

        {/* ---- CLOTHING-SPECIFIC FIELDS ---- */}
        {shopCategory === 'CLOTHING' && (
          <>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip
                  icon={<CheckroomIcon fontSize="small" />}
                  label="Clothing Details"
                  color="success"
                  variant="outlined"
                  size="small"
                />
              </Divider>
            </Grid>

            {/* Care Instructions */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Care Instructions"
                name="careInstructions"
                value={itemFormData.careInstructions || ''}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                sx={inputSx}
                placeholder="e.g., Hand Wash / Dry Clean Only"
                helperText="Printed on garment label"
              />
            </Grid>

            {/* Country of Origin */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Country of Origin"
                name="countryOfOrigin"
                value={itemFormData.countryOfOrigin || ''}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                sx={inputSx}
                placeholder="e.g., India, China, Bangladesh"
                helperText="Required under Legal Metrology Act"
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
                sx={inputSx}
                placeholder="e.g., 6105 (Cotton T-Shirts)"
                helperText="Required for GST filing"
              />
            </Grid>
          </>
        )}

        {/* ---- HARDWARE-SPECIFIC FIELDS ---- */}
        {shopCategory === 'HARDWARE' && (
          <>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip
                  icon={<BuildIcon fontSize="small" />}
                  label="Hardware / Building Material Details"
                  color="error"
                  variant="outlined"
                  size="small"
                />
              </Divider>
            </Grid>

            {/* IS Code */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="IS / BIS Standard Code"
                name="isCode"
                value={itemFormData.isCode || ''}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                sx={inputSx}
                placeholder="e.g., IS 1367 (Fasteners), IS 458 (Pipes)"
                helperText="Bureau of Indian Standards certification"
              />
            </Grid>

            {/* Safety Class */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" sx={inputSx}>
                <InputLabel>Safety / IP Class</InputLabel>
                <Select
                  name="safetyClass"
                  value={itemFormData.safetyClass || ''}
                  label="Safety / IP Class"
                  onChange={handleChange}
                >
                  <MenuItem value=""><em>Not Specified</em></MenuItem>
                  <MenuItem value="IP20">IP20 — Indoor, no moisture</MenuItem>
                  <MenuItem value="IP44">IP44 — Splash-proof</MenuItem>
                  <MenuItem value="IP65">IP65 — Dust-tight, water jet-proof</MenuItem>
                  <MenuItem value="IP67">IP67 — Dust-tight, water-immersion</MenuItem>
                  <MenuItem value="CLASS1">Class I — Earthed</MenuItem>
                  <MenuItem value="CLASS2">Class II — Double insulated</MenuItem>
                </Select>
              </FormControl>
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
                sx={inputSx}
                placeholder="e.g., 7318 (Screws/Bolts), 8544 (Wires)"
                helperText="Required for GST filing"
              />
            </Grid>

            {/* BIS Certified Toggle */}
            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!itemFormData.isCertified}
                    onChange={(e) => setItemFormData((prev) => ({ ...prev, isCertified: e.target.checked }))}
                    color="error"
                  />
                }
                label="BIS / ISI Certified"
              />
            </Grid>
          </>
        )}

        {/* ---- STATIONERY-SPECIFIC FIELDS ---- */}
        {shopCategory === 'STATIONERY' && (
          <>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip
                  label="Stationery / Education Details"
                  color="secondary"
                  variant="outlined"
                  size="small"
                />
              </Divider>
            </Grid>

            {/* Subject / Grade Level */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Subject / Grade Level"
                name="subjectGrade"
                value={itemFormData.subjectGrade || ''}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                sx={inputSx}
                placeholder="e.g., Class 10 Mathematics, General Purpose"
                helperText="For school / textbook items"
              />
            </Grid>

            {/* Board Affiliation */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" sx={inputSx}>
                <InputLabel>Board Affiliation</InputLabel>
                <Select
                  name="boardAffiliation"
                  value={itemFormData.boardAffiliation || ''}
                  label="Board Affiliation"
                  onChange={handleChange}
                >
                  <MenuItem value=""><em>General / Not Applicable</em></MenuItem>
                  <MenuItem value="CBSE">CBSE</MenuItem>
                  <MenuItem value="ICSE">ICSE / ISC</MenuItem>
                  <MenuItem value="SSC">SSC (State Board)</MenuItem>
                  <MenuItem value="HSC">HSC (State Board)</MenuItem>
                  <MenuItem value="OTHERS">Other Board</MenuItem>
                </Select>
              </FormControl>
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
                sx={inputSx}
                placeholder="e.g., 4820 (Notebooks), 9608 (Pens)"
                helperText="Required for GST filing"
              />
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
}
