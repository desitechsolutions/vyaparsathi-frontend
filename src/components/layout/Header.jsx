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
import { logout, decodeToken } from '../../utils/auth';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import SupportIcon from '@mui/icons-material/Support';
import LanguageIcon from '@mui/icons-material/Language';
import { useTranslation } from 'react-i18next';

const AppBranding = () => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <TrendingUpOutlinedIcon
        sx={{
          fontSize: { xs: 30, sm: 40 },
          color: 'white',
          '&:hover': { color: '#fff' },
        }}
      />
      <Box>
        <Typography
          variant="h6"
          component="div"
          noWrap
          sx={{
            fontWeight: '900',
            fontSize: { xs: '1.2rem', sm: '1.75rem' },
            color: 'white',
          }}
        >
          VyaparSathi
        </Typography>
        <Typography
          variant="caption"
          component="div"
          noWrap
          sx={{
            fontSize: { xs: '0.65rem', sm: '0.8rem' },
            color: 'rgba(255, 255, 255, 0.8)',
            letterSpacing: 0.5,
            mt: -0.5,
            fontStyle: 'italic',
          }}
        >
          Safal Vyapar, Aasan Hisab
        </Typography>
      </Box>
    </Box>
  );
};

const Header = () => {
  const [openSupportDialog, setOpenSupportDialog] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const token = localStorage.getItem('token');
  const { t, i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  let username = '';
  let isLoggedIn = false;

  if (token) {
    try {
      const decoded = decodeToken(token);
      username = decoded.sub || decoded.username || 'User';
      isLoggedIn = true;
    } catch (error) {
      console.error('Failed to decode token:', error);
      localStorage.removeItem('token');
      username = '';
      isLoggedIn = false;
    }
  }

  // Debug log
  // Remove this after confirming
  console.log('Header token:', token, 'username:', username, 'isLoggedIn:', isLoggedIn);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    handleClose();
    // Example: navigate('/profile');
  };

  const handleSettings = () => {
    handleClose();
    // Example: navigate('/settings');
  };

  const handleOpenSupport = () => {
    setOpenSupportDialog(true);
  };

  const handleCloseSupport = () => {
    setOpenSupportDialog(false);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <AppBranding />

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {!isLoggedIn ? (
            <Button
              color="inherit"
              onClick={() => navigate('/login')}
              sx={{ textTransform: 'none', fontWeight: 500 }}
            >
              Login
            </Button>
          ) : (
            <>
              {!isMobile && (
                <Typography
                  variant="body1"
                  sx={{ color: 'inherit', marginRight: 2, fontWeight: 500 }}
                >
                  {username}
                </Typography>
              )}
              <Tooltip title="Get Support" placement="bottom">
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
                <Avatar
                  sx={{
                    bgcolor: 'white',
                    color: theme.palette.primary.main,
                    width: 32,
                    height: 32,
                  }}
                >
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
                PaperProps={{
                  sx: {
                    borderRadius: 2,
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                    minWidth: 200,
                  },
                }}
              >
                <MenuItem onClick={handleProfile} sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
                  <AccountCircleIcon sx={{ marginRight: 1 }} /> Profile
                </MenuItem>
                <MenuItem onClick={handleSettings} sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
                  <SettingsIcon sx={{ marginRight: 1 }} /> Settings
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
                  <ExitToAppIcon sx={{ marginRight: 1 }} /> Logout
                </MenuItem>
              </Menu>
              <Dialog
                open={openSupportDialog}
                onClose={handleCloseSupport}
              >
                <Box sx={{ p: 2 }}>
                  <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                    How can we help you?
                  </DialogTitle>
                  <DialogContent>
                    <DialogContentText sx={{ textAlign: 'center', mb: 2 }}>
                      Our support team is ready to assist you.
                      You can reach us through the following channels:
                    </DialogContentText>
                    <Typography variant="body1" sx={{ mt: 1, textAlign: 'center' }}>
                      <strong>Email:</strong> support@vyaparsathi.com
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1, textAlign: 'center' }}>
                      <strong>Phone:</strong> +91-950-815-6282
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                      We will get back to you as soon as possible.
                    </Typography>
                  </DialogContent>
                  <DialogActions sx={{ justifyContent: 'center', mt: 2 }}>
                    <Button onClick={handleCloseSupport} variant="contained" color="primary">
                      Close
                    </Button>
                  </DialogActions>
                </Box>
              </Dialog>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;