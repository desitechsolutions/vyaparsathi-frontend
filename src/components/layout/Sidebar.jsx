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
import ViewListIcon from '@mui/icons-material/ViewList'; // A new icon for the product overview

const drawerWidth = 240;

const Sidebar = ({ children }) => {
  const navigate = useNavigate();

  // The updated menu items with slightly clearer names and distinct icons
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Products Overview', icon: <ViewListIcon />, path: '/products' },
    { text: 'Item Catalog', icon: <InventoryIcon />, path: '/items' },
    { text: 'Inventory', icon: <StoreIcon />, path: '/inventory' },
    { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
    { text: 'Sales', icon: <PointOfSaleIcon />, path: '/sales' },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
    { text: 'Expenses', icon: <MoneyOffIcon />, path: '/expenses' },
    { text: 'Backup', icon: <BackupIcon />, path: '/backup' },
  ];

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
          <Typography variant="h6" component="div" noWrap sx={{ fontWeight: 'bold' }}>
            VyaparSathi
          </Typography>
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
