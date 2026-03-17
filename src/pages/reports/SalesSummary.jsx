import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Grid, TextField, Button, Divider, 
  CircularProgress, Stack, Card, CardContent, Avatar, Alert
} from '@mui/material';
import {
  ArrowBackIosNew, ShowChart, ShoppingBag, AccountBalance, 
  PriceCheck, PieChart, LocalAtm, TrendingDown
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { fetchSalesSummary } from '../../services/api';

export default function SalesSummary() {
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
      const response = await fetchSalesSummary(from, to);
      setReport(response.data);
    } catch (e) {
      setError(e.message || "Failed to fetch summary.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetch();
  }, []);

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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900} color="#0f172a">{t('salesSummaryReport.title')}</Typography>
        <Typography color="text.secondary">{t('salesSummaryReport.subtitle')}</Typography>
      </Box>

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
          <Grid item xs={12} md={2}>
            <Button 
              variant="contained" fullWidth size="large" onClick={handleFetch} 
              disabled={loading} sx={{ height: 56, borderRadius: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" variant="filled" sx={{ mb: 4, borderRadius: 2 }}>{error}</Alert>}

      {report ? (
        <Box>
          {/* Top KPI row */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard title={t('salesSummaryReport.totalSales')} value={report.totalSales} icon={<ShowChart color="primary" />} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard title="Net Profit" value={report.netProfit} icon={<PieChart color="success" />} highlight={report.netProfit >= 0 ? 'success.main' : 'error.main'} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard title="Volume" value={report.totalSalesCount} icon={<ShoppingBag color="secondary" />} isCurrency={false} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard title="Receivables" value={report.outstandingReceivable} icon={<TrendingDown color="warning" />} />
            </Grid>
          </Grid>

          <Grid container spacing={4}>
            {/* Financial Detail */}
            <Grid item xs={12} md={7}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0' }}>
                <Typography variant="h6" fontWeight={800} mb={3}>Revenue & Collection Detail</Typography>
                <Stack spacing={2.5}>
                  <DataRow label="Gross Invoiced Sales" value={report.totalSales} bold />
                  <DataRow label="Total Paid Amount" value={report.totalPaid} />
                  <DataRow label="Net Revenue (Excl. Returns)" value={report.netRevenue} />
                  <Divider />
                  <DataRow label="Taxable Value" value={report.totalTaxableValue} />
                  <DataRow label="Total GST" value={report.totalGstAmount} color="secondary.main" />
                  <DataRow label="Round Off Differences" value={report.totalRoundOff} />
                </Stack>
              </Paper>
            </Grid>

            {/* Profitability Detail */}
            <Grid item xs={12} md={5}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                <Typography variant="h6" fontWeight={800} mb={3}>Profitability Summary</Typography>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase' }}>Cost of Goods Sold (COGS)</Typography>
                    <Typography variant="h5" fontWeight={900} color="#1e293b">₹{Number(report.totalCOGS).toLocaleString()}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ p: 2, bgcolor: report.netProfit >= 0 ? '#f0fdf4' : '#fef2f2', borderRadius: 3, border: '1px solid', borderColor: report.netProfit >= 0 ? '#dcfce7' : '#fee2e2' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase' }}>Net Margin Result</Typography>
                    <Typography variant="h4" fontWeight={900} color={report.netProfit >= 0 ? 'success.main' : 'error.main'}>
                      ₹{Number(report.netProfit).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Period: {dayjs(from).format('DD MMM')} — {dayjs(to).format('DD MMM')}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      ) : (
        !loading && (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: '#f1f5f9', mx: 'auto', mb: 2 }}>
              <LocalAtm sx={{ fontSize: 40, color: '#cbd5e1' }} />
            </Avatar>
            <Typography variant="h6" color="text.secondary">No reports for this period.</Typography>
          </Box>
        )
      )}
    </Box>
  );
}

// Reusable KPI Card
const KpiCard = ({ title, value, icon, highlight = "text.primary", isCurrency = true }) => (
  <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
    <CardContent>
      <Stack direction="row" justifyContent="space-between">
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase' }}>{title}</Typography>
          <Typography variant="h5" fontWeight={900} sx={{ color: highlight, mt: 0.5 }}>
            {isCurrency ? `₹${Number(value || 0).toLocaleString()}` : value}
          </Typography>
        </Box>
        <Avatar variant="rounded" sx={{ bgcolor: '#f8fafc', border: '1px solid #f1f5f9' }}>{icon}</Avatar>
      </Stack>
    </CardContent>
  </Card>
);

const DataRow = ({ label, value, bold = false, color = "text.primary" }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
    <Typography variant="body2" color="text.secondary" fontWeight={bold ? 800 : 400}>{label}</Typography>
    <Typography variant="body1" fontWeight={bold ? 900 : 700} sx={{ color }}>
      ₹{Number(value || 0).toLocaleString()}
    </Typography>
  </Box>
);