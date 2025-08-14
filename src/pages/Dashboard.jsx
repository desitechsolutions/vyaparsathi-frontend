import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import API from '../services/api';
import endpoints from '../services/endpoints';

const Dashboard = () => {
  const [stats, setStats] = useState({ sales: 0, customers: 0, items: 0 });

  useEffect(() => {
    API.get(endpoints.reports.daily(new Date().toISOString().split('T')[0]))
      .then(res => {
        setStats({
          sales: res.data.totalSales || 0,
          customers: res.data.numberOfSales || 0,
          items: res.data.totalItems || 0,
        });
      })
      .catch(err => console.error('Dashboard fetch error:', err));
  }, []);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={4}>
        <Paper style={{ padding: '16px' }}>
          <Typography variant="h6">Today's Sales</Typography>
          <Typography variant="h4">₹{stats.sales}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Paper style={{ padding: '16px' }}>
          <Typography variant="h6">Customers</Typography>
          <Typography variant="h4">{stats.customers}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Paper style={{ padding: '16px' }}>
          <Typography variant="h6">Items Sold</Typography>
          <Typography variant="h4">{stats.items}</Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Dashboard;