import React, { useState } from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar,
  Divider, Box, Collapse, Typography
} from '@mui/material';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '../../context/AuthContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CategoryIcon from '@mui/icons-material/Category';
import InventoryIcon from '@mui/icons-material/Inventory';
import LockIcon from '@mui/icons-material/Lock';
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
import VerifiedUser from '@mui/icons-material/VerifiedUser';
import PaymentsIcon from '@mui/icons-material/Payments';
import SubscriptionStatusCard from '../SubscriptionStatusCard';
import { useSubscription } from '../../context/SubscriptionContext';

const drawerWidth = 240;

const Sidebar = () => {
  const location = useLocation();
  const { isPremium } = useSubscription();
  const premium = isPremium(); 
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const userRole = user?.role;

  const [openReports, setOpenReports] = useState(false);
  const [openAdmin, setOpenAdmin] = useState(false);
  const [openPayments, setOpenPayments] = useState(false);

  const menuItems = [
    { text: 'dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'itemCatalog', icon: <CategoryIcon />, path: '/items' },
    { text: 'productsOverview', icon: <ShoppingCartIcon />, path: '/products' },
    { text: 'inventory', icon: <InventoryIcon />, path: '/stock'},
    { text: 'customers', icon: <PeopleIcon />, path: '/customers' },
    { text: 'sales', icon: <PointOfSaleIcon />, path: '/sales' },
    { text: 'delivery', icon: <LocalShippingIcon />, path: '/delivery' , protected: true},
    { text: 'expenses', icon: <ReceiptLongIcon />, path: '/expenses' },
    { text: 'receiving', icon: <InventoryIcon />, path: '/receivings', protected: true },
  ];

  const adminOwnerMenuItems = [
    { text: 'suppliers', icon: <PeopleIcon />, path: '/suppliers', protected: true },
    { text: 'purchaseOrders', icon: <ReceiptLongIcon />, path: '/purchase-orders', protected: true },
    {
      text: 'payments',
      icon: <PaymentIcon />,
      nested: true,
      open: openPayments,
      onClick: () => setOpenPayments((prev) => !prev),
      children: [
        { text: 'customerPayments', icon: <PeopleIcon />, path: '/customer-payments' },
        { text: 'supplierPayments', icon: <PeopleIcon />, path: '/supplier-payments' , protected: true},
      ],
    },
    { text: 'analytics', icon: <TrendingUpOutlinedIcon />, path: '/analytics', protected: true },
    { text: 'lowStockAlerts', icon: <InventoryIcon />, path: '/low-stock-alerts', protected: true },
    {
      text: 'reports',
      icon: <AssessmentIcon />,
      nested: true,
      protected: true, 
      open: openReports,
      onClick: () => setOpenReports((prev) => !prev),
      children: [
        { text: 'overview', icon: <AssessmentIcon />, path: '/reports' ,protected: true},
        { text: 'dailyReport', icon: <AssessmentIcon />, path: '/reports/daily', protected: true },
        { text: 'salesSummary', icon: <AssessmentIcon />, path: '/reports/sales-summary', protected: true },
        { text: 'Tax Compliance', icon: <VerifiedUser />, path: '/reports/tax-compliance', protected: true },
      ],
    },
    { text: 'backup', icon: <BackupIcon />, path: '/backup' , protected: true},
    {
      text: 'admin',
      icon: <PeopleIcon />,
      nested: true,
      open: openAdmin,
      onClick: () => setOpenAdmin((prev) => !prev),
      children: [
        { text: 'users', icon: <PeopleIcon />, path: '/admin/users' },
        { text: 'payroll.title', icon: <PaymentsIcon />, path: '/admin/payroll' , protected: true},
        { text: 'auditLogs', icon: <NotificationsIcon />, path: '/audit', protected: true },
        { text: 'notifications', icon: <NotificationsIcon />, path: '/notifications' , protected: true},
      ],
    },
  ];

  const isAdminOrOwner = userRole === 'ADMIN' || userRole === 'OWNER';
  const aboutUsItem = { text: 'aboutUs', icon: <InfoIcon />, path: '/about-us' };

  const activeStyle = {
    backgroundColor: 'primary.main',
    color: 'primary.contrastText',
    '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
    '&:hover': { backgroundColor: 'primary.dark' },
  };

  // REUSABLE ITEM RENDERER
  const renderItem = (item, isNested = false) => {
    const isLocked = item.protected && !premium;
    const isActuallyActive = location.pathname === item.path;
    
    return (
      <ListItem key={item.text} disablePadding>
        <ListItemButton
          // If locked, we don't use NavLink to prevent incorrect auto-highlighting
          component={isLocked ? 'div' : NavLink}
          to={isLocked ? undefined : item.path}
          onClick={isLocked ? () => navigate('/pricing') : undefined}
          sx={{
            borderRadius: '8px',
            margin: '4px 8px',
            pl: isNested ? 6 : 2,
            opacity: isLocked ? 0.7 : 1,
            // Apply active styles only if path matches AND it's not locked
            ...(isActuallyActive && !isLocked ? activeStyle : {}),
            // Remove the generic &.active to stop NavLink from forcing styles via CSS class
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: (isActuallyActive && !isLocked) ? 'inherit' : '#1976d2' }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText 
            primary={t(item.text)} 
            primaryTypographyProps={{ fontWeight: (isActuallyActive && !isLocked) ? 700 : 500 }}
          />
          {isLocked && <LockIcon sx={{ fontSize: 16, color: '#bf953f', ml: 1 }} />}
        </ListItemButton>
      </ListItem>
    );
  };

  const renderMenu = (items) =>
    items.map((item) =>
      item.nested ? (
        <React.Fragment key={item.text}>
          <ListItemButton
            onClick={item.onClick}
            sx={{ borderRadius: '8px', margin: '4px 8px', opacity: (item.protected && !premium) ? 0.7 : 1 }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: '#1976d2' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={t(item.text)} />
            {item.protected && !premium && <LockIcon sx={{ fontSize: 16, color: '#bf953f', mr: 1 }} />}
            {item.open ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={item.open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map((child) => renderItem(child, true))}
            </List>
          </Collapse>
        </React.Fragment>
      ) : (
        renderItem(item)
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
      <SubscriptionStatusCard />
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <List>
          {renderMenu(menuItems)}
          {isAdminOrOwner && <Divider sx={{ my: 1 }} />}
          {isAdminOrOwner && renderMenu(adminOwnerMenuItems)}
        </List>
      </Box>
      <Divider />
      <List sx={{ mt: 'auto', p: 0 }}>
        {renderItem(aboutUsItem)}
      </List>
    </Drawer>
  );
};

export default Sidebar;