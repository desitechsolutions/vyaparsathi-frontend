import React, { useState } from 'react';
import {
  Box, Container, Grid, Typography, Stack, Chip, Button, Divider,
  ToggleButtonGroup, ToggleButton, Paper, List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

// Static plan definitions (no SubscriptionContext dependency)
const staticPlans = [
  {
    key: 'free',
    priceMonthly: 0,
    priceYearly: 0,
    color: '#64748B',
    features: [
      'Up to 500 Products',
      'Basic Sales & Billing',
      'GST Invoice Generation',
      'Customer Management',
      'Basic Reports',
      '— Purchase Orders',
      '— Analytics Dashboard',
      '— Staff & Payroll',
      '— Cloud Backup',
    ]
  },
  {
    key: 'starter',
    priceMonthly: 499,
    priceYearly: 4799,
    color: '#2563EB',
    features: [
      'Unlimited Products',
      'Full Sales & Billing',
      'GST Invoice + GSTR Data',
      'Customer Management',
      'Supplier Management',
      'Delivery Management',
      'Advanced Reports',
      '— Analytics Dashboard',
      '— Staff & Payroll',
    ]
  },
  {
    key: 'pro',
    isPopular: true,
    priceMonthly: 999,
    priceYearly: 9590,
    color: '#7C3AED',
    features: [
      'Everything in Starter',
      'Analytics Dashboard',
      'Purchase Order Management',
      'Stock Receiving Workflow',
      'Supplier Payment Tracking',
      'Audit Logs',
      'Cloud Data Backup',
      'Low Stock Alerts',
      '— Staff & Payroll',
    ]
  },
  {
    key: 'enterprise',
    priceMonthly: null,
    priceYearly: null,
    color: '#D97706',
    features: [
      'Everything in Professional',
      'Staff & Payroll Management',
      'HSN Code Compliance',
      'Tax Compliance Hub',
      'Multi-branch Support',
      'Priority Support (2hr SLA)',
      'Dedicated Account Manager',
      'Custom Integrations',
      'Advanced Security Controls',
    ]
  }
];

const PublicPricingSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [billing, setBilling] = useState('yearly');

  return (
    <Box
      id="pricing"
      sx={{ bgcolor: '#F8FAFC', py: { xs: 10, md: 14, lg: 18 } }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 3, lg: 6 } }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 10 } }}>
          <Chip
            label={t('landingPage.pricing.sectionBadge')}
            size="small"
            sx={{
              bgcolor: 'rgba(37,99,235,0.08)',
              color: '#2563EB',
              fontWeight: 800,
              fontSize: '0.75rem',
              mb: 2.5,
              border: '1px solid rgba(37,99,235,0.15)',
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
            {t('landingPage.pricing.sectionTitle')}
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: '#64748B', fontWeight: 400, maxWidth: 520, mx: 'auto', lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.1rem' } }}
          >
            {t('landingPage.pricing.sectionSubtitle')}
          </Typography>

          {/* Billing Toggle */}
          <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" sx={{ mt: 5 }}>
            <Typography variant="body2" fontWeight={billing === 'monthly' ? 700 : 500} sx={{ color: billing === 'monthly' ? '#1E293B' : '#94A3B8' }}>
              {t('landingPage.pricing.monthlyLabel')}
            </Typography>
            <Paper elevation={0} sx={{ p: 0.5, borderRadius: 50, bgcolor: '#E2E8F0' }}>
              <ToggleButtonGroup
                value={billing}
                exclusive
                onChange={(_, v) => v && setBilling(v)}
                sx={{
                  '& .MuiToggleButton-root': {
                    border: 'none',
                    borderRadius: '50px !important',
                    px: 3,
                    py: 0.7,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    '&.Mui-selected': { bgcolor: '#fff', color: '#2563EB', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }
                  }
                }}
              >
                <ToggleButton value="monthly">Monthly</ToggleButton>
                <ToggleButton value="yearly">Yearly</ToggleButton>
              </ToggleButtonGroup>
            </Paper>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" fontWeight={billing === 'yearly' ? 700 : 500} sx={{ color: billing === 'yearly' ? '#1E293B' : '#94A3B8' }}>
                {t('landingPage.pricing.yearlyLabel')}
              </Typography>
              <Chip
                label={t('landingPage.pricing.savingsLabel')}
                size="small"
                sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 900, fontSize: '0.65rem', height: 20 }}
              />
            </Stack>
          </Stack>
        </Box>

        {/* Plan Cards */}
        <Grid container spacing={3} alignItems="stretch">
          {staticPlans.map((plan) => {
            const { key, color, isPopular, priceMonthly, priceYearly } = plan;
            const displayPrice = billing === 'monthly' ? priceMonthly : (priceYearly ? Math.round(priceYearly / 12) : null);
            const billingTotal = billing === 'yearly' ? priceYearly : priceMonthly;

            return (
              <Grid item xs={12} sm={6} md={3} key={key}>
                <Paper
                  elevation={0}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 4,
                    border: `2px solid ${isPopular ? color : 'rgba(0,0,0,0.08)'}`,
                    bgcolor: isPopular ? `${color}04` : '#ffffff',
                    transition: 'all 0.3s',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: `0 24px 60px ${color}20`,
                      borderColor: color,
                    }
                  }}
                >
                  {/* Popular badge */}
                  {isPopular && (
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bgcolor: color,
                      py: 0.8,
                      textAlign: 'center',
                    }}>
                      <Typography variant="caption" fontWeight={900} sx={{ color: '#fff', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
                        <StarIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                        {t('landingPage.pricing.mostPopular')}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ p: { xs: 3, md: 4 }, pt: isPopular ? 6 : 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Plan Name */}
                    <Typography variant="h6" fontWeight={900} sx={{ color: '#1E293B', mb: 0.5 }}>
                      {t(`landingPage.pricing.plans.${key}.name`)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500, display: 'block', mb: 3 }}>
                      {t(`landingPage.pricing.plans.${key}.desc`)}
                    </Typography>

                    {/* Price */}
                    <Box sx={{ mb: 3 }}>
                      {priceMonthly === null ? (
                        <Typography variant="h4" fontWeight={900} sx={{ color: '#1E293B' }}>Custom</Typography>
                      ) : priceMonthly === 0 ? (
                        <Typography variant="h4" fontWeight={900} sx={{ color: '#1E293B' }}>₹0</Typography>
                      ) : (
                        <Stack direction="row" alignItems="baseline" spacing={0.5}>
                          <Typography variant="h3" fontWeight={900} sx={{ color: '#1E293B' }}>₹{displayPrice}</Typography>
                          <Typography variant="body2" sx={{ color: '#64748B' }}>{t('landingPage.pricing.perMonth')}</Typography>
                        </Stack>
                      )}
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                        {priceMonthly === 0
                          ? t('landingPage.pricing.freeForever')
                          : priceMonthly === null
                          ? 'Contact us for pricing'
                          : billing === 'yearly'
                          ? `${t('landingPage.pricing.billedAnnually')} ₹${billingTotal}`
                          : `₹${billingTotal} per month`}
                      </Typography>
                    </Box>

                    {/* CTA */}
                    <Button
                      fullWidth
                      variant={isPopular ? 'contained' : 'outlined'}
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate('/login')}
                      sx={{
                        mb: 3,
                        fontWeight: 800,
                        textTransform: 'none',
                        py: 1.5,
                        borderRadius: 2.5,
                        fontSize: '0.9rem',
                        ...(isPopular ? {
                          bgcolor: color,
                          boxShadow: `0 8px 20px ${color}35`,
                          '&:hover': { bgcolor: color, filter: 'brightness(0.9)', transform: 'translateY(-1px)' }
                        } : {
                          borderColor: color,
                          color: color,
                          '&:hover': { bgcolor: `${color}08`, borderColor: color }
                        })
                      }}
                    >
                      {key === 'free'
                        ? t('landingPage.pricing.startFree')
                        : key === 'enterprise'
                        ? t('landingPage.pricing.contactSales')
                        : t('landingPage.pricing.loginToPurchase')}
                    </Button>

                    <Divider sx={{ mb: 2.5 }} />

                    {/* Features list */}
                    <Typography variant="caption" fontWeight={800} sx={{ color: '#1E293B', textTransform: 'uppercase', letterSpacing: 0.8, mb: 1.5, display: 'block' }}>
                      {t('landingPage.pricing.featuresIncluded')}
                    </Typography>
                    <List dense disablePadding sx={{ flexGrow: 1 }}>
                      {plan.features.map((feat, fi) => {
                        const isExcluded = feat.startsWith('—');
                        const label = isExcluded ? feat.replace('— ', '') : feat;
                        return (
                          <ListItem key={fi} disablePadding sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 28 }}>
                              {isExcluded
                                ? <CloseIcon sx={{ fontSize: 16, color: '#CBD5E1' }} />
                                : <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981' }} />
                              }
                            </ListItemIcon>
                            <ListItemText
                              primary={label}
                              primaryTypographyProps={{
                                variant: 'body2',
                                fontWeight: isExcluded ? 400 : 600,
                                color: isExcluded ? '#CBD5E1' : '#334155',
                                fontSize: '0.82rem',
                              }}
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        {/* Bottom note */}
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
            🔒 All purchases require login &nbsp;•&nbsp; 14-day free trial on Starter &nbsp;•&nbsp; Cancel anytime &nbsp;•&nbsp; No hidden fees
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default PublicPricingSection;
