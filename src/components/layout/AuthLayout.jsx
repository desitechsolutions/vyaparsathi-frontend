import React from 'react';
import { Outlet, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Stack,
  Button,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import LanguageIcon from '@mui/icons-material/Language';
import { useTranslation } from 'react-i18next';
import BrandMark from '../branding/BrandMark';

/**
 * Auth split-screen shell.
 *
 * Left panel — one anchor pattern (Zoho / Salesforce / Xero convention):
 *   BrandMark → concise headline → single pull-quote card → subdued trust
 *   chips. No fake dashboards, no stats-that-look-small, no marketing
 *   bullet list — everything competes for attention on a login page and
 *   the point is to get the user IN, not to sell.
 *
 * Right panel — unchanged: back-to-home + language toggle chrome, then
 *   the centered form (Outlet) that Login/Register/ForgotPassword render.
 *
 * 50/50 split at md+, single-column at xs/sm so mobile just gets the form.
 */
const AuthLayout = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>
      <Grid container sx={{ flex: 1 }}>
        {/* ── LEFT PANEL (50% on desktop, hidden on mobile) ── */}
        <Grid
          item
          xs={false}
          md={6}
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'space-between',
            // Solid deep navy with one soft accent gradient at the top-
            // right corner — matches how Salesforce / Linear use one
            // muted accent per surface instead of stacked gradients.
            background: 'radial-gradient(circle at 90% 10%, rgba(245,158,11,0.10) 0%, rgba(245,158,11,0) 45%), #0B1220',
            color: '#FFFFFF',
            position: 'relative',
            overflow: 'hidden',
            p: { md: 6, lg: 8 },
          }}
        >
          {/* Brand mark */}
          <BrandMark
            size="lg"
            variant="dark"
            showTagline
            sx={{ zIndex: 2, alignSelf: 'flex-start' }}
          />

          {/* Middle — headline + subhead + pull-quote card */}
          <Box sx={{ zIndex: 2, maxWidth: 520 }}>
            <Typography
              variant="h3"
              fontWeight={800}
              letterSpacing="-1.2px"
              sx={{ mb: 2, lineHeight: 1.1 }}
            >
              Run your entire shop
              <br />
              from{' '}
              <Box component="span" sx={{ color: '#F59E0B' }}>
                one login
              </Box>
              .
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255,255,255,0.72)',
                mb: 5,
                fontSize: '1.05rem',
                lineHeight: 1.55,
                maxWidth: 460,
              }}
            >
              Billing, stock, GST returns and dues — the same data everywhere,
              on every device your team signs in from.
            </Typography>

            {/*
              Pull-quote card. Intentionally NOT attributed to a fabricated
              person — attributing to "Rajesh Sharma, Sharma Traders" when
              no such customer exists would be misleading. Replace `quote`
              + `author` with real values when a real testimonial is
              collected, or keep this framing as an anonymous product-voice
              card in the meantime.
            */}
            <Box
              sx={{
                position: 'relative',
                p: { md: 3, lg: 4 },
                borderRadius: 3,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <FormatQuoteIcon
                sx={{
                  position: 'absolute',
                  top: 12,
                  left: 16,
                  fontSize: 40,
                  color: 'rgba(245,158,11,0.35)',
                  transform: 'scaleX(-1)',
                }}
                aria-hidden
              />
              <Typography
                variant="body1"
                sx={{
                  pl: 5,
                  color: 'rgba(255,255,255,0.92)',
                  fontStyle: 'italic',
                  fontSize: '1.05rem',
                  lineHeight: 1.55,
                }}
              >
                One place for every invoice, every rupee, every GSTR — so a
                whole afternoon's work is a couple of clicks, not a folder of
                spreadsheets.
              </Typography>
            </Box>
          </Box>

          {/* Bottom — trust chips (subdued, not competing with the anchor) */}
          <Stack
            direction="row"
            spacing={1.5}
            flexWrap="wrap"
            useFlexGap
            sx={{ zIndex: 2, pt: 3 }}
          >
            <Chip
              size="small"
              icon={<LockOutlinedIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.7) !important' }} />}
              label="Bank-grade encryption"
              sx={{
                bgcolor: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontSize: '0.72rem',
                fontWeight: 600,
                '& .MuiChip-icon': { marginLeft: '8px' },
              }}
            />
            <Chip
              size="small"
              icon={<VerifiedUserOutlinedIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.7) !important' }} />}
              label="GST-compliant · IN-hosted data"
              sx={{
                bgcolor: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontSize: '0.72rem',
                fontWeight: 600,
                '& .MuiChip-icon': { marginLeft: '8px' },
              }}
            />
          </Stack>
        </Grid>

        {/* ── RIGHT PANEL (50% on desktop, 100% on mobile) ── */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
            minHeight: '100vh',
          }}
        >
          {/* Top chrome — back to home + language toggle */}
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

          {/* Centered scrollable form container */}
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
              {/* Mobile-only brand mark — desktop shows it in the left panel */}
              <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 4 }}>
                <BrandMark size="md" />
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
