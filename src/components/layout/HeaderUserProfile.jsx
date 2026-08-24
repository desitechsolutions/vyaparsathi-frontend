import React from 'react';
import {
  Box, Avatar, Typography, Menu, MenuItem, Divider, Stack, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, ListItemIcon, useTheme,
  Badge, Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  ShieldOutlined as ShieldOutlinedIcon,
  Settings as SettingsIcon,
  ExitToApp as ExitToAppIcon,
  Support as SupportIcon,
  Storefront as StorefrontIcon,
  HelpOutline as HelpOutlineIcon,
  Lock as LockIcon,
  Keyboard as KeyboardIcon,
  Assignment as AssignmentIcon,
  Language as LanguageIcon,
  BrightnessHigh as BrightnessHighIcon,
  DarkMode as DarkModeIcon,
  BrightnessAuto as BrightnessAutoIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '../../context/AuthContext';
import { useThemeContext } from '../../context/ThemeContext';
import { useShop } from '../../context/ShopContext';

const APP_VERSION = process.env.REACT_APP_VERSION || '1.0.0';
const BUILD_HASH = process.env.REACT_APP_BUILD_HASH || 'dev';

const HeaderUserProfile = ({
  profileMenuAnchor,
  onProfileMenuOpen,
  onProfileMenuClose,
  isMobile,
  isTablet,
}) => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { colorPreference, cycleColorPreference } = useThemeContext();
  const { shop } = useShop();

  const [showAboutModal, setShowAboutModal] = React.useState(false);

  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.sub || 'User' : 'User';
  const firstName = displayName.split(' ')[0];
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const themeIconMap = {
    light: <BrightnessHighIcon sx={{ fontSize: 16 }} />,
    dark: <DarkModeIcon sx={{ fontSize: 16 }} />,
    auto: <BrightnessAutoIcon sx={{ fontSize: 16 }} />,
  };

  const themeNextLabel = { light: 'Dark', dark: 'Auto', auto: 'Light' };

  const handleLogout = () => {
    onProfileMenuClose();
    logout();
  };

  const handleNavigate = (path) => {
    onProfileMenuClose();
    navigate(path);
  };

  const handleChangeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <>
      {/* User Avatar Button */}
      <Box
        onClick={onProfileMenuOpen}
        role="button"
        tabIndex={0}
        aria-label={`User menu: ${displayName}`}
        aria-expanded={Boolean(profileMenuAnchor)}
        aria-haspopup="menu"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onProfileMenuOpen(e);
          }
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
          transition: 'all 200ms',
          '&:hover': { opacity: 0.85 },
          '&:focus': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            borderRadius: 1,
          },
          ml: 2,
        }}
      >
        <Badge
          overlap="circular"
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          variant="dot"
          sx={{
            '& .MuiBadge-badge': {
              backgroundColor: user?.twoFactor ? '#44b700' : '#999',
              boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
            },
          }}
        >
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: 'primary.main',
              color: 'white',
              fontWeight: 700,
              border: '2px solid rgba(255,255,255,0.3)',
              transition: 'all 200ms',
              '&:hover': {
                boxShadow: `0 0 0 4px ${theme.palette.primary.light}`,
              },
            }}
          >
            {avatarLetter}
          </Avatar>
        </Badge>

        {/* User name - shown on desktop only */}
        {!isMobile && (
          <Box sx={{ display: { xs: 'none', sm: 'none', md: 'block' } }}>
            <Typography
              variant="body2"
              sx={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2 }}
            >
              {firstName}
            </Typography>
          </Box>
        )}
      </Box>

      {/* User Profile Dropdown Menu - ENTERPRISE TIER-1 DESIGN */}
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={onProfileMenuClose}
        PaperProps={{
          sx: {
            minWidth: 380,
            borderRadius: 2,
            mt: 1.5,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            background: 'background.paper',
          },
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {/* ===== USER & TENANT HEADER CARD ===== */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48, fontWeight: 700 }}>
              {avatarLetter}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.2 }}>
                {displayName}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                {user?.email || user?.username}
              </Typography>
              <Stack direction="row" spacing={0.8}>
                <Chip
                  label={user?.role || 'User'}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 22,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                />
                {user?.twoFactor && (
                  <Chip
                    icon={<ShieldOutlinedIcon sx={{ fontSize: '12px !important' }} />}
                    label="2FA"
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{
                      height: 22,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                    }}
                  />
                )}
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Active Business / Tenant Display */}
        <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover', borderRadius: 1, mx: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <StorefrontIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700 }}>
                Active Shop
              </Typography>
              <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                {shop?.name || 'Shop'}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* ===== ACCOUNT & WORKSPACE SETTINGS ===== */}
        <Box sx={{ px: 1.5, py: 1 }}>
          <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem' }}>
            Account & Settings
          </Typography>
        </Box>

        <MenuItem
          onClick={() => handleNavigate('/account/profile')}
          sx={{ gap: 1.5, py: 1.2, '&:hover': { bgcolor: 'action.hover' } }}
        >
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <Box flex={1}>
            <Typography fontSize="0.9rem" fontWeight={500}>
              Profile & Security
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Personal info, password, 2FA
            </Typography>
          </Box>
        </MenuItem>

        <MenuItem
          onClick={() => handleNavigate('/admin/settings')}
          sx={{ gap: 1.5, py: 1.2, '&:hover': { bgcolor: 'action.hover' } }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <Box flex={1}>
            <Typography fontSize="0.9rem" fontWeight={500}>
              Business Settings
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              GST, invoicing, printers
            </Typography>
          </Box>
        </MenuItem>

        <MenuItem
          onClick={() => handleNavigate('/admin/team')}
          sx={{ gap: 1.5, py: 1.2, '&:hover': { bgcolor: 'action.hover' } }}
        >
          <ListItemIcon>
            <AssignmentIcon fontSize="small" />
          </ListItemIcon>
          <Box flex={1}>
            <Typography fontSize="0.9rem" fontWeight={500}>
              Staff & Roles
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              RBAC permissions
            </Typography>
          </Box>
        </MenuItem>

        <Divider sx={{ my: 1.5 }} />

        {/* ===== PREFERENCES ===== */}
        <Box sx={{ px: 1.5, py: 1 }}>
          <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem' }}>
            Preferences
          </Typography>
        </Box>

        <MenuItem
          onClick={() => {
            handleChangeLanguage(i18n.language === 'en' ? 'hi' : 'en');
          }}
          sx={{ gap: 1.5, py: 1 }}
        >
          <ListItemIcon>
            <LanguageIcon fontSize="small" />
          </ListItemIcon>
          <Typography fontSize="0.9rem">
            Language: {i18n.language === 'en' ? 'हिंदी' : 'English'}
          </Typography>
        </MenuItem>

        <MenuItem
          onClick={cycleColorPreference}
          sx={{ gap: 1.5, py: 1 }}
        >
          <ListItemIcon>{themeIconMap[colorPreference]}</ListItemIcon>
          <Typography fontSize="0.9rem">
            Theme: {themeNextLabel[colorPreference]}
          </Typography>
        </MenuItem>

        <Divider sx={{ my: 1.5 }} />

        {/* ===== SUPPORT & RESOURCES ===== */}
        <Box sx={{ px: 1.5, py: 1 }}>
          <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: 'text.secondary', fontSize: '0.7rem' }}>
            Support & Resources
          </Typography>
        </Box>

        <MenuItem
          onClick={() => handleNavigate('/user/help')}
          sx={{ gap: 1.5, py: 1, '&:hover': { bgcolor: 'action.hover' } }}
        >
          <ListItemIcon>
            <SupportIcon fontSize="small" />
          </ListItemIcon>
          <Typography fontSize="0.9rem">Help & Support</Typography>
        </MenuItem>

        <MenuItem
          onClick={() => handleNavigate('/user/keyboard-shortcuts')}
          sx={{ gap: 1.5, py: 1, '&:hover': { bgcolor: 'action.hover' } }}
        >
          <ListItemIcon>
            <KeyboardIcon fontSize="small" />
          </ListItemIcon>
          <Typography fontSize="0.9rem">Keyboard Shortcuts</Typography>
        </MenuItem>

        <MenuItem
          onClick={() => {
            window.open('https://docs.vyaparsathi.com', '_blank');
            onProfileMenuClose();
          }}
          sx={{ gap: 1.5, py: 1, '&:hover': { bgcolor: 'action.hover' } }}
        >
          <ListItemIcon>
            <HelpOutlineIcon fontSize="small" />
          </ListItemIcon>
          <Typography fontSize="0.9rem">Documentation</Typography>
        </MenuItem>

        <MenuItem
          onClick={() => handleNavigate('/user/preferences')}
          sx={{ gap: 1.5, py: 1, '&:hover': { bgcolor: 'action.hover' } }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <Typography fontSize="0.9rem">Preferences</Typography>
        </MenuItem>

        <Divider sx={{ my: 1.5 }} />

        {/* ===== DANGER / EXIT ZONE ===== */}
        <MenuItem
          onClick={() => handleNavigate('/user/lock-screen')}
          sx={{ gap: 1.5, py: 1.2, '&:hover': { bgcolor: 'action.hover' } }}
        >
          <ListItemIcon>
            <LockIcon fontSize="small" />
          </ListItemIcon>
          <Typography fontSize="0.9rem">Lock Screen</Typography>
        </MenuItem>

        <MenuItem
          onClick={handleLogout}
          sx={{
            gap: 1.5,
            py: 1.2,
            color: 'error.main',
            '&:hover': { bgcolor: 'error.light', color: 'error.dark' },
          }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <ExitToAppIcon fontSize="small" />
          </ListItemIcon>
          <Typography fontSize="0.9rem" fontWeight={600}>
            Sign Out
          </Typography>
        </MenuItem>

        {/* ===== FOOTER / ABOUT & DIAGNOSTICS ===== */}
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() => {
            onProfileMenuClose();
            setShowAboutModal(true);
          }}
          sx={{
            px: 1.5,
            py: 0.8,
            bgcolor: 'action.hover',
            justifyContent: 'center',
            fontSize: '0.7rem',
            color: 'text.secondary',
            '&:hover': { color: 'text.primary' },
          }}
        >
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
            VyaparSathi v{APP_VERSION} (Build {BUILD_HASH.slice(0, 8)})
          </Typography>
        </MenuItem>
      </Menu>

      {/* About & System Status Modal */}
      <Dialog
        open={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>About VyaparSathi</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                Company
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Biruma Technology Solutions Pvt. Ltd.
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                Version & Build
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2">v{APP_VERSION}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Build: {BUILD_HASH}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                System Status
              </Typography>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption">Active Shop ID:</Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {user?.shopId}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption">User ID:</Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {user?.sub}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              const diagnostics = `Shop: ${user?.shopId} | User: ${user?.sub} | Version: ${APP_VERSION}`;
              navigator.clipboard.writeText(diagnostics);
            }}
          >
            Copy Diagnostics
          </Button>
          <Button variant="contained" size="small" onClick={() => setShowAboutModal(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

    </>
  );
};

export default HeaderUserProfile;
