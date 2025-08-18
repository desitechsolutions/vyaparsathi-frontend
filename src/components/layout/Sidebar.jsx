import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  Typography,
  Box,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import StoreIcon from '@mui/icons-material/Store';
import PeopleIcon from '@mui/icons-material/People';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import BackupIcon from '@mui/icons-material/Backup';
import { useNavigate } from 'react-router-dom';
import ViewListIcon from '@mui/icons-material/ViewList';
import PaymentIcon from '@mui/icons-material/Payment';
import InfoIcon from '@mui/icons-material/Info'; // Icon for About Us
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
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

const drawerWidth = 240;

const Sidebar = ({ children }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Products Overview', icon: <ViewListIcon />, path: '/products' },
    { text: 'Item Catalog', icon: <InventoryIcon />, path: '/items' },
    { text: 'Inventory', icon: <StoreIcon />, path: '/stock' },
    { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
    { text: 'Sales', icon: <PointOfSaleIcon />, path: '/sales' },
    { text: 'Customer Payments', icon: <PaymentIcon />, path: '/customer-payments' },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
    { text: 'Expenses', icon: <MoneyOffIcon />, path: '/expenses' },
    { text: 'Backup', icon: <BackupIcon />, path: '/backup' },
  ];

  const aboutItem = { text: 'About Us', icon: <InfoIcon />, path: '/about-us' };

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#f5f5f5',
            color: '#333',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar sx={{ backgroundColor: '#1976d2', color: '#fff' }}>
          <AppBranding />
        </Toolbar>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => navigate(item.path)}
              sx={{
                '&:hover': {
                  backgroundColor: '#e0e0e0',
                },
                borderRadius: '8px',
                margin: '4px 8px',
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: '#1976d2' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
        <Divider />
        <List sx={{ marginTop: 'auto' }}>
          <ListItem
            button
            onClick={() => navigate(aboutItem.path)}
            sx={{
              '&:hover': {
                backgroundColor: '#e0e0e0',
              },
              borderRadius: '8px',
              margin: '4px 8px',
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: '#1976d2' }}>
              {aboutItem.icon}
            </ListItemIcon>
            <ListItemText primary={aboutItem.text} />
          </ListItem>
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: `calc(100% - ${drawerWidth}px)` }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Sidebar;
