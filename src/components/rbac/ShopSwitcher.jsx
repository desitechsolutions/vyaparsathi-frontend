import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
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
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import { fetchMyShops, switchShop } from '../../services/api';
import { useAuthContext } from '../../context/AuthContext';
import { clearPermissionsCache } from '../../hooks/usePermissions';
import CreateShopForm from '../shop/CreateShopForm';

/**
 * Header shop switcher. Shows the active shop's name + role; clicking
 * expands a dropdown listing every shop the user belongs to. Selecting
 * one hits {@code POST /api/auth/switch-shop}, swaps in the new access
 * token, clears the permission cache, and reloads the app so context
 * (ShopContext, permission set, industry field spec, etc.) rebuilds
 * against the new shopId claim.
 *
 * MULTI-STORE-3 fix: always renders for OWNER users (not just ≥2 shops)
 * so there is an entry point to "Add new store".
 */
export default function ShopSwitcher() {
  const { user, login } = useAuthContext();
  const [anchorEl, setAnchorEl] = useState(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const currentShopId = user?.shopId ?? null;
  const isOwner = user?.role === 'OWNER';

  const loadShops = () => {
    if (!user) return;
    setLoading(true);
    fetchMyShops()
      .then((res) => setShops(Array.isArray(res.data) ? res.data : []))
      .catch(() => setShops([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    setLoading(true);
    fetchMyShops()
      .then((res) => { if (!cancelled) setShops(Array.isArray(res.data) ? res.data : []); })
      .catch(() => { if (!cancelled) setShops([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, currentShopId]);

  // Render for multi-shop users OR for OWNER (who can create a new store).
  if (!user || (shops.length < 2 && !isOwner)) return null;

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
      console.error('Shop switch failed:', err);
    } finally {
      setSwitching(null);
    }
  };

  const handleShopCreated = (newToken) => {
    setCreateOpen(false);
    closeMenu();
    if (newToken) {
      clearPermissionsCache();
      login(newToken);
      window.location.assign('/');
    } else {
      // Reload shops list without a full navigation if no auto-login token.
      loadShops();
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
        {shops.length > 0 && (
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="overline" color="text.secondary" fontWeight={700}>Your shops</Typography>
          </Box>
        )}
        {shops.length > 0 && <Divider />}
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

        {/* MULTI-STORE-3 fix: Add new store entry point for OWNER */}
        {isOwner && [
          shops.length > 0 && <Divider key="divider" />,
          <MenuItem
            key="add-store"
            onClick={() => { closeMenu(); setCreateOpen(true); }}
            sx={{ py: 1.25 }}
          >
            <ListItemIcon>
              <Avatar variant="rounded" sx={{ width: 32, height: 32, bgcolor: 'success.light', color: 'success.main' }}>
                <AddBusinessIcon fontSize="small" />
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{ variant: 'body2', fontWeight: 700 }}
              primary="Add new store"
              secondary="Create a new shop under your account"
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </MenuItem>,
        ]}
      </Menu>

      {/* Create new store dialog */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          Create a new store
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <CreateShopForm
            mode="additional"
            onSuccess={handleShopCreated}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
