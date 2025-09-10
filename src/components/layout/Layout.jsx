import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';

// Only responsible for "frame", NOT for routing
const Layout = () => (
  <Box sx={{ display: 'flex' }}>
    <CssBaseline />
    <Header />
    <Sidebar />
    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
      <Toolbar />
      <Outlet />
    </Box>
  </Box>
);

export default Layout;