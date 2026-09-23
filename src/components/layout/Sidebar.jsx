import React, { useState } from 'react';
import {
  Drawer, SwipeableDrawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar,
  Box, Collapse, useMediaQuery, useTheme, Typography, alpha, Badge
} from '@mui/material';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useShop } from '../../context/ShopContext';
import { useWebSocketContext } from '../../context/WebSocketContext';

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
import BadgeIcon from '@mui/icons-material/Badge';
import PaidIcon from '@mui/icons-material/Paid';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import VerifiedUser from '@mui/icons-material/VerifiedUser';
import SummarizeIcon from '@mui/icons-material/Summarize';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GroupIcon from '@mui/icons-material/Group';
import ShieldIcon from '@mui/icons-material/Shield';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import RequestPageIcon from '@mui/icons-material/RequestPage';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DescriptionIcon from '@mui/icons-material/Description';
import LockClockIcon from '@mui/icons-material/LockClock';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import PolicyIcon from '@mui/icons-material/Policy';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Settings from '@mui/icons-material/Settings';
import AccountBalanceWallet from '@mui/icons-material/AccountBalanceWallet';
import BackupIcon from '@mui/icons-material/Backup';
import LockIcon from '@mui/icons-material/Lock';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';

import SubscriptionStatusCard from '../SubscriptionStatusCard';
import { useResponsiveTouchTarget } from '../../utils/touchTargets';

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
  const { unreadCount } = useWebSocketContext();

  const userRole = user?.role;
  const isAdminOrOwner = userRole === 'ADMIN' || userRole === 'OWNER';

  // Accordion state — each key controls one collapsible group.
  // Sales / Purchases open by default so the everyday workflows are one click away.
  // Post-reorg (Phase 5 polish): three sections (OPERATIONS · BUSINESS · ADMINISTRATION)
  // with tighter sub-groups so the sidebar reads like Zoho Books / SAP B1 /
  // Microsoft Dynamics — every group is one narrow concern instead of the old
  // 10-item catch-all "Administration".
  const [openStates, setOpenStates] = useState({
    sales: true,
    purchases: false,
    inventory: false,
    contacts: false,
    finance: false,
    expenses: false,   // Expenses — collapsible group
    payroll: false,    // Payroll — top-level enterprise group
    ess: false,        // Employee Self-Service portal
    reports: false,
    teamAccess: false,
    configuration: false,
    compliance: false,
  });

  const toggleNested = (key) => {
    setOpenStates(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── MENU DEFINITION ────────────────────────────────────────────────
  //
  // Sidebar sections, in Zoho Books / SAP B1 / Microsoft Dynamics order:
  //
  //   OPERATIONS (everyone with permissions)
  //     • Dashboard
  //     • Sales, Purchases, Inventory, Contacts — daily transactional flows
  //
  //   BUSINESS (admin/owner)
  //     • Finance — money in / money out
  //     • Reports — analytics, GST, compliance dashboard
  //
  //   ADMINISTRATION (admin/owner)
  //     • Team & access   — users, team invitations, roles & permissions
  //     • Configuration   — shop settings, notifications, payroll, backup
  //     • Compliance      — audit logs
  //     • Subscription    — plans & billing (leaf, standalone)
  //
  // Per-user personal settings (Profile, Account security / MFA) live in the
  // header user-menu — not in the sidebar — matching the enterprise pattern.
  //
  // Every item passes through hasAccess(requiredTier) so tier gates render as
  // a lock icon; STAFF never sees the BUSINESS or ADMINISTRATION sections.

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
      { text: t('sidebar.stock', 'Stock'), icon: <InventoryIcon />, path: '/stock' },
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

  const expensesGroup = {
    key: 'expenses',
    text: t('expenses', 'Expenses'),
    icon: <PaidIcon />,
    children: [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/expenses/dashboard' },
      { text: 'My Expenses', icon: <AssignmentIcon />, path: '/expenses/list' },
      { text: 'Approvals', icon: <VerifiedUser />, path: '/expenses/approvals' },
      { text: 'Reconciliation', icon: <CompareArrowsIcon />, path: '/expenses/reconciliation' },
      { text: 'Reports', icon: <BarChartIcon />, path: '/expenses/reports' },
      { text: 'Settings', icon: <Settings />, path: '/expenses/settings' },
    ],
  };

  const financeGroup = {
    key: 'finance',
    text: t('sidebar.groupFinance', 'Finance'),
    icon: <AccountBalanceIcon />,
    children: [
      { text: t('customerPayments', 'Customer Payments'), icon: <PaymentIcon />, path: '/customer-payments' },
      { text: t('supplierPayments', 'Supplier Payments'), icon: <PaymentsIcon />, path: '/supplier-payments', requiredTier: 'PRO' },
    ],
  };

  // Payroll — standalone top-level group (enterprise module)
  // Lives in BUSINESS section between Finance and Reports, matching Zoho Payroll / Zoho Books patterns.
  const payrollGroup = {
    key: 'payroll',
    text: t('payroll.title', 'Payroll'),
    icon: <BadgeIcon />,
    requiredTier: 'ENTERPRISE',
    children: [
      // Overview
      { text: t('payroll.dashboard', 'Dashboard'), icon: <DashboardIcon />, path: '/payroll', requiredTier: 'ENTERPRISE' },
      { text: t('payroll.reports', 'Reports & Analytics'), icon: <AssessmentIcon />, path: '/payroll/reports', requiredTier: 'ENTERPRISE' },
      // Payroll Operations
      { text: t('payroll.runs', 'Payroll Runs'), icon: <AssignmentIcon />, path: '/payroll/runs', requiredTier: 'ENTERPRISE' },
      // Employee Management
      { text: t('payroll.employees', 'Employees'), icon: <PeopleIcon />, path: '/payroll/employees', requiredTier: 'ENTERPRISE' },
      { text: t('payroll.structures', 'Salary Structures'), icon: <RequestQuoteIcon />, path: '/payroll/structures', requiredTier: 'ENTERPRISE' },
      // Approvals
      { text: t('payroll.leaveApprovals', 'Leave Approvals'), icon: <EventBusyIcon />, path: '/payroll/leave-approvals', requiredTier: 'ENTERPRISE' },
      { text: t('payroll.loanApprovals', 'Loan Management'), icon: <PaidIcon />, path: '/payroll/loans', requiredTier: 'ENTERPRISE' },
      // Configuration
      { text: t('payroll.statutory', 'Statutory & Compliance'), icon: <PolicyIcon />, path: '/payroll/statutory', requiredTier: 'ENTERPRISE' },
      { text: t('payroll.banking', 'Banking Setup'), icon: <AccountBalanceIcon />, path: '/payroll/banking', requiredTier: 'ENTERPRISE' },
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
    { text: t('sidebar.complianceDashboard', 'Compliance Dashboard'), icon: <VerifiedUser />, path: '/reports/compliance', requiredTier: 'PRO' },
    { text: t('taxComplianceHub.title'), icon: <VerifiedUser />, path: '/reports/tax-compliance', requiredTier: 'ENTERPRISE' },
  ];

  const reportsGroup = {
    key: 'reports',
    text: t('reports', 'Reports'),
    icon: <AssessmentIcon />,
    requiredTier: 'PRO',
    children: reportChildren,
  };

  // ─── ADMINISTRATION sub-groups ──────────────────────────────────────
  //
  // Three narrow groups instead of one 10-item bucket:
  //   • Team & access — who's in the shop and what they can do
  //   • Configuration — how the shop runs (settings, notifications, payroll, backup)
  //   • Compliance — audit + regulatory trail
  //
  // Subscription & billing is a standalone leaf below these — it's a single
  // destination and users hit it rarely, so nesting is noise.

  const teamAccessGroup = {
    key: 'teamAccess',
    text: t('sidebar.groupTeamAccess', 'Team & access'),
    icon: <GroupIcon />,
    children: [
      { text: t('sidebar.team', 'Team & invitations'), icon: <GroupIcon />, path: '/admin/team' },
      { text: t('sidebar.rolesPermissions', 'Roles & permissions'), icon: <ShieldIcon />, path: '/admin/roles' },
      { text: t('users', 'Users'), icon: <ManageAccountsIcon />, path: '/admin/users' },
    ],
  };

  const configurationGroup = {
    key: 'configuration',
    text: t('sidebar.groupConfiguration', 'Configuration'),
    icon: <Settings />,
    children: [
      { text: t('sidebar.shopProfile', 'Shop profile & settings'), icon: <Settings />, path: '/admin/settings' },
      // Add new store — OWNER only; not shown to ADMIN or staff.
      ...(userRole === 'OWNER' ? [{
        text: t('sidebar.addStore', 'Add new store'),
        icon: <AddBusinessIcon />,
        path: '/admin/stores/add',
      }] : []),
      // Shop-level 2FA policy — enforcement + own-account status. Personal
      // MFA enrollment lives in the header user menu (per-user, not shop-config).
      { text: t('sidebar.twoFactor', 'Two-factor authentication'), icon: <ShieldOutlinedIcon />, path: '/admin/security/two-factor' },
      {
        text: t('notifications', 'Notifications'),
        icon: <NotificationsIcon />,
        path: '/notifications',
        requiredTier: 'STARTER',
        // Live badge from WebSocket — cleared when the user visits /notifications
        badge: unreadCount,
      },
      { text: t('sidebar.backupExport', 'Backup & data export'), icon: <BackupIcon />, path: '/backup', requiredTier: 'PRO' },
    ],
  };

  // ─── Compliance ─── statutory, tax and audit tooling
  //
  // Existing pages already ship for GST Summary, Compliance Dashboard, Tax
  // Compliance Hub and the platform Audit Logs — the other four (GSTR-1/3B
  // filing, GSTR-2B ITC recon, E-Way/E-Invoice hub, Period Lock, Cancelled
  // Documents register) land on ComingSoonPage stubs so the sidebar has no
  // dead links while we build them out.
  const complianceGroup = {
    key: 'compliance',
    text: t('sidebar.groupCompliance', 'Compliance'),
    icon: <PolicyIcon />,
    children: [
      { text: t('sidebar.auditTrail', 'Audit trail & activity logs'), icon: <HistoryEduIcon />, path: '/audit', requiredTier: 'ENTERPRISE' },
      { text: t('sidebar.gstrFiling', 'GST returns & filing'), icon: <RequestPageIcon />, path: '/compliance/gstr-filing', requiredTier: 'PRO' },
      { text: t('sidebar.gstr2b', 'GSTR-2B ITC reconciliation'), icon: <CompareArrowsIcon />, path: '/compliance/gstr-2b', requiredTier: 'ENTERPRISE' },
      { text: t('sidebar.einvoiceEway', 'E-Invoicing & E-Way Bill hub'), icon: <DescriptionIcon />, path: '/compliance/einvoice-eway', requiredTier: 'PRO' },
      { text: t('sidebar.periodLock', 'Period lock (book closing)'), icon: <LockClockIcon />, path: '/compliance/period-lock', requiredTier: 'ENTERPRISE' },
      { text: t('sidebar.cancelledDocs', 'Cancelled / deleted documents'), icon: <DeleteSweepIcon />, path: '/compliance/cancelled-documents', requiredTier: 'PRO' },
    ],
  };

  const billingLeaf = {
    text: t('sidebar.billingPlans', 'Subscription & billing'),
    icon: <AccountBalanceWallet />,
    path: '/admin/billing',
  };

  // Employee Self-Service Portal (ESS) — for employees only
  const essChildren = [
    { text: t('ess.dashboard', 'My Dashboard'), icon: <DashboardIcon />, path: '/employee/dashboard', requiredTier: 'ENTERPRISE', divider: false },
    { text: t('ess.payslips', 'Payslips'), icon: <ReceiptLongIcon />, path: '/employee/payslips', requiredTier: 'ENTERPRISE' },
    { text: t('ess.tax', 'Tax Declaration'), icon: <RequestPageIcon />, path: '/employee/tax-declaration', requiredTier: 'ENTERPRISE' },
    { text: t('ess.leaves', 'Leave Requests'), icon: <EventBusyIcon />, path: '/employee/leaves', requiredTier: 'ENTERPRISE', divider: true },
    { text: t('ess.loans', 'Loans'), icon: <PaidIcon />, path: '/employee/loans', requiredTier: 'ENTERPRISE' },
    { text: t('ess.advances', 'Salary Advances'), icon: <PaymentsIcon />, path: '/employee/advances', requiredTier: 'ENTERPRISE' },
    { text: t('ess.preferences', 'Preferences'), icon: <Settings />, path: '/employee/preferences', requiredTier: 'ENTERPRISE', divider: true },
  ];

  const essGroup = {
    key: 'ess',
    text: t('ess.title', 'Employee Portal'),
    icon: <BadgeIcon />,
    requiredTier: 'ENTERPRISE',
    children: essChildren,
  };

  // Section order — operations sit above business insights sit above admin.
  // IMPORTANT: Role-based sidebar organization
  // - Admin/Owner: Finance, Payroll (top-level), Reports, Administration
  // - Regular Staff: Employee Self-Service Portal only
  const operationsGroups = [salesGroup, purchasesGroup, inventoryGroup, contactsGroup];

  // For Admin/Owner: Finance | Expenses | Payroll (own section) | Reports
  const adminBusinessGroups = [financeGroup, expensesGroup, payrollGroup, reportsGroup];
  const adminAdministrationGroups = [teamAccessGroup, configurationGroup, complianceGroup];

  // For Regular Staff: Only Employee Portal (self-service)
  const staffBusinessGroups = [essGroup];

  // Choose groups based on role
  const businessGroups = isAdminOrOwner ? adminBusinessGroups : staffBusinessGroups;
  const administrationGroups = isAdminOrOwner ? adminAdministrationGroups : [];

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
    const label    = item.text;
    const badgeVal = item.badge || 0;

    return (
      <ListItem key={item.path || item.text} disablePadding>
        <ListItemButton
          component={isLocked ? 'div' : NavLink}
          to={isLocked ? undefined : item.path}
          onClick={() => {
            if (isLocked) navigate('/pricing', { state: { requiredTier: item.requiredTier } });
            if (isMobile) onDrawerToggle();
          }}
          aria-label={isLocked ? `${label} (requires upgrade)` : label}
          aria-current={isActive && !isLocked ? 'page' : undefined}
          sx={{
            borderRadius: '6px',
            margin: '1px 8px',
            pl: isNested ? (5 - 0.375) : (2 - 0.375),  // compensate for the 3px accent so text stays put
            opacity: isLocked ? 0.6 : 1,
            transition: 'background-color 120ms ease',
            /* Touch target: 44px on mobile, 48px on desktop (WCAG 2.5.5) */
            minHeight: { xs: 44, md: 48 },
            ...inactiveEdge,
            ...(isActive && !isLocked ? activeStyle : {}),
          }}
        >
          {/* Icon — wrapped in a Badge when there are unread notifications */}
          <ListItemIcon sx={{ minWidth: 36, color: (isActive && !isLocked) ? 'primary.main' : 'text.secondary' }}>
            {badgeVal > 0 ? (
              <Badge
                badgeContent={badgeVal > 99 ? '99+' : badgeVal}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.6rem',
                    height: 16,
                    minWidth: 16,
                    padding: '0 3px',
                  },
                }}
              >
                {item.icon}
              </Badge>
            ) : (
              item.icon
            )}
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
          aria-expanded={open}
          aria-label={groupIsLocked ? `${group.text} (requires upgrade), ${open ? 'expanded' : 'collapsed'}` : `${group.text}, ${open ? 'expanded' : 'collapsed'}`}
          sx={{
            borderRadius: '6px',
            margin: '1px 8px',
            pl: 2 - 0.375,
            opacity: groupIsLocked ? 0.6 : 1,
            transition: 'background-color 120ms ease',
            /* Touch target: 44px on mobile, 48px on desktop (WCAG 2.5.5) */
            minHeight: { xs: 44, md: 48 },
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

        {/* Section header + accordion body helper — keeps the three sections
            visually parallel without duplicating the sx block below. */}
        {(() => {
          const SectionHeader = ({ label }) => (
            <Box sx={{ px: 3, pt: 2, pb: 0.5 }}>
              <Typography
                variant="overline"
                sx={{
                  display: 'block',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'text.disabled',
                  lineHeight: 1.4,
                }}
              >
                {label}
              </Typography>
            </Box>
          );

          return (
            <>
              {/* ─── OPERATIONS ─── everyone with the right permissions */}
              <SectionHeader label={t('sidebar.sectionOperations', 'OPERATIONS')} />
              <List disablePadding aria-label={t('sidebar.sectionOperations', 'Operations')}>{operationsGroups.map(renderGroup)}</List>

              {/* ─── BUSINESS ─── finance + reports (admin/owner) */}
              {isAdminOrOwner && (
                <>
                  <SectionHeader label={t('sidebar.sectionBusiness', 'BUSINESS')} />
                  <List disablePadding aria-label={t('sidebar.sectionBusiness', 'Business')}>{businessGroups.map(renderGroup)}</List>
                </>
              )}

              {/* ─── ADMINISTRATION ─── team / config / compliance / billing */}
              {isAdminOrOwner && (
                <>
                  <SectionHeader label={t('sidebar.sectionAdministration', 'ADMINISTRATION')} />
                  <List disablePadding aria-label={t('sidebar.sectionAdministration', 'Administration')}>{administrationGroups.map(renderGroup)}</List>
                  <List disablePadding aria-label={t('sidebar.billingPlans', 'Subscription & billing')}>{renderLeaf(billingLeaf)}</List>
                </>
              )}
            </>
          );
        })()}
      </Box>
      {/* About Us moved to the header user dropdown to keep the sidebar focused
          on operational navigation. Legal / marketing links live under the profile menu. */}
    </Box>
  );

  return (
    <Box component="nav" aria-label="Main navigation" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      {isMobile ? (
        <SwipeableDrawer
          variant="temporary"
          open={mobileOpen}
          onOpen={onDrawerToggle}
          onClose={onDrawerToggle}
          ModalProps={{ keepMounted: true }}
          aria-label="Navigation drawer"
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
        </SwipeableDrawer>
      ) : (
        <Drawer
          variant="permanent"
          open={true}
          ModalProps={{ keepMounted: true }}
          aria-label="Navigation drawer"
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
      )}
    </Box>
  );
};

export default Sidebar;
