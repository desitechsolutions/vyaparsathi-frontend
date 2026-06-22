import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import EnterpriseHeader from './EnterpriseHeader';
import EnterpriseFooter from './EnterpriseFooter';

/**
 * LandingLayout — Unified public layout for all public-facing marketing pages.
 * Uses EnterpriseHeader + EnterpriseFooter throughout.
 */
const LandingLayout = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <EnterpriseHeader />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>
      <EnterpriseFooter />
    </Box>
  );
};

export default LandingLayout;
