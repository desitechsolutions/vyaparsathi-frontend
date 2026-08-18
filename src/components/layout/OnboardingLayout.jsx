import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import LanguageIcon from '@mui/icons-material/Language';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '../../context/AuthContext';
import BrandMark from '../branding/BrandMark';

/**
 * OnboardingLayout — dedicated frame for the /setup-shop wizard.
 *
 * Unlike the AuthLayout split-screen (which is designed for compact
 * login/signup forms), this layout gives the wizard the full viewport
 * width. It provides:
 *
 *   1. Sticky top bar with brand mark, sign-out and language toggle.
 *   2. A wide centered container (max 1120 px) so the two-column body
 *      inside SetupShop (step-nav rail + form) has room to breathe.
 *
 * All wizard-specific chrome (per-step title, step counter, progress
 * bar) lives inside the SetupShop page itself so it can react to state
 * without prop drilling through the layout.
 */
const OnboardingLayout = () => {
  const { t, i18n } = useTranslation();
  const { logout, user } = useAuthContext();

  const toggleLanguage = () => {
    const next = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('language', next);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        elevation={0}
        color="inherit"
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, md: 72 }, px: { xs: 2, md: 4 } }}>
          <BrandMark size="sm" tagline={t('onboardingLayout.subtitle', 'Business ERP Platform')} />

          <Box sx={{ flex: 1 }} />

          <Stack direction="row" spacing={1.5} alignItems="center">
            {user?.email && (
              <Chip
                label={user.email}
                size="small"
                variant="outlined"
                sx={{ display: { xs: 'none', md: 'flex' }, fontWeight: 600 }}
              />
            )}
            <Button
              onClick={toggleLanguage}
              startIcon={<LanguageIcon />}
              size="small"
              variant="outlined"
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              {i18n.language === 'en' ? 'हिन्दी' : 'English'}
            </Button>
            <Tooltip title={t('onboardingLayout.signOut', 'Sign out')}>
              <IconButton onClick={logout} aria-label="Sign out" size="small">
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth={false}
        sx={{ flex: 1, py: { xs: 3, md: 5 }, px: { xs: 2, md: 4 }, maxWidth: 1120, mx: 'auto', width: '100%' }}
      >
        <Outlet />
      </Container>

      <Box
        component="footer"
        sx={{
          py: 2.5,
          px: { xs: 2, md: 4 },
          textAlign: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack spacing={0.5} alignItems="center">
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            &copy; {new Date().getFullYear()} Biruma Technology Solutions Pvt. Ltd.
            &nbsp;&middot;&nbsp; GSTIN 06AAOCB1973G1ZJ
            &nbsp;&middot;&nbsp; CIN U62010HR2025PTC139151
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Registered Office: Arjun Nagar, Gurgaon, Haryana &ndash; 122001 &middot; Made in India for Indian businesses
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
};

export default OnboardingLayout;
