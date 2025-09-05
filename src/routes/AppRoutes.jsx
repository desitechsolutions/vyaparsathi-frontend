import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import Layout from '../components/layout/Layout'; // Import Layout
import Dashboard from '../pages/Dashboard';
import Items from '../pages/Items';
// ... other page imports
import Stock from '../pages/Stock';
import Customers from '../pages/Customers';
import Sales from '../pages/Sales';
import Reports from '../pages/Reports';
import Expenses from '../pages/Expenses';
import Backup from '../pages/Backup';
import Login from '../pages/Login';
import ProductOverview from '../pages/ProductOverview';
import CustomerPaymentPage from '../pages/CustomerPaymentPage';
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

function AppRoutes() {
  return (
     <AlertProvider>
    <Routes>
      {/* Public routes wrapped by PublicLayout */}
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<Login />} />
        {/* You can add other public routes like /forgot-password here */}
      </Route>

      {/* Protected routes wrapped by Layout */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="items" element={<Items />} />
        <Route path="stock" element={<Stock />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customer-details/:id/dues" element={<CustomerDetails />} />
        <Route path="sales" element={<Sales />} />
         <Route path="delivery" element={<DeliveryManagement />} />
        <Route path="reports" element={<Reports />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="low-stock-alerts" element={<LowStockAlerts />} />
        <Route path="backup" element={<Backup />} />
        <Route path="products" element={<ProductOverview />} />
        <Route path="customer-payments" element={<CustomerPaymentPage />} />
        <Route path="about-us" element={<AboutUs />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route path="purchase-orders" element={<PurchaseOrders />} />
        <Route path='receiving' element={<ReceivingPage />} />
        <Route path="receiving/:poId" element={<ReceivingPage />} />
        <Route path="suppliers" element={<Suppliers />} />
        
        {/* SetupShop should be inside PrivateRoute but not Layout */}
        <Route path="setup-shop" element={<SetupShop />} />

        {/* Catch-all route for 404 */}
        <Route path="*" element={<div>Page Not Found</div>} />
      </Route>
    </Routes>
    </AlertProvider>
  );
}

export default AppRoutes;