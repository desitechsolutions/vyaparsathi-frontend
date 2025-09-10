import React, { useState } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Divider, CircularProgress, Table, TableHead, TableRow, TableCell, TableBody
} from '@mui/material';
import dayjs from 'dayjs';
import { fetchCustomerSales } from '../../services/api';

const downloadCSV = (data) => {
  const header = ['Customer ID', 'Customer Name', 'Total Sales', 'Total Due'];
  const rows = data.map(row => [
    row.customerId,
    row.customerName,
    row.totalSales,
    row.totalDue,
  ]);
  const csvContent = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'customer-sales.csv';
  a.click();
  URL.revokeObjectURL(url);
};

export default function CustomerSales() {
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchCustomerSales(from, to);
      setReport(response.data);
    } catch (e) {
      setError(e.message);
      setReport([]);
    }
    setLoading(false);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
        Customer Sales Report
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
              View Report
            </Button>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              onClick={() => report.length > 0 && downloadCSV(report)}
              disabled={report.length === 0}
            >
              Download CSV
            </Button>
          </Grid>
        </Grid>
      </Paper>
      {loading && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}
      {report.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Customer Sales ({from} to {to})
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer ID</TableCell>
                <TableCell>Customer Name</TableCell>
                <TableCell>Total Sales (₹)</TableCell>
                <TableCell>Total Due (₹)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>{row.customerId}</TableCell>
                  <TableCell>{row.customerName}</TableCell>
                  <TableCell>{row.totalSales}</TableCell>
                  <TableCell>{row.totalDue}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}