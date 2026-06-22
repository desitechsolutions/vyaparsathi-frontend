import React, { useState, useEffect } from 'react';
import {
  Box, Container, Grid, Typography, Stack, Chip, Button, Paper
} from '@mui/material';
import StoreIcon from '@mui/icons-material/Store';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import GroceryIcon from '@mui/icons-material/LocalGroceryStore';
import DevicesIcon from '@mui/icons-material/Devices';
import StyleIcon from '@mui/icons-material/Style';
import ConstructionIcon from '@mui/icons-material/Construction';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

const industryData = [
  {
    key: 'retail',
    Icon: StoreIcon,
    color: '#2563EB',
    emoji: '🏪',
    bulletPoints: [
      'Fast billing with GST invoices',
      'Daily sales and cash reports',
      'Customer credit & due tracking',
      'Low-stock alerts & reorder',
      'Multi-user staff access',
    ]
  },
  {
    key: 'wholesale',
    Icon: WarehouseIcon,
    color: '#7C3AED',
    emoji: '🏭',
    bulletPoints: [
      'Bulk order processing',
      'Distributor pricing tiers',
      'Multi-party billing',
      'Volume discount management',
      'Supplier payment tracking',
    ]
  },
  {
    key: 'distribution',
    Icon: LocalShippingIcon,
    color: '#0891B2',
    emoji: '🚚',
    bulletPoints: [
      'Route-wise order management',
      'Delivery tracking dashboard',
      'Order fulfillment workflows',
      'Territory reporting',
      'Driver-wise delivery logs',
    ]
  },
  {
    key: 'grocery',
    Icon: GroceryIcon,
    color: '#059669',
    emoji: '🛒',
    bulletPoints: [
      'Fast-moving item reports',
      'Multi-unit pricing (kg, pcs)',
      'Batch & lot tracking',
      'Margin analysis per product',
      'Daily purchase & sales audit',
    ]
  },
  {
    key: 'electronics',
    Icon: DevicesIcon,
    color: '#DC2626',
    emoji: '📱',
    bulletPoints: [
      'Serial number tracking',
      'Warranty management',
      'High-value item records',
      'Service & repair billing',
      'Brand-wise inventory view',
    ]
  },
  {
    key: 'fashion',
    Icon: StyleIcon,
    color: '#DB2777',
    emoji: '👗',
    bulletPoints: [
      'Size, color, design variants',
      'Season-based planning',
      'Style catalog management',
      'Return & exchange handling',
      'Brand & supplier tracking',
    ]
  },
  {
    key: 'hardware',
    Icon: ConstructionIcon,
    color: '#D97706',
    emoji: '🔧',
    bulletPoints: [
      'Unit-based pricing (kg, mtr)',
      'Contractor billing & quotation',
      'Material & raw stock tracking',
      'Project-wise costing',
      'Supplier ledger management',
    ]
  },
];

const IndustrySolutionsSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('retail');

  // Read ?industry= query param to activate the correct tab
  useEffect(() => {
    const industryParam = searchParams.get('industry');
    const validKeys = industryData.map(d => d.key);
    if (industryParam && validKeys.includes(industryParam)) {
      setActiveTab(industryParam);
    }
  }, [searchParams]);

  const activeIndustry = industryData.find(d => d.key === activeTab);

  return (
    <Box
      id="solutions"
      sx={{
        bgcolor: '#ffffff',
        py: { xs: 10, md: 14, lg: 18 },
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 3, lg: 6 } }}>
        {/* Section Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
          <Chip
            label={t('landingPage.solutions.sectionBadge')}
            size="small"
            sx={{
              bgcolor: 'rgba(124,58,237,0.08)',
              color: '#7C3AED',
              fontWeight: 800,
              fontSize: '0.75rem',
              mb: 2.5,
              border: '1px solid rgba(124,58,237,0.15)',
            }}
          />
          <Typography
            variant="h2"
            fontWeight={900}
            sx={{
              color: '#1E293B',
              fontSize: { xs: '2rem', md: '2.8rem', lg: '3.2rem' },
              letterSpacing: '-0.03em',
              mb: 2,
              lineHeight: 1.1,
            }}
          >
            {t('landingPage.solutions.sectionTitle')}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#64748B',
              fontWeight: 400,
              maxWidth: 560,
              mx: 'auto',
              lineHeight: 1.7,
              fontSize: { xs: '1rem', md: '1.1rem' },
            }}
          >
            {t('landingPage.solutions.sectionSubtitle')}
          </Typography>
        </Box>

        {/* Tab Pills */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            justifyContent: 'center',
            mb: 6,
            px: { xs: 0, md: 4 },
          }}
        >
          {industryData.map((industry) => {
            const isActive = activeTab === industry.key;
            return (
              <Button
                key={industry.key}
                onClick={() => setActiveTab(industry.key)}
                startIcon={<span style={{ fontSize: '1.1rem' }}>{industry.emoji}</span>}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  px: 2.5,
                  py: 1,
                  borderRadius: 50,
                  border: '2px solid',
                  borderColor: isActive ? industry.color : 'rgba(0,0,0,0.1)',
                  bgcolor: isActive ? `${industry.color}12` : 'transparent',
                  color: isActive ? industry.color : '#64748B',
                  transition: 'all 0.25s',
                  '&:hover': {
                    borderColor: industry.color,
                    color: industry.color,
                    bgcolor: `${industry.color}08`,
                  }
                }}
              >
                {t(`landingPage.solutions.${industry.key}.title`)}
              </Button>
            );
          })}
        </Box>

        {/* Content Panel */}
        {activeIndustry && (
          <Box
            key={activeTab}
            sx={{
              animation: 'fadeInUp 0.35s ease forwards',
              '@keyframes fadeInUp': {
                from: { opacity: 0, transform: 'translateY(20px)' },
                to: { opacity: 1, transform: 'translateY(0)' }
              }
            }}
          >
            <Paper
              elevation={0}
              sx={{
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.06)',
              }}
            >
              <Grid container>
                {/* Left: Info */}
                <Grid item xs={12} md={6}
                  sx={{
                    p: { xs: 4, md: 6 },
                    background: `linear-gradient(135deg, ${activeIndustry.color}0A 0%, ${activeIndustry.color}04 100%)`,
                    borderRight: { md: '1px solid rgba(0,0,0,0.06)' },
                    borderBottom: { xs: '1px solid rgba(0,0,0,0.06)', md: 'none' },
                  }}
                >
                  <Stack spacing={3}>
                    {/* Icon + Tag */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: 3,
                          bgcolor: `${activeIndustry.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid ${activeIndustry.color}25`,
                        }}
                      >
                        <activeIndustry.Icon sx={{ fontSize: 32, color: activeIndustry.color }} />
                      </Box>
                      <Chip
                        label={t(`landingPage.solutions.${activeTab}.tag`)}
                        size="small"
                        sx={{
                          bgcolor: `${activeIndustry.color}12`,
                          color: activeIndustry.color,
                          fontWeight: 800,
                          border: `1px solid ${activeIndustry.color}25`,
                          fontSize: '0.75rem',
                        }}
                      />
                    </Box>

                    <Box>
                      <Typography variant="h4" fontWeight={900} sx={{ color: '#1E293B', mb: 1.5, lineHeight: 1.2 }}>
                        {t(`landingPage.solutions.${activeTab}.title`)}
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#64748B', lineHeight: 1.7 }}>
                        {t(`landingPage.solutions.${activeTab}.desc`)}
                      </Typography>
                    </Box>

                    <Button
                      variant="contained"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate('/login')}
                      sx={{
                        alignSelf: 'flex-start',
                        fontWeight: 800,
                        textTransform: 'none',
                        borderRadius: 2.5,
                        px: 3,
                        py: 1.2,
                        bgcolor: activeIndustry.color,
                        boxShadow: `0 8px 24px ${activeIndustry.color}35`,
                        '&:hover': {
                          bgcolor: activeIndustry.color,
                          filter: 'brightness(0.9)',
                          boxShadow: `0 12px 30px ${activeIndustry.color}45`,
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.25s',
                      }}
                    >
                      Start Free for {t(`landingPage.solutions.${activeTab}.title`)}
                    </Button>
                  </Stack>
                </Grid>

                {/* Right: Bullet Points */}
                <Grid item xs={12} md={6} sx={{ p: { xs: 4, md: 6 } }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#1E293B', mb: 3, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' }}>
                    What you get
                  </Typography>
                  <Stack spacing={2}>
                    {activeIndustry.bulletPoints.map((point, i) => (
                      <Box
                        key={i}
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 2,
                          p: 1.8,
                          borderRadius: 2.5,
                          border: '1px solid rgba(0,0,0,0.06)',
                          bgcolor: '#FAFAFA',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: `${activeIndustry.color}05`,
                            borderColor: `${activeIndustry.color}20`,
                            transform: 'translateX(4px)',
                          }
                        }}
                      >
                        <CheckCircleIcon sx={{ fontSize: 20, color: activeIndustry.color, flexShrink: 0, mt: 0.1 }} />
                        <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600, lineHeight: 1.5 }}>
                          {point}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default IndustrySolutionsSection;
