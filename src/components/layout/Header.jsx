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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { logout, decodeToken } from '../../utils/auth';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

const Header = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const token = localStorage.getItem('token');
  let username = 'Guest';

  // State for the dropdown menu
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Decode the token to get the username if it exists
  if (token) {
    try {
      const decoded = decodeToken(token);
      username = decoded.sub || 'User'; // 'sub' as username
    } catch (error) {
      console.error('Failed to decode token:', error);
      localStorage.removeItem('token');
      username = 'Guest';
    }
  }

  // Event handlers for the dropdown menu
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
    console.log('Navigate to profile page');
    // Example: navigate('/profile');
  };

  const handleSettings = () => {
    handleClose();
    console.log('Navigate to settings page');
    // Example: navigate('/settings');
  };

  return (
    <AppBar
      position="static" // Revert to static position like the earlier version
      color="primary" // Revert to primary color from the theme
    >
      <Toolbar
        sx={{
          justifyContent: 'space-between'
        }}
      >
        <Typography
          variant="h6"
          component="div"
          noWrap
          sx={{
            fontWeight: 'bold',
            fontSize: { xs: '1.2rem', sm: '1.5rem' },
          }}
        >
          VyaparSathi
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {token && (
            <>
              {!isMobile && (
                <Typography
                  variant="body1"
                  sx={{ color: 'inherit', marginRight: 2, fontWeight: 500 }}
                >
                  {username}
                </Typography>
              )}
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
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
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
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
                <MenuItem
                  onClick={handleProfile}
                  sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                >
                  <AccountCircleIcon sx={{ marginRight: 1 }} /> Profile
                </MenuItem>
                <MenuItem
                  onClick={handleSettings}
                  sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                >
                  <SettingsIcon sx={{ marginRight: 1 }} /> Settings
                </MenuItem>
                <MenuItem
                  onClick={handleLogout}
                  sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                >
                  <ExitToAppIcon sx={{ marginRight: 1 }} /> Logout
                </MenuItem>
              </Menu>
            </>
          )}
          {!token && (
            <Button
              color="inherit"
              onClick={() => navigate('/login')}
              sx={{ textTransform: 'none', fontWeight: 500 }}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;