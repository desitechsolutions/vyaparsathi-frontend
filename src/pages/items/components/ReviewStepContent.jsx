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
  CheckCircleOutline
} from '@mui/icons-material';

export default function ReviewStepContent({
  itemFormData,
  variantList,
  apiCategories,
  shopCategory = 'CLOTHING', // Receiving from parent
}) {
  const { t } = useTranslation();

  const selectedCategory = apiCategories.find((c) => c.id === itemFormData.categoryId);
  const categoryName = selectedCategory?.name || 'N/A';

  // --- Dynamic Industry Label Configuration ---
  const industryConfig = {
    CLOTHING: {
      attr1: t('itemsPage.form.fabric'),
      attr2: t('itemsPage.form.season'),
      size: t('itemsPage.variant.size', 'Size'),
      color: t('itemsPage.variant.color', 'Color'),
      fit: t('itemsPage.variant.fit', 'Fit')
    },
    ELECTRONICS: {
      attr1: 'Build Material',
      attr2: 'Warranty',
      size: 'Storage/Cap',
      color: 'Finish',
      fit: 'Connectivity'
    },
    HARDWARE: {
      attr1: 'Material',
      attr2: 'Usage Env',
      size: 'Specs/Dimensions',
      color: 'Coating',
      fit: 'Mounting'
    },
    GROCERY: {
      attr1: 'Packaging',
      attr2: 'Dietary',
      size: 'Weight/Vol',
      color: 'Origin',
      fit: 'Life'
    },
    AUTOMOBILE: {
      attr1: 'Material',
      attr2: 'Compatibility',
      size: 'Specs',
      color: 'Finish',
      fit: 'Position'
    },
    STATIONERY: {
      attr1: 'Material',
      attr2: 'Usage',
      size: 'Dimensions',
      color: 'Ink/Color',
      fit: 'Binding'
    },
    FOOTWEAR: {
      attr1: 'Upper Mat.',
      attr2: 'Season',
      size: 'Size (UK)',
      color: 'Color',
      fit: 'Width'
    },
    FURNITURE: {
      attr1: 'Frame',
      attr2: 'Room',
      size: 'Dimensions',
      color: 'Finish',
      fit: 'Assembly'
    },
    JEWELLERY: {
      attr1: 'Purity',
      attr2: 'Occasion',
      size: 'Length/Size',
      color: 'Tone',
      fit: 'Clasp'
    }
  };

  const labels = industryConfig[shopCategory] || industryConfig.CLOTHING;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <CheckCircleOutline color="success" />
        <Typography variant="h6" fontWeight={800}>
          {t('itemsPage.stepper.reviewTitle') || 'Review Product Summary'}
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        {/* Left Side: Basic Product Details */}
        <Grid item xs={12} md={5}>
          <Paper 
            elevation={0} 
            sx={{ p: 3, borderRadius: 3, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', height: '100%' }}
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
              <Divider sx={{ borderColor: 'divider' }} />
              <DetailRow label={labels.attr1} value={itemFormData.attribute1} />
              <DetailRow label={labels.attr2} value={itemFormData.attribute2} />
            </Stack>

            {itemFormData.description && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>{t('itemsPage.description')}</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>{itemFormData.description}</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Side: Variant List Summary */}
        <Grid item xs={12} md={7}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="overline" color="text.secondary" fontWeight={800}>
              {t('itemsPage.variant.variantsCount', { count: variantList.length })}
            </Typography>
            <Chip 
              label={shopCategory} 
              size="small" 
              color="primary" 
              variant="outlined" 
              sx={{ fontWeight: 800, fontSize: '0.65rem' }} 
            />
          </Box>

          <Stack spacing={2} sx={{ maxHeight: '450px', overflowY: 'auto', pr: 1 }}>
            {variantList.map((variant, index) => (
              <Paper 
                key={variant.id || index} 
                elevation={0} 
                sx={{ 
                  p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                  transition: 'all 0.2s'
                }}
              >
                <Grid container alignItems="center" spacing={2}>
                  <Grid item>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontWeight: 800, color: 'primary.contrastText' }}>
                      {index + 1}
                    </Avatar>
                  </Grid>
                  <Grid item xs>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle1" fontWeight={900} color="text.primary">₹{variant.pricePerUnit}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('itemsPage.variant.perUnit', { unit: variant.unit })}
                      </Typography>
                      <Chip 
                        label={t('itemsPage.variant.gstLabel', { rate: variant.gstRate })} 
                        size="small" 
                        color="info"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} 
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      <strong>{variant.size || 'N/A'}</strong> ({labels.size}) • 
                      <strong> {variant.color || 'N/A'}</strong> ({labels.color}) • 
                      {variant.fit || labels.fit}
                    </Typography>
                  </Grid>
                  <Grid item sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'text.secondary' }}>
                      {variant.sku || 'No SKU'}
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