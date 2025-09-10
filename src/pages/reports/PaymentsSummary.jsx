import React, { useState } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Divider, CircularProgress
} from '@mui/material';
import dayjs from 'dayjs';
import { fetchPaymentsSummary } from '../../services/api';

const downloadCSV = (data) => {
  const header = ['Total Payments', 'Payment Count'];
  const row = [
    data.totalPayments,
    data.paymentCount,
  ];
  const csvContent = [header, row].map(r => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'payments-summary.csv';
  a.click();
  URL.revokeObjectURL(url);
};

export default function PaymentsSummary() {
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchPaymentsSummary(from, to);
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
        Payments Summary Report
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
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              onClick={() => report && downloadCSV(report)}
              disabled={!report}
            >
              Download CSV
            </Button>
          </Grid>
        </Grid>
      </Paper>
      {loading && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}
      {report && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Payments Summary ({from} to {to})
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography><b>Total Payments:</b> ₹{report.totalPayments}</Typography>
              <Typography><b>Payment Count:</b> {report.paymentCount}</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}