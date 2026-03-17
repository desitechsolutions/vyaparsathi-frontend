import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Grid, TextField, Button, Divider, 
  CircularProgress, Stack, Card, CardContent, Avatar, Alert, Tooltip
} from '@mui/material';
import {
  ArrowBackIosNew, AccountBalance, FileDownload, 
  AccountBalanceWallet, Gavel, FactCheck, Receipt
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { fetchGstSummary } from '../../services/api';

const downloadCSV = (data, from, to) => {
  const rows = [
    ['GST Summary Report'],
    [`Period: ${from} to ${to}`],
    [],
    ['Component', 'Amount (INR)'],
    ['Taxable Value', data.taxableValue],
    ['CGST Total', data.cgstTotal],
    ['SGST Total', data.sgstTotal],
    ['IGST Total', data.igstTotal],
    ['Total GST Liability', data.totalGst],
  ];
  const csvContent = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `GST_Summary_${from}_to_${to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function GstSummary() {
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
      const response = await fetchGstSummary(from, to);
      setReport(response.data);
    } catch (e) {
      setError(e.message || "Failed to fetch GST data.");
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
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#0f172a">{t('gstSummaryReport.title')}</Typography>
          <Typography color="text.secondary">{t('gstSummaryReport.subtitle')}</Typography>
        </Box>
        {report && (
          <Button 
            variant="outlined" 
            startIcon={<FileDownload />} 
            onClick={() => downloadCSV(report, from, to)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, bgcolor: 'white' }}
          >
            {t('reportsCommon.export')}
          </Button>
        )}
      </Stack>

      {/* Filter Bar */}
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
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Calculate Tax'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" variant="filled" sx={{ mb: 4, borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress thickness={5} /></Box>
      ) : report ? (
        <Box>
          {/* High Level Metrics */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={6}>
              <KpiCard 
                title="Total Taxable Turnover" 
                value={report.taxableValue} 
                icon={<FactCheck color="primary" />} 
                subtitle="Value excluding GST"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <KpiCard 
                title="Total GST Liability" 
                value={report.totalGst} 
                icon={<Gavel color="error" />} 
                highlight="error.main"
                subtitle="CGST + SGST + IGST"
              />
            </Grid>
          </Grid>

          {/* Tax Component Breakdown */}
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
            <Typography variant="h6" fontWeight={800} mb={4}>Tax Component Breakdown</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TaxBox label="CGST" value={report.cgstTotal} description="Central Goods & Service Tax" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TaxBox label="SGST" value={report.sgstTotal} description="State Goods & Service Tax" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TaxBox label="IGST" value={report.igstTotal} description="Integrated Goods & Service Tax" />
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 4 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
               <Box sx={{ textAlign: 'right' }}>
                 <Typography variant="body2" color="text.secondary" fontWeight={600}>Total GST Payable</Typography>
                 <Typography variant="h3" fontWeight={900} color="primary.main">
                   ₹{Number(report.totalGst).toLocaleString('en-IN')}
                 </Typography>
               </Box>
            </Box>
          </Paper>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <AccountBalanceWallet sx={{ fontSize: 60, color: '#e2e8f0', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">Ready to calculate tax totals.</Typography>
        </Box>
      )}
    </Box>
  );
}

// Internal Components for GstSummary
const KpiCard = ({ title, value, icon, subtitle, highlight = "text.primary" }) => (
  <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <Avatar variant="rounded" sx={{ width: 56, height: 56, bgcolor: '#f1f5f9', color: 'inherit' }}>{icon}</Avatar>
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase' }}>{title}</Typography>
        <Typography variant="h4" fontWeight={900} sx={{ color: highlight }}>₹{Number(value || 0).toLocaleString('en-IN')}</Typography>
        <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
      </Box>
    </CardContent>
  </Card>
);

const TaxBox = ({ label, value, description }) => (
  <Box sx={{ p: 2, borderRadius: 3, border: '1px solid #f1f5f9', bgcolor: '#fcfdfe' }}>
    <Typography variant="subtitle2" fontWeight={800} color="primary.main">{label}</Typography>
    <Typography variant="h5" fontWeight={900} sx={{ my: 0.5 }}>₹{Number(value || 0).toLocaleString('en-IN')}</Typography>
    <Typography variant="caption" color="text.disabled">{description}</Typography>
  </Box>
);