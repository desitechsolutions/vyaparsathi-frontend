import React from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar,
  Divider, Box, Typography
} from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PaymentsIcon from '@mui/icons-material/Payments';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HelpCenterIcon from '@mui/icons-material/HelpCenter';
import GavelIcon from '@mui/icons-material/Gavel';

const drawerWidth = 240;

const TechAdminSidebar = () => {
  const location = useLocation();

  const adminMenu = [
    { text: 'Platform Overview', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { text: 'Verify Payments', icon: <PaymentsIcon />, path: '/admin/payments' },
    { text: 'Shop Directory', icon: <StorefrontIcon />, path: '/admin/shops' },
    { text: 'System Users', icon: <PeopleIcon />, path: '/admin/users' },
  ];

  const systemMenu = [
    { text: 'Global Analytics', icon: <AssessmentIcon />, path: '/admin/analytics' },
    { text: 'Audit Logs', icon: <GavelIcon />, path: '/admin/audit' },
    { text: 'Support Tickets', icon: <HelpCenterIcon />, path: '/admin/support' },
  ];

  const activeStyle = {
    backgroundColor: '#ef4444', // Red for Admin to stand out
    color: 'white',
    '& .MuiListItemIcon-root': { color: 'white' },
    '&:hover': { backgroundColor: '#dc2626' },
  };

  const renderItem = (item) => (
    <ListItem key={item.text} disablePadding>
      <ListItemButton
        component={NavLink}
        to={item.path}
        sx={{
          borderRadius: '8px',
          margin: '4px 12px',
          transition: '0.2s',
          ...(location.pathname === item.path ? activeStyle : { color: '#94a3b8' }),
        }}
      >
        <ListItemIcon sx={{ minWidth: 40, color: location.pathname === item.path ? 'inherit' : '#64748b' }}>
          {item.icon}
        </ListItemIcon>
        <ListItemText 
          primary={item.text} 
          primaryTypographyProps={{ fontWeight: location.pathname === item.path ? 700 : 500, fontSize: '0.9rem' }}
        />
      </ListItemButton>
    </ListItem>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#1e293b', // Deep Slate Blue (Pro Admin look)
          color: '#f8fafc',
          borderRight: '1px solid #334155',
        },
      }}
    >
      <Toolbar />
      <Box sx={{ p: 2 }}>
        <Typography variant="overline" sx={{ color: '#94a3b8', fontWeight: 800, ml: 2 }}>
          Management
        </Typography>
      </Box>
      <List>{adminMenu.map(renderItem)}</List>
      
      <Divider sx={{ my: 2, bgcolor: '#334155' }} />
      
      <Box sx={{ p: 2 }}>
        <Typography variant="overline" sx={{ color: '#94a3b8', fontWeight: 800, ml: 2 }}>
          System
        </Typography>
      </Box>
      <List>{systemMenu.map(renderItem)}</List>

      <Box sx={{ mt: 'auto', p: 3, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: '#475569' }}>
          VyaparSathi v0.1.0<br />Staff Panel
        </Typography>
      </Box>
    </Drawer>
  );
};

export default TechAdminSidebar;