import React, { useState } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Divider, CircularProgress
} from '@mui/material';
import dayjs from 'dayjs';
import { fetchSalesSummary } from '../../services/api';

export default function SalesSummary() {
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchSalesSummary(from, to);
      setReport(response.data);
    } catch (e) {
      setError(e.message);
      setReport(null);
    }
    setLoading(false);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
        Sales Summary Report
      </Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              label="From Date"
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="To Date"
              type="date"
              value={to}
              onChange={e => setTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button variant="contained" onClick={handleFetch} disabled={loading}>
              View Summary
            </Button>
          </Grid>
        </Grid>
      </Paper>
      {loading && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}
      {report && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Summary ({report.fromDate} to {report.toDate})
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography><b>Total Sales:</b> ₹{report.totalSales}</Typography>
              <Typography><b>Sales Transactions:</b> {report.totalSalesCount}</Typography>
              <Typography><b>Total Paid:</b> ₹{report.totalPaid}</Typography>
              <Typography><b>Net Revenue:</b> ₹{report.netRevenue}</Typography>
              <Typography><b>Outstanding Receivable:</b> ₹{report.outstandingReceivable}</Typography>
              <Typography><b>Total Taxable Value:</b> ₹{report.totalTaxableValue}</Typography>
              <Typography><b>Total GST Amount:</b> ₹{report.totalGstAmount}</Typography>
              <Typography><b>Total Round-Off:</b> ₹{report.totalRoundOff}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography><b>Total COGS:</b> ₹{report.totalCOGS}</Typography>
              <Typography><b>Net Profit:</b> ₹{report.netProfit}</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}