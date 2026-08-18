import React from 'react';
import { Box, Paper, Typography, Grid, Skeleton, useTheme, alpha } from '@mui/material';
import {
  People as PeopleIcon,
  CheckCircleOutline as ActiveIcon,
  CancelOutlined as InactiveIcon,
  Business as BusinessIcon,
  AccountBalanceWallet as WalletIcon,
  PersonAdd as NewCustIcon,
} from '@mui/icons-material';

const inr = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const KpiCell = ({ icon, label, value, color, divider, subtitle }) => (
  <Box
    sx={{
      p: { xs: 1.5, sm: 2 },
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      borderRight: divider ? '1px solid' : 'none',
      borderColor: 'divider',
      minWidth: 0,
      height: '100%',
    }}
  >
    <Box
      sx={{
        display: 'inline-flex',
        p: 1.25,
        borderRadius: 2,
        bgcolor: alpha(color, 0.1),
        color: color,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={700}
        sx={{ letterSpacing: 0.6, fontSize: '0.68rem', display: 'block', textTransform: 'uppercase' }}
      >
        {label}
      </Typography>
      <Typography
        variant="h6"
        fontWeight={800}
        color="text.primary"
        sx={{ lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: { xs: '1rem', sm: '1.25rem' } }}
      >
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  </Box>
);

export const CustomerKpiStrip = ({ kpis, loading }) => {
  const theme = useTheme();

  if (loading || !kpis) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={6} sm={4} md={2} key={i}>
              <Skeleton variant="rounded" height={60} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      <Grid container>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCell
            icon={<PeopleIcon fontSize="small" />}
            label="Total Customers"
            value={kpis.totalCustomers || 0}
            color={theme.palette.primary.main}
            divider
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCell
            icon={<ActiveIcon fontSize="small" />}
            label="Active"
            value={kpis.activeCustomers || 0}
            color={theme.palette.success.main}
            subtitle={`${Math.round(((kpis.activeCustomers || 0) / Math.max(kpis.totalCustomers || 1, 1)) * 100)}% active`}
            divider
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCell
            icon={<InactiveIcon fontSize="small" />}
            label="Inactive"
            value={kpis.inactiveCustomers || 0}
            color={theme.palette.text.disabled}
            divider
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCell
            icon={<BusinessIcon fontSize="small" />}
            label="B2B (GST)"
            value={kpis.businessCustomers || 0}
            color={theme.palette.info.main}
            subtitle={`${kpis.individualCustomers || 0} Retail/B2C`}
            divider
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCell
            icon={<WalletIcon fontSize="small" />}
            label="Outstanding"
            value={inr(kpis.totalOutstanding)}
            color={theme.palette.warning.main}
            divider
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCell
            icon={<NewCustIcon fontSize="small" />}
            label="New This Month"
            value={kpis.newThisMonth || 0}
            color="#8b5cf6"
          />
        </Grid>
      </Grid>
    </Paper>
  );
};
