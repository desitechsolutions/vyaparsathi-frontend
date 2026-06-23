import React from 'react';
import {
  Box, Container, Grid, Typography, Button, Stack, Chip
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import LockIcon from '@mui/icons-material/Lock';
import CloudIcon from '@mui/icons-material/Cloud';
import StarIcon from '@mui/icons-material/Star';
import FlagIcon from '@mui/icons-material/Flag';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

// ─── Dashboard Mockup (placeholder visual until real screenshot is available) ──
const DashboardMockup = () => (
  <Box
    sx={{
      width: '100%',
      aspectRatio: '16/10',
      borderRadius: 3,
      overflow: 'hidden',
      boxShadow: '0 40px 120px rgba(0,0,0,0.4)',
      border: '1px solid rgba(255,255,255,0.12)',
      background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
      position: 'relative',
    }}
  >
    {/* Top Bar */}
    <Box sx={{ height: 40, bgcolor: '#0F172A', display: 'flex', alignItems: 'center', px: 2, gap: 1, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#EF4444' }} />
      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#F59E0B' }} />
      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#10B981' }} />
      <Box sx={{ flex: 1, mx: 2, height: 22, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 1 }} />
    </Box>

    {/* Sidebar + Content */}
    <Box sx={{ display: 'flex', height: 'calc(100% - 40px)' }}>
      {/* Sidebar */}
      <Box sx={{ width: 56, bgcolor: '#0F172A', borderRight: '1px solid rgba(255,255,255,0.06)', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {['📊', '📦', '🧾', '👥', '🛒', '📈'].map((icon, i) => (
          <Box key={i} sx={{ width: 32, height: 32, bgcolor: i === 0 ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.04)', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
            {icon}
          </Box>
        ))}
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 2, overflowY: 'hidden' }}>
        {/* Stats Row */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {[
            { label: "Today's Sales", value: '₹24,580', color: '#3B82F6', up: true },
            { label: 'Total Customers', value: '1,240', color: '#10B981', up: true },
            { label: 'Items Sold', value: '342', color: '#F59E0B', up: true },
            { label: 'Outstanding Due', value: '₹8,920', color: '#EF4444', up: false },
          ].map((stat, i) => (
            <Grid item xs={3} key={i}>
              <Box sx={{ p: 1.2, bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
                <Typography sx={{ fontSize: '0.55rem', color: '#64748B', fontWeight: 600 }}>{stat.label}</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: stat.color, mt: 0.3 }}>{stat.value}</Typography>
                <Box sx={{ mt: 0.5, height: 3, borderRadius: 2, bgcolor: `${stat.color}30`, overflow: 'hidden' }}>
                  <Box sx={{ height: '100%', width: `${60 + i * 10}%`, bgcolor: stat.color, borderRadius: 2 }} />
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Chart Area */}
        <Grid container spacing={1.5}>
          <Grid item xs={8}>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)', height: 110 }}>
              <Typography sx={{ fontSize: '0.6rem', color: '#94A3B8', fontWeight: 700, mb: 1 }}>Revenue Trend (Last 7 Days)</Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.8, height: 75 }}>
                {[45, 70, 55, 90, 65, 80, 95].map((h, i) => (
                  <Box key={i} sx={{ flex: 1, height: `${h}%`, bgcolor: i === 6 ? '#3B82F6' : 'rgba(59,130,246,0.3)', borderRadius: '3px 3px 0 0', transition: '0.3s' }} />
                ))}
              </Box>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)', height: 110 }}>
              <Typography sx={{ fontSize: '0.6rem', color: '#94A3B8', fontWeight: 700, mb: 1.5 }}>Top Items</Typography>
              {['Rice (5kg)', 'Milk', 'Sugar', 'Dal'].map((item, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ height: 3, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', width: `${90 - i * 15}%`, bgcolor: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][i], borderRadius: 2 }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.5rem', color: '#64748B', mt: 0.2 }}>{item}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>

    {/* Floating "Live" badge */}
    <Box sx={{ position: 'absolute', top: 54, right: 12, display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.4, bgcolor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10 }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981', boxShadow: '0 0 6px #10B981' }} />
      <Typography sx={{ fontSize: '0.55rem', fontWeight: 800, color: '#10B981' }}>LIVE</Typography>
    </Box>
  </Box>
);

// ─── Hero Section ────────────────────────────────────────────────────────────
const HeroSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const trustBadges = [
    { icon: LockIcon, label: t('landingPage.hero.trustBadge1') },
    { icon: CloudIcon, label: t('landingPage.hero.trustBadge2') },
    { icon: FlagIcon, label: t('landingPage.hero.trustBadge3') },
    { icon: StarIcon, label: t('landingPage.hero.trustBadge4') },
  ];

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #0F172A 100%)',
        position: 'relative',
        overflow: 'hidden',
        pt: { xs: 8, md: 12, lg: 16 },
        pb: { xs: 10, md: 14, lg: 18 },
      }}
    >
      {/* Background Grid */}
      <Box sx={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(to right, #ffffff 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      {/* Glow blobs */}
      <Box sx={{ position: 'absolute', top: '20%', left: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: '10%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

      <Container maxWidth="xl" sx={{ px: { xs: 3, lg: 6 }, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={{ xs: 6, lg: 8 }} alignItems="center">

          {/* Left: Copy */}
          <Grid item xs={12} lg={6}>
            <Stack spacing={4}>
              {/* Badge */}
              <Box>
                <Chip
                  label={`✅ ${t('landingPage.hero.badge')}`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(16, 185, 129, 0.12)',
                    color: '#6EE7B7',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    height: 30,
                    px: 0.5,
                  }}
                />
              </Box>

              {/* Headline */}
              <Box>
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem', lg: '3.8rem' },
                    lineHeight: 1.08,
                    letterSpacing: '-0.03em',
                    color: '#F1F5F9',
                    mb: 0,
                  }}
                >
                  {t('landingPage.hero.headline1')}
                </Typography>
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem', lg: '3.8rem' },
                    lineHeight: 1.08,
                    letterSpacing: '-0.03em',
                    background: 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 50%, #F97316 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {t('landingPage.hero.headline2')}
                </Typography>
              </Box>

              {/* Sub-headline */}
              <Typography
                variant="h6"
                sx={{
                  color: '#94A3B8',
                  fontWeight: 400,
                  lineHeight: 1.7,
                  fontSize: { xs: '1rem', md: '1.15rem' },
                  maxWidth: 540,
                }}
              >
                {t('landingPage.hero.subHeadline')}
              </Typography>

              {/* CTAs */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/login')}
                  sx={{
                    fontWeight: 800,
                    fontSize: '1rem',
                    textTransform: 'none',
                    px: 4,
                    py: 1.8,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
                    color: '#1E293B',
                    boxShadow: '0 8px 30px rgba(245,158,11,0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #FBBF24 0%, #FB923C 100%)',
                      boxShadow: '0 12px 40px rgba(245,158,11,0.5)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.25s'
                  }}
                >
                  {t('landingPage.hero.primaryCta')}
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<PlayCircleOutlineIcon />}
                  href="https://wa.me/919508156282"
                  target="_blank"
                  sx={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    textTransform: 'none',
                    px: 4,
                    py: 1.8,
                    borderRadius: 3,
                    color: '#CBD5E1',
                    borderColor: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(8px)',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.4)',
                      bgcolor: 'rgba(255,255,255,0.08)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.25s'
                  }}
                >
                  {t('landingPage.hero.secondaryCta')}
                </Button>
              </Stack>

              {/* Trust Badges */}
              <Stack direction="row" flexWrap="wrap" gap={2}>
                {trustBadges.map((badge, i) => {
                  const Icon = badge.icon;
                  return (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Icon sx={{ fontSize: 16, color: '#64748B' }} />
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                        {badge.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            </Stack>
          </Grid>

          {/* Right: Dashboard Mockup */}
          <Grid item xs={12} lg={6}>
            <Box
              sx={{
                position: 'relative',
                animation: 'floatHero 4s ease-in-out infinite',
                '@keyframes floatHero': {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-12px)' }
                }
              }}
            >
              <DashboardMockup />
              {/* Caption */}
              <Typography
                variant="caption"
                sx={{ display: 'block', textAlign: 'center', mt: 2, color: '#475569', fontWeight: 600 }}
              >
                📊 {t('landingPage.hero.dashboardCaption')}
              </Typography>
            </Box>
          </Grid>

        </Grid>
      </Container>

      {/* Bottom wave */}
      <Box
        sx={{
          position: 'absolute',
          bottom: -1,
          left: 0,
          right: 0,
          height: 60,
          background: 'linear-gradient(to bottom, transparent, #F8FAFC)',
        }}
      />
    </Box>
  );
};

export default HeroSection;
