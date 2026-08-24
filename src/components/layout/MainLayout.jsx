import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, Toolbar, Container } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import PremiumStatusBanner from '../../pages/PremiumStatusBanner';
import SupportChatWidget from '../../pages/SupportChatWidget';
import ErrorBoundary from '../common/ErrorBoundary';
import CommandPalette from '../common/CommandPalette';
import { useAuthContext } from '../../context/AuthContext';

const MainLayout = () => {
  const { user } = useAuthContext();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false); // Mobile menu state

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isSuperAdmin = user?.role === 'ROLE_SUPER_ADMIN';
  const hasShopId = !!user?.shopId;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      
      {/* Pass the toggle function to the Header */}
      <Header onDrawerToggle={handleDrawerToggle} />
      
      {/* Pass state and toggle function to Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} />

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          bgcolor: 'background.default', 
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          // Desktop: subtract sidebar width. Mobile: 100%
          width: { xs: '100%', md: `calc(100% - 240px)` }, 
          overflowX: 'hidden'
        }}
      >
        <Toolbar />
        <PremiumStatusBanner />

        <Container
          maxWidth="xl"
          sx={{
            py: { xs: 2, md: 3 },
            px: { xs: 1, sm: 2, md: 3 },
            flexGrow: 1,
          }}
        >
          {/* Per-route error containment — a render crash in the active
              page shows the fallback INSIDE this container, so the header +
              sidebar + support widget stay usable. `resetKey` clears the
              error automatically when the user navigates elsewhere. */}
          <ErrorBoundary resetKey={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </Container>

        {!isSuperAdmin && hasShopId && (
          <SupportChatWidget
            user={{
              shopId: user.shopId,
              shopName: user.shopName || 'My Shop',
              name: user.userName || user.sub || 'User'
            }}
          />
        )}
      </Box>

      {/* Command Palette - Global Cmd+K search */}
      <CommandPalette />
      </Box>
    </Box>
  );
};

export default MainLayout;