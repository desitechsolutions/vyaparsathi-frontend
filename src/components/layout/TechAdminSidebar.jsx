import React, { useState, useEffect, useRef } from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar,
  Divider, Box, Typography, Badge, Chip, Paper, keyframes, useTheme,
} from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PaymentsIcon from '@mui/icons-material/Payments';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PeopleIcon from '@mui/icons-material/People';
import HelpCenterIcon from '@mui/icons-material/HelpCenter';
import GavelIcon from '@mui/icons-material/Gavel';
import EmailIcon from '@mui/icons-material/Email';
import BusinessIcon from '@mui/icons-material/Business';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import FlagIcon from '@mui/icons-material/Flag';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import ShieldIcon from '@mui/icons-material/Shield';
import useWebSocket from '../../hooks/useWebSocket';
import { useAuthContext } from '../../context/AuthContext';

const drawerWidth = 260;

const pulseAnimation = keyframes`
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
`;

const TechAdminSidebar = () => {
  const location = useLocation();
  const locationRef = useRef(location);
  const subscriptionRef = useRef(null);
  const { user } = useAuthContext();
  const theme = useTheme();

  const isDark = theme.palette.mode === 'dark';

  // Dynamic Theme Palette Values
  const sidebarBg = isDark ? '#1E293B' : '#FFFFFF';
  const sidebarColor = isDark ? '#F8FAFC' : '#0F172A';
  const borderColor = isDark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(0, 0, 0, 0.08)';
  const navTitleColor = isDark ? '#94A3B8' : '#64748B';
  const inactiveItemColor = isDark ? '#CBD5E1' : '#334155';
  const inactiveIconColor = isDark ? '#94A3B8' : '#475569';
  const hoverBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(37, 99, 235, 0.08)';
  const hoverText = isDark ? '#FFFFFF' : '#1D4ED8';
  const hoverIcon = isDark ? '#60A5FA' : '#2563EB';
  const brandCardBg = isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(37, 99, 235, 0.06)';
  const brandCardBorder = isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(37, 99, 235, 0.15)';
  const brandTitleColor = isDark ? '#F8FAFC' : '#0F172A';
  const footerBg = isDark ? '#0F172A' : '#F8FAFC';
  const footerCardBg = isDark ? '#1E293B' : '#FFFFFF';

  const [unreadSupport, setUnreadSupport] = useState(false);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  // WebSocket Hook for Live Support Notification
  const { stompClient, connected } = useWebSocket('ADMIN_SUPER');

  useEffect(() => {
    if (!connected || !stompClient || typeof stompClient.subscribe !== 'function') {
      return;
    }

    try {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }

      const sub = stompClient.subscribe('/topic/admin/support', () => {
        const currentPath = locationRef.current?.pathname;
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
    { text: 'Newsletter Subscribers', icon: <EmailIcon />, path: '/admin/newsletter' },
  ];

  const systemMenu = [
    { text: 'Pricing Plans & Entitlements', icon: <SettingsSuggestIcon />, path: '/admin/plans' },
    { text: 'Platform Settings', icon: <BusinessIcon />, path: '/admin/platform-settings' },
    { text: 'Feature Flags', icon: <FlagIcon />, path: '/admin/feature-flags' },
    { text: 'Admin Team', icon: <GroupAddIcon />, path: '/admin/team' },
    { text: 'Audit / Forensic Logs', icon: <GavelIcon />, path: '/admin/audit' },
    {
      text: 'Support Tickets',
      icon: (
        <Badge color="error" variant="dot" invisible={!unreadSupport}>
          <HelpCenterIcon />
        </Badge>
      ),
      path: '/admin/support',
    },
  ];

  const roleTitle = user?.role ? user.role.replace('_', ' ') : 'SUPER ADMIN';

  const renderNavGroup = (title, items) => (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="caption"
        sx={{
          color: navTitleColor,
          fontWeight: 800,
          letterSpacing: '0.08em',
          fontSize: '0.68rem',
          textTransform: 'uppercase',
          px: 3,
          py: 1,
          display: 'block',
        }}
      >
        {title}
      </Typography>
      <List disablePadding>
        {items.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NavLink}
                to={item.path}
                sx={{
                  mx: 1.5,
                  my: 0.25,
                  px: 2,
                  py: 1.25,
                  borderRadius: '12px',
                  position: 'relative',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  ...(isActive
                    ? {
                        background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                        color: '#FFFFFF',
                        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                        fontWeight: 700,
                        '& .MuiListItemIcon-root': { color: '#FFFFFF' },
                        '& .MuiListItemText-primary': { color: '#FFFFFF !important' },
                      }
                    : {
                        color: inactiveItemColor,
                        '&:hover': {
                          backgroundColor: hoverBg,
                          color: hoverText,
                          transform: 'translateX(3px)',
                          '& .MuiListItemIcon-root': { color: hoverIcon },
                          '& .MuiListItemText-primary': { color: `${hoverText} !important` },
                        },
                      }),
                }}
              >
                {/* Active Indicator Strip */}
                {isActive && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: -6,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 4,
                      height: 20,
                      borderRadius: 4,
                      backgroundColor: '#60A5FA',
                    }}
                  />
                )}

                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: isActive ? '#FFFFFF' : inactiveIconColor,
                    transition: 'color 0.2s ease',
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 800 : 600,
                    fontSize: '0.85rem',
                    letterSpacing: '-0.01em',
                    color: isActive ? '#FFFFFF' : inactiveItemColor,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
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
          backgroundColor: sidebarBg,
          color: sidebarColor,
          borderRight: `1px solid ${borderColor}`,
          display: 'flex',
          flexDirection: 'column',
          transition: 'background-color 0.2s ease, border-color 0.2s ease',
        },
      }}
    >
      <Toolbar sx={{ minHeight: 70 }} />

      {/* SuperAdmin Brand Badge Header */}
      <Box sx={{ px: 3, pt: 1, pb: 2 }}>
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            bgcolor: brandCardBg,
            border: brandCardBorder,
            borderRadius: '14px',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '10px',
              bgcolor: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)',
            }}
          >
            <ShieldIcon sx={{ color: '#FFFFFF', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={900} color={brandTitleColor} sx={{ lineHeight: 1.2 }}>
              {roleTitle}
            </Typography>
            <Chip
              label={user?.role === 'SUPER_ADMIN' ? 'GOD MODE ACTIVE' : `${roleTitle} ACTIVE`}
              size="small"
              sx={{
                height: 16,
                fontSize: '0.55rem',
                fontWeight: 900,
                bgcolor: user?.role === 'SUPER_ADMIN' ? '#DC2626' : '#2563EB',
                color: '#FFFFFF',
                borderRadius: '4px',
                mt: 0.3,
              }}
            />
          </Box>
        </Paper>
      </Box>

      {/* Main Navigation Lists */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1 }}>
        {renderNavGroup('Platform Operations', adminMenu)}
        <Divider sx={{ mx: 3, my: 1.5, borderColor: borderColor }} />
        {renderNavGroup('System Control', systemMenu)}
      </Box>

      {/* Glassmorphic Footer & Live Connection Indicator */}
      <Box sx={{ p: 2, borderTop: `1px solid ${borderColor}`, bgcolor: footerBg }}>
        <Paper
          elevation={0}
          sx={{
            p: 1.75,
            bgcolor: footerCardBg,
            borderRadius: '14px',
            border: `1px solid ${borderColor}`,
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              mb: 1,
            }}
          >
            <Box
              sx={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                bgcolor: connected ? '#10B981' : '#EF4444',
                animation: connected ? `${pulseAnimation} 2s infinite` : 'none',
              }}
            />
            <Typography variant="caption" fontWeight={800} sx={{ color: connected ? '#10B981' : '#EF4444' }}>
              {connected ? 'Live Sync Active' : 'Server Offline'}
            </Typography>
          </Box>

          <Typography variant="caption" color={navTitleColor} fontWeight={600} sx={{ display: 'block', fontSize: '0.7rem' }}>
            VyaparSathi Enterprise v0.1.0
          </Typography>
        </Paper>
      </Box>
    </Drawer>
  );
};

export default TechAdminSidebar;

