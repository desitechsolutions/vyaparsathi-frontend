import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, Toolbar } from '@mui/material';
import PublicHeader from './PublicHeader';

const PublicLayout = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: 'linear-gradient(120deg, #FAF3E3 0%, #F6F7FA 100%)',
    }}
  >
    <PublicHeader />
    <Toolbar /> {/* Offsets the fixed header height */}
    <Container
      component="main"
      maxWidth="xs"
      sx={{
        flexGrow: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: { xs: 'calc(100vh - 64px)', md: 'calc(100vh - 64px)' }, // 64px is default AppBar height
        py: 2,
        overflow: 'auto', // Enables scrolling for content if needed
      }}
    >
      <Outlet />
    </Container>
  </Box>
);

export default PublicLayout;