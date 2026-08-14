import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import TechAdminHeader from './TechAdminHeader'; // Your new Admin Header
import TechAdminSidebar from './TechAdminSidebar'; // A simplified Admin Sidebar
import ErrorBoundary from '../common/ErrorBoundary';

const AdminLayout = () => {
  const location = useLocation();
  return (
    <Box sx={{ display: 'flex' }}>
      <TechAdminHeader />
      <TechAdminSidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          bgcolor: 'background.default',
          minHeight: '100vh',
          color: 'text.primary'
        }}
      >
        <Toolbar />
        {/* Same containment pattern as MainLayout — an admin page crash
            keeps the admin nav shell intact. */}
        <ErrorBoundary resetKey={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </Box>
    </Box>
  );
};

export default AdminLayout;