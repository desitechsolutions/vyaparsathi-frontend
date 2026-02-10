import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Chip,
  Stack,
  Avatar
} from '@mui/material';
import {
  Inventory2,
  CheckCircleOutline
} from '@mui/icons-material';

export default function ReviewStepContent({
  itemFormData,
  variantList,
  apiCategories,
}) {
  const { t } = useTranslation();

  // 1. Find the specific category selected
  const selectedCategory = apiCategories.find((c) => c.id === itemFormData.categoryId);
  const categoryName = selectedCategory?.name || 'N/A';

  // 2. Logic to determine the Top-Level Industry
  const getDetectedIndustry = () => {
    if (!selectedCategory) return 'CLOTHING';

    // Check if the category itself OR its parent is one of the major industries
    const target = (selectedCategory.parentName || selectedCategory.name || '').toUpperCase();

    if (target.includes('ELECTRONICS')) return 'ELECTRONICS';
    if (target.includes('HARDWARE')) return 'HARDWARE';
    
    // Default to clothing for MEN, WOMEN, KIDS, etc.
    return 'CLOTHING';
  };

  const detectedIndustry = getDetectedIndustry();

  // --- Industry-Specific Labels Configuration ---
  const industryLabels = {
    CLOTHING: {
      attr1: t('itemsPage.form.fabric'),
      attr2: t('itemsPage.form.season'),
      fitLabel: t('itemsPage.variant.fit', 'Fit'),
      colorLabel: t('itemsPage.variant.color', 'Color'),
      sizeLabel: t('itemsPage.variant.size', 'Size'),
    },
    ELECTRONICS: {
      attr1: 'Build Material',
      attr2: 'Warranty',
      fitLabel: 'Connectivity',
      colorLabel: 'Finish',
      sizeLabel: 'Storage/Cap',
    },
    HARDWARE: {
      attr1: 'Material',
      attr2: 'Usage Env',
      fitLabel: 'Mounting',
      colorLabel: 'Finish/Coating',
      sizeLabel: 'Specs/Weight',
    }
  };

  const labels = industryLabels[detectedIndustry];

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <CheckCircleOutline color="success" />
        <Typography variant="h6" fontWeight={800}>
          {t('itemsPage.stepper.reviewTitle') || 'Review Product Summary'}
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper 
            elevation={0} 
            sx={{ p: 3, borderRadius: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', height: '100%' }}
          >
            <Typography variant="overline" color="text.secondary" fontWeight={800} sx={{ letterSpacing: 1.2 }}>
              {t('itemsPage.stepper.itemDetails')}
            </Typography>
            
            <Stack spacing={2} mt={2}>
              <DetailRow label={t('itemsPage.form.name')} value={itemFormData.name} bold />
              <DetailRow 
                label={t('itemsPage.form.category')} 
                value={selectedCategory?.parentName ? `${selectedCategory.parentName} > ${categoryName}` : categoryName} 
              />
              <DetailRow label={t('itemsPage.form.brandName')} value={itemFormData.brandName} />
              <Divider />
              <DetailRow label={labels.attr1} value={itemFormData.attribute1 || itemFormData.fabric} />
              <DetailRow label={labels.attr2} value={itemFormData.attribute2 || itemFormData.season} />
            </Stack>

            {itemFormData.description && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #f1f5f9' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>{t('itemsPage.description')}</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, color: '#475569' }}>{itemFormData.description}</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="overline" color="text.secondary" fontWeight={800}>
              {t('itemsPage.variant.variantsCount', { count: variantList.length })}
            </Typography>
            <Chip label={detectedIndustry} size="small" variant="outlined" sx={{ fontWeight: 800, fontSize: '0.6rem' }} />
          </Box>

          <Stack spacing={2} sx={{ maxHeight: '450px', overflowY: 'auto', pr: 1 }}>
            {variantList.map((variant, index) => (
              <Paper 
                key={variant.id || index} 
                elevation={0} 
                sx={{ 
                  p: 2, borderRadius: 3, border: '1px solid #e2e8f0',
                  '&:hover': { borderColor: 'primary.main', bgcolor: '#f0f9ff' },
                  transition: 'all 0.2s'
                }}
              >
                <Grid container alignItems="center" spacing={2}>
                  <Grid item>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontWeight: 800 }}>
                      {index + 1}
                    </Avatar>
                  </Grid>
                  <Grid item xs>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle1" fontWeight={900}>₹{variant.pricePerUnit}</Typography>
                      <Typography variant="caption" color="text.secondary">{t('itemsPage.variant.perUnit', { unit: variant.unit })}</Typography>
                      <Chip label={t('itemsPage.variant.gstLabel', { rate: variant.gstRate })} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#e0f2fe', color: '#0369a1' }} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      <strong>{variant.color}</strong> ({labels.colorLabel}) • <strong>{variant.size}</strong> ({labels.sizeLabel}) • {variant.fit || t('itemsPage.variant.standardFit')}
                    </Typography>
                  </Grid>
                  <Grid item sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#64748b' }}>
                      {t('itemsPage.variant.sku')}: {variant.sku || t('itemsPage.notAvailable')}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

const DetailRow = ({ label, value, bold = false }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: '100px' }}>{label}:</Typography>
    <Typography variant="body2" fontWeight={bold ? 900 : 600} sx={{ textAlign: 'right', color: bold ? 'primary.main' : 'inherit' }}>
      {value || 'N/A'}
    </Typography>
  </Box>
);