import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useShopConfig from '../../hooks/useShopConfig';

export default function ShopGuard({ children }) {
  const { shop, loading } = useShopConfig();
  const location = useLocation();

  if (loading) {
    return <div>Loading shop configuration...</div>;
  }

  // No shop → force setup (except when already on setup page)
  if (!shop && location.pathname !== '/setup-shop') {
    return <Navigate to="/setup-shop" replace />;
  }

  // Has shop but on setup page → redirect to dashboard
  if (shop && location.pathname === '/setup-shop') {
    return <Navigate to="/" replace />;
  }

  return children;
}