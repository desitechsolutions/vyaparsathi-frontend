import React from 'react';
import { Box, Paper, Typography, Grid, Skeleton } from '@mui/material';

import { inr } from '../../utils/customerFormat';

/**
 * Compact enterprise KPI cell — flat, dense, no chart-y colored icon
 * avatars. Just a small uppercase label + a bold numeric value + an
 * optional caption. Matches Zoho Books / Xero metric strips: the
 * numbers do the talking, not iconography.
 */
const KpiCell = ({ label, value, subtitle, divider }) => (
  <Box
    sx={{
      p: { xs: 1.75, sm: 2 },
      borderRight: divider ? '1px solid' : 'none',
      borderColor: 'divider',
      minWidth: 0,
      height: '100%',
    }}
  >
    <Typography
      variant="caption"
      color="text.secondary"
      fontWeight={700}
      sx={{ letterSpacing: 0.7, fontSize: '0.68rem', display: 'block', textTransform: 'uppercase' }}
    >
      {label}
    </Typography>
    <Typography
      variant="h6"
      fontWeight={800}
      color="text.primary"
      sx={{
        lineHeight: 1.2,
        letterSpacing: '-0.3px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        mt: 0.5,
        fontSize: { xs: '1.05rem', sm: '1.2rem' },
      }}
    >
      {value}
    </Typography>
    {subtitle && (
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', mt: 0.25, display: 'block' }}>
        {subtitle}
      </Typography>
    )}
  </Box>
);

export const CustomerKpiStrip = ({ kpis, loading }) => {
  if (loading || !kpis) {
    return (
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        <Grid container>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={6} sm={4} md={2} key={i}>
              <Box sx={{ p: 2, borderRight: i < 6 ? '1px solid' : 'none', borderColor: 'divider' }}>
                <Skeleton variant="text" width="60%" height={12} />
                <Skeleton variant="text" width="80%" height={24} sx={{ mt: 0.5 }} />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  }

  const activePct = Math.round(((kpis.activeCustomers || 0) / Math.max(kpis.totalCustomers || 1, 1)) * 100);

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      <Grid container>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCell
            label="Total customers"
            value={kpis.totalCustomers || 0}
            divider
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCell
            label="Active"
            value={kpis.activeCustomers || 0}
            subtitle={`${activePct}% active`}
            divider
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCell
            label="Inactive"
            value={kpis.inactiveCustomers || 0}
            divider
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCell
            label="B2B (GST)"
            value={kpis.businessCustomers || 0}
            subtitle={`${kpis.individualCustomers || 0} retail / B2C`}
            divider
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCell
            label="Outstanding"
            value={inr(kpis.totalOutstanding)}
            divider
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KpiCell
            label="New this month"
            value={kpis.newThisMonth || 0}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};
