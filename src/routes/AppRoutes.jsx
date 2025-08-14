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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/items" element={<PrivateRoute><Items /></PrivateRoute>} />
      <Route path="/stock" element={<PrivateRoute><Stock /></PrivateRoute>} />
      <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
      <Route path="/sales" element={<PrivateRoute><Sales /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
      <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
      <Route path="/backup" element={<PrivateRoute><Backup /></PrivateRoute>} />
      <Route path="/products" element={<PrivateRoute><ProductOverview /></PrivateRoute>} />
    </Routes>
  );
}

export default AppRoutes;