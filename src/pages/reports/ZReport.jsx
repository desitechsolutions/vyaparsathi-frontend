import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Paper, Grid, TextField, Button, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody, Stack, Alert, TableContainer,
  Card, CardContent, Chip, Divider,
} from '@mui/material';
import {
  ArrowBackIosNew, Print, Refresh, AccountBalanceWallet, PointOfSale,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { fetchZReport } from '../../services/api';

const inr = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ZReport() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Drawer reconciliation is client-side only for now (no persisted drawer session).
  const [openingBalance, setOpeningBalance] = useState('');
  const [countedCash, setCountedCash] = useState('');

  const handleFetch = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchZReport(date);
      setReport(response.data);
    } catch (e) {
      setError(e.message || 'Failed to load Z-report.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { handleFetch(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const expectedCashInDrawer = useMemo(() => {
    if (!report) return 0;
    const opening = Number(openingBalance) || 0;
    const cash = Number(report.cashSalesTotal) || 0;
    return opening + cash;
  }, [openingBalance, report]);

  const variance = useMemo(() => {
    if (countedCash === '') return null;
    return Number(countedCash) - expectedCashInDrawer;
  }, [countedCash, expectedCashInDrawer]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Button
        startIcon={<ArrowBackIosNew sx={{ fontSize: '0.8rem !important' }} />}
        onClick={() => navigate('/reports')}
        sx={{ mb: 3, color: 'text.secondary', fontWeight: 700, textTransform: 'none' }}
      >
        Back to Reports
      </Button>

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="text.primary">
            {t('zReport.title', 'End-of-Day (Z-Report)')}
          </Typography>
          <Typography color="text.secondary">
            {t('zReport.subtitle', "Shift close-out — reconcile the drawer against the day's sales.")}
          </Typography>
        </Box>
        {report && (
          <Button variant="outlined" startIcon={<Print />} onClick={() => window.print()}
            sx={{ borderRadius: 2, bgcolor: 'background.paper', fontWeight: 700 }}
          >
            Print
          </Button>
        )}
      </Stack>

      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField label={t('zReport.dateLabel', 'Date')} type="date" value={date} fullWidth
              onChange={e => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Button variant="contained" fullWidth size="large" onClick={handleFetch}
              disabled={loading} startIcon={<Refresh />}
              sx={{ height: 56, borderRadius: 2, fontWeight: 700 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Load Report'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 10 }}><CircularProgress /></Box>
      ) : report ? (
        <>
          {/* Sales summary tiles */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>SALES COUNT</Typography>
                  <Typography variant="h4" fontWeight={900}>{report.salesCount}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {report.cancelledCount} cancelled · {report.returnedCount} returned
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>GROSS SALES</Typography>
                  <Typography variant="h4" fontWeight={900} color="primary.main">{inr(report.grossSales)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Discount {inr(report.totalDiscount)} · GST {inr(report.totalGst)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>NET SALES</Typography>
                  <Typography variant="h4" fontWeight={900} color="success.dark">{inr(report.netSales)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    After returns
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>CASH RECEIVED</Typography>
                  <Typography variant="h4" fontWeight={900} sx={{ color: '#eab308' }}>{inr(report.cashSalesTotal)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Digital: {inr(report.digitalSalesTotal)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Payment method breakdown */}
          <Paper elevation={0} sx={{ mb: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <PointOfSale color="primary" />
                <Typography variant="h6" fontWeight={800}>Payment Method Breakdown</Typography>
              </Stack>
            </Box>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Method</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>Txn Count</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(report.paymentBreakdown || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.disabled' }}>
                        No payments recorded on this date.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (report.paymentBreakdown || []).map((row) => (
                      <TableRow key={row.method} hover>
                        <TableCell>
                          <Chip label={row.method} size="small" color={row.method === 'CASH' ? 'warning' : 'default'} sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell align="right">{row.txnCount}</TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={800} color="primary.main">{inr(row.amount)}</Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Drawer reconciliation (client-side) */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <AccountBalanceWallet color="primary" />
              <Typography variant="h6" fontWeight={800}>Cash Drawer Reconciliation</Typography>
              <Chip label="Not persisted" size="small" variant="outlined" sx={{ ml: 1 }} />
            </Stack>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField label="Opening balance (₹)" type="number" fullWidth value={openingBalance}
                  onChange={e => setOpeningBalance(e.target.value)}
                  helperText="Cash in drawer at start of shift" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Expected in drawer (₹)" fullWidth value={inr(expectedCashInDrawer)}
                  InputProps={{ readOnly: true }}
                  helperText="Opening + cash sales" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Counted cash (₹)" type="number" fullWidth value={countedCash}
                  onChange={e => setCountedCash(e.target.value)}
                  helperText="Physical cash counted at close" />
              </Grid>
            </Grid>
            {variance !== null && (
              <>
                <Divider sx={{ my: 2 }} />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" fontWeight={800}>Variance</Typography>
                  <Typography variant="h5" fontWeight={900}
                    color={variance === 0 ? 'success.dark' : variance > 0 ? 'primary.main' : 'error.dark'}>
                    {variance > 0 ? '+' : ''}{inr(variance)}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {variance === 0 ? 'Drawer balances perfectly.' :
                    variance > 0 ? 'Excess cash — investigate uncounted sales or manual deposits.' :
                    'Short cash — investigate refunds, breakage, or missed voids.'}
                </Typography>
              </>
            )}
          </Paper>
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <PointOfSale sx={{ fontSize: 80, color: 'action.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">Select a date and load the report.</Typography>
        </Box>
      )}
    </Box>
  );
}
