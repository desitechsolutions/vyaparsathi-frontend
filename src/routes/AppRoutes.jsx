import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import Expenses from '../pages/Expenses';
import Backup from '../pages/Backup';
import Login from '../pages/Login';
import ProductOverview from '../pages/ProductOverview';
import CustomerPaymentPage from '../pages/payments/CustomerPaymentPage';
import CustomerDetails from '../pages/CustomerDetails';
import AboutUs from '../pages/AboutUs';
import SetupShop from '../pages/SetupShop';
import AnalyticsDashboard from '../pages/AnalyticsDashboard';
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
import TeamPage from '../pages/TeamPage';
import RolesPermissionMatrixPage from '../pages/RolesPermissionMatrixPage';
import AcceptShopInvitePage from '../pages/AcceptShopInvitePage';
import ComplianceModuleStub from '../pages/compliance/ComingSoonPage';
import Notifications from '../pages/Notifications';
import ShopGuard from '../components/guards/ShopGuard';
import TierGuard from '../components/guards/TierGuard'; // Added TierGuard
import ErrorBoundary from '../components/common/ErrorBoundary'; // route-level fallback keeps sidebar/header alive on page crash
import HsnSummary from '../pages/reports/HsnSummary';
import AuditLogs from '../pages/AuditLogs';
import SupplierPaymentPage from '../pages/SupplierPaymentPage';
import PayrollDashboard from '../pages/PayrollDashboard';
import PricingPage from '../pages/PricingPage';
import PaymentHistoryPage from '../pages/payroll/PaymentHistoryPage';
import ResetPassword from '../pages/ResetPassword';
import VerifyEmail from '../pages/VerifyEmail';
import ComingSoonPage from '../pages/public/ComingSoonPage';
import AdminLayout from '../components/layout/AdminLayout';
import TechAdminDashboard from '../pages/admin/TechAdminDashboard';
import AdminPaymentQueue from '../pages/admin/AdminPaymentQueue';
import { useAuthContext } from '../context/AuthContext';
import AdminSupport from '../pages/admin/AdminSupport';
import GlobalShopManagement from '../pages/admin/GlobalShopManagement';
import SystemUserManagement from '../pages/admin/SystemUserManagement';
import NewsletterManager from '../pages/admin/NewsletterManager';
import SettingsPage from '../pages/SettingsPage';
import NotFound from '../pages/NotFound';
import BillingDashboard from '../components/subscriptions/BillingDashboard';
import PlanConfigManager from '../pages/admin/PlanConfigManager';
import PlatformSettingsPage from '../pages/admin/PlatformSettingsPage';
import AdminTeamManagementPage from '../pages/admin/AdminTeamManagementPage';
import FeatureFlagManagerPage from '../pages/admin/FeatureFlagManagerPage';
import SuperAdminAuditPage from '../pages/admin/SuperAdminAuditPage';
import AcceptAdminInvitePage from '../pages/public/AcceptAdminInvitePage';
import ExpiryReport from '../pages/reports/ExpiryReport';
import BillingPage from '../pages/billing/BillingPage';
import PaymentSuccessPage from '../pages/billing/PaymentSuccessPage';
import PaymentFailurePage from '../pages/billing/PaymentFailurePage';
import AccountingDashboard from '../pages/reports/AccountingDashboard';

import PurchaseRegister from '../pages/reports/PurchaseRegister';
import ComplianceDashboard from '../pages/reports/ComplianceDashboard';
import PurchaseReturns from '../pages/purchases/PurchaseReturns';
import PrintGRNPage from '../pages/purchases/PrintGRNPage';
import PrintPurchaseReturnPage from '../pages/purchases/PrintPurchaseReturnPage';
import { ShopProvider } from '../context/ShopContext';

