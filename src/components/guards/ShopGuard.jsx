import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material'; // Use MUI components
import useShopConfig from '../../hooks/useShopConfig';

export default function ShopGuard({ children }) {
  const { shop, loading } = useShopConfig();
  const location = useLocation();

  // Handle Loading state with a standard MUI Spinner
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        height: '100vh', 
        width: '100vw', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: '#f8fafc' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  // 1. If no shop, and NOT already on setup page -> Redirect to setup
  if (shop === null && location.pathname !== '/setup-shop') {
    return <Navigate to="/setup-shop" replace />;
  }

  // 2. If shop exists, and TRYING to go to setup -> Redirect to dashboard
  if (shop !== null && location.pathname === '/setup-shop') {
    return <Navigate to="/" replace />;
  }

  // 3. Otherwise, render the dashboard (children)
  return children;
}