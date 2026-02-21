import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import PremiumStatusBanner from '../../pages/PremiumStatusBanner';
import SupportChatWidget from '../../pages/SupportChatWidget';
import { useAuthContext } from '../../context/AuthContext';

const Layout = () => {
  // 1. Get user data from your AuthContext
  const { user } = useAuthContext();
  
  // 2. Determine roles/access based on the decoded JWT claims
  // Ensure your JWT payload includes 'role' and 'shopId'
  const isSuperAdmin = user?.role === 'ROLE_SUPER_ADMIN';
  const hasShopId = !!user?.shopId;

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Header />
      <Sidebar />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          bgcolor: '#F8FAFC', 
          minHeight: '100vh',
          position: 'relative' // Keeps the floating widget anchored correctly
        }}
      >
        <Toolbar />
        
        {/* Verification Banner appears here globally when status is PENDING */}
        <PremiumStatusBanner />

        {/* Actual Page Content */}
        <Outlet />

        {/* 3. Floating chat for Shop Owners only. 
            Super Admins access support via the full-screen AdminSupport page.
        */}
        {!isSuperAdmin && hasShopId && (
          <SupportChatWidget 
            user={{
              shopId: user.shopId,
              shopName: user.shopName || 'My Shop',
              name: user.userName || user.sub || 'User' // 'sub' is standard for username in JWT
            }} 
          />
        )}
      </Box>
    </Box>
  );
};

export default Layout;