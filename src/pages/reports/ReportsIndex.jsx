import React from 'react';
import {
  Box, Typography, Paper, Grid, Button, Divider
} from '@mui/material';
import { Link } from 'react-router-dom';

const reports = [
  { label: 'Daily Report', path: '/reports/daily' },
  { label: 'Sales Summary', path: '/reports/sales-summary' },
  { label: 'GST Summary', path: '/reports/gst-summary' },
  { label: 'GST Breakdown', path: '/reports/gst-breakdown' },
  { label: 'Items Sold', path: '/reports/items-sold' },
  { label: 'Category Sales', path: '/reports/category-sales' },
  { label: 'Customer Sales', path: '/reports/customer-sales' },
  { label: 'Expenses Summary', path: '/reports/expenses-summary' },
  { label: 'Payments Summary', path: '/reports/payments-summary' },
  { label: 'Analytics Dashboard', path: '/reports/analytics' },
];

export default function ReportsIndex() {
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
        Reports Dashboard
      </Typography>
      <Divider sx={{ mb: 3 }} />
      <Grid container spacing={3}>
        {reports.map((report) => (
          <Grid item xs={12} sm={6} md={4} key={report.path}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>{report.label}</Typography>
              <Button
                component={Link}
                to={report.path}
                variant="contained"
                fullWidth
                >
                View
            </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}