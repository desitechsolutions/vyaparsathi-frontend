import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Switch, TextField, Button, Grid, Stack, Chip,
  Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Divider
} from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import SpeedIcon from '@mui/icons-material/Speed';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import superAdminApi from '../../services/superAdminApi';

export default function FeatureFlagManagerPage() {
  const [platformFlags, setPlatformFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tenant Feature Override Search
  const [targetShopId, setTargetShopId] = useState('');
  const [tenantOverrides, setTenantOverrides] = useState([]);
  const [tenantOverridesLoading, setTenantOverridesLoading] = useState(false);

  // Limit Override Modal
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [limitShopId, setLimitShopId] = useState('');
  const [resourceKey, setResourceKey] = useState('MAX_USERS');
  const [overrideLimit, setOverrideLimit] = useState(10);
  const [endDate, setEndDate] = useState('');
  const [limitReason, setLimitReason] = useState('');
  const [limitActionLoading, setLimitActionLoading] = useState(false);

  const loadPlatformFlags = async () => {
    setLoading(true);
    setError(null);
    try {
      const flags = await superAdminApi.getPlatformFlags();
      setPlatformFlags(flags || []);
    } catch (err) {
      console.error("Failed to load platform flags:", err);
      setError("Failed to fetch platform feature flags.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlatformFlags();
  }, []);

  const handleSearchTenantOverrides = async () => {
    if (!targetShopId.trim()) return;
    setTenantOverridesLoading(true);
    try {
      const overrides = await superAdminApi.getShopFeatureOverrides(targetShopId);
      setTenantOverrides(overrides || []);
    } catch (err) {
      console.error("Tenant flag fetch error:", err);
    } finally {
      setTenantOverridesLoading(false);
    }
  };

  const handleToggleTenantOverride = async (featureKey, currentEnabled) => {
    if (!targetShopId) return;
    try {
      await superAdminApi.setFeatureOverride(targetShopId, featureKey, !currentEnabled);
      handleSearchTenantOverrides();
    } catch (err) {
      console.error("Override toggle error:", err);
    }
  };

  const handleAddLimitOverride = async () => {
    if (!limitShopId || !limitReason.trim()) return;
    setLimitActionLoading(true);
    try {
      await superAdminApi.addLimitOverride(
        limitShopId,
        resourceKey,
        parseInt(overrideLimit, 10),
        endDate ? `${endDate}T23:59:59` : null,
        limitReason
      );
      setLimitModalOpen(false);
      setLimitShopId('');
      setLimitReason('');
      alert("Tenant entitlement limit override applied successfully.");
    } catch (err) {
      console.error("Limit override error:", err);
      alert(err.response?.data?.message || "Failed to apply limit override");
    } finally {
      setLimitActionLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, color: 'text.primary' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FlagIcon sx={{ fontSize: 36, color: 'primary.main' }} /> Feature Flags & Entitlements
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage global feature flags, tenant-specific overrides, and scheduled resource limits
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={() => setLimitModalOpen(true)}
          sx={{ borderRadius: 2, fontWeight: 800, textTransform: 'none', px: 3 }}
        >
          Add Tenant Limit Override
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Platform Feature Flags Table */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', height: '100%' }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
              Platform Master Feature Flags
            </Typography>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>FEATURE KEY</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>NAME</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>CATEGORY</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem' }}>DEFAULT</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={30} />
                      </TableCell>
                    </TableRow>
                  ) : platformFlags.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        No platform feature flags configured.
                      </TableCell>
                    </TableRow>
                  ) : (
                    platformFlags.map((flag) => (
                      <TableRow key={flag.featureKey}>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{flag.featureKey}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{flag.featureName}</TableCell>
                        <TableCell>
                          <Chip label={flag.category} size="small" variant="outlined" sx={{ fontWeight: 800 }} />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={flag.defaultEnabled ? 'ENABLED' : 'DISABLED'}
                            color={flag.defaultEnabled ? 'success' : 'default'}
                            size="small"
                            sx={{ fontWeight: 800 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Tenant Specific Feature Override Console */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', height: '100%' }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
              Tenant Specific Feature Overrides
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Inspect and override specific feature toggles for an individual shop
            </Typography>

            <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Enter Shop ID (e.g. 1002)..."
                value={targetShopId}
                onChange={(e) => setTargetShopId(e.target.value)}
              />
              <Button
                variant="contained"
                onClick={handleSearchTenantOverrides}
                disabled={!targetShopId.trim() || tenantOverridesLoading}
              >
                Inspect
              </Button>
            </Stack>

            {tenantOverridesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
            ) : tenantOverrides.length > 0 ? (
              <Stack spacing={1.5}>
                {tenantOverrides.map((override) => (
                  <Paper key={override.id} elevation={0} sx={{ p: 1.5, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" fontFamily="monospace" fontWeight={800}>
                          {override.featureKey}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Updated: {new Date(override.updatedAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Switch
                        checked={Boolean(override.enabled)}
                        onChange={() => handleToggleTenantOverride(override.featureKey, override.enabled)}
                        color="success"
                      />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            ) : targetShopId ? (
              <Typography variant="caption" color="text.secondary">No tenant feature overrides set for Shop #{targetShopId}.</Typography>
            ) : null}
          </Paper>
        </Grid>
      </Grid>

      {/* Add Limit Override Modal */}
      <Dialog open={limitModalOpen} onClose={() => setLimitModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Override Tenant Resource Limit</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Shop ID"
              required
              fullWidth
              value={limitShopId}
              onChange={(e) => setLimitShopId(e.target.value)}
              placeholder="e.g. 1001"
            />
            <TextField
              select
              label="Resource Metric Key"
              fullWidth
              value={resourceKey}
              onChange={(e) => setResourceKey(e.target.value)}
            >
              <MenuItem value="MAX_USERS">MAX_USERS (Staff accounts limit)</MenuItem>
              <MenuItem value="MAX_INVOICES">MAX_INVOICES (Monthly invoice generation)</MenuItem>
              <MenuItem value="MAX_ITEMS">MAX_ITEMS (Inventory item limit)</MenuItem>
              <MenuItem value="MAX_STORAGE_MB">MAX_STORAGE_MB (Attachment storage limit)</MenuItem>
            </TextField>
            <TextField
              label="Override Limit Value"
              type="number"
              required
              fullWidth
              value={overrideLimit}
              onChange={(e) => setOverrideLimit(e.target.value)}
            />
            <TextField
              label="Expiration Date (Optional)"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <TextField
              label="Mandatory Reason"
              required
              multiline
              rows={2}
              fullWidth
              placeholder="Auditable justification for limit override..."
              value={limitReason}
              onChange={(e) => setLimitReason(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLimitModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!limitShopId || !limitReason.trim() || limitActionLoading}
            onClick={handleAddLimitOverride}
          >
            {limitActionLoading ? <CircularProgress size={20} /> : 'Apply Override'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
