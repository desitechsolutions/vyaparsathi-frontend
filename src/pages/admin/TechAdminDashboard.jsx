import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Typography, Card, CardContent, Button, Stack, 
  Divider, CircularProgress, Avatar, Paper,
  IconButton, Tooltip, Alert, Chip, GlobalStyles
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { fetchPlatformStats } from '../../services/api';
import superAdminApi from '../../services/superAdminApi';

// Icons
import PaymentsIcon from '@mui/icons-material/Payments';
import StorefrontIcon from '@mui/icons-material/Storefront';
import GroupIcon from '@mui/icons-material/Group';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ChatIcon from '@mui/icons-material/Chat';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const AdminStatCard = ({ title, value, icon, color, subtext, onClick, pulse }) => (
  <Card 
    sx={{ 
      bgcolor: 'background.paper', color: 'text.primary', 
      borderRadius: 4, 
      height: '100%',
      border: pulse ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.05)',
      animation: pulse ? `pulse-${color.replace('#', '')} 2s infinite` : 'none',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': { 
        transform: 'translateY(-5px)', 
        boxShadow: `0 12px 20px -10px ${color}60`,
        cursor: onClick ? 'pointer' : 'default' 
      }
    }} 
    onClick={onClick}
  >
    <CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: 1 }}>
            {title}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 900, my: 1, letterSpacing: -1 }}>
            {value}
          </Typography>
          <Typography variant="caption" sx={{ color: color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {subtext}
          </Typography>
        </Box>
        <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 48, height: 48, borderRadius: 2.5 }}>
          {icon}
        </Avatar>
      </Stack>
    </CardContent>
  </Card>
);

const TechAdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [execMetrics, setExecMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, execData] = await Promise.all([
        fetchPlatformStats(),
        superAdminApi.getExecutiveMetrics().catch(() => null)
      ]);
      setStats(data);
      setExecMetrics(execData);
    } catch (err) {
      console.error("Platform Stats Fetch Error:", err);
      setError("Unable to connect to platform services. Please check backend connectivity.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <CircularProgress sx={{ color: 'error.main' }} thickness={5} />
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1, p: 2 }}>
      <GlobalStyles styles={{
        '@keyframes pulse-fbbf24': {
          '0%': { boxShadow: '0 0 0 0px rgba(251, 191, 36, 0.4)' },
          '70%': { boxShadow: '0 0 0 10px rgba(251, 191, 36, 0)' },
          '100%': { boxShadow: '0 0 0 0px rgba(251, 191, 36, 0)' },
        },
        '@keyframes pulse-ec4899': {
          '0%': { boxShadow: '0 0 0 0px rgba(236, 72, 153, 0.4)' },
          '70%': { boxShadow: '0 0 0 10px rgba(236, 72, 153, 0)' },
          '100%': { boxShadow: '0 0 0 0px rgba(236, 72, 153, 0)' },
        }
      }} />

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3, bgcolor: '#450a0a', color: '#fca5a5' }} icon={<WarningAmberIcon />}>
          {error}
        </Alert>
      )}

      {/* Header Section */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: 'text.primary' }}>
            Executive Control Center
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Real-time SaaS operations, MRR, & tenant governance
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={loadDashboardData} sx={{ color: 'text.primary', border: '1px solid', borderColor: 'divider' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button 
            variant="contained" 
            color="secondary" 
            startIcon={<ChatIcon />} 
            onClick={() => navigate('/admin/support')}
            sx={{ borderRadius: 2, fontWeight: 800, px: 3, bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' } }}
          >
            Live Support
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<VerifiedUserIcon />} 
            onClick={() => navigate('/admin/payments')}
            sx={{ borderRadius: 2, fontWeight: 800, px: 3, textTransform: 'none', boxShadow: '0 4px 14px 0 rgba(74, 222, 128, 0.39)' }}
          >
            Verify {stats?.pendingCount || 0} Payments
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {/* Metric Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <AdminStatCard 
            title="Monthly Recurring (MRR)"
            value={`₹${(execMetrics?.mrr || 0).toLocaleString('en-IN')}`}
            icon={<AccountBalanceWalletIcon />}
            color="#3B82F6"
            subtext={`ARR: ₹${(execMetrics?.arr || 0).toLocaleString('en-IN')}`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <AdminStatCard 
            title="Paying Subscriptions"
            value={execMetrics?.payingShops || 0}
            icon={<TrendingUpIcon />}
            color="#4ade80"
            subtext={`${execMetrics?.trialConversionRate || 0}% Trial Conv. Rate`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <AdminStatCard 
            title="Pending UTR Verification"
            value={stats?.pendingCount || 0}
            icon={<PendingActionsIcon />}
            color="#fbbf24"
            subtext="Bank Transfers Queue"
            onClick={() => navigate('/admin/payments')}
            pulse={stats?.pendingCount > 0}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <AdminStatCard 
            title="Total Tenant Ecosystem"
            value={execMetrics?.totalShops || stats?.totalShops || 0}
            icon={<StorefrontIcon />}
            color="#38bdf8"
            subtext={`${execMetrics?.activeShops || 0} Active • ${execMetrics?.suspendedShops || 0} Suspended`}
            onClick={() => navigate('/admin/shops')}
          />
        </Grid>

        {/* System Health Area */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 4, bgcolor: 'background.paper', color: 'text.primary', borderRadius: 5, border: '1px solid', borderColor: 'divider', minHeight: 400 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight={800}>SaaS Platform Health & Growth</Typography>
              <Chip label={execMetrics?.systemStatus || "All Systems Nominal"} size="small" color="success" variant="outlined" sx={{ fontWeight: 900 }} />
            </Stack>
            <Divider sx={{ bgcolor: 'text.disabled', mb: 4 }} />
            
            <Box sx={{ mb: 4 }}>
               <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.8 }}>
                  VyaparSathi is actively orchestrating <strong>{execMetrics?.totalShops || stats?.totalShops} multi-tenant shops</strong>. 
                  {stats?.pendingCount > 0 ? (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(251, 191, 36, 0.1)', borderRadius: 2, border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                      <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 600 }}>
                         Action Required: {stats.pendingCount} payment verifications are pending.
                      </Typography>
                    </Box>
                  ) : (
                    <Typography component="p" sx={{ color: 'success.main', mt: 2 }}>
                      ✓ All AutoPay & subscription mandates are fully processed.
                    </Typography>
                  )}
               </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mt: 6, opacity: 0.3 }}>
              <TrendingUpIcon sx={{ fontSize: 80, mb: 2 }} />
              <Typography variant="body2">
                Real-time SaaS billing & entitlement telemetry active.
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar Controls */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 4, bgcolor: 'background.paper', color: 'text.primary', borderRadius: 5, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>Administrative Tools</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 3 }}>
              Global Master Controls
            </Typography>
            
            <Stack spacing={2}>
              {[
                { label: 'Shop Ecosystem & 360°', icon: <StorefrontIcon />, path: '/admin/shops' },
                { label: 'Platform Users Directory', icon: <GroupIcon />, path: '/admin/users' },
                { label: 'Platform Settings', icon: <ArrowForwardIcon />, path: '/admin/platform-settings' },
                { label: 'Live Support Center', icon: <ChatIcon />, path: '/admin/support', highlight: true },
              ].map((item, index) => (
                <Button 
                  key={index}
                  fullWidth 
                  variant="outlined" 
                  onClick={() => item.path && navigate(item.path)}
                  sx={{ 
                    justifyContent: 'flex-start', 
                    py: 1.8, 
                    px: 2.5,
                    borderRadius: 3,
                    borderColor: item.highlight ? 'rgba(236, 72, 153, 0.3)' : 'rgba(255,255,255,0.1)',
                    color: item.highlight ? '#ec4899' : 'rgba(255,255,255,0.8)',
                    '&:hover': { 
                      borderColor: item.highlight ? '#ec4899' : '#ef4444', 
                      color: 'text.primary', 
                      bgcolor: item.highlight ? 'rgba(236, 72, 153, 0.05)' : 'rgba(239, 68, 68, 0.05)' 
                    }
                  }}
                >
                  <Box sx={{ mr: 2, display: 'flex' }}>{item.icon}</Box>
                  <Typography variant="body2" fontWeight={700}>{item.label}</Typography>
                </Button>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TechAdminDashboard;