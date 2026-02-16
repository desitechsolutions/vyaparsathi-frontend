import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import TechAdminHeader from './TechAdminHeader'; // Your new Admin Header
import TechAdminSidebar from './TechAdminSidebar'; // A simplified Admin Sidebar

const AdminLayout = () => (
  <Box sx={{ display: 'flex' }}>
    <CssBaseline />
    {/* Admin Specific Header - No search/subscription logic */}
    <TechAdminHeader /> 
    
    {/* Admin Specific Sidebar - Links like "Verify Payments", "User Management" */}
    <TechAdminSidebar /> 

    <Box 
      component="main" 
      sx={{ 
        flexGrow: 1, 
        p: 3, 
        bgcolor: '#0f172a', // Darker theme for Admin "God-mode"
        minHeight: '100vh',
        color: '#f8fafc'
      }}
    >
      <Toolbar />
      
      {/* NOTE: We REMOVED <PremiumStatusBanner /> 
         Admins don't have subscriptions to verify! 
      */}

      <Outlet />
    </Box>
  </Box>
);

export default AdminLayout;