import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import {
  Box, Typography, Paper, Grid, TextField, Button, Divider, 
  CircularProgress, Stack, Card, CardContent, Avatar, IconButton, Alert
} from '@mui/material';
import {
  TrendingUp, AccountBalanceWallet, LocalActivity, 
  ChevronLeft, ChevronRight, ErrorOutline, Payments,
  ReceiptLong, Savings, ArrowBackIosNew
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { fetchDailyReport } from '../../services/api';

export default function DailyReport() {
  const navigate = useNavigate(); // Initialize navigation
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = async (targetDate = date) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchDailyReport(targetDate);
      setReport(response.data);
    } catch (e) {
      setError(e.message || "Failed to fetch report.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetch();
  }, []);

  const changeDate = (days) => {
    const newDate = dayjs(date).add(days, 'day').format('YYYY-MM-DD');
    setDate(newDate);
    handleFetch(newDate);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Navigation & Header */}
      <Button 
        startIcon={<ArrowBackIosNew sx={{ fontSize: '0.8rem !important' }} />} 
        onClick={() => navigate('/reports')}
        sx={{ 
          mb: 3, 
          color: 'text.secondary', 
          fontWeight: 700,
          textTransform: 'none',
          '&:hover': { bgcolor: 'transparent', color: 'primary.main' }
        }}
      >
        Back to Reports
      </Button>

      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} mb={4} spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#0f172a">Daily Performance</Typography>
          <Typography color="text.secondary">Financial snapshot for {dayjs(date).format('MMMM DD, YYYY')}</Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={() => changeDate(-1)} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <ChevronLeft fontSize="small" />
          </IconButton>
          <TextField
            type="date"
            size="small"
            value={date}
            onChange={e => { setDate(e.target.value); handleFetch(e.target.value); }}
            sx={{ 
              bgcolor: 'white', 
              '& .MuiOutlinedInput-root': { borderRadius: 3 }
            }}
          />
          <IconButton onClick={() => changeDate(1)} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <ChevronRight fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>

      {error && <Alert severity="error" variant="filled" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress thickness={5} /></Box>
      ) : report ? (
        <Box>
          {/* Top Level KPI Grid */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={4}>
              <KpiCard title="Gross Sales" value={report.totalSales} icon={<TrendingUp color="primary" />} subtitle={`${report.numberOfSales} Transactions`} />
            </Grid>
            <Grid item xs={12} md={4}>
              <KpiCard 
                title="Net Profit" 
                value={report.netProfit} 
                icon={<Savings color="success" />} 
                highlight={report.netProfit >= 0 ? 'success.main' : 'error.main'}
                subtitle={`Margin: ${report.totalSales > 0 ? ((report.netProfit / report.totalSales) * 100).toFixed(1) : 0}%`} 
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <KpiCard title="Outstanding" value={report.outstandingReceivable} icon={<ErrorOutline color="warning" />} subtitle="Pending from Credits" />
            </Grid>
          </Grid>

          <Grid container spacing={4}>
            {/* Sales & Revenue Column */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 5, height: '100%', border: '1px solid #e2e8f0' }} elevation={0}>
                <Typography variant="h6" fontWeight={800} mb={3} display="flex" alignItems="center" gap={1.5}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: '#eff6ff' }}><Payments sx={{ color: '#3b82f6', fontSize: 18 }} /></Avatar>
                  Revenue Breakdown
                </Typography>
                <Stack spacing={2.5}>
                  <DataRow label="Total Invoiced Amount" value={report.totalSales} bold />
                  <DataRow label="Total Payments Collected" value={report.totalPaid} />
                  <DataRow label="Net Revenue (After Returns)" value={report.netRevenue} color="primary.main" />
                  <Divider />
                  <DataRow label="Uncollected (Receivables)" value={report.outstandingReceivable} color="warning.dark" />
                </Stack>
              </Paper>
            </Grid>

            {/* Expenses & Costs Column */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 5, height: '100%', border: '1px solid #e2e8f0' }} elevation={0}>
                <Typography variant="h6" fontWeight={800} mb={3} display="flex" alignItems="center" gap={1.5}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: '#fef2f2' }}><ReceiptLong sx={{ color: '#ef4444', fontSize: 18 }} /></Avatar>
                  Cost Analysis
                </Typography>
                <Stack spacing={2.5}>
                  <DataRow label="Cost of Goods Sold (COGS)" value={report.totalCOGS} />
                  <DataRow label="Operating Expenses" value={report.totalExpenses} />
                  <Divider />
                  <Box sx={{ p: 2, bgcolor: report.netProfit >= 0 ? '#f0fdf4' : '#fef2f2', borderRadius: 3, border: '1px solid', borderColor: report.netProfit >= 0 ? '#dcfce7' : '#fee2e2' }}>
                    <DataRow 
                      label="Day End Result (Net Profit)" 
                      value={report.netProfit} 
                      bold 
                      color={report.netProfit >= 0 ? 'success.main' : 'error.main'} 
                    />
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <LocalActivity sx={{ fontSize: 60, color: '#e2e8f0', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No data found for this date.</Typography>
        </Box>
      )}
    </Box>
  );
}

// Reusable KPI Card (Internal to this file)
const KpiCard = ({ title, value, icon, subtitle, highlight = "text.primary" }) => (
  <Card elevation={0} sx={{ borderRadius: 5, border: '1px solid #e2e8f0' }}>
    <CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</Typography>
          <Typography variant="h4" fontWeight={900} sx={{ color: highlight, my: 0.5 }}>₹{Number(value || 0).toLocaleString('en-IN')}</Typography>
          <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
        </Box>
        <Avatar sx={{ bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #f1f5f9' }}>{icon}</Avatar>
      </Stack>
    </CardContent>
  </Card>
);

// Reusable Detail Row (Internal to this file)
const DataRow = ({ label, value, bold = false, color = "text.primary" }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Typography variant="body2" color="text.secondary" fontWeight={bold ? 700 : 400}>{label}</Typography>
    <Typography variant="body1" fontWeight={bold ? 900 : 700} sx={{ color }}>
      ₹{Number(value || 0).toLocaleString('en-IN')}
    </Typography>
  </Box>
);