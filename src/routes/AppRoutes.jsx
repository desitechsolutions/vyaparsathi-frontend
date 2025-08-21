import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import Dashboard from '../pages/Dashboard';
import Items from '../pages/Items';
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
import AnalyticsDashboard from '../pages/AnalyticsDashboard'; // Assuming you have an Analytics page

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/setup-shop" element={<SetupShop />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/items" element={<PrivateRoute><Items /></PrivateRoute>} />
      <Route path="/stock" element={<PrivateRoute><Stock /></PrivateRoute>} />
      <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
      <Route path="/customer-details/:id/dues" element={<PrivateRoute><CustomerDetails /></PrivateRoute>} />
      <Route path="/sales" element={<PrivateRoute><Sales /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
      <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
      <Route path="/backup" element={<PrivateRoute><Backup /></PrivateRoute>} />
      <Route path="/products" element={<PrivateRoute><ProductOverview /></PrivateRoute>} />
      <Route path="/customer-payments" element={<PrivateRoute><CustomerPaymentPage /></PrivateRoute>} />
      <Route path="/about-us" element={<PrivateRoute><AboutUs /></PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute><AnalyticsDashboard /></PrivateRoute>} />
      
      {/* Catch-all route for 404 */}
      <Route path="*" element={<PrivateRoute><div>Page Not Found</div></PrivateRoute>} />


    </Routes>
  );
}

export default AppRoutes;