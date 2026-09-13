import React from 'react';
import {
  Box, Container, Grid, Typography, Button, Stack, Chip
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LockIcon from '@mui/icons-material/Lock';
import CloudIcon from '@mui/icons-material/Cloud';
import StarIcon from '@mui/icons-material/Star';
import FlagIcon from '@mui/icons-material/Flag';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

// ─── Enhanced Dashboard Mockup ────────────────────────────────────────────────
const DashboardMockup = () => (
  <Box sx={{
    width: '100%',
    aspectRatio: '16/10',
    borderRadius: 3,
    overflow: 'hidden',
    background: 'linear-gradient(145deg, #0D1425 0%, #0A1020 100%)',
    border: '1px solid rgba(255,255,255,0.1)',
    position: 'relative',
  }}>
    {/* Browser chrome */}
    <Box sx={{ height: 36, bgcolor: '#080D18', display: 'flex', alignItems: 'center', px: 2, gap: 1, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <Box sx={{ display: 'flex', gap: 0.6 }}>
        <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#EF4444' }} />
        <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#F59E0B' }} />
        <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#10B981' }} />
      </Box>
      <Box sx={{ flex: 1, mx: 2, height: 18, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 1, display: 'flex', alignItems: 'center', px: 1.5 }}>
        <Typography sx={{ fontSize: '0.48rem', color: '#475569', fontFamily: 'monospace' }}>app.vyaparsathi.com/dashboard</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, px: 0.8, py: 0.25, bgcolor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10 }}>
        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#10B981', boxShadow: '0 0 5px #10B981', animation: 'pulse 1.5s ease-in-out infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} />
        <Typography sx={{ fontSize: '0.42rem', fontWeight: 800, color: '#10B981' }}>LIVE</Typography>
      </Box>
    </Box>

    {/* Main layout */}
    <Box sx={{ display: 'flex', height: 'calc(100% - 36px)' }}>
      {/* Sidebar */}
      <Box sx={{ width: 46, bgcolor: '#060B15', borderRight: '1px solid rgba(255,255,255,0.05)', p: 1.2, display: 'flex', flexDirection: 'column', gap: 1.2, pt: 1.8 }}>
        {[
          { emoji: '📊', active: true },
          { emoji: '📦', active: false },
          { emoji: '🧾', active: false },
          { emoji: '👥', active: false },
          { emoji: '🛒', active: false },
          { emoji: '📈', active: false },
        ].map(({ emoji, active }, i) => (
          <Box key={i} sx={{ width: 28, height: 28, bgcolor: active ? 'rgba(37,99,235,0.28)' : 'rgba(255,255,255,0.04)', border: active ? '1px solid rgba(37,99,235,0.45)' : '1px solid transparent', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
            {emoji}
          </Box>
        ))}
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, p: 1.4, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '0.55rem', color: '#F1F5F9', fontWeight: 800 }}>Dashboard</Typography>
          <Box sx={{ px: 0.8, py: 0.2, bgcolor: 'rgba(37,99,235,0.15)', borderRadius: 1, border: '1px solid rgba(37,99,235,0.25)' }}>
            <Typography sx={{ fontSize: '0.42rem', color: '#60A5FA', fontWeight: 700 }}>Today</Typography>
          </Box>
        </Box>

        {/* KPI cards */}
        <Grid container spacing={0.8}>
          {[
            { label: 'Revenue', value: '₹24,580', trend: '+12%', color: '#3B82F6', up: true },
            { label: 'Customers', value: '1,240', trend: '+8%', color: '#10B981', up: true },
            { label: 'Items Sold', value: '342', trend: '+5%', color: '#F59E0B', up: true },
            { label: 'Dues', value: '₹8,920', trend: '-2%', color: '#EF4444', up: false },
          ].map((s, i) => (
            <Grid item xs={3} key={i}>
              <Box sx={{ p: 0.8, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.06)', borderTop: `2px solid ${s.color}` }}>
                <Typography sx={{ fontSize: '0.4rem', color: '#64748B', fontWeight: 600, mb: 0.2 }}>{s.label}</Typography>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 900, color: s.color }}>{s.value}</Typography>
                <Typography sx={{ fontSize: '0.38rem', color: s.up ? '#10B981' : '#EF4444', fontWeight: 700 }}>{s.trend}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Charts row */}
        <Grid container spacing={0.8} sx={{ flex: 1 }}>
          <Grid item xs={7}>
            <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.05)', height: '100%' }}>
              <Typography sx={{ fontSize: '0.45rem', color: '#94A3B8', fontWeight: 700, mb: 0.6 }}>Revenue — 7 Days</Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: 44 }}>
                {[30, 52, 42, 72, 58, 82, 100].map((h, i) => (
                  <Box key={i} sx={{ flex: 1, height: `${h}%`, background: i === 6 ? 'linear-gradient(180deg,#60A5FA 0%,#2563EB 100%)' : 'rgba(59,130,246,0.18)', borderRadius: '2px 2px 0 0' }} />
                ))}
              </Box>
            </Box>
          </Grid>
          <Grid item xs={5}>
            <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.05)', height: '100%' }}>
              <Typography sx={{ fontSize: '0.45rem', color: '#94A3B8', fontWeight: 700, mb: 0.6 }}>Recent Sales</Typography>
              {[
                { name: 'Rahul S.', amount: '₹1,200', dot: '#10B981' },
                { name: 'Store #2', amount: '₹3,450', dot: '#3B82F6' },
                { name: 'Priya M.', amount: '₹780', dot: '#F59E0B' },
              ].map((item, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                    <Box sx={{ width: 3.5, height: 3.5, borderRadius: '50%', bgcolor: item.dot }} />
                    <Typography sx={{ fontSize: '0.38rem', color: '#94A3B8' }}>{item.name}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.38rem', color: '#F1F5F9', fontWeight: 700 }}>{item.amount}</Typography>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Box>
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

  const stats = [
    { value: '500+', label: 'Businesses', color: '#60A5FA' },
    { value: '₹10Cr+', label: 'Processed', color: '#10B981' },
    { value: '4.9★', label: 'Rating', color: '#FBBF24' },
  ];

  return (
    <Box
      sx={{
        background: 'linear-gradient(155deg, #060D1B 0%, #0C1830 55%, #08112A 100%)',
        position: 'relative',
        overflow: 'hidden',
        pt: { xs: 8, md: 12, lg: 16 },
        pb: { xs: 12, md: 16, lg: 22 },
      }}
    >
      {/* Grid overlay */}
      <Box sx={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: `linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.9) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
        pointerEvents: 'none',
      }} />

      {/* Blue glow — top left */}
      <Box sx={{ position: 'absolute', top: '-15%', left: '-8%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.22) 0%, transparent 65%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      {/* Purple glow — bottom right */}
      <Box sx={{ position: 'absolute', bottom: '5%', right: '-10%', width: 550, height: 550, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.16) 0%, transparent 65%)', filter: 'blur(70px)', pointerEvents: 'none' }} />

      <Container maxWidth="xl" sx={{ px: { xs: 3, lg: 6 }, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={{ xs: 6, lg: 10 }} alignItems="center">

          {/* ── Left: Copy ── */}
          <Grid item xs={12} lg={6}>
            <Stack spacing={3.5}>
              {/* Launch chip */}
              <Box>
                <Chip
                  label="🚀 Trusted by 500+ Indian Businesses"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(37,99,235,0.12)',
                    color: '#93C5FD',
                    border: '1px solid rgba(37,99,235,0.28)',
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
                    fontSize: { xs: '2.6rem', sm: '3.2rem', md: '3.6rem', lg: '4rem' },
                    lineHeight: 1.07,
                    letterSpacing: '-0.03em',
                    color: '#F1F5F9',
                  }}
                >
                  {t('landingPage.hero.headline1')}
                </Typography>
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: '2.6rem', sm: '3.2rem', md: '3.6rem', lg: '4rem' },
                    lineHeight: 1.07,
                    letterSpacing: '-0.03em',
                    background: 'linear-gradient(90deg, #60A5FA 0%, #A78BFA 55%, #C084FC 100%)',
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
                  lineHeight: 1.75,
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
                    fontWeight: 800, fontSize: '1rem', textTransform: 'none',
                    px: 4, py: 1.8, borderRadius: 3,
                    background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
                    color: '#1E293B',
                    boxShadow: '0 8px 30px rgba(245,158,11,0.4)',
                    '&:hover': { background: 'linear-gradient(135deg, #FBBF24 0%, #FB923C 100%)', boxShadow: '0 12px 40px rgba(245,158,11,0.5)', transform: 'translateY(-2px)' },
                    transition: 'all 0.25s',
                  }}
                >
                  {t('landingPage.hero.primaryCta')}
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<WhatsAppIcon />}
                  href="https://wa.me/919508156282"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    fontWeight: 700, fontSize: '1rem', textTransform: 'none',
                    px: 4, py: 1.8, borderRadius: 3,
                    color: '#CBD5E1',
                    borderColor: 'rgba(255,255,255,0.15)',
                    bgcolor: 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(8px)',
                    '&:hover': { borderColor: '#25D366', color: '#4ADE80', bgcolor: 'rgba(37,211,102,0.06)', transform: 'translateY(-2px)' },
                    transition: 'all 0.25s',
                  }}
                >
                  {t('landingPage.hero.secondaryCta')}
                </Button>
              </Stack>

              {/* Stats row */}
              <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1.5}>
                {stats.map((stat, i) => (
                  <React.Fragment key={i}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                      <Typography sx={{ fontWeight: 900, fontSize: '1.05rem', color: stat.color, letterSpacing: '-0.01em' }}>
                        {stat.value}
                      </Typography>
                      <Typography sx={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                        {stat.label}
                      </Typography>
                    </Box>
                    {i < stats.length - 1 && (
                      <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#1E3A5F' }} />
                    )}
                  </React.Fragment>
                ))}
              </Stack>

              {/* Trust badges */}
              <Stack direction="row" flexWrap="wrap" gap={2.5}>
                {trustBadges.map((badge, i) => {
                  const Icon = badge.icon;
                  return (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Icon sx={{ fontSize: 14, color: '#3D5A7A' }} />
                      <Typography variant="caption" sx={{ color: '#4A6583', fontWeight: 600, fontSize: '0.75rem' }}>
                        {badge.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            </Stack>
          </Grid>

          {/* ── Right: Dashboard Visual ── */}
          <Grid item xs={12} lg={6}>
            <Box
              sx={{
                position: 'relative',
                pl: { lg: 2 },
                pt: { xs: 0, lg: 3 },
                pb: { xs: 0, lg: 3 },
              }}
            >
              {/* Floating card — top right: Revenue */}
              <Box sx={{
                position: 'absolute', top: -8, right: { xs: 0, lg: -16 },
                display: { xs: 'none', lg: 'flex' },
                alignItems: 'center', gap: 1,
                px: 1.5, py: 0.9,
                bgcolor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.22)',
                borderRadius: 2, backdropFilter: 'blur(12px)', zIndex: 10,
                animation: 'floatA 3.2s ease-in-out infinite',
                '@keyframes floatA': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-7px)' } },
              }}>
                <Typography sx={{ fontSize: '1.1rem' }}>📈</Typography>
                <Box>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 900, color: '#10B981' }}>₹24,580</Typography>
                  <Typography sx={{ fontSize: '0.58rem', color: '#6EE7B7', fontWeight: 700 }}>↑ 23% Today</Typography>
                </Box>
              </Box>

              {/* Floating card — left: GST */}
              <Box sx={{
                position: 'absolute', top: '38%', left: { lg: -20 },
                display: { xs: 'none', lg: 'flex' },
                alignItems: 'center', gap: 1,
                px: 1.5, py: 0.9,
                bgcolor: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.22)',
                borderRadius: 2, backdropFilter: 'blur(12px)', zIndex: 10,
                animation: 'floatB 3.8s 0.6s ease-in-out infinite',
                '@keyframes floatB': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
              }}>
                <Typography sx={{ fontSize: '1.1rem' }}>✅</Typography>
                <Box>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 900, color: '#60A5FA' }}>GST Ready</Typography>
                  <Typography sx={{ fontSize: '0.58rem', color: '#93C5FD', fontWeight: 700 }}>GSTR-1 Filed</Typography>
                </Box>
              </Box>

              {/* Mockup */}
              <Box sx={{ boxShadow: '0 40px 120px rgba(0,0,0,0.55), 0 0 80px rgba(37,99,235,0.12)', borderRadius: 3, overflow: 'hidden' }}>
                <DashboardMockup />
              </Box>

              {/* Floating card — bottom: sync */}
              <Box sx={{
                position: 'absolute', bottom: -4, right: 32,
                display: { xs: 'none', lg: 'flex' },
                alignItems: 'center', gap: 0.8,
                px: 1.2, py: 0.7,
                bgcolor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: 2, backdropFilter: 'blur(12px)', zIndex: 10,
                animation: 'floatC 4.2s 1.1s ease-in-out infinite',
                '@keyframes floatC': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-5px)' } },
              }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#F59E0B', boxShadow: '0 0 6px #F59E0B', animation: 'blink 1.4s ease-in-out infinite', '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />
                <Typography sx={{ fontSize: '0.62rem', color: '#FCD34D', fontWeight: 700 }}>🔄 Live Sync Active</Typography>
              </Box>

              {/* Caption */}
              <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 3.5, color: '#2D4A6B', fontWeight: 600 }}>
                📊 {t('landingPage.hero.dashboardCaption')}
              </Typography>
            </Box>
          </Grid>

        </Grid>
      </Container>

      {/* Bottom gradient fade to white */}
      <Box sx={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 90, background: 'linear-gradient(to bottom, transparent, #F8FAFC)', pointerEvents: 'none' }} />
    </Box>
  );
};

export default HeroSection;
