import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

/**
 * Legacy alias — /customer-details/:id/dues is a URL the old
 * SalesHistory page linked to. Rather than keep dual routes, we
 *301 through to the canonical /customers/:id.
 */
const LegacyDuesRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/customers/${id}`} replace />;
};

// Loading fallback for lazy-loaded components
const LazyFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
    <CircularProgress />
  </Box>
);

import PrivateRoute from './PrivateRoute';
import MainLayout from '../components/layout/MainLayout'; // Updated to use your responsive layout
import Dashboard from '../pages/Dashboard';
import ItemsPage from '../pages/ItemsPage';
import CustomFieldsPage from '../pages/CustomFieldsPage';
import Stock from '../pages/Stock';
import Customers from '../pages/Customers';
import Sales from '../pages/Sales';
import SalesReturn from '../pages/SalesReturn';
import TaxComplianceHub from '../pages/reports/TaxComplianceHub';
import ReportsIndex from '../pages/reports/ReportsIndex';
import DailyReport from '../pages/reports/DailyReport';
import SalesSummary from '../pages/reports/SalesSummary';
import GstSummary from '../pages/reports/GstSummary';
import GstBreakdown from '../pages/reports/GstBreakdown';
import ItemsSold from '../pages/reports/ItemsSold';
import CategorySales from '../pages/reports/CategorySales';
import CustomerSales from '../pages/reports/CustomerSales';
import SalespersonLeaderboard from '../pages/reports/SalespersonLeaderboard';
import ZReport from '../pages/reports/ZReport';
import ExpensesSummary from '../pages/reports/ExpensesSummary';
import PaymentsSummary from '../pages/reports/PaymentsSummary';
// import Expenses from '../pages/Expenses'; // Replaced with new Enterprise Expenses pages
import Backup from '../pages/Backup';
import {
  ExpenseDashboard,
  ExpensesList,
  ExpenseForm,
  ApprovalInbox,
  ReconciliationPage,
  ReportsPage,
  ExpenseSettingsPage,
} from '../pages/expenses';
import Login from '../pages/Login';
import ProductOverview from '../pages/ProductOverview';
import CustomerPaymentPage    from '../pages/payments/CustomerPaymentPage';
import CustomerStatementPage  from '../pages/payments/CustomerStatementPage';
import CustomerDetails from '../pages/CustomerDetails';
import AboutUs from '../pages/AboutUs';
import SetupShop from '../pages/SetupShop';
import PurchaseOrders from '../pages/PurchaseOrders';
import PurchaseOrderEditor from '../pages/purchases/PurchaseOrderEditor';
import PurchaseOrderDetail from '../pages/purchases/PurchaseOrderDetail';
import PurchaseOrderApprovals from '../pages/purchases/PurchaseOrderApprovals';
import Quotations from '../pages/Quotations';
import QuotationEditor from '../pages/QuotationEditor';
import SalesOrders from '../pages/SalesOrders';
import SalesOrderEditor from '../pages/SalesOrderEditor';
import CreditNotes from '../pages/CreditNotes';
import CreditNotesListPage from '../pages/accounting/CreditNotesListPage';
import CreditNoteDetailPage from '../pages/accounting/CreditNoteDetailPage';
import DebitNotes from '../pages/DebitNotes';
import Suppliers from '../pages/Suppliers';
import SuppliersListPage from '../pages/suppliers/SuppliersListPage';
import LandingLayout from '../components/layout/LandingLayout';
import AuthLayout from '../components/layout/AuthLayout';
import OnboardingLayout from '../components/layout/OnboardingLayout';
import LandingPage from '../pages/LandingPage';
import Receiving from '../pages/Receiving'; // legacy Receiving page — kept for backwards compat
import ReceivingListPage from '../pages/receivings/ReceivingListPage';
import GrnCreatePage from '../pages/receivings/GrnCreatePage';
import GrnDetailPage from '../pages/receivings/GrnDetailPage';
import GrnEditPage from '../pages/receivings/GrnEditPage';
import ReceivingReportsPage from '../pages/receivings/ReceivingReportsPage';
import PurchaseOrderReportsPage from '../pages/purchases/PurchaseOrderReportsPage';
import InventoryReportsPage from '../pages/inventory/InventoryReportsPage';
import CycleCountsPage from '../pages/inventory/CycleCountsPage';
import BatchRecallsPage from '../pages/inventory/BatchRecallsPage';
import AdjustmentApprovalsPage from '../pages/inventory/AdjustmentApprovalsPage';
import ProductBundlesPage from '../pages/inventory/ProductBundlesPage';
import UomSettingsPage from '../pages/inventory/UomSettingsPage';
import BarcodeLabelsPage from '../pages/inventory/BarcodeLabelsPage';
import PurchaseReturnsListPage from '../pages/returns/PurchaseReturnsListPage';
import PurchaseReturnCreatePage from '../pages/returns/PurchaseReturnCreatePage';
import PurchaseReturnDetailPage from '../pages/returns/PurchaseReturnDetailPage';
import DebitNotesListPage from '../pages/accounting/DebitNotesListPage';
import DebitNoteDetailPage from '../pages/accounting/DebitNoteDetailPage';
import DebitNoteReportsPage from '../pages/accounting/DebitNoteReportsPage';
import ReceivingTicketsListPage from '../pages/receivings/ReceivingTicketsListPage';
import SupplierDetailPage from '../pages/suppliers/SupplierDetailPage';
import DeliveryManagement from '../pages/DeliveryManagement';
import LowStockAlerts from '../pages/LowStockAlerts';
import { AlertProvider } from '../context/AlertContext';
import UserManagementPage from '../pages/UserManagementPage';
import MfaSetupPage from '../pages/MfaSetupPage';
import ActiveSessionsPage from '../pages/ActiveSessionsPage';
import TwoFactorAuthenticationPage from '../pages/security/TwoFactorAuthenticationPage';
import ChangePasswordPage from '../pages/security/ChangePasswordPage';
import UserProfile from '../pages/UserProfile';
import SearchResults from '../pages/SearchResults';
import TeamPage from '../pages/TeamPage';
import RolesPermissionMatrixPage from '../pages/RolesPermissionMatrixPage';
import AcceptShopInvitePage from '../pages/AcceptShopInvitePage';
import ComplianceModuleStub from '../pages/compliance/ComingSoonPage';
const PeriodLockManagement = React.lazy(() => import('../pages/compliance/PeriodLockManagement'));
const Gstr2bReconciliation = React.lazy(() => import('../pages/compliance/Gstr2bReconciliation'));
const Gstr9Summary = React.lazy(() => import('../pages/reports/Gstr9Summary'));
import Notifications from '../pages/Notifications';
import ShopGuard from '../components/guards/ShopGuard';
import TierGuard from '../components/guards/TierGuard'; // Added TierGuard
import ErrorBoundary from '../components/common/ErrorBoundary'; // route-level fallback keeps sidebar/header alive on page crash
import HsnSummary from '../pages/reports/HsnSummary';
const Gstr3bSummary = React.lazy(() => import('../pages/reports/Gstr3bSummary'));
import AuditLogs from '../pages/AuditLogs';
import SupplierPaymentPage from '../pages/SupplierPaymentPage';
import PricingPage from '../pages/PricingPage';
import PaymentHistoryPage from '../pages/payroll/PaymentHistoryPage';
// ===== LAZY-LOADED BUNDLES =====
// BUNDLE 1: Payroll Module (async)
const EmployeeDirectory = React.lazy(() => import('../pages/payroll/EmployeeDirectory'));
const SalaryStructures = React.lazy(() => import('../pages/payroll/SalaryStructures'));
const LoanManagement = React.lazy(() => import('../pages/payroll/LoanManagement'));
const PayrollWizard = React.lazy(() => import('../pages/payroll/PayrollWizard'));
const StatutoryCompliance = React.lazy(() => import('../pages/payroll/StatutoryCompliance'));
const BankingIntegration = React.lazy(() => import('../pages/payroll/BankingIntegration'));
const LeaveApprovals = React.lazy(() => import('../pages/payroll/LeaveApprovals'));
const PayrollReports = React.lazy(() => import('../pages/payroll/PayrollReports'));
const AdvanceApprovals = React.lazy(() => import('../pages/payroll/AdvanceApprovals'));
const LeaveTypeManagement = React.lazy(() => import('../pages/payroll/LeaveTypeManagement'));
const HolidayCalendar = React.lazy(() => import('../pages/payroll/HolidayCalendar'));
const EmployeePayrollHistory = React.lazy(() => import('../pages/payroll/EmployeePayrollHistory'));
const PayrollAdminDashboard = React.lazy(() => import('../pages/payroll/PayrollAdminDashboard'));

// BUNDLE 2: Employee Self-Service (async)
const ESSDashboard = React.lazy(() => import('../pages/employee/ESSDashboard'));
const MyPayslips = React.lazy(() => import('../pages/employee/MyPayslips'));
const TaxDeclaration = React.lazy(() => import('../pages/employee/TaxDeclaration'));
const LeaveApplications = React.lazy(() => import('../pages/employee/LeaveApplications'));
const LoanRequests = React.lazy(() => import('../pages/employee/LoanRequests'));
const AdvanceRequests = React.lazy(() => import('../pages/employee/AdvanceRequests'));
const ESSPreferences = React.lazy(() => import('../pages/employee/ESSPreferences'));

// BUNDLE 3: Admin Module (async)
const TechAdminDashboard = React.lazy(() => import('../pages/admin/TechAdminDashboard'));
const AdminPaymentQueue = React.lazy(() => import('../pages/admin/AdminPaymentQueue'));
const AdminSupport = React.lazy(() => import('../pages/admin/AdminSupport'));
const GlobalShopManagement = React.lazy(() => import('../pages/admin/GlobalShopManagement'));
const SystemUserManagement = React.lazy(() => import('../pages/admin/SystemUserManagement'));
const NewsletterManager = React.lazy(() => import('../pages/admin/NewsletterManager'));
const PlanConfigManager = React.lazy(() => import('../pages/admin/PlanConfigManager'));
const PlatformSettingsPage = React.lazy(() => import('../pages/admin/PlatformSettingsPage'));
const AdminTeamManagementPage = React.lazy(() => import('../pages/admin/AdminTeamManagementPage'));
const FeatureFlagManagerPage = React.lazy(() => import('../pages/admin/FeatureFlagManagerPage'));
const SuperAdminAuditPage = React.lazy(() => import('../pages/admin/SuperAdminAuditPage'));

// BUNDLE 4: Analytics & Compliance (async)
const AnalyticsDashboard = React.lazy(() => import('../pages/AnalyticsDashboard'));
const PaymentDashboard = React.lazy(() => import('../pages/payments/PaymentDashboard'));
const ComplianceDashboard = React.lazy(() => import('../pages/reports/ComplianceDashboard'));
const AccountingDashboard = React.lazy(() => import('../pages/reports/AccountingDashboard'));
const ExpiryReport = React.lazy(() => import('../pages/reports/ExpiryReport'));
const PurchaseRegister = React.lazy(() => import('../pages/reports/PurchaseRegister'));

// ===== EAGERLY-LOADED (Main app) =====
import ResetPassword from '../pages/ResetPassword';
import VerifyEmail from '../pages/VerifyEmail';
import ComingSoonPage from '../pages/public/ComingSoonPage';
import AdminLayout from '../components/layout/AdminLayout';
import { useAuthContext } from '../context/AuthContext';
import SettingsPage from '../pages/SettingsPage';
import NotFound from '../pages/NotFound';
import BillingDashboard from '../components/subscriptions/BillingDashboard';
import LockScreenPage from '../pages/LockScreenPage';
import HelpAndSupportPage from '../pages/HelpAndSupportPage';
import KeyboardShortcutsPage from '../pages/KeyboardShortcutsPage';
import UserPreferencesPage from '../pages/UserPreferencesPage';
import AcceptAdminInvitePage from '../pages/public/AcceptAdminInvitePage';
import BillingPage from '../pages/billing/BillingPage';
import PaymentSuccessPage from '../pages/billing/PaymentSuccessPage';
import PaymentFailurePage from '../pages/billing/PaymentFailurePage';
import PurchaseReturns from '../pages/purchases/PurchaseReturns';
import PrintGRNPage from '../pages/purchases/PrintGRNPage';
import PrintPurchaseReturnPage from '../pages/purchases/PrintPurchaseReturnPage';
import { ShopProvider } from '../context/ShopContext';
import { OfflineSalesProvider } from '../context/OfflineSalesContext';

function AppRoutes() {
  const { user } = useAuthContext();
  const isSuperAdmin = user?.role === 'ROLE_SUPER_ADMIN';

  return (
    <AlertProvider>
      <Routes>
        {/* 0. Public Marketing Routes — LandingLayout (EnterpriseHeader + EnterpriseFooter) */}
        <Route element={<LandingLayout />}>
          <Route
            index
            path="/"
            element={
              user ? (
                isSuperAdmin ? (
                  <Navigate to="/admin/dashboard" replace />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              ) : (
                <LandingPage />
              )
            }
          />
          {/* Public pricing for guest users only */}
          {!user && <Route path="/pricing" element={<PricingPage />} />}

          {/* Placeholder marketing routes */}
          <Route path="/about" element={<ComingSoonPage sectionName="About Us" />} />
          <Route path="/careers" element={<ComingSoonPage sectionName="Careers" />} />
          <Route path="/blog" element={<ComingSoonPage sectionName="Blog" />} />
          <Route path="/docs" element={<ComingSoonPage sectionName="Documentation" />} />
          <Route path="/docs/api" element={<ComingSoonPage sectionName="API Reference" />} />
          <Route path="/help" element={<ComingSoonPage sectionName="Help Center" />} />
        </Route>

        {/* 1. Auth Routes — AuthLayout (Split-Screen Layout) */}
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={
              user ? (
                isSuperAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/dashboard" replace />
              ) : <Login />
            }
          />
          <Route
            path="/auth/reset-password"
            element={user ? <Navigate to="/" replace /> : <ResetPassword />}
          />
          {/* Email verification is public — the linked user is (by design) not yet
              signed in. Allows a link click from the verification email to work
              even when a stale session exists. */}
          <Route path="/auth/verify-email" element={<VerifyEmail />} />
          <Route path="/accept-invite" element={<AcceptAdminInvitePage />} />
          {/* Shop-level staff invitations (Phase 5). Public: the token in the URL is the auth signal. */}
          <Route path="/accept-shop-invite" element={<AcceptShopInvitePage />} />
        </Route>

        {/* 1b. Shop onboarding — its own wide layout, not the auth split-screen.
             Guarded like the old inline auth block: needs a signed-in user, redirects
             to /dashboard if the user already has a shop. */}
        <Route element={<OnboardingLayout />}>
          <Route
            path="/setup-shop"
            element={
              user ? (
                user.shopId ? <Navigate to="/dashboard" replace /> : <SetupShop />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Route>

        {/* 2. Admin Routes - Active ONLY for Super Admin */}
        {isSuperAdmin && (
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<TechAdminDashboard />} />
            <Route path="dashboard" element={<TechAdminDashboard />} />
            <Route path="payments" element={<AdminPaymentQueue />} />
            <Route path="shops" element={<GlobalShopManagement />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="users" element={<SystemUserManagement />} />
            <Route path="plans" element={<PlanConfigManager />} />
            <Route path="platform-settings" element={<PlatformSettingsPage />} />
            <Route path="team" element={<AdminTeamManagementPage />} />
            <Route path="feature-flags" element={<FeatureFlagManagerPage />} />
            <Route path="audit" element={<SuperAdminAuditPage />} />
            <Route path="newsletter" element={<NewsletterManager />} />
          </Route>
        )}

        {/* 3. Protected Layout: Responsive wrapper for Shop Owners/Staff */}
        {!isSuperAdmin && (
          <Route
            path="/"
            element={
              <PrivateRoute>
                <ShopProvider>
                  <OfflineSalesProvider>
                    <ShopGuard>
                      <MainLayout />
                    </ShopGuard>
                  </OfflineSalesProvider>
                </ShopProvider>
              </PrivateRoute>
            }
          >
            {/* PUBLIC WITHIN APP (No Tier Required) */}
            <Route path="/pricing" element={<PricingPage />} />
            {/* Global Search Results */}
            <Route path="/search" element={<SearchResults />} />
            {/* Razorpay AutoPay Billing Routes */}
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/billing/success" element={<PaymentSuccessPage />} />
            <Route path="/billing/failure" element={<PaymentFailurePage />} />
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="items" element={<ItemsPage />} />
            <Route path="settings/custom-fields" element={<CustomFieldsPage />} />
            <Route path="stock" element={<Stock />} />
            <Route path="stock/reports" element={<ErrorBoundary resetKey="stock/reports"><InventoryReportsPage /></ErrorBoundary>} />
            <Route path="stock/cycle-counts" element={<ErrorBoundary resetKey="stock/cycle-counts"><CycleCountsPage /></ErrorBoundary>} />
            <Route path="stock/recalls" element={<ErrorBoundary resetKey="stock/recalls"><BatchRecallsPage /></ErrorBoundary>} />
            <Route path="stock/adjustment-approvals" element={<ErrorBoundary resetKey="stock/adjustment-approvals"><AdjustmentApprovalsPage /></ErrorBoundary>} />
            <Route path="stock/bundles" element={<ErrorBoundary resetKey="stock/bundles"><ProductBundlesPage /></ErrorBoundary>} />
            <Route path="stock/uom" element={<ErrorBoundary resetKey="stock/uom"><UomSettingsPage /></ErrorBoundary>} />
            <Route path="stock/labels" element={<ErrorBoundary resetKey="stock/labels"><BarcodeLabelsPage /></ErrorBoundary>} />
            <Route path="customers" element={<ErrorBoundary resetKey="customers"><Customers /></ErrorBoundary>} />
            {/* V104 enterprise detail page — /customers/:id */}
            <Route path="customers/:id" element={<ErrorBoundary resetKey="customers/:id"><CustomerDetails /></ErrorBoundary>} />
            {/* Legacy ledger route retired in Phase 4 — redirect deep-links from
                SalesHistory to the canonical /customers/:id URL. Preserves any
                cached bookmarks pointing at the old path without duplicating the
                page render. */}
            <Route path="customer-details/:id/dues" element={<LegacyDuesRedirect />} />

            <Route path="sales" element={<Sales />} />
            <Route path="sales/drafts" element={<Sales />} />
            <Route path="sales/return" element={<SalesReturn />} />

            {/* Enterprise Expenses Routes */}
            <Route path="expenses" element={<ExpenseDashboard />} />
            <Route path="expenses/dashboard" element={<ExpenseDashboard />} />
            <Route path="expenses/list" element={<ExpensesList />} />
            <Route path="expenses/create" element={<ExpenseForm />} />
            <Route path="expenses/edit/:id" element={<ExpenseForm />} />
            <Route path="expenses/approvals" element={<ApprovalInbox />} />
            <Route path="expenses/reconciliation" element={<ReconciliationPage />} />
            <Route path="expenses/reports" element={<ReportsPage />} />
            <Route path="expenses/settings" element={<ExpenseSettingsPage />} />

            <Route path="products" element={<ProductOverview />} />
            <Route path="customer-payments" element={<CustomerPaymentPage />} />
            {/* Canonical path used in Phase 1 links: /payments/customer */}
            <Route path="payments/customer" element={<CustomerPaymentPage />} />
            {/* Phase 3A: Payment analytics dashboard for finance/admin users */}
            <Route path="payments/dashboard" element={<Suspense fallback={<LazyFallback />}><PaymentDashboard /></Suspense>} />
            {/* Phase 3C: Customer account statement (double-entry ledger + PDF) */}
            <Route path="payments/customer-statement" element={<CustomerStatementPage />} />
            <Route path="about-us" element={<AboutUs />} />
            <Route path="admin/users" element={<UserManagementPage />} />
            <Route path="admin/settings" element={<SettingsPage />} />
            <Route path="admin/billing" element={<BillingDashboard />} />
            {/* Account-security (per-user MFA + Active Sessions). Available to every signed-in user regardless of role. */}
            <Route path="account/security" element={<MfaSetupPage />} />
            <Route path="account/security/mfa" element={<MfaSetupPage />} />
            <Route path="account/security/sessions" element={<ActiveSessionsPage />} />
            <Route path="account/security/change-password" element={<ChangePasswordPage />} />
            <Route path="account/profile" element={<UserProfile />} />
            {/* Team management (Phase 5). Permission gate lives inside TeamPage. */}
            <Route path="admin/team" element={<TeamPage />} />
            <Route path="admin/roles" element={<RolesPermissionMatrixPage />} />
            {/* Shop-level 2FA policy — dedicated page under Configuration.
                Personal MFA (enrollment/backup-codes) still lives at
                /account/security/mfa in the header user menu. */}
            <Route path="admin/security/two-factor" element={<TwoFactorAuthenticationPage />} />

            {/* User Profile Menu Pages — Available to all authenticated users */}
            <Route path="user/lock-screen" element={<LockScreenPage />} />
            <Route path="user/help" element={<HelpAndSupportPage />} />
            <Route path="user/keyboard-shortcuts" element={<KeyboardShortcutsPage />} />
            <Route path="user/preferences" element={<UserPreferencesPage />} />

            {/* QUOTATIONS — available on all tiers as a core sales tool */}
            <Route path="quotations" element={<Quotations />} />
            <Route path="quotations/new" element={<QuotationEditor />} />
            <Route path="quotations/:id/edit" element={<QuotationEditor />} />
            {/* SALES ORDERS — with stock reservation, above the tier line */}
            <Route path="sales-orders" element={<SalesOrders />} />
            <Route path="sales-orders/new" element={<SalesOrderEditor />} />
            <Route path="sales-orders/:id/edit" element={<SalesOrderEditor />} />
            {/* CREDIT NOTES — customer-facing returns / adjustments (V101 enterprise redesign) */}
            <Route path="credit-notes" element={<TierGuard requiredTier="PRO"><ErrorBoundary resetKey="credit-notes"><CreditNotesListPage /></ErrorBoundary></TierGuard>} />
            <Route path="credit-notes/:id" element={<TierGuard requiredTier="PRO"><ErrorBoundary resetKey="credit-notes/:id"><CreditNoteDetailPage /></ErrorBoundary></TierGuard>} />
            <Route path="credit-notes/legacy" element={<TierGuard requiredTier="PRO"><CreditNotes /></TierGuard>} />
            {/* DEBIT NOTES — supplier-facing returns / adjustments */}
            <Route path="debit-notes" element={<TierGuard requiredTier="PRO"><ErrorBoundary resetKey="debit-notes"><DebitNotesListPage /></ErrorBoundary></TierGuard>} />
            <Route path="debit-notes/reports" element={<TierGuard requiredTier="PRO"><ErrorBoundary resetKey="debit-notes/reports"><DebitNoteReportsPage /></ErrorBoundary></TierGuard>} />
            <Route path="debit-notes/:id" element={<TierGuard requiredTier="PRO"><ErrorBoundary resetKey="debit-notes/:id"><DebitNoteDetailPage /></ErrorBoundary></TierGuard>} />
            <Route path="debit-notes/legacy" element={<TierGuard requiredTier="PRO"><DebitNotes /></TierGuard>} />

            {/* STARTER TIER & ABOVE */}
            <Route path="delivery" element={<TierGuard requiredTier="STARTER"><DeliveryManagement /></TierGuard>} />
            {/* V103 — enterprise suppliers list. Legacy at /suppliers/legacy. */}
            <Route path="suppliers" element={<TierGuard requiredTier="STARTER"><ErrorBoundary resetKey="suppliers"><SuppliersListPage /></ErrorBoundary></TierGuard>} />
            <Route path="suppliers/legacy" element={<TierGuard requiredTier="STARTER"><Suppliers /></TierGuard>} />
            <Route path="low-stock-alerts" element={<TierGuard requiredTier="STARTER"><LowStockAlerts /></TierGuard>} />
            <Route path="notifications" element={<TierGuard requiredTier="STARTER"><Notifications /></TierGuard>} />

            {/* PRO TIER & ABOVE */}
            <Route path="analytics" element={<TierGuard requiredTier="PRO"><Suspense fallback={<LazyFallback />}><AnalyticsDashboard /></Suspense></TierGuard>} />
            {/* PO routes wrapped in ErrorBoundary so a page-render crash keeps
                the sidebar + header alive — user can still navigate away.
                resetKey=path clears the fallback when they switch pages. */}
            <Route path="purchase-orders" element={<TierGuard requiredTier="PRO"><ErrorBoundary resetKey="purchase-orders"><PurchaseOrders /></ErrorBoundary></TierGuard>} />
            <Route path="purchase-orders/new" element={<TierGuard requiredTier="PRO"><ErrorBoundary resetKey="purchase-orders/new"><PurchaseOrderEditor /></ErrorBoundary></TierGuard>} />
            <Route path="purchase-orders/approvals" element={<TierGuard requiredTier="PRO"><ErrorBoundary resetKey="purchase-orders/approvals"><PurchaseOrderApprovals /></ErrorBoundary></TierGuard>} />
            <Route path="purchase-orders/reports" element={<TierGuard requiredTier="PRO"><ErrorBoundary resetKey="purchase-orders/reports"><PurchaseOrderReportsPage /></ErrorBoundary></TierGuard>} />
            <Route path="purchase-orders/:id" element={<TierGuard requiredTier="PRO"><ErrorBoundary resetKey="purchase-orders/:id"><PurchaseOrderDetail /></ErrorBoundary></TierGuard>} />
            <Route path="purchase-orders/:id/edit" element={<TierGuard requiredTier="PRO"><ErrorBoundary resetKey="purchase-orders/:id/edit"><PurchaseOrderEditor /></ErrorBoundary></TierGuard>} />
            <Route path="receivings" element={<TierGuard requiredTier="PRO"><ErrorBoundary resetKey="receivings"><ReceivingListPage /></ErrorBoundary></TierGuard>} />
            <Route path="receivings/new" element={<TierGuard requiredTier="PRO"><ErrorBoundary resetKey="receivings/new"><GrnCreatePage /></ErrorBoundary></TierGuard>} />
            <Route path="receivings/tickets" element={<TierGuard requiredTier="PRO"><ErrorBoundary resetKey="receivings/tickets"><ReceivingTicketsListPage /></ErrorBoundary></TierGuard>} />
            <Route path="receivings/reports" element={<TierGuard requiredTier="PRO"><ErrorBoundary resetKey="receivings/reports"><ReceivingReportsPage /></ErrorBoundary></TierGuard>} />
            <Route path="receivings/:id" element={<TierGuard requiredTier="PRO"><ErrorBoundary resetKey="receivings/:id"><GrnDetailPage /></ErrorBoundary></TierGuard>} />
            <Route path="receivings/:id/edit" element={<TierGuard requiredTier="PRO"><ErrorBoundary resetKey="receivings/:id/edit"><GrnEditPage /></ErrorBoundary></TierGuard>} />
            <Route path="receivings/:id/print" element={<TierGuard requiredTier="PRO"><PrintGRNPage /></TierGuard>} />
            <Route path="receivings/legacy" element={<TierGuard requiredTier="PRO"><Receiving /></TierGuard>} />
            <Route path="suppliers/:id" element={<TierGuard requiredTier="STARTER"><ErrorBoundary resetKey="suppliers/:id"><SupplierDetailPage /></ErrorBoundary></TierGuard>} />
            <Route path="supplier-payments" element={<TierGuard requiredTier="PRO"><SupplierPaymentPage /></TierGuard>} />
            <Route path="purchase-returns" element={<TierGuard requiredTier="PRO"><ErrorBoundary resetKey="purchase-returns"><PurchaseReturnsListPage /></ErrorBoundary></TierGuard>} />
            <Route path="purchase-returns/new" element={<TierGuard requiredTier="PRO"><ErrorBoundary resetKey="purchase-returns/new"><PurchaseReturnCreatePage /></ErrorBoundary></TierGuard>} />
            <Route path="purchase-returns/:id" element={<TierGuard requiredTier="PRO"><ErrorBoundary resetKey="purchase-returns/:id"><PurchaseReturnDetailPage /></ErrorBoundary></TierGuard>} />
            <Route path="purchase-returns/:id/print" element={<TierGuard requiredTier="PRO"><PrintPurchaseReturnPage /></TierGuard>} />
            <Route path="purchase-returns/legacy" element={<TierGuard requiredTier="PRO"><PurchaseReturns /></TierGuard>} />
            <Route path="backup" element={<TierGuard requiredTier="PRO"><Backup /></TierGuard>} />

            {/* Reports Group (PRO Tier) */}
            <Route path="reports" element={<TierGuard requiredTier="PRO"><ReportsIndex /></TierGuard>} />
            <Route path="reports/daily" element={<TierGuard requiredTier="PRO"><DailyReport /></TierGuard>} />
            <Route path="reports/sales-summary" element={<TierGuard requiredTier="PRO"><SalesSummary /></TierGuard>} />
            <Route path="reports/gst-summary" element={<TierGuard requiredTier="PRO"><GstSummary /></TierGuard>} />
            <Route path="reports/gst-breakdown" element={<TierGuard requiredTier="PRO"><GstBreakdown /></TierGuard>} />
            <Route path="reports/items-sold" element={<TierGuard requiredTier="PRO"><ItemsSold /></TierGuard>} />
            <Route path="reports/category-sales" element={<TierGuard requiredTier="PRO"><CategorySales /></TierGuard>} />
            <Route path="reports/customer-sales" element={<TierGuard requiredTier="PRO"><CustomerSales /></TierGuard>} />
            <Route path="reports/salesperson-leaderboard" element={<TierGuard requiredTier="PRO"><SalespersonLeaderboard /></TierGuard>} />
            <Route path="reports/z-report" element={<TierGuard requiredTier="PRO"><ZReport /></TierGuard>} />
            <Route path="reports/expenses-summary" element={<TierGuard requiredTier="PRO"><ExpensesSummary /></TierGuard>} />
            <Route path="reports/payments-summary" element={<TierGuard requiredTier="PRO"><PaymentsSummary /></TierGuard>} />
            <Route path="reports/accounting" element={<TierGuard requiredTier="PRO"><Suspense fallback={<LazyFallback />}><AccountingDashboard /></Suspense></TierGuard>} />
            {/* Retail Reports (PRO Tier) */}
            <Route path="reports/expiry-report" element={<TierGuard requiredTier="PRO"><Suspense fallback={<LazyFallback />}><ExpiryReport /></Suspense></TierGuard>} />
            <Route path="reports/purchase-register" element={<TierGuard requiredTier="PRO"><Suspense fallback={<LazyFallback />}><PurchaseRegister /></Suspense></TierGuard>} />
            <Route path="reports/compliance" element={<TierGuard requiredTier="PRO"><ErrorBoundary resetKey="reports/compliance"><Suspense fallback={<LazyFallback />}><ComplianceDashboard /></Suspense></ErrorBoundary></TierGuard>} />

            {/* ENTERPRISE TIER ONLY — PAYROLL MODULE (Admin-only routes) */}
            {/* IMPORTANT: These routes are ADMIN/OWNER ONLY. Regular staff cannot access. */}

            {/* Admin — Main Dashboard & Reports */}
            <Route path="payroll" element={
              <TierGuard requiredTier="ENTERPRISE">
                <PrivateRoute requiredRole={['ADMIN', 'OWNER']}>
                  <ErrorBoundary resetKey="payroll">
                    <Suspense fallback={<LazyFallback />}>
                      <PayrollAdminDashboard />
                    </Suspense>
                  </ErrorBoundary>
                </PrivateRoute>
              </TierGuard>
            } />
            {/* Alias: legacy links to /payroll/wizard redirect to the actual wizard page */}
            <Route path="payroll/wizard" element={<Navigate to="/payroll/runs" replace />} />
            <Route path="payroll/reports" element={
              <TierGuard requiredTier="ENTERPRISE">
                <PrivateRoute requiredRole={['ADMIN', 'OWNER']}>
                  <ErrorBoundary resetKey="payroll/reports">
                    <Suspense fallback={<LazyFallback />}>
                      <PayrollReports />
                    </Suspense>
                  </ErrorBoundary>
                </PrivateRoute>
              </TierGuard>
            } />

            {/* Admin — Payroll Operations */}
            <Route path="payroll/runs" element={
              <TierGuard requiredTier="ENTERPRISE">
                <PrivateRoute requiredRole={['ADMIN', 'OWNER']}>
                  <ErrorBoundary resetKey="payroll/runs">
                    <Suspense fallback={<LazyFallback />}>
                      <PayrollWizard />
                    </Suspense>
                  </ErrorBoundary>
                </PrivateRoute>
              </TierGuard>
            } />
            <Route path="payroll/history/:staffId" element={
              <TierGuard requiredTier="ENTERPRISE">
                <PrivateRoute requiredRole={['ADMIN', 'OWNER']}>
                  <PaymentHistoryPage />
                </PrivateRoute>
              </TierGuard>
            } />

            {/* Admin — Employee Management */}
            <Route path="payroll/employees" element={
              <TierGuard requiredTier="ENTERPRISE">
                <PrivateRoute requiredRole={['ADMIN', 'OWNER']}>
                  <ErrorBoundary resetKey="payroll/employees">
                    <Suspense fallback={<LazyFallback />}>
                      <EmployeeDirectory />
                    </Suspense>
                  </ErrorBoundary>
                </PrivateRoute>
              </TierGuard>
            } />
            <Route path="payroll/structures" element={
              <TierGuard requiredTier="ENTERPRISE">
                <PrivateRoute requiredRole={['ADMIN', 'OWNER']}>
                  <ErrorBoundary resetKey="payroll/structures">
                    <Suspense fallback={<LazyFallback />}>
                      <SalaryStructures />
                    </Suspense>
                  </ErrorBoundary>
                </PrivateRoute>
              </TierGuard>
            } />

            {/* Admin — Leave & Attendance */}
            <Route path="payroll/leave-approvals" element={
              <TierGuard requiredTier="ENTERPRISE">
                <PrivateRoute requiredRole={['ADMIN', 'OWNER']}>
                  <ErrorBoundary resetKey="payroll/leave-approvals">
                    <Suspense fallback={<LazyFallback />}>
                      <LeaveApprovals />
                    </Suspense>
                  </ErrorBoundary>
                </PrivateRoute>
              </TierGuard>
            } />

            {/* Admin — Loans & Advances */}
            <Route path="payroll/loans" element={
              <TierGuard requiredTier="ENTERPRISE">
                <PrivateRoute requiredRole={['ADMIN', 'OWNER']}>
                  <ErrorBoundary resetKey="payroll/loans">
                    <Suspense fallback={<LazyFallback />}>
                      <LoanManagement />
                    </Suspense>
                  </ErrorBoundary>
                </PrivateRoute>
              </TierGuard>
            } />

            <Route path="payroll/advance-approvals" element={
              <TierGuard requiredTier="ENTERPRISE">
                <PrivateRoute requiredRole={['ADMIN', 'OWNER']}>
                  <ErrorBoundary resetKey="payroll/advance-approvals">
                    <Suspense fallback={<LazyFallback />}>
                      <AdvanceApprovals />
                    </Suspense>
                  </ErrorBoundary>
                </PrivateRoute>
              </TierGuard>
            } />

            <Route path="payroll/leave-types" element={
              <TierGuard requiredTier="ENTERPRISE">
                <PrivateRoute requiredRole={['ADMIN', 'OWNER']}>
                  <ErrorBoundary resetKey="payroll/leave-types">
                    <Suspense fallback={<LazyFallback />}>
                      <LeaveTypeManagement />
                    </Suspense>
                  </ErrorBoundary>
                </PrivateRoute>
              </TierGuard>
            } />

            <Route path="payroll/holidays" element={
              <TierGuard requiredTier="ENTERPRISE">
                <PrivateRoute requiredRole={['ADMIN', 'OWNER']}>
                  <ErrorBoundary resetKey="payroll/holidays">
                    <Suspense fallback={<LazyFallback />}>
                      <HolidayCalendar />
                    </Suspense>
                  </ErrorBoundary>
                </PrivateRoute>
              </TierGuard>
            } />

            <Route path="payroll/employee-history" element={
              <TierGuard requiredTier="ENTERPRISE">
                <PrivateRoute requiredRole={['ADMIN', 'OWNER']}>
                  <ErrorBoundary resetKey="payroll/employee-history">
                    <Suspense fallback={<LazyFallback />}>
                      <EmployeePayrollHistory />
                    </Suspense>
                  </ErrorBoundary>
                </PrivateRoute>
              </TierGuard>
            } />

            {/* Admin — Compliance & Configuration */}
            <Route path="payroll/statutory" element={
              <TierGuard requiredTier="ENTERPRISE">
                <PrivateRoute requiredRole={['ADMIN', 'OWNER']}>
                  <ErrorBoundary resetKey="payroll/statutory">
                    <Suspense fallback={<LazyFallback />}>
                      <StatutoryCompliance />
                    </Suspense>
                  </ErrorBoundary>
                </PrivateRoute>
              </TierGuard>
            } />
            <Route path="payroll/banking" element={
              <TierGuard requiredTier="ENTERPRISE">
                <PrivateRoute requiredRole={['ADMIN', 'OWNER']}>
                  <ErrorBoundary resetKey="payroll/banking">
                    <Suspense fallback={<LazyFallback />}>
                      <BankingIntegration />
                    </Suspense>
                  </ErrorBoundary>
                </PrivateRoute>
              </TierGuard>
            } />

            {/* Employee Self-Service Portal (ESS) — Dashboard & Analytics */}
            <Route path="employee/dashboard" element={<TierGuard requiredTier="ENTERPRISE"><Suspense fallback={<LazyFallback />}><ESSDashboard /></Suspense></TierGuard>} />

            {/* Employee Self-Service — Compensation */}
            <Route path="employee/payslips" element={<TierGuard requiredTier="ENTERPRISE"><Suspense fallback={<LazyFallback />}><MyPayslips /></Suspense></TierGuard>} />
            <Route path="employee/tax-declaration" element={<TierGuard requiredTier="ENTERPRISE"><Suspense fallback={<LazyFallback />}><TaxDeclaration /></Suspense></TierGuard>} />

            {/* Employee Self-Service — Leave Management */}
            <Route path="employee/leaves" element={<TierGuard requiredTier="ENTERPRISE"><Suspense fallback={<LazyFallback />}><LeaveApplications /></Suspense></TierGuard>} />

            {/* Employee Self-Service — Finance */}
            <Route path="employee/loans" element={<TierGuard requiredTier="ENTERPRISE"><Suspense fallback={<LazyFallback />}><LoanRequests /></Suspense></TierGuard>} />
            <Route path="employee/advances" element={<TierGuard requiredTier="ENTERPRISE"><Suspense fallback={<LazyFallback />}><AdvanceRequests /></Suspense></TierGuard>} />

            {/* Employee Self-Service — Preferences */}
            <Route path="employee/preferences" element={<TierGuard requiredTier="ENTERPRISE"><Suspense fallback={<LazyFallback />}><ESSPreferences /></Suspense></TierGuard>} />

            <Route path="reports/tax-compliance" element={<TierGuard requiredTier="ENTERPRISE"><TaxComplianceHub /></TierGuard>} />
            <Route path="compliance/hsn" element={<TierGuard requiredTier="ENTERPRISE"><HsnSummary /></TierGuard>} />
            <Route path="compliance/gstr3b" element={
              <TierGuard requiredTier="ENTERPRISE">
                <ErrorBoundary resetKey="gstr3b">
                  <Suspense fallback={<LazyFallback />}><Gstr3bSummary /></Suspense>
                </ErrorBoundary>
              </TierGuard>
            } />
            <Route path="audit" element={<TierGuard requiredTier="ENTERPRISE"><AuditLogs /></TierGuard>} />

            {/* Compliance module — routes advertised in the sidebar. Live pages
                already exist for GST Summary and the compliance / tax-compliance
                dashboards; the remaining items land on a ComingSoonPage so the
                sidebar has no dead links while we build them out. */}
            <Route path="compliance/gstr-filing" element={
              <TierGuard requiredTier="PRO">
                <ComplianceModuleStub
                  eyebrow="Compliance · GST Returns"
                  title="GSTR-1 & GSTR-3B filing"
                  description="One-click summary + JSON export for GSTR-1 (outward supplies) and GSTR-3B (monthly return) directly from your invoices, credit notes and payments."
                  bullets={[
                    { label: 'GSTR-1 summary from invoices + credit notes', hint: 'B2B, B2C, exports, exempt splits with HSN breakdown', done: true },
                    { label: 'GSTR-3B monthly return summary', hint: 'Outward, inward, ITC, tax paid — auto-computed', done: true },
                    { label: 'JSON export in the government portal format', hint: 'Upload directly to gst.gov.in', done: false },
                    { label: 'Filing status tracker per return period', hint: 'Filed / late / pending — with due-date alerts', done: false },
                  ]}
                  fallbackPath="/reports/gst-summary"
                />
              </TierGuard>
            } />

            <Route path="compliance/gstr-2b" element={
              <TierGuard requiredTier="ENTERPRISE">
                <Suspense fallback={<LazyFallback />}><Gstr2bReconciliation /></Suspense>
              </TierGuard>
            } />

            <Route path="compliance/gstr-9" element={
              <TierGuard requiredTier="ENTERPRISE">
                <Suspense fallback={<LazyFallback />}><Gstr9Summary /></Suspense>
              </TierGuard>
            } />

            <Route path="compliance/einvoice-eway" element={
              <TierGuard requiredTier="PRO">
                <ComplianceModuleStub
                  eyebrow="Compliance · Regulatory documents"
                  title="E-Invoicing & E-Way Bill hub"
                  description="Central dashboard for IRN generation, e-way bill lifecycle, cancellations and NIC-portal status — across every invoice, credit note and delivery challan."
                  bullets={[
                    { label: 'Generate IRN & QR from invoices', hint: 'Per-document, via signed backend integration', done: true },
                    { label: 'Generate & cancel e-way bills', hint: 'Distance-based validity computation', done: true },
                    { label: 'Central status board across all documents', hint: 'Filter by date, status, portal error', done: false },
                    { label: 'Bulk regenerate / bulk cancel', hint: 'Recover from portal outages in one click', done: false },
                  ]}
                  fallbackPath="/reports/compliance"
                />
              </TierGuard>
            } />

            <Route path="compliance/period-lock" element={
              <TierGuard requiredTier="ENTERPRISE">
                <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}>
                  <PeriodLockManagement />
                </React.Suspense>
              </TierGuard>
            } />

            <Route path="compliance/cancelled-documents" element={
              <TierGuard requiredTier="PRO">
                <ComplianceModuleStub
                  eyebrow="Compliance · Audit register"
                  title="Cancelled & deleted documents register"
                  description="Every voided invoice, cancelled sale, deleted draft and reversed payment — with actor, reason and timestamp. The register a GST audit asks for on day one."
                  bullets={[
                    { label: 'Cancelled invoices / sales', hint: 'With linked reversal and ledger impact', done: true },
                    { label: 'Deleted drafts & discarded quotations', hint: 'Even work-in-progress rows are captured', done: true },
                    { label: 'Reversed payments & refunds', hint: 'With original + reversal transaction pair', done: true },
                    { label: 'Consolidated register with export', hint: 'CSV / PDF for auditors, filterable by period', done: false },
                  ]}
                  fallbackPath="/audit"
                />
              </TierGuard>
            } />

            <Route path="*" element={<NotFound />} />
          </Route>
        )}

        {/* Global Catch-all — redirect unknown routes to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AlertProvider>
  );
}

export default AppRoutes;