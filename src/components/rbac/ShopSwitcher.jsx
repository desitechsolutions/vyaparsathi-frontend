import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { fetchMyShops, switchShop } from '../../services/api';
import { useAuthContext } from '../../context/AuthContext';
import { clearPermissionsCache } from '../../hooks/usePermissions';

/**
 * Header shop switcher. Shows the active shop's name + role; clicking
 * expands a dropdown listing every shop the user belongs to. Selecting
 * one hits {@code POST /api/auth/switch-shop}, swaps in the new access
 * token, clears the permission cache, and reloads the app so context
 * (ShopContext, permission set, industry field spec, etc.) rebuilds
 * against the new shopId claim.
 */
export default function ShopSwitcher() {
  const { user, login } = useAuthContext();
  const [anchorEl, setAnchorEl] = useState(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(null);

  const currentShopId = user?.shopId ?? null;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    fetchMyShops()
      .then((res) => { if (!cancelled) setShops(Array.isArray(res.data) ? res.data : []); })
      .catch(() => { if (!cancelled) setShops([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, currentShopId]);

  // Only render the switcher when the user has more than one shop.
  // Single-shop users don't need a picker; the space is more valuable elsewhere.
  if (!user || shops.length < 2) return null;

  const active = shops.find((s) => s.shopId === currentShopId) || shops[0];

  const openMenu = (e) => setAnchorEl(e.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const handleSwitch = async (targetShopId) => {
    if (targetShopId === currentShopId) { closeMenu(); return; }
    setSwitching(targetShopId);
    try {
      const res = await switchShop(targetShopId);
      const token = res.data?.accessToken;
      if (token) {
        clearPermissionsCache();
        // AuthContext.login writes the new token to localStorage, updates
        // Axios auth headers, and re-parses the user (which will now carry
        // the new shopId claim). A hard reload flushes any cached
        // ShopContext / industryConfig for the previous shop.
        login(token);
        window.location.assign('/');
      }
    } catch (err) {
      // Keep the menu open so the user sees something happened; a toast
      // is out of scope here but the switch retries cheaply.
      console.error('Shop switch failed:', err);
    } finally {
      setSwitching(null);
    }
  };

  return (
    <>
      <Button
        onClick={openMenu}
        startIcon={<StorefrontIcon fontSize="small" />}
        endIcon={<ExpandMoreIcon fontSize="small" />}
        size="small"
        variant="outlined"
        sx={{
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 2,
          maxWidth: { xs: 180, md: 260 },
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}
        aria-label={`Active shop: ${active?.shopName || 'unknown'}`}
      >
        <Stack alignItems="flex-start" spacing={0.2} sx={{ overflow: 'hidden' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1 }}>
            Active shop
          </Typography>
          <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {active?.shopName || 'Shop'}
          </Typography>
        </Stack>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { minWidth: 300, borderRadius: 2, mt: 0.5 } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="overline" color="text.secondary" fontWeight={700}>Your shops</Typography>
        </Box>
        <Divider />
        {loading && (
          <MenuItem disabled sx={{ justifyContent: 'center', py: 2 }}>
            <CircularProgress size={20} />
          </MenuItem>
        )}
        {!loading && shops.map((s) => {
          const isActive = s.shopId === currentShopId;
          const isBusy = switching === s.shopId;
          return (
            <MenuItem
              key={s.shopId}
              selected={isActive}
              disabled={isBusy || (isActive && switching == null)}
              onClick={() => handleSwitch(s.shopId)}
              sx={{ py: 1.25 }}
            >
              <ListItemIcon>
                <Avatar
                  variant="rounded"
                  sx={{ width: 32, height: 32, bgcolor: 'primary.light', color: 'primary.main' }}
                  src={s.logoPath || undefined}
                >
                  <StorefrontIcon fontSize="small" />
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primaryTypographyProps={{ variant: 'body2', fontWeight: 700 }}
                secondaryTypographyProps={{ variant: 'caption' }}
                primary={s.shopName}
                secondary={
                  <Stack direction="row" spacing={0.75} alignItems="center" component="span">
                    <span>{s.roleDisplayName || s.role}</span>
                    {s.isDefault && <Chip label="Default" size="small" sx={{ height: 16, fontSize: '0.6rem' }} />}
                  </Stack>
                }
              />
              {isBusy && <CircularProgress size={16} />}
              {!isBusy && isActive && <CheckCircleIcon fontSize="small" color="success" />}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
