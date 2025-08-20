import React, { useState } from 'react';
import {
  Drawer, List, ListItem, ListItemIcon, ListItemText, Divider,
  Toolbar, Typography, Box, Collapse
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import StoreIcon from '@mui/icons-material/Store';
import PeopleIcon from '@mui/icons-material/People';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import BackupIcon from '@mui/icons-material/Backup';
import ViewListIcon from '@mui/icons-material/ViewList';
import PaymentIcon from '@mui/icons-material/Payment';
import InfoIcon from '@mui/icons-material/Info';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '../../context/AuthContext';

const drawerWidth = 240;

const AppBranding = () => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 2,
        backgroundColor: '#1976d2',
        color: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 2
      }}
    >
      <TrendingUpOutlinedIcon sx={{ fontSize: { xs: 30, sm: 40 } }} />
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
            color: 'rgba(255,255,255,0.8)',
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

const Sidebar = ({ children }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const userRole = user?.role;

  // Nested/collapsible menu state
  const [openReports, setOpenReports] = useState(false);
  const [openAdmin, setOpenAdmin] = useState(false);

  // Menu for all users (excluding About Us)
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Products Overview', icon: <ViewListIcon />, path: '/products' },
    { text: 'Inventory', icon: <StoreIcon />, path: '/stock' },
    { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
    { text: 'Sales', icon: <PointOfSaleIcon />, path: '/sales' },
    { text: 'Expenses', icon: <MoneyOffIcon />, path: '/expenses' },
  ];

  // For ADMIN and OWNER only (with some nested groups)
  const adminOwnerMenuItems = [
    { text: 'Item Catalog', icon: <InventoryIcon />, path: '/items' },
    { text: 'Customer Payments', icon: <PaymentIcon />, path: '/customer-payments' },
    // Reports as nested/collapsible
    {
      text: 'Reports',
      icon: <AssessmentIcon />,
      nested: true,
      open: openReports,
      onClick: () => setOpenReports((prev) => !prev),
      children: [
        { text: 'Overview', path: '/reports' },
        { text: 'Sales Report', path: '/reports/sales' },
        { text: 'GST Summary', path: '/reports/gst-summary' },
        { text: 'GST Breakdown', path: '/reports/gst-breakdown' },
        { text: 'Items Sold', path: '/reports/items-sold' },
        { text: 'Category Sales', path: '/reports/category-sales' },
        { text: 'Customer Sales', path: '/reports/customer-sales' },
        { text: 'Expenses Summary', path: '/reports/expenses-summary' },
        { text: 'Payments Summary', path: '/reports/payments-summary' },
      ],
    },
    { text: 'Backup', icon: <BackupIcon />, path: '/backup' },
    { text: 'Suppliers', icon: <PeopleIcon />, path: '/suppliers' },
    { text: 'Low Stock Alerts', icon: <InventoryIcon />, path: '/stock-alerts' },
    { text: 'Analytics', icon: <TrendingUpOutlinedIcon />, path: '/analytics' },
    // Admin group nested
    {
      text: 'Admin',
      icon: <PeopleIcon />,
      nested: true,
      open: openAdmin,
      onClick: () => setOpenAdmin((prev) => !prev),
      children: [
        { text: 'Users', path: '/admin/users' },
        { text: 'Audit Logs', path: '/audit' },
        { text: 'Notifications', path: '/notifications' },
      ],
    },
  ];

  const isAdminOrOwner = userRole === 'ADMIN' || userRole === 'OWNER';

  // About Us menu (always at bottom)
  const aboutUsItem = { text: 'About Us', icon: <InfoIcon />, path: '/about-us' };

  // Helper to render menu items (with optional nesting)
  const renderMenu = (items) =>
    items.map((item) =>
      item.nested ? (
        <React.Fragment key={item.text}>
          <ListItem
            button
            onClick={item.onClick}
            sx={{
              '&:hover': { backgroundColor: '#e0e0e0' },
              borderRadius: '8px',
              margin: '4px 8px',
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: '#1976d2' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={t(item.text)} />
            {item.open ? <ExpandLess /> : <ExpandMore />}
          </ListItem>
          <Collapse in={item.open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map((child) => (
                <ListItem
                  button
                  key={child.text}
                  onClick={() => navigate(child.path)}
                  sx={{
                    pl: 6,
                    '&:hover': { backgroundColor: '#e0e0e0' },
                    borderRadius: '8px',
                    margin: '2px 8px',
                  }}
                >
                  <ListItemText primary={t(child.text)} />
                </ListItem>
              ))}
            </List>
          </Collapse>
        </React.Fragment>
      ) : (
        <ListItem
          button
          key={item.text}
          onClick={() => navigate(item.path)}
          sx={{
            '&:hover': { backgroundColor: '#e0e0e0' },
            borderRadius: '8px',
            margin: '4px 8px',
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: '#1976d2' }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText primary={t(item.text)} />
        </ListItem>
      )
    );

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
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        {/* Sticky App branding */}
        <AppBranding />
        <Divider />
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          <List>
            {renderMenu(menuItems)}
            {isAdminOrOwner && renderMenu(adminOwnerMenuItems)}
          </List>
        </Box>
        <Divider />
        <List sx={{ mt: 1 }}>
          <ListItem
            button
            onClick={() => navigate(aboutUsItem.path)}
            sx={{
              '&:hover': { backgroundColor: '#e0e0e0' },
              borderRadius: '8px',
              margin: '4px 8px',
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: '#1976d2' }}>
              {aboutUsItem.icon}
            </ListItemIcon>
            <ListItemText primary={t(aboutUsItem.text)} />
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