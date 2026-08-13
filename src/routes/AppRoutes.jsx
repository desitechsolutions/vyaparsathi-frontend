import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import MainLayout from '../components/layout/MainLayout'; // Updated to use your responsive layout
import Dashboard from '../pages/Dashboard';
import ItemsPage from '../pages/ItemsPage';
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
import Quotations from '../pages/Quotations';
import QuotationEditor from '../pages/QuotationEditor';
import SalesOrders from '../pages/SalesOrders';
import SalesOrderEditor from '../pages/SalesOrderEditor';
import CreditNotes from '../pages/CreditNotes';
import DebitNotes from '../pages/DebitNotes';
import Suppliers from '../pages/Suppliers';
import LandingLayout from '../components/layout/LandingLayout';
import AuthLayout from '../components/layout/AuthLayout';
import LandingPage from '../pages/LandingPage';
import ReceivingPage from '../pages/ReceivingPage';
import DeliveryManagement from '../pages/DeliveryManagement';
import LowStockAlerts from '../pages/LowStockAlerts';
import { AlertProvider } from '../context/AlertContext';
import UserManagementPage from '../pages/UserManagementPage';
import Notifications from '../pages/Notifications';
import Receiving from '../pages/Receiving';
import ShopGuard from '../components/guards/ShopGuard';
import TierGuard from '../components/guards/TierGuard'; // Added TierGuard
import HsnSummary from '../pages/reports/HsnSummary';
import AuditLogs from '../pages/AuditLogs';
import SupplierPaymentPage from '../pages/SupplierPaymentPage';
import PayrollDashboard from '../pages/PayrollDashboard';
import PricingPage from '../pages/PricingPage';
import PaymentHistoryPage from '../pages/payroll/PaymentHistoryPage';
import ResetPassword from '../pages/ResetPassword';
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
            path="/setup-shop"
            element={
              user ? (
                user.shopId ? <Navigate to="/dashboard" replace /> : <SetupShop />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/auth/reset-password"
            element={user ? <Navigate to="/" replace /> : <ResetPassword />}
          />
          <Route path="/accept-invite" element={<AcceptAdminInvitePage />} />
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
            <Route path="stock" element={<Stock />} />
            <Route path="customers" element={<Customers />} />
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

            {/* QUOTATIONS — available on all tiers as a core sales tool */}
            <Route path="quotations" element={<Quotations />} />
            <Route path="quotations/new" element={<QuotationEditor />} />
            <Route path="quotations/:id/edit" element={<QuotationEditor />} />
            {/* SALES ORDERS — with stock reservation, above the tier line */}
            <Route path="sales-orders" element={<SalesOrders />} />
            <Route path="sales-orders/new" element={<SalesOrderEditor />} />
            <Route path="sales-orders/:id/edit" element={<SalesOrderEditor />} />
            {/* CREDIT NOTES — customer-facing returns / adjustments */}
            <Route path="credit-notes" element={<CreditNotes />} />
            {/* DEBIT NOTES — supplier-facing returns / adjustments */}
            <Route path="debit-notes" element={<TierGuard requiredTier="PRO"><DebitNotes /></TierGuard>} />

            {/* STARTER TIER & ABOVE */}
            <Route path="delivery" element={<TierGuard requiredTier="STARTER"><DeliveryManagement /></TierGuard>} />
            <Route path="suppliers" element={<TierGuard requiredTier="STARTER"><Suppliers /></TierGuard>} />
            <Route path="low-stock-alerts" element={<TierGuard requiredTier="STARTER"><LowStockAlerts /></TierGuard>} />
            <Route path="notifications" element={<TierGuard requiredTier="STARTER"><Notifications /></TierGuard>} />

            {/* PRO TIER & ABOVE */}
            <Route path="analytics" element={<TierGuard requiredTier="PRO"><AnalyticsDashboard /></TierGuard>} />
            <Route path="purchase-orders" element={<TierGuard requiredTier="PRO"><PurchaseOrders /></TierGuard>} />
            <Route path="receivings" element={<TierGuard requiredTier="PRO"><Receiving /></TierGuard>} />
            <Route path="receivings/:id/print" element={<TierGuard requiredTier="PRO"><PrintGRNPage /></TierGuard>} />
            <Route path="receiving/:poId" element={<TierGuard requiredTier="PRO"><ReceivingPage /></TierGuard>} />
            <Route path="supplier-payments" element={<TierGuard requiredTier="PRO"><SupplierPaymentPage /></TierGuard>} />
            <Route path="purchase-returns" element={<TierGuard requiredTier="PRO"><PurchaseReturns /></TierGuard>} />
            <Route path="purchase-returns/:id/print" element={<TierGuard requiredTier="PRO"><PrintPurchaseReturnPage /></TierGuard>} />
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

            {/* ENTERPRISE TIER ONLY */}
            <Route path="admin/payroll" element={<TierGuard requiredTier="ENTERPRISE"><PayrollDashboard /></TierGuard>} />
            <Route path="/payroll/history/:staffId" element={<TierGuard requiredTier="ENTERPRISE"><PaymentHistoryPage /></TierGuard>} />
            <Route path="reports/tax-compliance" element={<TierGuard requiredTier="ENTERPRISE"><TaxComplianceHub /></TierGuard>} />
            <Route path="compliance/hsn" element={<TierGuard requiredTier="ENTERPRISE"><HsnSummary /></TierGuard>} />
            <Route path="audit" element={<TierGuard requiredTier="ENTERPRISE"><AuditLogs /></TierGuard>} />

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