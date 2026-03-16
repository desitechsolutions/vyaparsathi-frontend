import React, { useState } from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar,
  Divider, Box, Collapse, useMediaQuery, useTheme, ListSubheader
} from '@mui/material';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useShop } from '../../context/ShopContext';

// Icons
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
import { AccountBalanceWallet, Settings } from '@mui/icons-material';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import VaccinesIcon from '@mui/icons-material/Vaccines';

import SubscriptionStatusCard from '../SubscriptionStatusCard';

const drawerWidth = 240;

const Sidebar = ({ mobileOpen, onDrawerToggle }) => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const { user } = useAuthContext();
  const { hasAccess } = useSubscription();
  const { isPharmacy } = useShop();
  
  const userRole = user?.role;
  const isAdminOrOwner = userRole === 'ADMIN' || userRole === 'OWNER';

  // State for nested menus
  const [openStates, setOpenStates] = useState({
    reports: false,
    admin: false,
    payments: false,
  });

  const toggleNested = (key) => {
    setOpenStates(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // --- ORGANIZED MENU STRUCTURE ---

  // 1. Core Operations (Daily workflow) — dynamic based on industry
  const mainItems = [
    { text: 'dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'sales', icon: <PointOfSaleIcon />, path: '/sales' },
    // Show "Patients" for pharmacy, "Customers" for others
    isPharmacy
      ? { text: 'Patients', icon: <MedicalServicesIcon />, path: '/customers' }
      : { text: 'customers', icon: <PeopleIcon />, path: '/customers' },
    // Hide delivery for pharmacy (medicines are typically dispensed in-store)
    ...(!isPharmacy ? [{ text: 'delivery', icon: <LocalShippingIcon />, path: '/delivery', requiredTier: 'STARTER' }] : []),
    { text: 'expenses', icon: <ReceiptLongIcon />, path: '/expenses' },
  ];

  // 2. Inventory & Supply Chain
  const inventoryItems = [
    // Rename "Item Catalog" to "Medicines" for pharmacy
    {
      text: isPharmacy ? 'Medicines & Products' : 'itemCatalog',
      icon: isPharmacy ? <VaccinesIcon /> : <CategoryIcon />,
      path: '/items',
    },
    { text: 'productsOverview.title', icon: <ShoppingCartIcon />, path: '/products' },
    { text: 'inventory', icon: <InventoryIcon />, path: '/stock' },
    { text: 'receiving', icon: <InventoryIcon />, path: '/receivings', requiredTier: 'PRO' },
    { text: 'suppliers', icon: <PeopleIcon />, path: '/suppliers', requiredTier: 'STARTER' },
    { text: 'purchaseOrders', icon: <ReceiptLongIcon />, path: '/purchase-orders', requiredTier: 'PRO' },
  ];

  // Build pharmacy-specific or general report children
  const reportChildren = [
    { text: 'overview', icon: <AssessmentIcon />, path: '/reports', requiredTier: 'PRO' },
    { text: 'dailyReport', icon: <AssessmentIcon />, path: '/reports/daily', requiredTier: 'PRO' },
    { text: 'salesSummary', icon: <AssessmentIcon />, path: '/reports/sales-summary', requiredTier: 'PRO' },
    // Pharmacy-only reports
    ...(isPharmacy ? [
      { text: 'Expiry Report', icon: <AssessmentIcon />, path: '/reports/expiry-report', requiredTier: 'PRO' },
      { text: 'Narcotics Register', icon: <AssessmentIcon />, path: '/reports/narcotics-register', requiredTier: 'PRO' },
      { text: 'Purchase Register', icon: <AssessmentIcon />, path: '/reports/purchase-register', requiredTier: 'PRO' },
    ] : []),
    { text: 'Tax Compliance', icon: <VerifiedUser />, path: '/reports/tax-compliance', requiredTier: 'ENTERPRISE' },
  ];

  // 3. Strategic & Financial (Admin/Owner only)
  const adminItems = [
    {
      text: 'payments',
      icon: <PaymentIcon />,
      nested: true,
      open: openStates.payments,
      onClick: () => toggleNested('payments'),
      children: [
        { text: isPharmacy ? 'Patient Payments' : 'customerPayments', icon: <PeopleIcon />, path: '/customer-payments' },
        { text: 'supplierPayments', icon: <PeopleIcon />, path: '/supplier-payments', requiredTier: 'PRO' },
      ],
    },
    { text: 'analytics', icon: <TrendingUpOutlinedIcon />, path: '/analytics', requiredTier: 'PRO' },
    { text: 'lowStockAlerts', icon: <InventoryIcon />, path: '/low-stock-alerts', requiredTier: 'STARTER' },
    {
      text: 'reports',
      icon: <AssessmentIcon />,
      nested: true,
      requiredTier: 'PRO',
      open: openStates.reports,
      onClick: () => toggleNested('reports'),
      children: reportChildren,
    },
    {
      text: 'admin',
      icon: <PeopleIcon />,
      nested: true,
      open: openStates.admin,
      onClick: () => toggleNested('admin'),
      children: [
        { text: 'users', icon: <PeopleIcon />, path: '/admin/users' },
        { text: 'payroll.title', icon: <PaymentsIcon />, path: '/admin/payroll', requiredTier: 'ENTERPRISE' },
        { text: 'auditLogs', icon: <NotificationsIcon />, path: '/audit', requiredTier: 'ENTERPRISE' },
        { text: 'notifications', icon: <NotificationsIcon />, path: '/notifications', requiredTier: 'STARTER' },
        { text: 'Shop Setting', icon: <Settings />, path: '/admin/settings' },
        {text: 'Billing & Plans', icon: <AccountBalanceWallet />, path: '/admin/billing'}
      ],
    },
    { text: 'backup', icon: <BackupIcon />, path: '/backup', requiredTier: 'PRO' },
  ];

  const activeStyle = {
    backgroundColor: 'primary.main',
    color: 'primary.contrastText',
    '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
    '&:hover': { backgroundColor: 'primary.dark' },
  };

  const renderItem = (item, isNested = false) => {
    // New Tier Access Check
    const isLocked = !hasAccess(item.requiredTier);
    const isActuallyActive = location.pathname === item.path;
    
    return (
      <ListItem key={item.text} disablePadding>
        <ListItemButton
          component={isLocked ? 'div' : NavLink}
          to={isLocked ? undefined : item.path}
          onClick={() => {
            if (isLocked) {
              navigate('/pricing', { state: { requiredTier: item.requiredTier } });
            }
            if (isMobile) onDrawerToggle();
          }}
          sx={{
            borderRadius: '8px',
            margin: '2px 8px',
            pl: isNested ? 6 : 2,
            opacity: isLocked ? 0.6 : 1,
            ...(isActuallyActive && !isLocked ? activeStyle : {}),
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: (isActuallyActive && !isLocked) ? 'inherit' : 'primary.main' }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText 
            primary={t(item.text)} 
            primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: (isActuallyActive && !isLocked) ? 700 : 500 }}
          />
          {isLocked && <LockIcon sx={{ fontSize: 14, color: '#bf953f', ml: 1 }} />}
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
            sx={{ borderRadius: '8px', margin: '2px 8px', opacity: !hasAccess(item.requiredTier) ? 0.6 : 1 }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={t(item.text)} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
            {!hasAccess(item.requiredTier) && <LockIcon sx={{ fontSize: 14, color: '#bf953f', mr: 1 }} />}
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

const drawerContent = (
  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <Toolbar sx={{ justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', color: 'primary.main' }}>
      {isPharmacy ? 'PHARMA POS' : 'BILLING APP'}
    </Toolbar>
    
    <Box sx={{ px: 1 }}>
      <SubscriptionStatusCard />
    </Box>

    <Box sx={{ flex: 1, overflowY: 'auto', mt: 1 }}>
      {/* ADD disableSticky TO ALL SUBHEADERS BELOW */}
      
      <List 
        subheader={
          <ListSubheader disableSticky sx={{ bgcolor: 'transparent', lineHeight: '24px', mt: 1 }}>
            {t('sidebar.core', 'Operations')}
          </ListSubheader>
        }
      >
        {renderMenu(mainItems)}
      </List>
      
      <Divider sx={{ my: 1, mx: 2 }} />
      
      <List 
        subheader={
          <ListSubheader disableSticky sx={{ bgcolor: 'transparent', lineHeight: '24px' }}>
            {t('sidebar.inventory', 'Stock & Supply')}
          </ListSubheader>
        }
      >
        {renderMenu(inventoryItems)}
      </List>

      {isAdminOrOwner && (
        <>
          <Divider sx={{ my: 1, mx: 2 }} />
          <List 
            subheader={
              <ListSubheader disableSticky sx={{ bgcolor: 'transparent', lineHeight: '24px' }}>
                {t('sidebar.management', 'Management')}
              </ListSubheader>
            }
          >
            {renderMenu(adminItems)}
          </List>
        </>
      )}
    </Box>

    <Divider />
    <List sx={{ p: 0 }}>
      {renderItem({ text: 'aboutUs', icon: <InfoIcon />, path: '/about-us' })}
    </List>
  </Box>
);

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }} 
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            boxShadow: 'none'
          },
        }}
        anchor="left"
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;