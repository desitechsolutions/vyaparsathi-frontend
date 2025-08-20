import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';
import Sidebar from '../components/layout/Sidebar';
import useShopConfig from '../hooks/useShopConfig';
import { useAuthContext } from '../context/AuthContext';

function PrivateRoute({ children }) {
   const { user } = useAuthContext();
  const auth = isAuthenticated();
  const { shop, loading } = useShopConfig();
  const location = useLocation();

  // Don't block login or setup-shop route
  if (location.pathname === '/setup-shop') {
    return children;
  }

  // If not authenticated
  if (!auth) {
    return <Navigate to="/login" />;
  }

  // Wait for shop config to load
  if (loading) {
    return <div>Loading...</div>;
  }

  // If shop not found or not configured, redirect to setup-shop
  if (!shop  /* || !shop.configured or your own check for completeness */) {
    return <Navigate to="/setup-shop" replace />;
  }

  return <Sidebar>{children}</Sidebar>;
}

export default PrivateRoute;