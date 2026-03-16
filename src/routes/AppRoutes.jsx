import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import MainLayout from '../components/layout/MainLayout'; // Updated to use your responsive layout
import Dashboard from '../pages/Dashboard';
import ItemsPage from '../pages/ItemsPage';
import Stock from '../pages/Stock';
import Customers from '../pages/Customers';
import Sales from '../pages/Sales';
import TaxComplianceHub from '../pages/reports/TaxComplianceHub';
import ReportsIndex from '../pages/reports/ReportsIndex';
import DailyReport from '../pages/reports/DailyReport';
import SalesSummary from '../pages/reports/SalesSummary';
import GstSummary from '../pages/reports/GstSummary';
import GstBreakdown from '../pages/reports/GstBreakdown';
import ItemsSold from '../pages/reports/ItemsSold';
import CategorySales from '../pages/reports/CategorySales';
import CustomerSales from '../pages/reports/CustomerSales';
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
import Suppliers from '../pages/Suppliers';
import PublicLayout from '../components/layout/PublicLayout'; 
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
import AdminLayout from '../components/layout/AdminLayout';
import TechAdminDashboard from '../pages/admin/TechAdminDashboard';
import AdminPaymentQueue from '../pages/admin/AdminPaymentQueue';
import { useAuthContext } from '../context/AuthContext';
import AdminSupport from '../pages/admin/AdminSupport';
import GlobalShopManagement from '../pages/admin/GlobalShopManagement';
import SystemUserManagement from '../pages/admin/SystemUserManagement';
import SettingsPage from '../pages/SettingsPage';
import NotFound from '../pages/NotFound';
import BillingDashboard from '../components/subscriptions/BillingDashboard';
import PlanConfigManager from '../pages/admin/PlanConfigManager';
import ExpiryReport from '../pages/reports/ExpiryReport';
import NarcoticsRegister from '../pages/reports/NarcoticsRegister';
import PurchaseRegister from '../pages/reports/PurchaseRegister';
import { ShopProvider } from '../context/ShopContext';

function AppRoutes() {
  const { user } = useAuthContext();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <AlertProvider>
      <Routes>
        {/* 1. Public Layout: No Sidebar, No ShopGuard */}
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/setup-shop" element={<SetupShop />} />
          <Route path="auth/reset-password" element={<ResetPassword />} />
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
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="items" element={<ItemsPage />} />
            <Route path="stock" element={<Stock />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customer-details/:id/dues" element={<CustomerDetails />} />
            <Route path="sales" element={<Sales />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="products" element={<ProductOverview />} />
            <Route path="customer-payments" element={<CustomerPaymentPage />} />
            <Route path="about-us" element={<AboutUs />} />
            <Route path="admin/users" element={<UserManagementPage />} />
            <Route path="admin/settings" element={<SettingsPage />} />
            <Route path="admin/billing" element={<BillingDashboard />} />

            {/* STARTER TIER & ABOVE */}
            <Route path="delivery" element={<TierGuard requiredTier="STARTER"><DeliveryManagement /></TierGuard>} />
            <Route path="suppliers" element={<TierGuard requiredTier="STARTER"><Suppliers /></TierGuard>} />
            <Route path="low-stock-alerts" element={<TierGuard requiredTier="STARTER"><LowStockAlerts /></TierGuard>} />
            <Route path="notifications" element={<TierGuard requiredTier="STARTER"><Notifications /></TierGuard>} />

            {/* PRO TIER & ABOVE */}
            <Route path="analytics" element={<TierGuard requiredTier="PRO"><AnalyticsDashboard /></TierGuard>} />
            <Route path="purchase-orders" element={<TierGuard requiredTier="PRO"><PurchaseOrders /></TierGuard>} />
            <Route path="receivings" element={<TierGuard requiredTier="PRO"><Receiving /></TierGuard>} />
            <Route path="receiving/:poId" element={<TierGuard requiredTier="PRO"><ReceivingPage /></TierGuard>} />
            <Route path="supplier-payments" element={<TierGuard requiredTier="PRO"><SupplierPaymentPage /></TierGuard>} />
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
            <Route path="reports/expenses-summary" element={<TierGuard requiredTier="PRO"><ExpensesSummary /></TierGuard>} />
            <Route path="reports/payments-summary" element={<TierGuard requiredTier="PRO"><PaymentsSummary /></TierGuard>} />
            {/* Pharma Reports (PRO Tier) */}
            <Route path="reports/expiry-report" element={<TierGuard requiredTier="PRO"><ExpiryReport /></TierGuard>} />
            <Route path="reports/narcotics-register" element={<TierGuard requiredTier="PRO"><NarcoticsRegister /></TierGuard>} />
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

        {/* Root Redirect based on role */}
        <Route 
          path="/" 
          element={
            isSuperAdmin ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } 
        />
        
        {/* Global Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AlertProvider>
  );
}

export default AppRoutes;