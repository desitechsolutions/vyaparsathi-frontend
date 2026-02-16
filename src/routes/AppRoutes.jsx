import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import Layout from '../components/layout/Layout';
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
            <Route path="shops" element={<div>Global Shop Management</div>} />
          </Route>
        )}

        {/* 3. Protected Layout: Disabled for Super Admin to avoid ShopGuard/Context conflicts */}
        {!isSuperAdmin && (
          <Route
            path="/"
            element={
              <PrivateRoute>
                <ShopGuard>
                  <Layout />
                </ShopGuard>          
              </PrivateRoute>
            }
          >
            <Route path="/pricing" element={<PricingPage />} />
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="items" element={<ItemsPage />} />
            <Route path="stock" element={<Stock />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customer-details/:id/dues" element={<CustomerDetails />} />
            <Route path="sales" element={<Sales />} />
            <Route path="delivery" element={<DeliveryManagement />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="low-stock-alerts" element={<LowStockAlerts />} />
            <Route path="backup" element={<Backup />} />
            <Route path="products" element={<ProductOverview />} />
            <Route path="customer-payments" element={<CustomerPaymentPage />} />
            <Route path="supplier-payments" element={<SupplierPaymentPage />} />
            <Route path="about-us" element={<AboutUs />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="purchase-orders" element={<PurchaseOrders />} />
            <Route path="receiving/:poId" element={<ReceivingPage />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="admin/users" element={<UserManagementPage />} />
            <Route path="admin/payroll" element={<PayrollDashboard />} />
            
            <Route path="reports" element={<ReportsIndex />} />
            <Route path="reports/daily" element={<DailyReport />} />
            <Route path="reports/sales-summary" element={<SalesSummary />} />
            <Route path="reports/gst-summary" element={<GstSummary />} />
            <Route path="reports/gst-breakdown" element={<GstBreakdown />} />
            <Route path="reports/items-sold" element={<ItemsSold />} />
            <Route path="reports/category-sales" element={<CategorySales />} />
            <Route path="reports/customer-sales" element={<CustomerSales />} />
            <Route path="reports/expenses-summary" element={<ExpensesSummary />} />
            <Route path="reports/payments-summary" element={<PaymentsSummary />} />
            <Route path="receivings" element={<Receiving />} />
            
            <Route path="reports/tax-compliance" element={<TaxComplianceHub />} />
            <Route path="compliance/hsn" element={<HsnSummary />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="/payroll/history/:staffId" element={<PaymentHistoryPage />} />

            <Route path="*" element={<div>Page Not Found</div>} />
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