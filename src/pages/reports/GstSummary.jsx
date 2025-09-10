import React, { useState } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Divider, CircularProgress
} from '@mui/material';
import dayjs from 'dayjs';
import { fetchGstSummary } from '../../services/api';

const downloadCSV = (data) => {
  const rows = [
    ['Taxable Value', 'CGST Total', 'SGST Total', 'IGST Total', 'Total GST'],
    [
      data.taxableValue,
      data.cgstTotal,
      data.sgstTotal,
      data.igstTotal,
      data.totalGst,
    ],
  ];
  const csvContent = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gst-summary.csv';
  a.click();
  URL.revokeObjectURL(url);
};

export default function GstSummary() {
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchGstSummary(from, to);
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
        GST Summary Report
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
            GST Summary ({from} to {to})
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography><b>Taxable Value:</b> ₹{report.taxableValue}</Typography>
              <Typography><b>CGST Total:</b> ₹{report.cgstTotal}</Typography>
              <Typography><b>SGST Total:</b> ₹{report.sgstTotal}</Typography>
              <Typography><b>IGST Total:</b> ₹{report.igstTotal}</Typography>
              <Typography><b>Total GST:</b> ₹{report.totalGst}</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}