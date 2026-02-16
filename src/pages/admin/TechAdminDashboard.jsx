import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Typography, Card, CardContent, Button, Stack, 
  Divider, CircularProgress, Avatar, Paper,
  IconButton, Tooltip, Alert,Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { fetchPlatformStats } from '../../services/api';

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

/**
 * Reusable Metric Card for Admin Stats
 */
const AdminStatCard = ({ title, value, icon, color, subtext, onClick, pulse }) => (
  <Card 
    sx={{ 
      bgcolor: '#1e293b', 
      color: 'white', 
      borderRadius: 4, 
      height: '100%',
      border: pulse ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.05)',
      animation: pulse ? 'pulse-border 2s infinite' : 'none',
      '@keyframes pulse-border': {
        '0%': { boxShadow: `0 0 0 0px ${color}40` },
        '70%': { boxShadow: `0 0 0 10px ${color}00` },
        '100%': { boxShadow: `0 0 0 0px ${color}00` },
      },
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
          <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800, letterSpacing: 1 }}>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPlatformStats();
      setStats(data);
    } catch (error) {
      console.error("Platform Stats Fetch Error:", error);
      setError("Unable to connect to platform services. Please check backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <CircularProgress sx={{ color: '#ef4444' }} thickness={5} />
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1, p: 1 }}>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3, bgcolor: '#450a0a', color: '#fca5a5' }} icon={<WarningAmberIcon />}>
          {error}
        </Alert>
      )}

      {/* Header Section */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: 'white' }}>
            Platform Monitor
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
            Real-time status of VyaparSathi ecosystem
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={loadDashboardData} sx={{ color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<VerifiedUserIcon />} 
            onClick={() => navigate('/admin/payments')}
            sx={{ borderRadius: 2, fontWeight: 800, px: 3, textTransform: 'none', boxShadow: '0 4px 14px 0 rgba(74, 222, 128, 0.39)' }}
          >
            Review {stats?.pendingCount || 0} Payments
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {/* 1. Pending Verifications - High Priority */}
        <Grid item xs={12} sm={6} md={3}>
          <AdminStatCard 
            title="Pending UTRs"
            value={stats?.pendingCount || 0}
            icon={<PendingActionsIcon />}
            color="#fbbf24" // Amber
            subtext="Needs Staff Approval"
            onClick={() => navigate('/admin/payments')}
            pulse={stats?.pendingCount > 0}
          />
        </Grid>

        {/* 2. Total Shops */}
        <Grid item xs={12} sm={6} md={3}>
          <AdminStatCard 
            title="Total Shops"
            value={stats?.totalShops || 0}
            icon={<StorefrontIcon />}
            color="#38bdf8" // Sky Blue
            subtext="Global Registered Entities"
          />
        </Grid>

        {/* 3. Monthly Revenue */}
        <Grid item xs={12} sm={6} md={3}>
          <AdminStatCard 
            title="Total Revenue"
            value={`₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`}
            icon={<TrendingUpIcon />}
            color="#4ade80" // Emerald
            subtext="Verified Earnings"
          />
        </Grid>

        {/* 4. Total Users */}
        <Grid item xs={12} sm={6} md={3}>
          <AdminStatCard 
            title="Platform Users"
            value={stats?.totalUsers || 0}
            icon={<GroupIcon />}
            color="#a78bfa" // Violet
            subtext="Total Staff & Owners"
          />
        </Grid>

        {/* Main Content Areas */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 4, bgcolor: '#1e293b', color: 'white', borderRadius: 5, border: '1px solid rgba(255,255,255,0.05)', minHeight: 400 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight={800}>System Health & Growth</Typography>
              <Chip label="Live" size="small" color="success" variant="outlined" sx={{ fontWeight: 900 }} />
            </Stack>
            <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 4 }} />
            
            {/* Descriptive Summary for Rakesh */}
            <Box sx={{ mb: 4 }}>
               <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Platform is currently handling <strong>{stats?.totalShops} shops</strong> across India. 
                  {stats?.pendingCount > 0 ? (
                    <Typography component="span" sx={{ color: '#fbbf24' }}>
                      {` There are ${stats.pendingCount} payments waiting for your verification.`}
                    </Typography>
                  ) : " All payments are currently reconciled."}
               </Typography>
            </Box>

            {/* Chart Placeholder */}
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mt: 4 }}>
              <TrendingUpIcon sx={{ fontSize: 60, color: 'rgba(255,255,255,0.1)', mb: 2 }} />
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)' }}>
                Analytics visualization will populate as more shops complete the onboarding process.
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 4, bgcolor: '#1e293b', color: 'white', borderRadius: 5, border: '1px solid rgba(255,255,255,0.05)', height: '100%' }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>Administrative Tools</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 3 }}>
              Global Master Controls
            </Typography>
            
            <Stack spacing={2}>
              {[
                { label: 'Manage All Shops', icon: <StorefrontIcon />, path: '/admin/shops' },
                { label: 'Platform Users List', icon: <GroupIcon />, path: '/admin/users' },
                { label: 'Revenue Analytics', icon: <PaymentsIcon />, path: '/admin/revenue' },
                { label: 'System Settings', icon: <ArrowForwardIcon />, path: '/admin/settings' },
              ].map((item, index) => (
                <Button 
                  key={index}
                  fullWidth 
                  variant="outlined" 
                  onClick={() => item.path && navigate(item.path)}
                  sx={{ 
                    justifyContent: 'flex-start', 
                    py: 1.5, 
                    px: 2,
                    borderRadius: 3,
                    borderColor: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.8)',
                    '&:hover': { borderColor: '#ef4444', color: 'white', bgcolor: 'rgba(239, 68, 68, 0.05)' }
                  }}
                >
                  <Box sx={{ mr: 2, display: 'flex' }}>{item.icon}</Box>
                  <Typography variant="body2" fontWeight={600}>{item.label}</Typography>
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