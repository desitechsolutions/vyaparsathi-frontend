import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline, Toolbar, Container } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import PremiumStatusBanner from '../../pages/PremiumStatusBanner';
import SupportChatWidget from '../../pages/SupportChatWidget';
import { useAuthContext } from '../../context/AuthContext';

const MainLayout = () => {
  const { user } = useAuthContext();
  const [mobileOpen, setMobileOpen] = useState(false); // Mobile menu state

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isSuperAdmin = user?.role === 'ROLE_SUPER_ADMIN';
  const hasShopId = !!user?.shopId;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Pass the toggle function to the Header */}
      <Header onDrawerToggle={handleDrawerToggle} />
      
      {/* Pass state and toggle function to Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} />

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          bgcolor: '#F8FAFC', 
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
          <Outlet />
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
    </Box>
  );
};

export default MainLayout;