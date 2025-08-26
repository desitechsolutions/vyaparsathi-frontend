import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useShopConfig from '../hooks/useShopConfig';
import { useAuthContext } from '../context/AuthContext';

function PrivateRoute({ children }) {
  const { user } = useAuthContext();
  const { shop, loading } = useShopConfig();
  const location = useLocation();

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Wait for shop config to load
  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  // If shop is not configured, redirect to setup page
  if (!shop && location.pathname !== '/setup-shop') {
    return <Navigate to="/setup-shop" replace />;
  }

  // If shop is configured, but user is on setup page, redirect to dashboard
  if (shop && location.pathname === '/setup-shop') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default PrivateRoute;