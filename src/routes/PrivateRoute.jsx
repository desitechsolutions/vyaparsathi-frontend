import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useShopConfig from '../hooks/useShopConfig';
import { useAuthContext } from '../context/AuthContext';

function PrivateRoute({ children }) {
  const { user, loading: authLoading } = useAuthContext();
  const { shop, loading: shopLoading } = useShopConfig();
  const location = useLocation();

  if (authLoading || shopLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!shop && location.pathname !== '/setup-shop') {
    return <Navigate to="/setup-shop" replace />;
  }

  if (shop && location.pathname === '/setup-shop') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default PrivateRoute;