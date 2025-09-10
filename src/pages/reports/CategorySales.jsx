import React, { useState } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Divider, CircularProgress, Table, TableHead, TableRow, TableCell, TableBody
} from '@mui/material';
import dayjs from 'dayjs';
import { fetchCategorySales } from '../../services/api';

const downloadCSV = (data) => {
  const header = ['Category Name', 'Total Sold', 'Total Sales'];
  const rows = data.map(row => [
    row.categoryName,
    row.totalSold,
    row.totalSales,
  ]);
  const csvContent = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'category-sales.csv';
  a.click();
  URL.revokeObjectURL(url);
};

export default function CategorySales() {
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchCategorySales(from, to);
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
        Category Sales Report
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
            Category Sales ({from} to {to})
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Category Name</TableCell>
                <TableCell>Total Sold</TableCell>
                <TableCell>Total Sales (₹)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>{row.categoryName}</TableCell>
                  <TableCell>{row.totalSold}</TableCell>
                  <TableCell>{row.totalSales}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}