import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Grid, TextField, Button, Divider, 
  CircularProgress, Stack, Card, CardContent, Avatar, Alert, LinearProgress
} from '@mui/material';
import {
  ArrowBackIosNew, FileDownload, Payments, 
  AccountBalance, Inventory, ReceiptLong, TrendingDown
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { fetchExpensesSummary } from '../../services/api';

const downloadCSV = (data, from, to) => {
  const header = ['Type', 'Amount (INR)'];
  const rows = [
    ['Total Expenses', data.totalExpenses],
    ['Operational Expenses', data.operationalExpenses],
    ['Inventory Purchases', data.inventoryPurchases],
  ];
  const csvContent = [
    [`Expense Report (${from} to ${to})`],
    [],
    header, 
    ...rows
  ].map(r => r.join(',')).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Expense_Summary_${from}_to_${to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function ExpensesSummary() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchExpensesSummary(from, to);
      setReport(response.data);
    } catch (e) {
      setError(e.message || "Failed to load expenses.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { handleFetch(); }, []);

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
          <Typography variant="h4" fontWeight={900} color="#0f172a">{t('expensesSummaryReport.title')}</Typography>
          <Typography color="text.secondary">{t('expensesSummaryReport.subtitle')}</Typography>
        </Box>
        {report && (
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
              label={t('reportsCommon.from')} type="date" value={from} fullWidth
              onChange={e => setFrom(e.target.value)} InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label={t('reportsCommon.to')} type="date" value={to} fullWidth
              onChange={e => setTo(e.target.value)} InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button 
              variant="contained" fullWidth size="large" onClick={handleFetch} 
              disabled={loading} sx={{ height: 56, borderRadius: 2, fontWeight: 700 }}
            >
              Generate Report
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 10 }}><CircularProgress /></Box>
      ) : report ? (
        <Box>
          {/* Main Hero KPI */}
          <Card elevation={0} sx={{ mb: 4, borderRadius: 4, border: '2px solid #fee2e2', bgcolor: '#fff5f5' }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" spacing={3} alignItems="center">
                <Avatar sx={{ width: 64, height: 64, bgcolor: '#ef4444' }}>
                  <TrendingDown fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="overline" fontWeight={800} color="error.main">Total Outflow</Typography>
                  <Typography variant="h3" fontWeight={900} color="#1e293b">
                    ₹{Number(report.totalExpenses).toLocaleString('en-IN')}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Grid container spacing={4}>
            {/* Detailed Breakdown */}
            <Grid item xs={12} md={7}>
              <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', height: '100%' }}>
                <Typography variant="h6" fontWeight={800} mb={4}>Distribution</Typography>
                
                <ExpenseRow 
                  label="Operational Expenses" 
                  value={report.operationalExpenses} 
                  total={report.totalExpenses}
                  icon={<ReceiptLong color="primary" />} 
                  color="#3b82f6"
                />
                
                <Box sx={{ my: 4 }} />

                <ExpenseRow 
                  label="Inventory Purchases" 
                  value={report.inventoryPurchases} 
                  total={report.totalExpenses}
                  icon={<Inventory color="warning" />} 
                  color="#f59e0b"
                />
              </Paper>
            </Grid>

            {/* Quick Tips/Summary */}
            <Grid item xs={12} md={5}>
              <Paper elevation={0} sx={{ p: 4, borderRadius: 4, bgcolor: '#f8fafc', border: '1px dashed #cbd5e1', height: '100%' }}>
                <Typography variant="subtitle1" fontWeight={800} mb={2}>Summary Insight</Typography>
                <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
                  Between <strong>{dayjs(from).format('DD MMM')}</strong> and <strong>{dayjs(to).format('DD MMM')}</strong>, your 
                  highest expenditure was on <strong>{report.inventoryPurchases > report.operationalExpenses ? 'Inventory' : 'Operations'}</strong>.
                </Typography>
                <Divider sx={{ my: 3 }} />
                <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  Note: Values are calculated based on recorded payment vouchers.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <AccountBalance sx={{ fontSize: 60, color: '#e2e8f0', mb: 2 }} />
          <Typography color="text.secondary">Select a date range to view expenses.</Typography>
        </Box>
      )}
    </Box>
  );
}

// Sub-component for a clean visual row
const ExpenseRow = ({ label, value, total, icon, color }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 32, height: 32, bgcolor: `${color}15`, color }}>{icon}</Avatar>
          <Typography variant="body1" fontWeight={700}>{label}</Typography>
        </Stack>
        <Typography variant="body1" fontWeight={900}>₹{Number(value).toLocaleString('en-IN')}</Typography>
      </Stack>
      <LinearProgress 
        variant="determinate" 
        value={percentage} 
        sx={{ 
          height: 10, 
          borderRadius: 5, 
          bgcolor: '#f1f5f9',
          '& .MuiLinearProgress-bar': { bgcolor: color }
        }} 
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, textAlign: 'right' }}>
        {percentage.toFixed(1)}% of total
      </Typography>
    </Box>
  );
};