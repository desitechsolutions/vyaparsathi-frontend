import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useShopConfig from '../hooks/useShopConfig';
import { useAuthContext } from '../context/AuthContext';

function PrivateRoute({ children }) {
  const { user, loading: authLoading } = useAuthContext();
  const { shop, loading: shopLoading } = useShopConfig();
  const location = useLocation();

  // Wait for both authentication and shop config to finish loading
  if (authLoading || shopLoading) {
    return <div>Loading...</div>; // Or a global spinner component
  }

  // If loading is done and there's no user, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is authenticated but shop is not configured, redirect to setup page
  if (!shop && location.pathname !== '/setup-shop') {
    return <Navigate to="/setup-shop" replace />;
  }

  // If shop IS configured, but user tries to access setup page, redirect to dashboard
  if (shop && location.pathname === '/setup-shop') {
    return <Navigate to="/" replace />;
  }

  // If all checks pass, render the requested child component
  return children;
}

export default PrivateRoute;