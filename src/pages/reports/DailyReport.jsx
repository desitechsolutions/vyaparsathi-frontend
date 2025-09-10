import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Divider, CircularProgress
} from '@mui/material';
import dayjs from 'dayjs';
import { fetchDailyReport } from '../../services/api';

export default function DailyReport() {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = async () => {
  setLoading(true);
  setError('');
  try {
    const response = await fetchDailyReport(date);
    setReport(response.data); // <-- Fix here
    console.log(response.data);
  } catch (e) {
    setError(e.message);
    setReport(null);
  }
  setLoading(false);
 };
  useEffect(() => {
    handleFetch();
    // eslint-disable-next-line
  }, []);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
        Daily Financial Report
      </Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              label="Report Date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button variant="contained" onClick={handleFetch} disabled={loading}>
              View Report
            </Button>
          </Grid>
        </Grid>
      </Paper>
      {loading && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}
      {report && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Summary for {report.date}</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography><b>Total Sales:</b> ₹{report.totalSales}</Typography>
              <Typography><b>Number of Sales:</b> {report.numberOfSales}</Typography>
              <Typography><b>Total Paid:</b> ₹{report.totalPaid}</Typography>
              <Typography><b>Net Revenue:</b> ₹{report.netRevenue}</Typography>
              <Typography><b>Outstanding Receivable:</b> ₹{report.outstandingReceivable}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography><b>Total Expenses:</b> ₹{report.totalExpenses}</Typography>
              <Typography><b>Total COGS:</b> ₹{report.totalCOGS}</Typography>
              <Typography><b>Net Profit:</b> ₹{report.netProfit}</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}