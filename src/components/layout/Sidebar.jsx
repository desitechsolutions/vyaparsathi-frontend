import React, { useState } from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar,
  Box, Collapse, useMediaQuery, useTheme, Typography, alpha
} from '@mui/material';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useShop } from '../../context/ShopContext';

// Icons — one icon per concept. Duplicate imports here caused the
// pre-audit "everything looks the same" problem; the current set gives
// each sidebar item a semantically distinct glyph.
import DashboardIcon from '@mui/icons-material/Dashboard';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import UndoIcon from '@mui/icons-material/Undo';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import RedoIcon from '@mui/icons-material/Redo';
import CategoryIcon from '@mui/icons-material/Category';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ContactsIcon from '@mui/icons-material/Contacts';
import PeopleIcon from '@mui/icons-material/People';
import StoreIcon from '@mui/icons-material/Store';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PaymentIcon from '@mui/icons-material/Payment';
import PaymentsIcon from '@mui/icons-material/Payments';
import PaidIcon from '@mui/icons-material/Paid';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import VerifiedUser from '@mui/icons-material/VerifiedUser';
import SummarizeIcon from '@mui/icons-material/Summarize';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Settings from '@mui/icons-material/Settings';
import AccountBalanceWallet from '@mui/icons-material/AccountBalanceWallet';
import BackupIcon from '@mui/icons-material/Backup';
import LockIcon from '@mui/icons-material/Lock';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

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
  const { shop, shopLoading } = useShop();

  const userRole = user?.role;
  const isAdminOrOwner = userRole === 'ADMIN' || userRole === 'OWNER';

  // Accordion state — each key controls one collapsible group.
  // Sales / Purchases open by default so the everyday workflows are one click away.
  const [openStates, setOpenStates] = useState({
    sales: true,
    purchases: false,
    inventory: false,
    contacts: false,
    finance: false,
    reports: false,
    admin: false,
    payments: false,   // legacy nested "payments" inside Finance
  });

  const toggleNested = (key) => {
    setOpenStates(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── MENU DEFINITION ────────────────────────────────────────────────
  //
  // Groups are ordered by frequency of daily use:
  //   1. Sales — the everyday quote-to-cash workflow
  //   2. Purchases — supplier-side flow
  //   3. Inventory — stock and products
  //   4. Contacts — customers + suppliers directory
  //   5. Finance — payments + expenses (Admin/Owner only)
  //   6. Reports — reporting hub (Admin/Owner, PRO tier)
  //   7. Admin — users, payroll, audit, settings (Admin/Owner only)
  //
  // Every item passes through hasAccess(requiredTier) so tier gates render as
  // a lock icon; STAFF users never see the Finance/Reports/Admin groups.

  const dashboardItem = { text: t('sidebar.dashboard', 'Dashboard'), icon: <DashboardIcon />, path: '/dashboard' };

  const salesGroup = {
    key: 'sales',
    text: t('sidebar.groupSales', 'Sales'),
    icon: <PointOfSaleIcon />,
    children: [
      { text: t('sidebar.newSale', 'New Sale / History'), icon: <PointOfSaleIcon />, path: '/sales' },
      { text: t('sidebar.quotations', 'Quotations'), icon: <RequestQuoteIcon />, path: '/quotations' },
      { text: t('sidebar.salesOrders', 'Sales Orders'), icon: <AssignmentIcon />, path: '/sales-orders' },
      { text: t('sidebar.delivery', 'Delivery'), icon: <LocalShippingIcon />, path: '/delivery', requiredTier: 'STARTER' },
      { text: t('sidebar.salesReturns', 'Sales Returns'), icon: <AssignmentReturnIcon />, path: '/sales/return' },
      { text: t('sidebar.creditNotes', 'Credit Notes'), icon: <UndoIcon />, path: '/credit-notes' },
    ],
  };

  const purchasesGroup = {
    key: 'purchases',
    text: t('sidebar.groupPurchases', 'Purchases'),
    icon: <ShoppingBagIcon />,
    children: [
      { text: t('sidebar.purchaseOrders', 'Purchase Orders'), icon: <ReceiptLongIcon />, path: '/purchase-orders', requiredTier: 'PRO' },
      { text: t('sidebar.receiving', 'Receive Goods (GRN)'), icon: <MoveToInboxIcon />, path: '/receivings', requiredTier: 'PRO' },
      { text: t('sidebar.purchaseReturns', 'Purchase Returns'), icon: <AssignmentReturnIcon />, path: '/purchase-returns', requiredTier: 'PRO' },
      { text: t('sidebar.debitNotes', 'Debit Notes'), icon: <RedoIcon />, path: '/debit-notes', requiredTier: 'PRO' },
    ],
  };

  const inventoryGroup = {
    key: 'inventory',
    text: t('sidebar.groupInventory', 'Inventory'),
    icon: <InventoryIcon />,
    children: [
      { text: t('itemCatalog', 'Item Catalog'), icon: <CategoryIcon />, path: '/items' },
      { text: t('productsOverview.title', 'Products Overview'), icon: <ShoppingCartIcon />, path: '/products' },
      { text: t('inventory', 'Stock'), icon: <InventoryIcon />, path: '/stock' },
      { text: t('lowStockAlerts', 'Low Stock Alerts'), icon: <WarningAmberIcon />, path: '/low-stock-alerts', requiredTier: 'STARTER' },
    ],
  };

  const contactsGroup = {
    key: 'contacts',
    text: t('sidebar.groupContacts', 'Contacts'),
    icon: <ContactsIcon />,
    children: [
      { text: t('customers', 'Customers'), icon: <PeopleIcon />, path: '/customers' },
      { text: t('suppliers', 'Suppliers'), icon: <StoreIcon />, path: '/suppliers', requiredTier: 'STARTER' },
    ],
  };

  const financeGroup = {
    key: 'finance',
    text: t('sidebar.groupFinance', 'Finance'),
    icon: <AccountBalanceIcon />,
    children: [
      { text: t('customerPayments', 'Customer Payments'), icon: <PaymentIcon />, path: '/customer-payments' },
      { text: t('supplierPayments', 'Supplier Payments'), icon: <PaymentsIcon />, path: '/supplier-payments', requiredTier: 'PRO' },
      { text: t('expenses', 'Expenses'), icon: <PaidIcon />, path: '/expenses' },
    ],
  };

  const reportChildren = [
    { text: t('overview', 'Overview'), icon: <SummarizeIcon />, path: '/reports', requiredTier: 'PRO' },
    { text: t('dailyReport.title'), icon: <AssessmentIcon />, path: '/reports/daily', requiredTier: 'PRO' },
    { text: t('salesSummaryReport.title'), icon: <BarChartIcon />, path: '/reports/sales-summary', requiredTier: 'PRO' },
    { text: t('sidebar.gstSummary', 'GST Summary'), icon: <PieChartIcon />, path: '/reports/gst-summary', requiredTier: 'PRO' },
    { text: t('expiryReport.title'), icon: <EventBusyIcon />, path: '/reports/expiry-report', requiredTier: 'PRO' },
    { text: t('purchaseRegisterReport.title'), icon: <ReceiptLongIcon />, path: '/reports/purchase-register', requiredTier: 'PRO' },
    { text: t('sidebar.analytics', 'Analytics'), icon: <TrendingUpOutlinedIcon />, path: '/analytics', requiredTier: 'PRO' },
    { text: t('taxComplianceHub.title'), icon: <VerifiedUser />, path: '/reports/tax-compliance', requiredTier: 'ENTERPRISE' },
  ];

  const reportsGroup = {
    key: 'reports',
    text: t('reports', 'Reports'),
    icon: <AssessmentIcon />,
    requiredTier: 'PRO',
    children: reportChildren,
  };

  const adminGroup = {
    key: 'admin',
    text: t('admin', 'Administration'),
    icon: <AdminPanelSettingsIcon />,
    children: [
      { text: t('users'), icon: <ManageAccountsIcon />, path: '/admin/users' },
      { text: t('payroll.title'), icon: <PaymentsIcon />, path: '/admin/payroll', requiredTier: 'ENTERPRISE' },
      { text: t('auditLogs'), icon: <HistoryEduIcon />, path: '/audit', requiredTier: 'ENTERPRISE' },
      { text: t('notifications'), icon: <NotificationsIcon />, path: '/notifications', requiredTier: 'STARTER' },
      { text: t('sidebar.shopSettings'), icon: <Settings />, path: '/admin/settings' },
      { text: t('sidebar.billingPlans'), icon: <AccountBalanceWallet />, path: '/admin/billing' },
      { text: t('backup'), icon: <BackupIcon />, path: '/backup', requiredTier: 'PRO' },
    ],
  };

  // Operational groups everyone sees
  const operationalGroups = [salesGroup, purchasesGroup, inventoryGroup, contactsGroup];
  // Admin/Owner-only groups
  const adminGroups = [financeGroup, reportsGroup, adminGroup];

  const isDark = theme.palette.mode === 'dark';

  // Enterprise-grade active state: subtle tinted background, primary-colored
  // text/icon, and a 3px accent border on the left edge. Matches Zoho Books /
  // Stripe / Metronic patterns — the item is unmistakably active without the
  // "loud filled block" of the earlier design.
  const activeStyle = {
    backgroundColor: alpha(theme.palette.primary.main, isDark ? 0.16 : 0.08),
    color: 'primary.main',
    fontWeight: 600,
    borderLeft: '3px solid',
    borderLeftColor: 'primary.main',
    '& .MuiListItemIcon-root': { color: 'primary.main' },
    '&:hover': { backgroundColor: alpha(theme.palette.primary.main, isDark ? 0.22 : 0.12) },
  };

  // Non-active items keep their left edge with a transparent border so text
  // alignment doesn't jitter when the active state kicks in.
  const inactiveEdge = {
    borderLeft: '3px solid transparent',
  };

  // Highlight a group when the current route matches one of its children
  const isGroupActive = (group) =>
    Array.isArray(group.children) &&
    group.children.some((c) => c.path && location.pathname === c.path);

  const renderLeaf = (item, isNested = false) => {
    const isLocked = !hasAccess(item.requiredTier);
    const isActive = location.pathname === item.path;
    // item.text is already translated via t(...) at declaration; no extra wrap needed
    const label = item.text;
    return (
      <ListItem key={item.path || item.text} disablePadding>
        <ListItemButton
          component={isLocked ? 'div' : NavLink}
          to={isLocked ? undefined : item.path}
          onClick={() => {
            if (isLocked) navigate('/pricing', { state: { requiredTier: item.requiredTier } });
            if (isMobile) onDrawerToggle();
          }}
          sx={{
            borderRadius: '6px',
            margin: '1px 8px',
            pl: isNested ? (5 - 0.375) : (2 - 0.375),  // compensate for the 3px accent so text stays put
            opacity: isLocked ? 0.6 : 1,
            transition: 'background-color 120ms ease',
            ...inactiveEdge,
            ...(isActive && !isLocked ? activeStyle : {}),
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: (isActive && !isLocked) ? 'primary.main' : 'text.secondary' }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText
            primary={label}
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: (isActive && !isLocked) ? 600 : 500,
              color: (isActive && !isLocked) ? 'primary.main' : 'text.primary',
            }}
          />
          {isLocked && <LockIcon sx={{ fontSize: 14, color: '#bf953f', ml: 1 }} />}
        </ListItemButton>
      </ListItem>
    );
  };

  const renderGroup = (group) => {
    const open = !!openStates[group.key];
    const groupIsLocked = !hasAccess(group.requiredTier);
    const groupActive = isGroupActive(group);
    return (
      <React.Fragment key={group.key}>
        <ListItemButton
          onClick={() => toggleNested(group.key)}
          sx={{
            borderRadius: '6px',
            margin: '1px 8px',
            pl: 2 - 0.375,
            opacity: groupIsLocked ? 0.6 : 1,
            transition: 'background-color 120ms ease',
            ...inactiveEdge,
            bgcolor: groupActive ? alpha(theme.palette.primary.main, isDark ? 0.10 : 0.05) : 'transparent',
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: groupActive ? 'primary.main' : 'text.secondary' }}>
            {group.icon}
          </ListItemIcon>
          <ListItemText
            primary={group.text}
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: groupActive ? 'primary.main' : 'text.primary',
            }}
          />
          {groupIsLocked && <LockIcon sx={{ fontSize: 14, color: '#bf953f', mr: 0.5 }} />}
          {open ? <ExpandLess sx={{ fontSize: 20, color: 'text.secondary' }} /> : <ExpandMore sx={{ fontSize: 20, color: 'text.secondary' }} />}
        </ListItemButton>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {group.children.map((child) => renderLeaf(child, true))}
          </List>
        </Collapse>
      </React.Fragment>
    );
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ px: 2, display: 'flex', alignItems: 'center', gap: 1.5, minHeight: { xs: 60, sm: 70 } }}>
        <TrendingUpOutlinedIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            noWrap
            sx={{ fontWeight: '800', color: 'text.primary', lineHeight: 1.2 }}
          >
            {shopLoading ? '...' : (shop?.name || t('appName'))}
          </Typography>
          <Typography
            variant="caption"
            noWrap
            sx={{ display: 'block', fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}
          >
            {t('sidebar.vsBadge', 'VyaparSathi ERP')}
          </Typography>
        </Box>
      </Toolbar>

      <Box sx={{ px: 1 }}>
        <SubscriptionStatusCard />
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', mt: 1, pb: 2 }}>
        {/* Dashboard sits above the accordion groups — it is the app's home */}
        <List disablePadding>{renderLeaf(dashboardItem)}</List>

        <Box sx={{ px: 3, pt: 2, pb: 0.5 }}>
          <Typography
            variant="overline"
            sx={{
              display: 'block',
              fontSize: '0.68rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: 'text.secondary',
              lineHeight: 1.4,
            }}
          >
            {t('sidebar.operations', 'Operations').toUpperCase()}
          </Typography>
        </Box>
        <List disablePadding>{operationalGroups.map(renderGroup)}</List>

        {isAdminOrOwner && (
          <>
            <Box sx={{ px: 3, pt: 2, pb: 0.5 }}>
              <Typography
                variant="overline"
                sx={{
                  display: 'block',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  color: 'text.secondary',
                  lineHeight: 1.4,
                }}
              >
                {t('sidebar.management', 'Management').toUpperCase()}
              </Typography>
            </Box>
            <List disablePadding>{adminGroups.map(renderGroup)}</List>
          </>
        )}
      </Box>
      {/* About Us moved to the header user dropdown to keep the sidebar focused
          on operational navigation. Legal / marketing links live under the profile menu. */}
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
            bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fbfbfb',
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
