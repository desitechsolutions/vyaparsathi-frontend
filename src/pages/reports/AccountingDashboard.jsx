import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Paper, Grid, Stack, Tab, Tabs,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Button, Chip, Skeleton, IconButton, Alert, Card, CardContent,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { fetchProfitAndLoss, fetchReceivablesAging, fetchPayablesAging } from '../../services/api';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

export default function AccountingDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  // P&L State
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(firstDayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [pnlData, setPnlData] = useState(null);
  const [pnlLoading, setPnlLoading] = useState(true);

  // Receivables & Payables Aging State
  const [receivables, setReceivables] = useState([]);
  const [recLoading, setRecLoading] = useState(true);
  const [payables, setPayables] = useState([]);
  const [payLoading, setPayLoading] = useState(true);

  const [error, setError] = useState(null);

  // ── Load P&L ─────────────────────────────────────────────────────────────
  const loadPnl = useCallback(async () => {
    setPnlLoading(true);
    setError(null);
    try {
      const data = await fetchProfitAndLoss(startDate, endDate);
      setPnlData(data);
    } catch (err) {
      console.error('[Accounting] Failed to load P&L:', err);
      setError(err?.response?.data?.message || 'Failed to fetch Profit & Loss data.');
    } finally {
      setPnlLoading(false);
    }
  }, [startDate, endDate]);

  // ── Load Receivables Aging ────────────────────────────────────────────────
  const loadReceivables = useCallback(async () => {
    setRecLoading(true);
    try {
      const data = await fetchReceivablesAging();
      setReceivables(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[Accounting] Failed to load receivables aging:', err);
    } finally {
      setRecLoading(false);
    }
  }, []);

  // ── Load Payables Aging ───────────────────────────────────────────────────
  const loadPayables = useCallback(async () => {
    setPayLoading(true);
    try {
      const data = await fetchPayablesAging();
      setPayables(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[Accounting] Failed to load payables aging:', err);
    } finally {
      setPayLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPnl();
    loadReceivables();
    loadPayables();
  }, [loadPnl, loadReceivables, loadPayables]);

  // ── Format Currency ───────────────────────────────────────────────────────
  const fmt = (val) => {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Aging totals calculation
  const recTotal = receivables.reduce((sum, r) => sum + (Number(r.totalOutstanding) || 0), 0);
  const payTotal = payables.reduce((sum, p) => sum + (Number(p.totalOutstanding) || 0), 0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconButton size="small" onClick={() => navigate('/reports')}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: '-0.02em' }}>
              Accounting & P&L Statement
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Profit & Loss ledger, Receivables & Payables aging analysis.
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          size="small"
          onClick={() => { loadPnl(); loadReceivables(); loadPayables(); }}
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
        >
          Refresh Data
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Navigation Tabs */}
      <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            px: 2,
            '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', minHeight: 52 },
            '& .MuiTabs-indicator': { height: 3, borderRadius: 2 },
          }}
        >
          <Tab label="Profit & Loss (P&L)" id="tab-pnl" />
          <Tab label={`Receivables Aging (${receivables.length})`} id="tab-receivables" />
          <Tab label={`Payables Aging (${payables.length})`} id="tab-payables" />
        </Tabs>
      </Paper>

      {/* ═════════════════════════════════════════════════════════════════════
           TAB 0 — Profit & Loss Statement
          ═════════════════════════════════════════════════════════════════════ */}
      <TabPanel value={tab} index={0}>
        {/* Date Filter Bar */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', border: '1px solid', borderColor: 'divider', mb: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle2" fontWeight={800}>Report Period</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Start Date"
                type="date"
                size="small"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End Date"
                type="date"
                size="small"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                variant="contained"
                onClick={loadPnl}
                sx={{ borderRadius: '8px', fontWeight: 800, textTransform: 'none', px: 3 }}
              >
                Apply Filter
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {pnlLoading ? (
          <Grid container spacing={3}>
            {[...Array(4)].map((_, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Skeleton variant="rectangular" height={110} sx={{ borderRadius: '16px' }} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <>
            {/* KPI Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '16px', bgcolor: '#F0FDF4' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary" fontWeight={800}>GROSS SALES</Typography>
                      <TrendingUpIcon sx={{ color: '#16A34A' }} />
                    </Stack>
                    <Typography variant="h5" fontWeight={900} sx={{ mt: 1, color: '#15803D' }}>
                      {fmt(pnlData?.grossSales)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '16px', bgcolor: '#EFF6FF' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary" fontWeight={800}>GROSS PROFIT</Typography>
                      <AccountBalanceIcon sx={{ color: '#2563EB' }} />
                    </Stack>
                    <Typography variant="h5" fontWeight={900} sx={{ mt: 1, color: '#1D4ED8' }}>
                      {fmt(pnlData?.grossProfit)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '16px', bgcolor: '#FEF2F2' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary" fontWeight={800}>OPERATING EXPENSES</Typography>
                      <TrendingDownIcon sx={{ color: '#DC2626' }} />
                    </Stack>
                    <Typography variant="h5" fontWeight={900} sx={{ mt: 1, color: '#B91C1C' }}>
                      {fmt(pnlData?.operatingExpenses)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '16px', bgcolor: Number(pnlData?.netProfit) >= 0 ? '#ECFDF5' : '#FEF2F2' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary" fontWeight={800}>NET PROFIT</Typography>
                      <Chip
                        label={`${Number(pnlData?.netProfitMarginPercent || 0).toFixed(1)}% MARGIN`}
                        size="small"
                        color={Number(pnlData?.netProfit) >= 0 ? 'success' : 'error'}
                        sx={{ fontWeight: 900, fontSize: '0.6rem', height: 20 }}
                      />
                    </Stack>
                    <Typography variant="h5" fontWeight={900} sx={{ mt: 1, color: Number(pnlData?.netProfit) >= 0 ? '#047857' : '#B91C1C' }}>
                      {fmt(pnlData?.netProfit)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Detailed P&L Breakdown Table */}
            <Paper elevation={0} sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Box sx={{ px: 3, py: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle1" fontWeight={800}>P&L Breakdown Summary</Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableBody>
                    <TableRow hover>
                      <TableCell sx={{ fontWeight: 700 }}>Gross Sales Revenue</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: '#16A34A' }}>{fmt(pnlData?.grossSales)}</TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell sx={{ fontWeight: 700, pl: 4, color: 'text.secondary' }}>Less: Sales Returns & Adjustments</TableCell>
                      <TableCell align="right" sx={{ color: '#DC2626' }}>- {fmt(pnlData?.salesReturns)}</TableCell>
                    </TableRow>
                    <TableRow hover sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 800 }}>Net Sales Revenue</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 900 }}>{fmt(pnlData?.netSales)}</TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell sx={{ fontWeight: 700, pl: 4, color: 'text.secondary' }}>Less: Cost of Goods Sold (COGS)</TableCell>
                      <TableCell align="right" sx={{ color: '#DC2626' }}>- {fmt(pnlData?.costOfGoodsSold)}</TableCell>
                    </TableRow>
                    <TableRow hover sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 800 }}>Gross Profit</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 900, color: '#2563EB' }}>{fmt(pnlData?.grossProfit)}</TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell sx={{ fontWeight: 700, pl: 4, color: 'text.secondary' }}>Less: Total Operating Expenses</TableCell>
                      <TableCell align="right" sx={{ color: '#DC2626' }}>- {fmt(pnlData?.operatingExpenses)}</TableCell>
                    </TableRow>
                    <TableRow hover sx={{ bgcolor: Number(pnlData?.netProfit) >= 0 ? '#F0FDF4' : '#FEF2F2' }}>
                      <TableCell sx={{ fontWeight: 900, fontSize: '1rem' }}>NET PROFIT / (LOSS)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 900, fontSize: '1.1rem', color: Number(pnlData?.netProfit) >= 0 ? '#15803D' : '#B91C1C' }}>
                        {fmt(pnlData?.netProfit)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}
      </TabPanel>

      {/* ═════════════════════════════════════════════════════════════════════
           TAB 1 — Receivables Aging (Customer Dues)
          ═════════════════════════════════════════════════════════════════════ */}
      <TabPanel value={tab} index={1}>
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider', bgcolor: '#FEFCE8' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={800}>TOTAL RECEIVABLES OUTSTANDING</Typography>
              <Typography variant="h4" fontWeight={900} color="#D97706">{fmt(recTotal)}</Typography>
            </Box>
            <Chip label={`${receivables.length} CUSTOMERS`} color="warning" sx={{ fontWeight: 800 }} />
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  <TableCell sx={{ fontWeight: 800 }}>CUSTOMER NAME</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>PHONE</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>0–30 DAYS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>31–60 DAYS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>61–90 DAYS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>OVER 90 DAYS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900 }}>TOTAL DUE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recLoading ? (
                  [...Array(4)].map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={7}><Skeleton height={36} /></TableCell></TableRow>
                  ))
                ) : receivables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" color="text.secondary">No customer receivables found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  receivables.map((row) => (
                    <TableRow key={row.customerId} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{row.customerName}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{row.phone || '—'}</TableCell>
                      <TableCell align="right">{fmt(row.current0To30Days)}</TableCell>
                      <TableCell align="right" sx={{ color: Number(row.days31To60) > 0 ? '#D97706' : 'inherit' }}>{fmt(row.days31To60)}</TableCell>
                      <TableCell align="right" sx={{ color: Number(row.days61To90) > 0 ? '#EA580C' : 'inherit' }}>{fmt(row.days61To90)}</TableCell>
                      <TableCell align="right" sx={{ color: Number(row.over90Days) > 0 ? '#DC2626' : 'inherit', fontWeight: Number(row.over90Days) > 0 ? 800 : 400 }}>{fmt(row.over90Days)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 900, color: '#B91C1C' }}>{fmt(row.totalOutstanding)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </TabPanel>

      {/* ═════════════════════════════════════════════════════════════════════
           TAB 2 — Payables Aging (Supplier Outstandings)
          ═════════════════════════════════════════════════════════════════════ */}
      <TabPanel value={tab} index={2}>
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider', bgcolor: '#EFF6FF' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={800}>TOTAL PAYABLES OUTSTANDING</Typography>
              <Typography variant="h4" fontWeight={900} color="#2563EB">{fmt(payTotal)}</Typography>
            </Box>
            <Chip label={`${payables.length} SUPPLIERS`} color="primary" sx={{ fontWeight: 800 }} />
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  <TableCell sx={{ fontWeight: 800 }}>SUPPLIER NAME</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>PHONE</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>0–30 DAYS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>31–60 DAYS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>61–90 DAYS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>OVER 90 DAYS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900 }}>TOTAL PAYABLE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payLoading ? (
                  [...Array(4)].map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={7}><Skeleton height={36} /></TableCell></TableRow>
                  ))
                ) : payables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" color="text.secondary">No supplier payables found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  payables.map((row) => (
                    <TableRow key={row.supplierId} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{row.supplierName}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{row.phone || '—'}</TableCell>
                      <TableCell align="right">{fmt(row.current0To30Days)}</TableCell>
                      <TableCell align="right" sx={{ color: Number(row.days31To60) > 0 ? '#D97706' : 'inherit' }}>{fmt(row.days31To60)}</TableCell>
                      <TableCell align="right" sx={{ color: Number(row.days61To90) > 0 ? '#EA580C' : 'inherit' }}>{fmt(row.days61To90)}</TableCell>
                      <TableCell align="right" sx={{ color: Number(row.over90Days) > 0 ? '#DC2626' : 'inherit', fontWeight: Number(row.over90Days) > 0 ? 800 : 400 }}>{fmt(row.over90Days)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 900, color: '#1D4ED8' }}>{fmt(row.totalOutstanding)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </TabPanel>
    </Container>
  );
}
