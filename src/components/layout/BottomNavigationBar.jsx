import React, { useState } from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

import DashboardIcon      from '@mui/icons-material/Dashboard';
import ShoppingCartIcon   from '@mui/icons-material/ShoppingCart';
import InventoryIcon      from '@mui/icons-material/Inventory';
import AssessmentIcon     from '@mui/icons-material/Assessment';
import MoreHorizIcon      from '@mui/icons-material/MoreHoriz';
import PeopleIcon         from '@mui/icons-material/People';
import StoreIcon          from '@mui/icons-material/Store';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptLongIcon    from '@mui/icons-material/ReceiptLong';
import NotificationsIcon  from '@mui/icons-material/Notifications';
import SettingsIcon       from '@mui/icons-material/Settings';

// ─── Route definitions ─────────────────────────────────────────────────────

const PRIMARY_TABS = [
  { label: 'Dashboard', icon: <DashboardIcon />,    path: '/dashboard' },
  { label: 'Sales',     icon: <ShoppingCartIcon />, path: '/sales'     },
  { label: 'Inventory', icon: <InventoryIcon />,    path: '/stock'     },
  { label: 'Reports',   icon: <AssessmentIcon />,   path: '/reports'   },
];

const MORE_ITEMS = [
  { label: 'Customers',     icon: <PeopleIcon />,         path: '/customers'         },
  { label: 'Suppliers',     icon: <StoreIcon />,          path: '/suppliers'         },
  { label: 'Finance',       icon: <AccountBalanceIcon />, path: '/customer-payments' },
  { label: 'Purchases',     icon: <ReceiptLongIcon />,    path: '/purchase-orders'   },
  { label: 'Notifications', icon: <NotificationsIcon />,  path: '/notifications'     },
  { label: 'Settings',      icon: <SettingsIcon />,       path: '/admin/settings'    },
];

// ─── Component ─────────────────────────────────────────────────────────────

const BottomNavigationBar = () => {
  const theme   = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Render nothing on tablet / desktop — the sidebar handles those viewports.
  if (!isMobile) return null;

  // Active tab index: exact match for the root path, or prefix-match for child
  // routes (e.g. /sales/return keeps "Sales" highlighted).
  const activeTab = PRIMARY_TABS.findIndex(
    (r) => location.pathname === r.path || location.pathname.startsWith(r.path + '/')
  );
  // "More" button (index 4) lights up only while the drawer is open.
  const tabValue = drawerOpen ? 4 : (activeTab >= 0 ? activeTab : false);

  // The AppBar is always brand-blue; keep the bottom bar consistent with it.
  const barBg       = '#1976d2';
  const inactiveClr = 'rgba(255,255,255,0.6)';
  const activeClr   = '#ffffff';

  return (
    <>
      {/* ── Fixed bottom bar ────────────────────────────────────────────── */}
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar,
          display: { xs: 'block', sm: 'none' },
          borderRadius: 0,
        }}
      >
        <BottomNavigation
          value={tabValue}
          showLabels
          sx={{
            bgcolor: barBg,
            height: 60,
            '& .MuiBottomNavigationAction-root': {
              color: inactiveClr,
              minWidth: 0,
              transition: 'color 180ms ease',
              '& .MuiBottomNavigationAction-label': { fontSize: '0.65rem', fontWeight: 500 },
              '& .MuiSvgIcon-root': { fontSize: 24 },
            },
            '& .Mui-selected': {
              color: `${activeClr} !important`,
              '& .MuiBottomNavigationAction-label': { fontWeight: 700, fontSize: '0.65rem !important' },
            },
          }}
        >
          {PRIMARY_TABS.map((tab) => (
            <BottomNavigationAction
              key={tab.path}
              label={tab.label}
              icon={tab.icon}
              onClick={() => { setDrawerOpen(false); navigate(tab.path); }}
            />
          ))}
          <BottomNavigationAction
            label="More"
            icon={<MoreHorizIcon />}
            onClick={() => setDrawerOpen((prev) => !prev)}
          />
        </BottomNavigation>
      </Paper>

      {/* ── "More" bottom sheet drawer ────────────────────────────────── */}
      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            pb: 2,
            // Extra bottom padding so content clears the fixed bar above
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
          },
        }}
      >
        {/* Drag handle + section label */}
        <Box sx={{ pt: 1.5, px: 2, pb: 0.5 }}>
          <Box sx={{ width: 40, height: 4, bgcolor: 'divider', borderRadius: 2, mx: 'auto', mb: 1.5 }} />
          <Typography
            variant="overline"
            sx={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', color: 'text.disabled' }}
          >
            More options
          </Typography>
        </Box>
        <Divider />

        <List disablePadding>
          {MORE_ITEMS.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <ListItemButton
                key={item.path}
                selected={isActive}
                onClick={() => { setDrawerOpen(false); navigate(item.path); }}
                sx={{
                  py: 1.25,
                  px: 3,
                  '&.Mui-selected': {
                    bgcolor: 'action.selected',
                    '& .MuiListItemIcon-root': { color: 'primary.main' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'primary.main' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isActive ? 600 : 400 }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Drawer>
    </>
  );
};

export default BottomNavigationBar;
