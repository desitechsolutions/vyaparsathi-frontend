import React, { useState, useEffect, useRef } from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar,
  Divider, Box, Typography, Badge
} from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PaymentsIcon from '@mui/icons-material/Payments';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HelpCenterIcon from '@mui/icons-material/HelpCenter';
import GavelIcon from '@mui/icons-material/Gavel';
import useWebSocket from '../../hooks/useWebSocket';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';

const drawerWidth = 240;

const TechAdminSidebar = () => {
  const location = useLocation();
  const locationRef = useRef(location);
  const subscriptionRef = useRef(null);

  const [unreadSupport, setUnreadSupport] = useState(false);

  // Keep latest location in ref (prevents stale closure bug)
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  // WebSocket Hook
  const { stompClient, connected } = useWebSocket('ADMIN_SUPER');

  // ✅ Stable Subscription Effect
  useEffect(() => {
    if (!connected || !stompClient || typeof stompClient.subscribe !== 'function') {
      return;
    }

    try {
      // Prevent duplicate subscriptions
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }

      const sub = stompClient.subscribe('/topic/admin/support', () => {
        const currentPath = locationRef.current?.pathname;

        // Show badge only if not on support page
        if (currentPath !== '/admin/support') {
          setUnreadSupport(true);
        }
      });

      subscriptionRef.current = sub;

    } catch (err) {
      console.error("Admin Support Subscription failed:", err);
    }

    return () => {
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.unsubscribe();
        } catch (e) {
          console.warn("Unsubscribe error:", e);
        }
        subscriptionRef.current = null;
      }
    };

  }, [stompClient, connected]);

  // Clear badge when admin opens support page
  useEffect(() => {
    if (location.pathname === '/admin/support') {
      setUnreadSupport(false);
    }
  }, [location.pathname]);

  const adminMenu = [
    { text: 'Platform Overview', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { text: 'Verify Payments', icon: <PaymentsIcon />, path: '/admin/payments' },
    { text: 'Shop Directory', icon: <StorefrontIcon />, path: '/admin/shops' },
    { text: 'System Users', icon: <PeopleIcon />, path: '/admin/users' },
  ];

  const systemMenu = [
    { text: 'Global Analytics', icon: <AssessmentIcon />, path: '/admin/analytics' },
    { 
    text: 'Pricing Plans', 
    icon: <SettingsSuggestIcon />, 
    path: '/admin/plans'
  },
    { text: 'Audit Logs', icon: <GavelIcon />, path: '/admin/audit' },
    {
      text: 'Support Tickets',
      icon: (
        <Badge color="error" variant="dot" invisible={!unreadSupport}>
          <HelpCenterIcon />
        </Badge>
      ),
      path: '/admin/support'
    },
  ];

  const activeStyle = {
    backgroundColor: '#ef4444',
    color: 'white',
    '& .MuiListItemIcon-root': { color: 'white' },
    '&:hover': { backgroundColor: '#dc2626' },
  };

  const renderItem = (item) => (
    <ListItem key={item.text} disablePadding>
      <ListItemButton
        component={NavLink}
        to={item.path}
        sx={{
          borderRadius: '8px',
          margin: '4px 12px',
          transition: '0.2s',
          ...(location.pathname === item.path ? activeStyle : { color: '#94a3b8' }),
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 40,
            color: location.pathname === item.path ? 'inherit' : '#64748b'
          }}
        >
          {item.icon}
        </ListItemIcon>
        <ListItemText
          primary={item.text}
          primaryTypographyProps={{
            fontWeight: location.pathname === item.path ? 700 : 500,
            fontSize: '0.9rem'
          }}
        />
      </ListItemButton>
    </ListItem>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#1e293b',
          color: '#f8fafc',
          borderRight: '1px solid #334155',
        },
      }}
    >
      <Toolbar />

      <Box sx={{ p: 2 }}>
        <Typography variant="overline" sx={{ color: '#94a3b8', fontWeight: 800, ml: 2 }}>
          Management
        </Typography>
      </Box>

      <List>{adminMenu.map(renderItem)}</List>

      <Divider sx={{ my: 2, bgcolor: '#334155' }} />

      <Box sx={{ p: 2 }}>
        <Typography variant="overline" sx={{ color: '#94a3b8', fontWeight: 800, ml: 2 }}>
          System
        </Typography>
      </Box>

      <List>{systemMenu.map(renderItem)}</List>

      <Box sx={{ mt: 'auto', p: 3, textAlign: 'center' }}>
        {/* WebSocket Status Indicator */}
        <Box sx={{
          mb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1
        }}>
          <Box sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: connected ? '#10b981' : '#ef4444'
          }} />

          <Typography variant="caption" sx={{ color: '#64748b' }}>
            {connected ? 'Live Sync Active' : 'Offline'}
          </Typography>
        </Box>

        <Typography variant="caption" sx={{ color: '#475569' }}>
          VyaparSathi v0.1.0<br />Staff Panel
        </Typography>
      </Box>

    </Drawer>
  );
};

export default TechAdminSidebar;
