import React from 'react';
import { Outlet, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Stack,
  Button,
  IconButton,
  Chip,
  Container,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import StarIcon from '@mui/icons-material/Star';
import LanguageIcon from '@mui/icons-material/Language';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTranslation } from 'react-i18next';

// ─── Dashboard Mockup (Visual ERP representation) ───
const DashboardMockup = () => (
  <Box
    sx={{
      width: '100%',
      aspectRatio: '16/10',
      borderRadius: 3,
      overflow: 'hidden',
      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
      position: 'relative',
    }}
  >
    {/* Top Bar */}
    <Box
      sx={{
        height: 36,
        bgcolor: '#0B0F19',
        display: 'flex',
        alignItems: 'center',
        px: 2,
        gap: 1,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#EF4444' }} />
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#F59E0B' }} />
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981' }} />
      <Box sx={{ flex: 1, mx: 2, height: 18, bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 1 }} />
    </Box>

    {/* Sidebar + Content */}
    <Box sx={{ display: 'flex', height: 'calc(100% - 36px)' }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: 44,
          bgcolor: '#0B0F19',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {['📊', '📦', '🧾', '👥', '⚙️'].map((icon, i) => (
          <Box
            key={i}
            sx={{
              width: 24,
              height: 24,
              bgcolor: i === 0 ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)',
              border: i === 0 ? '1px solid rgba(245,158,11,0.3)' : 'none',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
            }}
          >
            {icon}
          </Box>
        ))}
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 1.5, overflow: 'hidden' }}>
        {/* Stats Row */}
        <Grid container spacing={1} sx={{ mb: 1.5 }}>
          {[
            { label: "Today's Sales", value: '₹24,580', color: '#F59E0B' },
            { label: 'Customers', value: '1,240', color: '#10B981' },
            { label: 'Pending Dues', value: '₹8,920', color: '#EF4444' },
          ].map((stat, i) => (
            <Grid item xs={4} key={i}>
              <Box
                sx={{
                  p: 1,
                  bgcolor: 'rgba(255,255,255,0.02)',
                  borderRadius: 1.5,
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <Typography sx={{ fontSize: '0.5rem', color: '#64748B', fontWeight: 600 }}>
                  {stat.label}
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: stat.color, mt: 0.1 }}>
                  {stat.value}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Graph / List */}
        <Box
          sx={{
            p: 1,
            bgcolor: 'rgba(255,255,255,0.01)',
            borderRadius: 1.5,
            border: '1px solid rgba(255,255,255,0.04)',
            height: 'calc(100% - 65px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ width: 50, height: 6, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }} />
            <Box sx={{ width: 25, height: 6, bgcolor: 'rgba(16,185,129,0.2)', borderRadius: 1 }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.6, height: '70%', px: 1 }}>
            {[30, 50, 40, 75, 55, 90, 80, 95].map((h, i) => (
              <Box
                key={i}
                sx={{
                  flex: 1,
                  height: `${h}%`,
                  bgcolor: i === 7 ? '#F59E0B' : 'rgba(245,158,11,0.2)',
                  borderRadius: '2px 2px 0 0',
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  </Box>
);

const AuthLayout = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const featureHighlights = [
    { title: 'GST-Ready Invoicing', desc: 'Generate professional invoices in under a minute.' },
    { title: 'Smart Inventory', desc: 'Track stock items and get automated low stock alerts.' },
    { title: 'Automatic Reminders', desc: 'Send automated WhatsApp reminders for outstanding dues.' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: '#F8FAFC' }}>
      <Grid container sx={{ flex: 1 }}>
        {/* ── LEFT PANEL (60% on Desktop, hidden on mobile) ── */}
        <Grid
          item
          xs={false}
          md={6}
          lg={7}
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #0F172A 100%)',
            color: '#FFFFFF',
            position: 'relative',
            overflow: 'hidden',
            p: { md: 6, lg: 8 },
          }}
        >
          {/* Decorative Background Effects */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              opacity: 0.03,
              backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(to right, #ffffff 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '-10%',
              left: '-10%',
              width: 400,
              height: 400,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)',
              filter: 'blur(50px)',
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: '-10%',
              right: '-10%',
              width: 500,
              height: 500,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
              filter: 'blur(60px)',
              pointerEvents: 'none',
            }}
          />

          {/* Logo & Header */}
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              textDecoration: 'none',
              zIndex: 2,
              alignSelf: 'flex-start',
            }}
          >
            <img
              src="/desitechsolution.png"
              alt="VyaparSathi Logo"
              style={{ height: 42, width: 'auto', objectFit: 'contain' }}
            />
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  background: 'linear-gradient(90deg, #F59E0B, #EF4444)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1,
                }}
              >
                VyaparSathi
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                Business ERP Platform
              </Typography>
            </Box>
          </Box>

          {/* Content Middle Section */}
          <Box sx={{ zIndex: 2, my: 4, maxWidth: 540 }}>
            <Typography variant="h3" fontWeight={900} letterSpacing="-1px" sx={{ mb: 2, lineHeight: 1.15 }}>
              Simplifying{' '}
              <Box component="span" sx={{ color: '#F59E0B' }}>
                Vyapar
              </Box>{' '}
              for Indian Businesses
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 4, fontSize: '1.1rem' }}>
              Create GST bills, manage real-time inventory, track dues, and get smart financial insights to take your shop to the next level.
            </Typography>

            {/* Dashboard Mockup Display */}
            <Box sx={{ mb: 4 }}>
              <DashboardMockup />
            </Box>

            {/* Features Bullet List */}
            <Stack spacing={2.5}>
              {featureHighlights.map((feat, idx) => (
                <Stack key={idx} direction="row" spacing={2} alignItems="flex-start">
                  <CheckCircleIcon sx={{ color: '#F59E0B', mt: 0.3, fontSize: 20 }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {feat.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      {feat.desc}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Bottom Row / Stats / Badges */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', pt: 3, zIndex: 2 }}
          >
            {/* Stats */}
            <Stack direction="row" spacing={4}>
              <Box>
                <Typography variant="h6" fontWeight={800} color="#F59E0B">
                  10+
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  Active Shops
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800} color="#F59E0B">
                  ₹10Lakh+
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  Transacted Volume
                </Typography>
              </Box>
            </Stack>

            {/* Security Indicators */}
            <Stack direction="row" spacing={1.5}>
              <Chip
                icon={<SecurityIcon style={{ color: '#10B981', fontSize: 14 }} />}
                label="Bank-grade Security"
                size="small"
                sx={{
                  bgcolor: 'rgba(16,185,129,0.1)',
                  color: '#10B981',
                  border: '1px solid rgba(16,185,129,0.2)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  '& .MuiChip-icon': { marginLeft: '8px' },
                }}
              />
              <Chip
                label="Made in India 🇮🇳"
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.06)',
                  color: '#FFF',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}
              />
            </Stack>
          </Stack>
        </Grid>

        {/* ── RIGHT PANEL (40% on Desktop, 100% on Mobile) ── */}
        <Grid
          item
          xs={12}
          md={6}
          lg={5}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#FFFFFF',
            minHeight: '100vh',
          }}
        >
          {/* Top Actions: Back to Home + Language Selector */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: { xs: 3, sm: 4 },
              py: 2.5,
              borderBottom: '1px solid rgba(0,0,0,0.04)',
              flexShrink: 0,
            }}
          >
            <Button
              component={RouterLink}
              to="/"
              startIcon={<ArrowBackIcon />}
              sx={{
                color: 'text.secondary',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                '&:hover': { color: 'primary.main', bgcolor: 'transparent' },
              }}
            >
              Back to home
            </Button>

            <Button
              onClick={toggleLanguage}
              startIcon={<LanguageIcon />}
              variant="outlined"
              size="small"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                color: 'text.primary',
                borderColor: 'divider',
                px: 2,
                py: 0.6,
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'rgba(37,99,235,0.04)',
                },
              }}
            >
              {i18n.language === 'en' ? 'हिन्दी' : 'English'}
            </Button>
          </Box>

          {/* Centered Scrollable Form Container */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              pt: { xs: 4, md: 5, lg: 6 },
              pb: { xs: 4, md: 5 },
              px: { xs: 3, sm: 5, md: 7, lg: 9 },
              overflowY: 'auto',
            }}
          >
            <Box sx={{ width: '100%', maxWidth: 420 }}>
              {/* Logo block visible ONLY on Mobile */}
              <Box
                sx={{
                  display: { xs: 'flex', md: 'none' },
                  alignItems: 'center',
                  gap: 1.5,
                  mb: 4,
                  justifyContent: 'center',
                }}
              >
                <img
                  src="/desitechsolution.png"
                  alt="VyaparSathi Logo"
                  style={{ height: 36, width: 'auto' }}
                />
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 900,
                      background: 'linear-gradient(90deg, #F59E0B, #EF4444)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      lineHeight: 1,
                    }}
                  >
                    VyaparSathi
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Business ERP Platform
                  </Typography>
                </Box>
              </Box>

              <Outlet />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AuthLayout;
