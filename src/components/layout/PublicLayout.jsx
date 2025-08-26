import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import PublicHeader from './PublicHeader';

const PublicLayout = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <PublicHeader />
    <Container component="main" maxWidth="xs" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Outlet />
    </Container>
  </Box>
);

export default PublicLayout;