import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Box,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import SupportIcon from '@mui/icons-material/Support';
import LanguageIcon from '@mui/icons-material/Language';
import { useTranslation } from 'react-i18next';
import UserProfile from '../../pages/UserProfile';

const AppBranding = () => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <TrendingUpOutlinedIcon sx={{ fontSize: { xs: 30, sm: 40 }, color: 'white', '&:hover': { color: '#fff' } }} />
      <Box>
        <Typography variant="h6" component="div" noWrap sx={{ fontWeight: '900', fontSize: { xs: '1.2rem', sm: '1.75rem' }, color: 'white' }}>
          {t('appName')}
        </Typography>
        <Typography variant="caption" component="div" noWrap sx={{ fontSize: { xs: '0.65rem', sm: '0.8rem' }, color: 'rgba(255, 255, 255, 0.8)', letterSpacing: 0.5, mt: -0.5, fontStyle: 'italic' }}>
          {t('tagline')}
        </Typography>
      </Box>
    </Box>
  );
};

const Header = () => {
  const { user, logout } = useAuthContext();
  const [openSupportDialog, setOpenSupportDialog] = useState(false);
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t, i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const username = user ? (user.name || user.sub || user.username || 'User') : '';
  const isLoggedIn = !!user;

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login');
  };
  const handleProfile = () => {
    setOpenProfileModal(true);
    handleClose();
  };
  const handleSettings = () => {
    handleClose();
    // Navigate to settings if implemented
  };
  const handleOpenSupport = () => setOpenSupportDialog(true);
  const handleCloseSupport = () => setOpenSupportDialog(false);
  const handleCloseProfileModal = () => setOpenProfileModal(false);
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      color="primary"
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <AppBranding />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {!isLoggedIn ? (
            <Button color="inherit" onClick={() => navigate('/login')} sx={{ textTransform: 'none', fontWeight: 500 }}>
              {t('header.login')}
            </Button>
          ) : (
            <>
              {!isMobile && (
                <Typography
                  variant="body1"
                  sx={{ color: 'inherit', marginRight: 2, fontWeight: 500, cursor: 'pointer' }}
                  onClick={handleProfile}
                >
                  {username}
                </Typography>
              )}
              <Tooltip title={t('header.getSupport')} placement="bottom">
                <IconButton
                  size="medium"
                  color="inherit"
                  onClick={handleOpenSupport}
                  sx={{ marginRight: 2, '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
                >
                  <SupportIcon sx={{ fontSize: 20, color: 'white' }} />
                </IconButton>
              </Tooltip>
              <IconButton
                size="small"
                color="inherit"
                onClick={() => changeLanguage(i18n.language === 'en' ? 'hi' : 'en')}
                sx={{ marginRight: 2, '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
              >
                <LanguageIcon sx={{ fontSize: 20, color: 'white' }} />
                <Typography variant="caption" sx={{ ml: 0.5, color: 'white' }}>
                  {i18n.language === 'en' ? 'हिंदी' : 'English'}
                </Typography>
              </IconButton>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
                sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
              >
                <Avatar sx={{ bgcolor: 'white', color: theme.palette.primary.main, width: 32, height: 32 }}>
                  {username.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={open}
                onClose={handleClose}
                PaperProps={{ sx: { borderRadius: 2, boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', minWidth: 200 } }}
              >
                <MenuItem onClick={handleProfile} sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
                  <AccountCircleIcon sx={{ marginRight: 1 }} /> {t('header.profile')}
                </MenuItem>
                <MenuItem onClick={handleSettings} sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
                  <SettingsIcon sx={{ marginRight: 1 }} /> {t('header.settings')}
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
                  <ExitToAppIcon sx={{ marginRight: 1 }} /> {t('header.logout')}
                </MenuItem>
              </Menu>
              <Dialog open={openSupportDialog} onClose={handleCloseSupport}>
                <Box sx={{ p: 2 }}>
                  <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>{t('header.supportTitle')}</DialogTitle>
                  <DialogContent>
                    <DialogContentText sx={{ textAlign: 'center', mb: 2 }}>
                      {t('header.supportText')}
                    </DialogContentText>
                    <Typography variant="body1" sx={{ mt: 1, textAlign: 'center' }}><strong>{t('header.supportEmail')}</strong> support@vyaparsathi.com</Typography>
                    <Typography variant="body1" sx={{ mt: 1, textAlign: 'center' }}><strong>{t('header.supportPhone')}</strong> +91-950-815-6282</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                      {t('header.supportClosing')}
                    </Typography>
                  </DialogContent>
                  <DialogActions sx={{ justifyContent: 'center', mt: 2 }}>
                    <Button onClick={handleCloseSupport} variant="contained" color="primary">{t('header.close')}</Button>
                  </DialogActions>
                </Box>
              </Dialog>
              <UserProfile open={openProfileModal} onClose={handleCloseProfileModal} />
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;