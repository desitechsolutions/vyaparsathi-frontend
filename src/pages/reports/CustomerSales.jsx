import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Grid, TextField, Button, CircularProgress, 
  Table, TableHead, TableRow, TableCell, TableBody, Stack, Avatar, 
  Alert, InputAdornment, TableContainer, Tooltip, IconButton
} from '@mui/material';
import {
  ArrowBackIosNew, FileDownload, Person, Search, 
  Stars, AccountBalanceWallet, WhatsApp, Phone
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { fetchCustomerSales } from '../../services/api';

const downloadCSV = (data, from, to) => {
  const header = ['Customer Name', 'Total Sales (INR)', 'Total Due (INR)'];
  const rows = data.map(row => [
    row.customerName,
    row.totalSales,
    row.totalDue,
  ]);
  const csvContent = [
    [`Customer Sales Performance (${from} to ${to})`],
    [],
    header, 
    ...rows
  ].map(r => r.join(',')).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Customer_Sales_${from}_to_${to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function CustomerSales() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [searchTerm, setSearchTerm] = useState('');
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchCustomerSales(from, to);
      setReport(response.data || []);
    } catch (e) {
      setError(e.message || "Failed to load customer data.");
      setReport([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { handleFetch(); }, []);

  // Filter report based on search term
  const filteredReport = report.filter(row => 
    row.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.customerId?.toString().includes(searchTerm)
  );

  // Identify top spender for the "VIP" badge
  const maxSales = Math.max(...report.map(o => o.totalSales), 0);

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
          <Typography variant="h4" fontWeight={900} color="#0f172a">{t('customerSalesReport.title')}</Typography>
          <Typography color="text.secondary">{t('customerSalesReport.subtitle')}</Typography>
        </Box>
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

      {/* Filter Bar */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              label={t('reportsCommon.from')} type="date" value={from} fullWidth
              onChange={e => setFrom(e.target.value)} InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label={t('reportsCommon.to')} type="date" value={to} fullWidth
              onChange={e => setTo(e.target.value)} InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              placeholder="Search customer name..."
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
              Update
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 10 }}><CircularProgress /></Box>
      ) : filteredReport.length > 0 ? (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
          <Table sx={{ minWidth: 700 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>{	('customerSalesReport.columns.customer')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>{	('customerSalesReport.columns.totalAmount')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>{	('reportsCommon.amount')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>{	('reportsCommon.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReport.map((row, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: row.totalSales === maxSales ? '#fff7ed' : '#f1f5f9', color: row.totalSales === maxSales ? '#f59e0b' : '#64748b' }}>
                        {row.totalSales === maxSales ? <Stars /> : <Person />}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {row.customerName}
                          {row.totalSales === maxSales && (
                            <Typography component="span" variant="caption" sx={{ ml: 1, color: '#f59e0b', fontWeight: 900 }}>TOP BUYER</Typography>
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">ID: {row.customerId}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={800} color="primary.main">
                      ₹{Number(row.totalSales).toLocaleString('en-IN')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={800} sx={{ color: row.totalDue > 0 ? 'error.main' : 'success.main' }}>
                      ₹{Number(row.totalDue).toLocaleString('en-IN')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Call Customer">
                        <IconButton size="small" sx={{ color: '#3b82f6' }}><Phone fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Send Reminder">
                        <IconButton size="small" sx={{ color: '#10b981' }}><WhatsApp fontSize="small" /></IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <AccountBalanceWallet sx={{ fontSize: 60, color: '#e2e8f0', mb: 2 }} />
          <Typography color="text.secondary">No customer data found for this period.</Typography>
        </Box>
      )}
    </Box>
  );
}