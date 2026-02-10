import React, { useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  alpha
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useTranslation } from 'react-i18next';

import { API_BASE_URL } from '../../../services/api';

export default function VariantDetailDisplay({ 
  item, 
  stockData, 
  onDeleteVariant,
  shopCategory = 'CLOTHING' // Industry context
}) {
  const { t } = useTranslation();

  // --- Dynamic Industry Labels ---
  const industryLabels = {
    CLOTHING: {
      colorSize: (v) => `${v.color} — ${v.size}`,
      secondary: (v) => `${v.design || t('itemsPage.variant.standardDesign')} • ${v.fit || t('itemsPage.variant.standardFit')}`
    },
    ELECTRONICS: {
      colorSize: (v) => `${v.color} (Finish) — ${v.size} (Storage)`,
      secondary: (v) => `${v.design || 'Standard Model'} • ${v.fit || 'No Connectivity Info'}`
    },
    HARDWARE: {
      colorSize: (v) => `${v.color} (Material) — ${v.size} (Specs)`,
      secondary: (v) => `${v.design || 'Standard Grade'} • ${v.fit || 'Standard Mounting'}`
    }
  };

  const labels = industryLabels[shopCategory] || industryLabels.CLOTHING;

  const stockLookup = useMemo(() => {
    const map = new Map();
    if (stockData) {
      stockData.forEach((stockItem) => {
        map.set(stockItem.itemVariantId, stockItem.totalQuantity);
      });
    }
    return map;
  }, [stockData]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#f8fafc', borderRadius: 3 }}>
      <Grid container spacing={3}>
        {(item.variants || []).length > 0 ? (
          item.variants.map((variant) => {
            const currentStock = stockLookup.get(variant.id) ?? 0;
            const hasStock = currentStock > 0;
            const isLowStock = currentStock < (variant.lowStockThreshold || 5);

            return (
              <Grid item xs={12} sm={6} md={4} key={variant.id}>
                <Paper
                  elevation={0}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    borderRadius: 4,
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 24px -10px rgba(0,0,0,0.1)',
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  {/* Photo Section */}
                  <Box
                    sx={{
                      height: 180,
                      position: 'relative',
                      bgcolor: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    {variant.photoPath ? (
                      <img
                        src={`${API_BASE_URL}${variant.photoPath}`}
                        alt={`${variant.size} ${variant.color}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Box sx={{ textAlign: 'center', color: 'text.disabled' }}>
                        <Typography variant="caption" fontWeight={700}>{t('itemsPage.variant.noPhoto')}</Typography>
                      </Box>
                    )}
                    
                    {/* Floating Stock Badge */}
                    <Box sx={{ position: 'absolute', top: 12, left: 12 }}>
                      <Chip
                        label={hasStock ? t('itemsPage.variant.stockLevel', { count: currentStock }) : t('itemsPage.variant.outOfStock')}
                        size="small"
                        sx={{
                          fontWeight: 900,
                          bgcolor: hasStock ? (isLowStock ? '#fff7ed' : '#f0fdf4') : '#fef2f2',
                          color: hasStock ? (isLowStock ? '#c2410c' : '#166534') : '#991b1b',
                          border: '1px solid',
                          borderColor: hasStock ? (isLowStock ? '#fdba74' : '#bbf7d0') : '#fecaca',
                          backdropFilter: 'blur(4px)'
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Content Section */}
                  <Box sx={{ p: 2, flexGrow: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ letterSpacing: 0.5 }}>
                          {variant.sku || t('itemsPage.variant.noSku')}
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={900} sx={{ lineHeight: 1.2, mb: 0.5 }}>
                          {labels.colorSize(variant)}
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight={900} color="primary.main">
                        ₹{variant.pricePerUnit}
                      </Typography>
                    </Stack>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      {labels.secondary(variant)} • {variant.unit}
                    </Typography>

                    <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {t('itemsPage.variant.gstRate')}: <strong>{variant.gstRate || 0}%</strong>
                        </Typography>
                      </Box>
                      
                      <Tooltip
                        title={
                          hasStock
                            ? t('itemsPage.variant.tooltips.cannotDeleteStock')
                            : t('itemsPage.variant.tooltips.deleteVariant')
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => onDeleteVariant(variant.id)}
                            disabled={hasStock}
                            sx={{ 
                              bgcolor: hasStock ? 'transparent' : alpha('#ef4444', 0.1),
                              color: '#ef4444',
                              '&:hover': { bgcolor: alpha('#ef4444', 0.2) }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </Box>
                </Paper>
              </Grid>
            );
          })
        ) : (
          <Grid item xs={12}>
            <Stack alignItems="center" spacing={2} sx={{ py: 8, opacity: 0.6 }}>
              <ErrorOutlineIcon sx={{ fontSize: 48 }} color="disabled" />
              <Typography variant="h6" fontWeight={700} color="text.secondary">
               {t('itemsPage.variant.noVariantsFound')}
              </Typography>
            </Stack>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}