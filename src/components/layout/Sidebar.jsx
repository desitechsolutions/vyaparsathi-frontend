import React, { useState } from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar,
  Divider, Box, Collapse, Typography
} from '@mui/material';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '../../context/AuthContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CategoryIcon from '@mui/icons-material/Category';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import PaymentIcon from '@mui/icons-material/Payment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import BackupIcon from '@mui/icons-material/Backup';
import InfoIcon from '@mui/icons-material/Info';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

const drawerWidth = 240;

const Sidebar = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const userRole = user?.role; // Safely access role

  // Nested/collapsible menu state
  const [openReports, setOpenReports] = useState(false);
  const [openAdmin, setOpenAdmin] = useState(false);
  const [openPayments, setOpenPayments] = useState(false);

  // Menu for all users (excluding About Us)
  const menuItems = [
    { text: 'dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'itemCatalog', icon: <CategoryIcon />, path: '/items', protected: true },
    { text: 'productsOverview', icon: <ShoppingCartIcon />, path: '/products' },
    { text: 'inventory', icon: <InventoryIcon />, path: '/stock' },
    { text: 'customers', icon: <PeopleIcon />, path: '/customers' },
    { text: 'sales', icon: <PointOfSaleIcon />, path: '/sales' },
    { text: 'delivery', icon: <LocalShippingIcon />, path: '/delivery' },
    { text: 'expenses', icon: <ReceiptLongIcon />, path: '/expenses' },
    { text: 'backup', icon: <BackupIcon />, path: '/backup' },
    { text: 'receiving', icon: <InventoryIcon />, path: '/receivings' },
  ];

  // For ADMIN and OWNER only (with some nested groups)
  const adminOwnerMenuItems = [
    { text: 'suppliers', icon: <PeopleIcon />, path: '/suppliers' },
    { text: 'purchaseOrders', icon: <ReceiptLongIcon />, path: '/purchase-orders' },
    { text: 'receiving', icon: <InventoryIcon />, path: '/receiving' },
    {
      text: 'payments',
      icon: <PaymentIcon />,
      nested: true,
      open: openPayments,
      onClick: () => setOpenPayments((prev) => !prev),
      children: [
        { text: 'customerPayments', icon: <PeopleIcon />, path: '/customer-payments' },
        { text: 'supplierPayments', icon: <PeopleIcon />, path: '/supplier-payments' },
      ],
    },
    { text: 'analytics', icon: <TrendingUpOutlinedIcon />, path: '/analytics' },
    { text: 'lowStockAlerts', icon: <InventoryIcon />, path: '/low-stock-alerts' },
    {
      text: 'reports',
      icon: <AssessmentIcon />,
      nested: true,
      open: openReports,
      onClick: () => setOpenReports((prev) => !prev),
      children: [
        { text: 'overview', icon: <AssessmentIcon />, path: '/reports' },
        { text: 'dailyReport', icon: <AssessmentIcon />, path: '/reports/daily' },
        { text: 'salesSummary', icon: <AssessmentIcon />, path: '/reports/sales-summary' },
        { text: 'gstSummary', icon: <AssessmentIcon />, path: '/reports/gst-summary' },
        { text: 'gstBreakdown', icon: <AssessmentIcon />, path: '/reports/gst-breakdown' },
        { text: 'itemsSold', icon: <AssessmentIcon />, path: '/reports/items-sold' },
        { text: 'categorySales', icon: <AssessmentIcon />, path: '/reports/category-sales' },
        { text: 'customerSales', icon: <AssessmentIcon />, path: '/reports/customer-sales' },
        { text: 'expensesSummary', icon: <AssessmentIcon />, path: '/reports/expenses-summary' },
        { text: 'paymentsSummary', icon: <AssessmentIcon />, path: '/reports/payments-summary' },
      ],
    },
    { text: 'backup', icon: <BackupIcon />, path: '/backup' },
    {
      text: 'admin',
      icon: <PeopleIcon />,
      nested: true,
      open: openAdmin,
      onClick: () => setOpenAdmin((prev) => !prev),
      children: [
        { text: 'users', icon: <PeopleIcon />, path: '/admin/users' },
        { text: 'auditLogs', icon: <NotificationsIcon />, path: '/audit' },
        { text: 'notifications', icon: <NotificationsIcon />, path: '/notifications' },
      ],
    },
  ];

  const isAdminOrOwner = userRole === 'ADMIN' || userRole === 'OWNER';

  // About Us menu (always at bottom)
  const aboutUsItem = { text: 'aboutUs', icon: <InfoIcon />, path: '/about-us' };

  const activeStyle = {
    backgroundColor: 'primary.main',
    color: 'primary.contrastText',
    '& .MuiListItemIcon-root': {
      color: 'primary.contrastText',
    },
  };

  // Helper to render menu items (with optional nesting)
  const renderMenu = (items) =>
    items.map((item) =>
      item.nested ? (
        <React.Fragment key={item.text}>
          <ListItemButton
            onClick={item.onClick}
            sx={{
              borderRadius: '8px',
              margin: '4px 8px',
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: '#1976d2' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={t(item.text)} />
            {item.open ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={item.open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map((child) => (
                <ListItem key={child.text} disablePadding>
                  <ListItemButton
                    component={NavLink}
                    to={child.path}
                    sx={{
                      pl: 6,
                      borderRadius: '8px',
                      margin: '2px 8px',
                      '&.active': activeStyle,
                    }}
                  >
                    {child.icon && (
                      <ListItemIcon sx={{ minWidth: 40, color: '#1976d2' }}>
                        {child.icon}
                      </ListItemIcon>
                    )}
                    <ListItemText primary={t(child.text)} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        </React.Fragment>
      ) : (
        <ListItem key={item.text} disablePadding>
          <ListItemButton
            component={NavLink}
            to={item.path}
            end={item.path === '/'} // Ensure only exact match for dashboard
            sx={{
              borderRadius: '8px',
              margin: '4px 8px',
              '&.active': activeStyle,
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: '#1976d2' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={t(item.text)} />
          </ListItemButton>
        </ListItem>
      )
    );

  return (
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
      <Toolbar />
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <List>
          {renderMenu(menuItems)}
          {isAdminOrOwner && <Divider sx={{ my: 1 }} />}
          {isAdminOrOwner && renderMenu(adminOwnerMenuItems)}
        </List>
      </Box>
      <Divider />
      <List sx={{ mt: 'auto', p: 0 }}>
        <ListItem disablePadding>
          <ListItemButton
            component={NavLink}
            to={aboutUsItem.path}
            sx={{
              borderRadius: '8px',
              margin: '4px 8px',
              '&.active': activeStyle,
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: '#1976d2' }}>
              {aboutUsItem.icon}
            </ListItemIcon>
            <ListItemText primary={t(aboutUsItem.text)} />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;