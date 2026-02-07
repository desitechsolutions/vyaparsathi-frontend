import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, TextField, Button, CircularProgress, 
  Table, TableHead, TableRow, TableCell, TableBody, Stack, Avatar, 
  LinearProgress, Alert, TableContainer
} from '@mui/material';
import {
  ArrowBackIosNew, FileDownload, Category, 
  BarChart, PieChart, Inventory2
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { fetchCategorySales } from '../../services/api';

const downloadCSV = (data, from, to) => {
  const header = ['Category Name', 'Units Sold', 'Total Revenue (INR)'];
  const rows = data.map(row => [
    row.categoryName,
    row.totalSold,
    row.totalSales,
  ]);
  const csvContent = [
    [`Category Sales Report (${from} to ${to})`],
    [],
    header, 
    ...rows
  ].map(r => r.join(',')).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Category_Sales_${from}_to_${to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function CategorySales() {
  const navigate = useNavigate();
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
      setReport(response.data || []);
    } catch (e) {
      setError(e.message || "Failed to load category data.");
      setReport([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { handleFetch(); }, []);

  // Calculate total revenue for contribution bars
  const totalRevenue = report.reduce((sum, item) => sum + (item.totalSales || 0), 0);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Navigation */}
      <Button 
        startIcon={<ArrowBackIosNew sx={{ fontSize: '0.8rem !important' }} />} 
        onClick={() => navigate('/reports')}
        sx={{ mb: 3, color: 'text.secondary', fontWeight: 700, textTransform: 'none' }}
      >
        Back to Reports
      </Button>

      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#0f172a">Category Analytics</Typography>
          <Typography color="text.secondary">Sales distribution across different product departments</Typography>
        </Box>
        {report.length > 0 && (
          <Button 
            variant="outlined" startIcon={<FileDownload />} 
            onClick={() => downloadCSV(report, from, to)}
            sx={{ borderRadius: 2, bgcolor: 'white', fontWeight: 700 }}
          >
            Export
          </Button>
        )}
      </Stack>

      {/* Filters */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              label="From" type="date" value={from} fullWidth
              onChange={e => setFrom(e.target.value)} InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="To" type="date" value={to} fullWidth
              onChange={e => setTo(e.target.value)} InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button 
              variant="contained" fullWidth size="large" onClick={handleFetch} 
              disabled={loading} sx={{ height: 56, borderRadius: 2, fontWeight: 700 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Run Analysis'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 10 }}><CircularProgress /></Box>
      ) : report.length > 0 ? (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
          <Table sx={{ minWidth: 600 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Category Name</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>Units Sold</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Revenue & Contribution</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Total Sales</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.map((row, idx) => {
                const contribution = totalRevenue > 0 ? (row.totalSales / totalRevenue) * 100 : 0;
                return (
                  <TableRow key={idx} hover>
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: 'secondary.light', width: 36, height: 36 }}>
                          <Category sx={{ fontSize: 20, color: 'secondary.main' }} />
                        </Avatar>
                        <Typography variant="body2" fontWeight={700} color="#1e293b">
                          {row.categoryName}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={600}>{row.totalSold}</Typography>
                    </TableCell>
                    <TableCell sx={{ width: '30%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={contribution} 
                            sx={{ height: 8, borderRadius: 5, bgcolor: '#f1f5f9' }}
                          />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={700}>
                            {contribution.toFixed(1)}%
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={900} color="primary.main">
                        ₹{Number(row.totalSales).toLocaleString('en-IN')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <PieChart sx={{ fontSize: 80, color: '#e2e8f0', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No category data found.</Typography>
          <Typography variant="body2" color="text.disabled">Try adjusting your date range.</Typography>
        </Box>
      )}
    </Box>
  );
}