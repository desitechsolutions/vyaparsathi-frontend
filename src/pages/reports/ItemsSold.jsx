import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, TextField, Button, CircularProgress, 
  Table, TableHead, TableRow, TableCell, TableBody, Stack, Avatar, 
  Chip, Alert, InputAdornment, TableContainer
} from '@mui/material';
import {
  ArrowBackIosNew, FileDownload, Inventory, Search, 
  TrendingUp, CalendarToday, Label, LocalShipping
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { fetchItemsSold } from '../../services/api';

const downloadCSV = (data, from, to) => {
  const header = ['Item Name', 'SKU', 'Quantity Sold', 'Revenue (INR)', 'Last Transaction'];
  const rows = data.map(row => [
    row.itemName,
    row.sku,
    row.totalSold,
    row.totalSales,
    dayjs(row.lastSoldDate).format('DD MMM YYYY'),
  ]);
  const csvContent = [
    [`Sales Performance Report (${from} to ${to})`],
    [],
    header, 
    ...rows
  ].map(r => r.join(',')).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Items_Sold_${from}_to_${to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function ItemsSold() {
  const navigate = useNavigate();
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [report, setReport] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchItemsSold(from, to);
      setReport(response.data || []);
    } catch (e) {
      setError(e.message || "Failed to load item data.");
      setReport([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { handleFetch(); }, []);

  // Filter logic for the search bar
  const filteredReport = report.filter(item => 
    item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="flex-start" mb={4} spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#0f172a">Product Performance</Typography>
          <Typography color="text.secondary">Analysis of items sold and stock movement</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {report.length > 0 && (
            <Button 
              variant="outlined" startIcon={<FileDownload />} 
              onClick={() => downloadCSV(report, from, to)}
              sx={{ borderRadius: 2, bgcolor: 'white', fontWeight: 700 }}
            >
              Export CSV
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Filters & Search */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              label="From" type="date" value={from} fullWidth
              onChange={e => setFrom(e.target.value)} InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="To" type="date" value={to} fullWidth
              onChange={e => setTo(e.target.value)} InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              placeholder="Search by name or SKU..."
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button 
              variant="contained" fullWidth size="large" onClick={handleFetch} 
              disabled={loading} sx={{ height: 56, borderRadius: 2, fontWeight: 700 }}
            >
              Fetch
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 10 }}><CircularProgress /></Box>
      ) : filteredReport.length > 0 ? (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Product Details</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>SKU</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>Qty Sold</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Revenue</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Last Sold</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReport.map((row, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                        <Inventory sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{row.itemName}</Typography>
                        <Typography variant="caption" color="text.secondary">ID: {row.itemId}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip label={row.sku || 'N/A'} size="small" variant="outlined" sx={{ borderRadius: 1 }} />
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontWeight={700}>{row.totalSold}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={800} color="primary.main">
                      ₹{Number(row.totalSales).toLocaleString('en-IN')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                      <CalendarToday sx={{ fontSize: 14, color: 'text.disabled' }} />
                      <Typography variant="body2" color="text.secondary">
                        {dayjs(row.lastSoldDate).format('DD MMM, YYYY')}
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <LocalShipping sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
          <Typography color="text.secondary">No items found for the selected criteria.</Typography>
        </Box>
      )}
    </Box>
  );
}