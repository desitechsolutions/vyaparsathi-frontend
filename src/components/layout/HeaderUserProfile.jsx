import React from 'react';
import {
  Box, Avatar, Typography, Menu, MenuItem, Divider, Stack, Button,
  ListItemIcon, useTheme, useMediaQuery, Badge,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import SupportIcon from '@mui/icons-material/Support';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LanguageIcon from '@mui/icons-material/Language';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import BrightnessAutoIcon from '@mui/icons-material/BrightnessAuto';
import PersonIcon from '@mui/icons-material/Person';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '../../context/AuthContext';
import { useThemeContext } from '../../context/ThemeContext';

const HeaderUserProfile = ({
  profileMenuAnchor,
  onProfileMenuOpen,
  onProfileMenuClose,
  onProfileModalOpen,
  onSettingsDialogOpen,
  onSupportDialogOpen,
  isMobile,
  isTablet,
}) => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { colorPreference, cycleColorPreference } = useThemeContext();

  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.sub || 'User' : 'User';
  const firstName = displayName.split(' ')[0];
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const themeIconMap = {
    light: <LightModeIcon sx={{ fontSize: 16 }} />,
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
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
          transition: 'opacity 200ms',
          '&:hover': { opacity: 0.85 },
          ml: 2,
        }}
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: 'rgba(255,255,255,0.25)',
            color: 'white',
            fontWeight: 600,
            border: '2px solid rgba(255,255,255,0.3)',
            transition: 'all 200ms',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.35)',
              borderColor: 'rgba(255,255,255,0.5)',
            },
          }}
        >
          {avatarLetter}
        </Avatar>

        {/* User name - shown on desktop only */}
        {!isMobile && (
          <Box sx={{ display: { xs: 'none', sm: 'none', md: 'block' } }}>
            <Typography
              variant="body2"
              sx={{ color: 'white', fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.2 }}
            >
              {firstName}
            </Typography>
          </Box>
        )}
      </Box>

      {/* User Profile Dropdown Menu */}
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={onProfileMenuClose}
        PaperProps={{
          sx: {
            minWidth: 300,
            borderRadius: 2,
            mt: 1.5,
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          },
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {/* Profile Header */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Badge badgeContent={user?.twoFactor ? '✓' : null} color="success">
              <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                {avatarLetter}
              </Avatar>
            </Badge>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>
                {displayName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email || user?.username || user?.sub}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 0.3,
                  textTransform: 'uppercase',
                  color: 'primary.main',
                  fontWeight: 600,
                  fontSize: '0.65rem',
                }}
              >
                {user?.role}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider />

        {/* Profile Menu Items */}
        <MenuItem onClick={onProfileModalOpen} sx={{ gap: 1, py: 1.2 }}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <Typography fontSize="0.9rem">My Profile</Typography>
        </MenuItem>

        <MenuItem onClick={() => handleNavigate('/account/security/mfa')} sx={{ gap: 1, py: 1.2 }}>
          <ListItemIcon>
            <ShieldOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <Typography fontSize="0.9rem">Account Security</Typography>
        </MenuItem>

        <MenuItem onClick={onSettingsDialogOpen} sx={{ gap: 1, py: 1.2 }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <Typography fontSize="0.9rem">Settings</Typography>
        </MenuItem>

        <MenuItem onClick={onSupportDialogOpen} sx={{ gap: 1, py: 1.2 }}>
          <ListItemIcon>
            <SupportIcon fontSize="small" />
          </ListItemIcon>
          <Typography fontSize="0.9rem">Help & Support</Typography>
        </MenuItem>

        {/* Mobile-only menu items */}
        {isMobile && (
          <>
            <Divider />

            {/* Quick Actions Section */}
            <Box sx={{ px: 1, py: 0.8 }}>
              <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: 'text.secondary' }}>
                Quick Actions
              </Typography>
            </Box>

            <MenuItem onClick={() => handleNavigate('/sales')} sx={{ gap: 1, py: 1 }}>
              <Typography fontSize="0.9rem">New Sale</Typography>
            </MenuItem>

            <MenuItem onClick={() => handleNavigate('/stock')} sx={{ gap: 1, py: 1 }}>
              <Typography fontSize="0.9rem">Add Product</Typography>
            </MenuItem>

            {/* Language Section */}
            <Divider />
            <Box sx={{ px: 1, py: 0.8 }}>
              <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: 'text.secondary' }}>
                Preferences
              </Typography>
            </Box>

            <MenuItem
              onClick={() => handleChangeLanguage(i18n.language === 'en' ? 'hi' : 'en')}
              sx={{ gap: 1, py: 1 }}
            >
              <ListItemIcon>
                <LanguageIcon fontSize="small" />
              </ListItemIcon>
              <Typography fontSize="0.9rem">
                Language: {i18n.language === 'en' ? 'हिंदी' : 'English'}
              </Typography>
            </MenuItem>

            <MenuItem onClick={cycleColorPreference} sx={{ gap: 1, py: 1 }}>
              <ListItemIcon>{themeIconMap[colorPreference]}</ListItemIcon>
              <Typography fontSize="0.9rem">Theme: {themeNextLabel[colorPreference]}</Typography>
            </MenuItem>
          </>
        )}

        {/* Logout Button */}
        <Divider />
        <MenuItem
          onClick={handleLogout}
          sx={{
            gap: 1,
            py: 1.2,
            color: 'error.main',
            '&:hover': { bgcolor: 'error.light', opacity: 0.1 },
          }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <ExitToAppIcon fontSize="small" />
          </ListItemIcon>
          <Typography fontSize="0.9rem" fontWeight={600}>
            Logout
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default HeaderUserProfile;
