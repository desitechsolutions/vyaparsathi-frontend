import React, { useState, useEffect } from 'react';
import {
  Drawer, Box, Typography, IconButton, Tabs, Tab, Stack, Chip, Paper,
  Grid, Avatar, Divider, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SecurityIcon from '@mui/icons-material/Security';
import HistoryIcon from '@mui/icons-material/History';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import superAdminApi from '../../services/superAdminApi';

export default function Shop360Drawer({ open, shopId, onClose, onStatusUpdated }) {
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Suspension Modal State
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (open && shopId) {
      setLoading(true);
      setError(null);
      superAdminApi.getShop360(shopId)
        .then((res) => setData(res))
        .catch((err) => {
          console.error("Shop 360 Fetch Error:", err);
          setError("Failed to load Shop 360 profile.");
        })
        .finally(() => setLoading(false));
    }
  }, [open, shopId]);

  const handleToggleLifecycle = async () => {
    if (!suspendReason.trim()) return;
    setActionLoading(true);
    try {
      const newStatus = !data.active;
      await superAdminApi.updateShopLifecycle(shopId, newStatus, suspendReason);
      setSuspendModalOpen(false);
      setSuspendReason('');
      if (onStatusUpdated) onStatusUpdated();
      // Reload 360
      const refreshed = await superAdminApi.getShop360(shopId);
      setData(refreshed);
    } catch (err) {
      console.error("Status Update Failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 540 }, p: 3, bgcolor: '#0B0F19', color: '#F8FAFC' }
      }}
    >
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: '#2563EB', fontWeight: 900 }}>
            {data?.shopName ? data.shopName.charAt(0) : 'S'}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={900}>
              {data?.shopName || 'Shop Profile'}
            </Typography>
            <Typography variant="caption" color="#94A3B8">
              ID: {data?.shopCode || '—'} • State: {data?.state || '—'}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#94A3B8' }}>
          <CloseIcon />
        </IconButton>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : data ? (
        <>
          {/* Status Badge */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#1E293B', borderRadius: 3, mb: 3, border: '1px solid #334155' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="#94A3B8" fontWeight={700}>ACCOUNT STATUS</Typography>
                <Typography variant="subtitle1" fontWeight={900} color={data.active ? '#34D399' : '#F87171'}>
                  {data.active ? 'ACTIVE ACCESSIBLE' : 'SUSPENDED / DISABLED'}
                </Typography>
              </Box>
              <Button
                variant="contained"
                color={data.active ? 'error' : 'success'}
                size="small"
                startIcon={<PowerSettingsNewIcon />}
                onClick={() => setSuspendModalOpen(true)}
                sx={{ borderRadius: 2, fontWeight: 800, textTransform: 'none' }}
              >
                {data.active ? 'Suspend Account' : 'Activate Account'}
              </Button>
            </Stack>
          </Paper>

          {/* Navigation Tabs */}
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            textColor="primary"
            indicatorColor="primary"
            sx={{ borderBottom: 1, borderColor: '#334155', mb: 3 }}
          >
            <Tab label="Profile" sx={{ color: '#94A3B8', textTransform: 'none', fontWeight: 700 }} />
            <Tab label="Subscription" sx={{ color: '#94A3B8', textTransform: 'none', fontWeight: 700 }} />
            <Tab label="Lifecycle Audit" sx={{ color: '#94A3B8', textTransform: 'none', fontWeight: 700 }} />
          </Tabs>

          {/* Tab 0: Business Profile */}
          {activeTab === 0 && (
            <Stack spacing={2}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#1E293B', borderRadius: 3, border: '1px solid #334155' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="#94A3B8">Owner Name</Typography>
                    <Typography variant="body2" fontWeight={800}>{data.ownerName || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="#94A3B8">Owner Email</Typography>
                    <Typography variant="body2" fontWeight={800}>{data.ownerEmail || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="#94A3B8">Owner Phone</Typography>
                    <Typography variant="body2" fontWeight={800}>{data.ownerPhone || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="#94A3B8">GSTIN</Typography>
                    <Typography variant="body2" fontWeight={800}>{data.gstin || 'Unregistered'}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Stack>
          )}

          {/* Tab 1: Subscription Details */}
          {activeTab === 1 && (
            <Stack spacing={2}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#1E293B', borderRadius: 3, border: '1px solid #334155' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="caption" color="#94A3B8">Current Tier</Typography>
                  <Chip label={data.currentPlanCode} color="primary" size="small" sx={{ fontWeight: 900 }} />
                </Stack>
                <Typography variant="body2" color="#94A3B8">
                  Mandate ID: <span style={{ fontFamily: 'monospace', color: '#F8FAFC' }}>{data.razorpaySubscriptionId || 'N/A'}</span>
                </Typography>
              </Paper>
            </Stack>
          )}

          {/* Tab 2: Lifecycle History */}
          {activeTab === 2 && (
            <Stack spacing={1.5}>
              {data.lifecycleLogs && data.lifecycleLogs.length > 0 ? (
                data.lifecycleLogs.map((log) => (
                  <Paper key={log.id} elevation={0} sx={{ p: 1.5, bgcolor: '#1E293B', borderRadius: 2, border: '1px solid #334155' }}>
                    <Typography variant="caption" color="#60A5FA" fontWeight={800}>
                      {log.action} • {new Date(log.timestamp).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {log.details}
                    </Typography>
                  </Paper>
                ))
              ) : (
                <Typography variant="caption" color="#94A3B8">No lifecycle events recorded.</Typography>
              )}
            </Stack>
          )}
        </>
      ) : null}

      {/* Mandatory Reason Dialog */}
      <Dialog open={suspendModalOpen} onClose={() => setSuspendModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>
          {data?.active ? 'Confirm Account Suspension' : 'Confirm Account Activation'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please state an auditable justification for this lifecycle transition.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Reason (e.g., Subscription non-payment, requested reactivation...)"
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuspendModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={data?.active ? 'error' : 'success'}
            disabled={!suspendReason.trim() || actionLoading}
            onClick={handleToggleLifecycle}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Confirm Action'}
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
}
