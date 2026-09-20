import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useShop } from '../../context/ShopContext';
import { useAuthContext } from '../../context/AuthContext';

export default function ShopGuard({ children }) {
  const { shop: currentShop, shopLoading, isShopLoading } = useShop();
  const location = useLocation();
  const { user, loading: authLoading } = useAuthContext();

  const loading = Boolean(authLoading || isShopLoading || shopLoading);

  // Handle Loading state with a standard MUI Spinner (Only on initial cold boot)
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        height: '100vh', 
        width: '100vw', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'background.default' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (user?.role === 'SUPER_ADMIN') {
    // Optional: Prevent Super Admin from even seeing the setup-shop page
    if (location.pathname === '/setup-shop') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return children;
  }

  const hasShop = Boolean(user?.shopId || currentShop?.id);

  // 1. If no shop, and NOT already on setup page -> Redirect to setup
  if (!hasShop && location.pathname !== '/setup-shop') {
    return <Navigate to="/setup-shop" replace />;
  }

  // 2. If shop exists, and TRYING to go to setup -> Redirect to dashboard
  if (hasShop && location.pathname === '/setup-shop') {
    return <Navigate to="/" replace />;
  }

  // 3. Otherwise, render the dashboard (children)
  return children;
}