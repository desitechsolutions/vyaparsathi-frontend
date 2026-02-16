// src/components/layout/TechAdminHeader.jsx
import React from 'react';
import { AppBar, Toolbar, Box, Typography, Chip, IconButton, Avatar, Menu, MenuItem, Divider, ListItemIcon } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import PaymentsIcon from '@mui/icons-material/Payments';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import SettingsIcon from '@mui/icons-material/Settings';

const TechAdminHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: '#0f172a' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        
        {/* Branding */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => navigate('/admin/dashboard')}>
          <TrendingUpOutlinedIcon sx={{ fontSize: 35, color: 'white' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: 'white', lineHeight: 1 }}>
              VYAPARSATHI <Chip label="TECH" size="small" color="error" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 900 }} />
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Platform Administration</Typography>
          </Box>
        </Box>

        {/* Admin Navigation Icons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton color="inherit" onClick={() => navigate('/admin/payments')} title="Pending Payments">
             <PaymentsIcon />
          </IconButton>
          
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 1 }}>
            <Avatar sx={{ bgcolor: 'error.main', width: 35, height: 35 }}>
                {user?.sub?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Box>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          <MenuItem onClick={logout} sx={{ color: 'error.main' }}>
            <ListItemIcon><ExitToAppIcon fontSize="small" color="error" /></ListItemIcon> Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default TechAdminHeader;