function AppRoutes() {
  const { user } = useAuthContext();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

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
                  <ShopGuard>
                    <MainLayout />
                  </ShopGuard>
                </ShopProvider>
              </PrivateRoute>
            }
          >
            {/* PUBLIC WITHIN APP (No Tier Required) */}
            <Route path="/pricing" element={<PricingPage />} />
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
            <Route path="customers" element={<Customers />} />
            {/* V104 enterprise detail page — /customers/:id */}
            <Route path="customers/:id" element={<CustomerDetails />} />
            {/* Legacy ledger route — kept for deep links from SalesHistory */}
            <Route path="customer-details/:id/dues" element={<CustomerDetails />} />

            <Route path="sales" element={<Sales />} />
            <Route path="sales/drafts" element={<Sales />} />
            <Route path="sales/return" element={<SalesReturn />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="products" element={<ProductOverview />} />
            <Route path="customer-payments" element={<CustomerPaymentPage />} />
            <Route path="about-us" element={<AboutUs />} />
            <Route path="admin/users" element={<UserManagementPage />} />
            <Route path="admin/settings" element={<SettingsPage />} />
            <Route path="admin/billing" element={<BillingDashboard />} />
            {/* Account-security (per-user MFA + Active Sessions). Available to every signed-in user regardless of role. */}
            <Route path="account/security" element={<MfaSetupPage />} />
            <Route path="account/security/mfa" element={<MfaSetupPage />} />
            <Route path="account/security/sessions" element={<ActiveSessionsPage />} />
            {/* Team management (Phase 5). Permission gate lives inside TeamPage. */}
            <Route path="admin/team" element={<TeamPage />} />
            <Route path="admin/roles" element={<RolesPermissionMatrixPage />} />
            {/* Shop-level 2FA policy — dedicated page under Configuration.
                Personal MFA (enrollment/backup-codes) still lives at
                /account/security/mfa in the header user menu. */}
            <Route path="admin/security/two-factor" element={<TwoFactorAuthenticationPage />} />

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
            <Route path="analytics" element={<TierGuard requiredTier="PRO"><AnalyticsDashboard /></TierGuard>} />
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
            <Route path="reports/accounting" element={<TierGuard requiredTier="PRO"><AccountingDashboard /></TierGuard>} />
            {/* Retail Reports (PRO Tier) */}
            <Route path="reports/expiry-report" element={<TierGuard requiredTier="PRO"><ExpiryReport /></TierGuard>} />
            <Route path="reports/purchase-register" element={<TierGuard requiredTier="PRO"><PurchaseRegister /></TierGuard>} />
            <Route path="reports/compliance" element={<TierGuard requiredTier="PRO"><ErrorBoundary resetKey="reports/compliance"><ComplianceDashboard /></ErrorBoundary></TierGuard>} />

            {/* ENTERPRISE TIER ONLY */}
            <Route path="admin/payroll" element={<TierGuard requiredTier="ENTERPRISE"><PayrollDashboard /></TierGuard>} />
            <Route path="/payroll/history/:staffId" element={<TierGuard requiredTier="ENTERPRISE"><PaymentHistoryPage /></TierGuard>} />
            <Route path="reports/tax-compliance" element={<TierGuard requiredTier="ENTERPRISE"><TaxComplianceHub /></TierGuard>} />
            <Route path="compliance/hsn" element={<TierGuard requiredTier="ENTERPRISE"><HsnSummary /></TierGuard>} />
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
                <ComplianceModuleStub
                  eyebrow="Compliance · Input Tax Credit"
                  title="GSTR-2B ITC reconciliation"
                  description="Match your GSTR-2B auto-drafted statement against recorded purchase invoices. Flag mismatches, missing invoices, and over-claimed ITC before you file."
                  bullets={[
                    { label: 'Upload GSTR-2B JSON', hint: 'From gst.gov.in returns dashboard', done: false },
                    { label: 'Line-by-line match against recorded purchases', hint: 'GSTIN + invoice-no + tax-value key', done: false },
                    { label: 'Mismatch report: missing / duplicate / value-mismatch', hint: 'Actionable list with supplier contact', done: false },
                    { label: 'ITC-eligible summary for GSTR-3B claim', hint: 'Matched + provisional ITC breakdown', done: false },
                  ]}
                  fallbackPath="/reports/gst-summary"
                />
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
                <ComplianceModuleStub
                  eyebrow="Compliance · Book closing"
                  title="Period lock (financial-year & book closing)"
                  description="Freeze a financial period so no invoice, payment or ledger entry can be back-dated into it — the gate every accountant asks for before signing off on returns."
                  bullets={[
                    { label: 'Lock any period up to a chosen date', hint: 'FY-end, quarter-end, monthly close', done: false },
                    { label: 'Refuse writes to locked periods', hint: 'Enforced at every service (invoice, payment, journal)', done: false },
                    { label: 'Reason-required unlock by OWNER only', hint: 'Audited, one-off unlock window with expiry', done: false },
                    { label: 'Book-closing signoff trail', hint: 'Who locked what, when, with what supporting docs', done: false },
                  ]}
                  fallbackPath="/reports/compliance"
                />
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