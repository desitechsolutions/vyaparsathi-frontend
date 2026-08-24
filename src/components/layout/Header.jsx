import React, { useState } from 'react';
import {
  AppBar, Toolbar, Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Button, Stack, useMediaQuery, useTheme, Typography, skipToMainContentClasses,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '../../context/AuthContext';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import UserProfile from '../../pages/UserProfile';
import SettingsDialog from '../settings/SettingsDialog';
import ShopSwitcher from '../rbac/ShopSwitcher';

// Import new sub-components
import HeaderBrand from './HeaderBrand';
import HeaderSearch from './HeaderSearch';
import HeaderActions from './HeaderActions';
import HeaderUserProfile from './HeaderUserProfile';
import { useHeaderState } from '../../hooks/useHeaderState';

const Header = ({ onDrawerToggle }) => {
  const { user } = useAuthContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation();

  // Centralized state management
  const { state, handlers } = useHeaderState();

  // Shop switcher state
  const [shopSwitcherOpen, setShopSwitcherOpen] = useState(false);

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(135deg, primary.main 0%, primary.dark 100%)',
        }}
      >
        <Toolbar
          sx={{
            justifyContent: 'space-between',
            minHeight: { xs: 60, sm: 70 },
            gap: { xs: 1, sm: 2 },
          }}
        >
          {/* Left Section: Brand + Search */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexGrow: 1, minWidth: 0 }}>
            {/* Hamburger menu - mobile only */}
            {isMobile && (
              <Button
                color="inherit"
                onClick={onDrawerToggle}
                sx={{ minWidth: 44, p: 1 }}
                aria-label="Open navigation menu"
              >
                ☰
              </Button>
            )}

            {/* Brand / Logo */}
            <HeaderBrand
              onShopSwitcherOpen={() => setShopSwitcherOpen(true)}
              hideBrandName={isMobile}
            />

            {/* Search - Main component or mobile icon trigger */}
            {!isMobile && (
              <HeaderSearch
                mobileSearchOpen={false}
                onMobileSearchClose={() => {}}
                isMobile={isMobile}
                isTablet={isTablet}
              />
            )}

            {/* Mobile search icon only */}
            {isMobile && state.mobileSearchOpen && (
              <HeaderSearch
                mobileSearchOpen={state.mobileSearchOpen}
                onMobileSearchClose={handlers.closeMobileSearch}
                isMobile={isMobile}
                isTablet={isTablet}
              />
            )}
          </Box>

          {/* Mobile Search Icon Trigger */}
          {isMobile && !state.mobileSearchOpen && (
            <Button
              color="inherit"
              onClick={handlers.openMobileSearch}
              sx={{ minWidth: 44, p: 1 }}
              aria-label="Open search"
            >
              🔍
            </Button>
          )}

          {/* Shop Switcher - Desktop only */}
          {!isTablet && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ShopSwitcher onClose={() => setShopSwitcherOpen(false)} />
            </Box>
          )}

          {/* Right Section: Actions + User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* Header Actions (Notifications, Quick Actions, Theme, Language, Premium Badge) */}
            <HeaderActions
              notificationAnchor={state.notificationAnchor}
              onNotificationOpen={handlers.openNotificationMenu}
              onNotificationClose={handlers.closeNotificationMenu}
              quickActionAnchor={state.quickActionAnchor}
              onQuickActionOpen={handlers.openQuickActionMenu}
              onQuickActionClose={handlers.closeQuickActionMenu}
              themeMenuAnchor={state.themeMenuAnchor}
              onThemeMenuOpen={handlers.openThemeMenu}
              onThemeMenuClose={handlers.closeThemeMenu}
              languageMenuAnchor={state.languageMenuAnchor}
              onLanguageMenuOpen={handlers.openLanguageMenu}
              onLanguageMenuClose={handlers.closeLanguageMenu}
              isMobile={isMobile}
              isTablet={isTablet}
            />

            {/* User Profile Menu */}
            <HeaderUserProfile
              profileMenuAnchor={state.profileMenuAnchor}
              onProfileMenuOpen={handlers.openProfileMenu}
              onProfileMenuClose={handlers.closeProfileMenu}
              onProfileModalOpen={() => {
                handlers.closeProfileMenu();
                handlers.openProfileModal();
              }}
              onSettingsDialogOpen={() => {
                handlers.closeProfileMenu();
                handlers.openSettingsDialog();
              }}
              onSupportDialogOpen={() => {
                handlers.closeProfileMenu();
                handlers.openSupportDialog();
              }}
              isMobile={isMobile}
              isTablet={isTablet}
            />
          </Box>
        </Toolbar>
      </AppBar>

      {/* User Profile Modal */}
      {state.openProfileModal && (
        <UserProfile
          open={state.openProfileModal}
          onClose={handlers.closeProfileModal}
        />
      )}

      {/* Settings Dialog */}
      {state.openSettingsDialog && (
        <SettingsDialog
          open={state.openSettingsDialog}
          onClose={handlers.closeSettingsDialog}
        />
      )}

      {/* Support Dialog */}
      <Dialog
        open={state.openSupportDialog}
        onClose={handlers.closeSupportDialog}
        PaperProps={{ sx: { borderRadius: 3, maxWidth: 400 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, pb: 0 }}>
          {t('header.helpSupport')}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <DialogContentText>
            {t('header.contactUsDesc')}
          </DialogContentText>
          <Stack spacing={2} sx={{ mt: 3 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                Email:
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                support@birumatech.com
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                Phone:
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                +91-950-815-6282
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handlers.closeSupportDialog}
            variant="contained"
            fullWidth
            sx={{ borderRadius: 2 }}
          >
            {t('header.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Header;
