import React from 'react';
import {
  Box, Container, Grid, Typography, Stack, Chip
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory2';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import BadgeIcon from '@mui/icons-material/Badge';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { useTranslation } from 'react-i18next';

const features = [
  { key: 'inventory', Icon: InventoryIcon, color: '#3B82F6', bgGrad: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(37,99,235,0.06))', large: true },
  { key: 'billing', Icon: ReceiptLongIcon, color: '#10B981', bgGrad: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.06))', large: true },
  { key: 'purchase', Icon: ShoppingCartIcon, color: '#F59E0B', bgGrad: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(217,119,6,0.06))', large: false },
  { key: 'customer', Icon: PeopleIcon, color: '#8B5CF6', bgGrad: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(109,40,217,0.06))', large: false },
  { key: 'staff', Icon: BadgeIcon, color: '#EC4899', bgGrad: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(219,39,119,0.06))', large: false },
  { key: 'reports', Icon: BarChartIcon, color: '#06B6D4', bgGrad: 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(8,145,178,0.06))', large: false },
  { key: 'gst', Icon: AccountBalanceIcon, color: '#F97316', bgGrad: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(234,88,12,0.06))', large: false },
];

// Bento-grid card component
const FeatureCard = ({ feature, t }) => {
  const { key, Icon, color, bgGrad, large } = feature;
  return (
    <Box
      sx={{
        background: bgGrad,
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 4,
        p: { xs: 3, md: large ? 4 : 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: large ? 2.5 : 2,
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: `0 20px 60px ${color}20`,
          borderColor: `${color}40`,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: color,
          borderRadius: '4px 4px 0 0',
          opacity: 0,
          transition: 'opacity 0.3s',
        },
        '&:hover::before': { opacity: 1 },
      }}
    >
      <Box
        sx={{
          width: large ? 56 : 48,
          height: large ? 56 : 48,
          borderRadius: 3,
          bgcolor: `${color}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${color}25`,
          transition: 'all 0.3s',
        }}
      >
        <Icon sx={{ fontSize: large ? 28 : 24, color }} />
      </Box>

      <Box>
        <Typography
          variant={large ? 'h6' : 'subtitle1'}
          fontWeight={800}
          sx={{ color: '#1E293B', mb: 1, lineHeight: 1.2 }}
        >
          {t(`landingPage.features.${key}.title`)}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: '#64748B', lineHeight: 1.7, fontWeight: 500 }}
        >
          {t(`landingPage.features.${key}.desc`)}
        </Typography>
      </Box>

      {/* Corner accent */}
      <Box sx={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, borderRadius: '50%', bgcolor: `${color}08` }} />
    </Box>
  );
};

const FeaturesShowcaseSection = () => {
  const { t } = useTranslation();
  const largeFeatures = features.filter(f => f.large);
  const smallFeatures = features.filter(f => !f.large);

  return (
    <Box
      id="features"
      sx={{
        bgcolor: 'background.default',
        py: { xs: 10, md: 14, lg: 18 },
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 3, lg: 6 } }}>
        {/* Section Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 10 } }}>
          <Chip
            label={t('landingPage.features.sectionBadge')}
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
            {t('landingPage.features.sectionTitle')}
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
            {t('landingPage.features.sectionSubtitle')}
          </Typography>
        </Box>

        {/* Bento Grid */}
        <Grid container spacing={3}>
          {/* Row 1: 2 large cards */}
          {largeFeatures.map((feat) => (
            <Grid item xs={12} md={6} key={feat.key} sx={{ minHeight: { md: 220 } }}>
              <FeatureCard feature={feat} t={t} />
            </Grid>
          ))}

          {/* Row 2: 5 smaller cards */}
          {smallFeatures.map((feat) => (
            <Grid item xs={12} sm={6} md={4} lg={12/5 * 1} key={feat.key}>
              <FeatureCard feature={feat} t={t} />
            </Grid>
          ))}
        </Grid>

        {/* Bottom Stats */}
        <Grid container spacing={3} sx={{ mt: 6 }}>
          {[
            { value: '7+', label: 'Core Business Modules' },
            { value: '99.9%', label: 'Uptime Guaranteed' },
            { value: '30 min', label: 'Average Setup Time' },
            { value: '10+', label: 'Language Support' },
          ].map((stat, i) => (
            <Grid item xs={6} md={3} key={i}>
              <Box sx={{ textAlign: 'center', p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', bgcolor: 'background.paper', transition: '0.3s', '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.06)', transform: 'translateY(-4px)' } }}>
                <Typography variant="h4" fontWeight={900} sx={{ color: '#1E293B', mb: 0.5 }}>{stat.value}</Typography>
                <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>{stat.label}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default FeaturesShowcaseSection;
