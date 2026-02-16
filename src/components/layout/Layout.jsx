import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import PremiumStatusBanner from '../../pages/PremiumStatusBanner';
const Layout = () => (
  <Box sx={{ display: 'flex' }}>
    <CssBaseline />
    <Header />
    <Sidebar />
    <Box 
      component="main" 
      sx={{ 
        flexGrow: 1, 
        p: 3, 
        bgcolor: '#F8FAFC', // Optional: added a light background for better contrast
        minHeight: '100vh' 
      }}
    >
      <Toolbar />
      
      {/* Verification Banner appears here globally when status is PENDING */}
      <PremiumStatusBanner />

      {/* Actual Page Content */}
      <Outlet />
    </Box>
  </Box>
);

export default Layout;