import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import useShopConfig from '../hooks/useShopConfig';
import { useAuthContext } from '../context/AuthContext';

function PrivateRoute({ children }) {
  const { user } = useAuthContext();
  const { shop, loading } = useShopConfig();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user && location.pathname !== '/setup-shop' && location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  // Don't block login or setup-shop route
  if (location.pathname === '/setup-shop') {
    return children;
  }

  // If not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Wait for shop config to load
  if (loading) {
    return <div>Loading...</div>;
  }

  // If shop not found or not configured, redirect to setup-shop
  if (!shop /* || !shop.configured or your own check for completeness */) {
    return <Navigate to="/setup-shop" replace />;
  }

  return <Sidebar>{children}</Sidebar>;
}

export default PrivateRoute;