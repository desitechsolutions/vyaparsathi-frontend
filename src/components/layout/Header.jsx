import React, { useState } from 'react';
import {
  AppBar, Toolbar, Box,
  Button, useMediaQuery, useTheme, skipToMainContentClasses,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '../../context/AuthContext';
import ShopSwitcher from '../rbac/ShopSwitcher';

// Import new sub-components
import HeaderBrand from './HeaderBrand';
import HeaderSearch from './HeaderSearch';
import HeaderActions from './HeaderActions';
import HeaderUserProfile from './HeaderUserProfile';
import { useHeaderState } from '../../hooks/useHeaderState';
import { useResponsiveTouchTarget } from '../../utils/touchTargets';

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
          boxShadow: '0 4px 20px rgba(25, 118, 210, 0.15)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(25, 118, 210, 0.95)',
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
                sx={{ minWidth: 44, minHeight: 44, p: 1 }}
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
              sx={{ minWidth: 44, minHeight: 44, p: 1 }}
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
              isMobile={isMobile}
              isTablet={isTablet}
            />
          </Box>
        </Toolbar>
      </AppBar>

    </>
  );
};

export default Header;
