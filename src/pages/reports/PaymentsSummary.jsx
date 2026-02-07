import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, TextField, Button, Divider, 
  CircularProgress, Stack, Card, CardContent, Avatar, Alert
} from '@mui/material';
import {
  ArrowBackIosNew, FileDownload, AccountBalanceWallet, 
  PointOfSale, Receipt, Speed, DoneAll
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { fetchPaymentsSummary } from '../../services/api';

const downloadCSV = (data, from, to) => {
  const header = ['Total Collected', 'Transaction Count', 'Average Collection'];
  const avg = data.paymentCount > 0 ? (data.totalPayments / data.paymentCount).toFixed(2) : 0;
  const row = [data.totalPayments, data.paymentCount, avg];
  
  const csvContent = [
    [`Payments Collection Report (${from} to ${to})`],
    [],
    header, 
    row
  ].map(r => r.join(',')).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Payments_Summary_${from}_to_${to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function PaymentsSummary() {
  const navigate = useNavigate();
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
      setError(e.message || "Failed to load payment data.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { handleFetch(); }, []);

  const averageCollection = report?.paymentCount > 0 
    ? (report.totalPayments / report.paymentCount) 
    : 0;

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
          <Typography variant="h4" fontWeight={900} color="#0f172a">Payment Collection</Typography>
          <Typography color="text.secondary">Summary of actual cash/digital inflows</Typography>
        </Box>
        {report && (
          <Button 
            variant="outlined" startIcon={<FileDownload />} 
            onClick={() => downloadCSV(report, from, to)}
            sx={{ borderRadius: 2, bgcolor: 'white', fontWeight: 700 }}
          >
            Export CSV
          </Button>
        )}
      </Stack>

      {/* Filters */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              label="Collection From" type="date" value={from} fullWidth
              onChange={e => setFrom(e.target.value)} InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Collection To" type="date" value={to} fullWidth
              onChange={e => setTo(e.target.value)} InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button 
              variant="contained" fullWidth size="large" onClick={handleFetch} 
              disabled={loading} sx={{ height: 56, borderRadius: 2, fontWeight: 700 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'View Collection'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 10 }}><CircularProgress /></Box>
      ) : report ? (
        <Box>
          <Grid container spacing={3}>
            {/* Total Collected */}
            <Grid item xs={12} md={4}>
              <MetricCard 
                title="Total Collected" 
                value={`₹${Number(report.totalPayments).toLocaleString('en-IN')}`}
                icon={<DoneAll sx={{ color: '#10b981' }} />}
                subtitle="Net amount received"
                bgColor="#ecfdf5"
              />
            </Grid>

            {/* Transaction Count */}
            <Grid item xs={12} md={4}>
              <MetricCard 
                title="Payment Count" 
                value={report.paymentCount}
                icon={<Receipt sx={{ color: '#3b82f6' }} />}
                subtitle="Number of transactions"
                bgColor="#eff6ff"
              />
            </Grid>

            {/* Avg Collection */}
            <Grid item xs={12} md={4}>
              <MetricCard 
                title="Avg per Payment" 
                value={`₹${Number(averageCollection.toFixed(2)).toLocaleString('en-IN')}`}
                icon={<Speed sx={{ color: '#8b5cf6' }} />}
                subtitle="Collection efficiency"
                bgColor="#f5f3ff"
              />
            </Grid>
          </Grid>

          <Paper sx={{ mt: 4, p: 4, borderRadius: 4, border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing payment records for the period of 
              <strong> {dayjs(from).format('LL')}</strong> to <strong>{dayjs(to).format('LL')}</strong>.
            </Typography>
          </Paper>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <PointOfSale sx={{ fontSize: 60, color: '#e2e8f0', mb: 2 }} />
          <Typography color="text.secondary">Fetch data to see your collection summary.</Typography>
        </Box>
      )}
    </Box>
  );
}

// Reusable Metric Card for this report
const MetricCard = ({ title, value, icon, subtitle, bgColor }) => (
  <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
    <CardContent>
      <Stack spacing={2}>
        <Avatar sx={{ bgcolor: bgColor, borderRadius: 2 }}>{icon}</Avatar>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase' }}>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={900} color="#1e293b">
            {value}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            {subtitle}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);