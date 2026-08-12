import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area, BarChart, Bar, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import {
  Box, Typography, Paper, Button, Grid, CircularProgress, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  MenuItem, Select, FormControl, Card, CardContent,
  Avatar, Chip, Stack, Divider, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, LinearProgress, Checkbox, Alert, IconButton, Tooltip as MuiTooltip,
  Snackbar, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useAlerts } from '../context/AlertContext';
// Icons
import DownloadIcon from '@mui/icons-material/Download';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import GroupIcon from '@mui/icons-material/Group';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import PaymentIcon from '@mui/icons-material/Payment';
import PercentIcon from '@mui/icons-material/Percent';

// API Services
import {
  fetchItemDemand, fetchCustomerTrends,
  fetchFuturePurchaseOrders, fetchTopItems, fetchChurnPrediction,
  fetchSeasonalTrends, exportProcurementPlan, fetchItems,
  fetchKpis, fetchRevenueTimeSeries, fetchPaymentMix, fetchGrossMargin,
} from '../services/api';

import { useTheme } from '@mui/material/styles';

const CHART_COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];
const METHOD_COLOR = {
  CASH:        '#10B981',
  UPI:         '#6366F1',
  CARD:        '#3B82F6',
  NET_BANKING: '#8B5CF6',
  CHEQUE:      '#F59E0B',
  OTHER:       '#94A3B8',
};

const INR = (n) => {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '₹0';
  const abs = Math.abs(Number(n));
  if (abs >= 1e7) return `₹${(Number(n) / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `₹${(Number(n) / 1e5).toFixed(2)}L`;
  if (abs >= 1e3) return `₹${(Number(n) / 1e3).toFixed(1)}k`;
  return `₹${Number(n).toLocaleString('en-IN')}`;
};
const INR_FULL = (n) =>
  (n === null || n === undefined) ? '₹0' : `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const NUM = (n) => (n === null || n === undefined) ? '0' : Number(n).toLocaleString('en-IN');

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { alerts } = useAlerts();

  // ── Range + granularity state (drives every fetch) ──
  const [from, setFrom] = useState(dayjs().subtract(29, 'day'));
  const [to, setTo] = useState(dayjs());
  const [granularity, setGranularity] = useState('DAY');

  const [data, setData] = useState({
    kpis: null,
    revenueSeries: null,
    paymentMix: null,
    grossMargin: null,
    demand: [],
    trends: [],
    topItems: [],
    churn: [],
    purchase: [],
    seasonal: [],
    totalItems: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [exportFormat, setExportFormat] = useState('xlsx');
  const [selectedItems, setSelectedItems] = useState([]);
  const [orderModal, setOrderModal] = useState({ open: false, item: null });
  const [orderQty, setOrderQty] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const handleCloseSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const rangeOpts = useMemo(() => ({
    from: from?.format('YYYY-MM-DD'),
    to: to?.format('YYYY-MM-DD'),
  }), [from, to]);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const results = await Promise.allSettled([
        fetchKpis(rangeOpts),
        fetchRevenueTimeSeries({ ...rangeOpts, granularity }),
        fetchPaymentMix(rangeOpts),
        fetchGrossMargin(rangeOpts),
        fetchItemDemand(rangeOpts),
        fetchCustomerTrends(rangeOpts),
        fetchTopItems(rangeOpts),
        fetchChurnPrediction(),
        fetchFuturePurchaseOrders(),
        fetchSeasonalTrends(),
        fetchItems(),
      ]);

      const [
        kpisRes, revRes, mixRes, marginRes,
        demandRes, trendsRes, topRes, churnRes, purchaseRes, seasonalRes, itemsRes,
      ] = results;

      const safeData = (res) => (res.status === 'fulfilled' ? (res.value?.data ?? null) : null);
      const safeArr  = (res) => (res.status === 'fulfilled' ? (res.value?.data || []) : []);

      setData({
        kpis: safeData(kpisRes),
        revenueSeries: safeData(revRes),
        paymentMix: safeData(mixRes),
        grossMargin: safeData(marginRes),
        demand: safeArr(demandRes),
        trends: safeArr(trendsRes),
        topItems: safeArr(topRes),
        churn: safeArr(churnRes),
        purchase: safeArr(purchaseRes),
        seasonal: safeArr(seasonalRes),
        totalItems: safeArr(itemsRes).length,
      });

      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0 && failed === results.length) {
        setLoadError('Failed to load analytics data. Please check your connection and try again.');
      } else if (failed > 0) {
        setLoadError(`${failed} data source(s) failed to load. Some charts may be incomplete.`);
      }
    } catch (error) {
      console.error('Dashboard Load Error:', error);
      setLoadError('Failed to load analytics data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [rangeOpts, granularity]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ── Derived: financial metrics ──
  const totalRevenueAtRisk = data.churn.reduce((sum, item) => sum + (item.revenueAtRisk || 0), 0);
  const totalInvestmentNeeded = data.purchase.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
  const lowStockCount = alerts?.length || 0;
  const inventoryHealth = data.totalItems > 0
    ? Math.max(0, Math.min(100, Math.round(((data.totalItems - lowStockCount) / data.totalItems) * 100)))
    : 100;

  // ── Derived: seasonal (new backend shape) ──
  const seasonalRows = useMemo(() => {
    if (!data.seasonal?.length) return [];
    return data.seasonal.map((s, i, all) => {
      const prev = i > 0 ? (all[i - 1].salesCount ?? 0) : 0;
      const cur = s.salesCount ?? 0;
      let growth = 0;
      if (prev > 0) growth = ((cur - prev) / prev) * 100;
      else if (cur > 0) growth = 100;
      return {
        month: s.monthName || `M${s.month ?? i + 1}`,
        season: s.season || '',
        totalSales: cur,
        revenue: Number(s.revenue ?? 0),
        growth: Number(growth.toFixed(1)),
      };
    });
  }, [data.seasonal]);

  // ── Derived: top rising / falling ──
  const risingItems  = useMemo(() => data.topItems.filter((t) => t.rising).slice(0, 5), [data.topItems]);
  const fallingItems = useMemo(() => data.topItems.filter((t) => !t.rising).slice(0, 5), [data.topItems]);

  const handleSelectAll = (e) => {
    setSelectedItems(e.target.checked ? data.purchase.map((p) => p.itemId) : []);
  };
  const handleSelectItem = (itemId) => {
    setSelectedItems((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]));
  };
  const handleExport = async () => {
    try {
      const res = await exportProcurementPlan(exportFormat);
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Procurement_Plan_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      link.click();
      setSnackbar({ open: true, message: 'Procurement plan exported successfully!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Export failed. Please try again.', severity: 'error' });
    }
  };

  const applyPreset = (days) => {
    setTo(dayjs());
    setFrom(dayjs().subtract(days - 1, 'day'));
  };

  // ── UI atoms ────────────────────────────────────────
  const trendIcon = (pct) => {
    if (pct === null || pct === undefined) return <TrendingFlatIcon fontSize="small" />;
    if (pct > 0) return <TrendingUpIcon fontSize="small" />;
    if (pct < 0) return <TrendingDownIcon fontSize="small" />;
    return <TrendingFlatIcon fontSize="small" />;
  };
  const trendColor = (pct) => {
    if (pct === null || pct === undefined) return 'default';
    if (pct > 0) return 'success';
    if (pct < 0) return 'error';
    return 'default';
  };
  const formatPct = (pct) => {
    if (pct === null || pct === undefined) return '—';
    const rounded = Math.abs(pct) >= 100 ? pct.toFixed(0) : pct.toFixed(1);
    return `${pct > 0 ? '+' : ''}${rounded}%`;
  };

  const KpiCard = ({ title, valueRender, icon, color, kpi, subtitle }) => {
    const current = kpi?.current;
    const pct = kpi?.changePct;
    return (
      <Card sx={{ borderRadius: 4, height: '100%', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: 'none' }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, width: 48, height: 48, opacity: 0.9 }}>{icon}</Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" color="text.primary" sx={{ fontWeight: 800, lineHeight: 1.2 }} noWrap>
                {valueRender(current)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                {title}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
            <Chip
              size="small"
              icon={trendIcon(pct)}
              label={formatPct(pct)}
              color={trendColor(pct)}
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
            <Typography variant="caption" color="text.secondary">
              {subtitle || 'vs previous period'}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  // ── Time-series row builder ──
  const seriesRows = useMemo(() => {
    const buckets = data.revenueSeries?.buckets || [];
    return buckets.map((b) => ({
      bucketStart: b.bucketStart,
      label: (() => {
        const d = dayjs(b.bucketStart);
        if (granularity === 'MONTH') return d.format('MMM YY');
        if (granularity === 'WEEK') return `W${d.isoWeek ? d.isoWeek() : d.week()} ${d.format('MMM')}`;
        return d.format('DD MMM');
      })(),
      revenue: Number(b.revenue ?? 0),
      saleCount: Number(b.saleCount ?? 0),
    }));
  }, [data.revenueSeries, granularity]);

  // ── Payment mix chart rows ──
  const paymentRows = useMemo(() => {
    const m = data.paymentMix?.methods || [];
    return m.map((row) => ({
      name: row.method,
      value: Number(row.amount || 0),
      txnCount: Number(row.txnCount || 0),
      percentage: Number(row.percentage || 0),
    }));
  }, [data.paymentMix]);

  // ── Main render ─────────────────────────────────────
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: { xs: 2, md: 4 } }}>
        <Box sx={{ maxWidth: 1600, mx: 'auto' }}>

          {/* HEADER */}
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 3 }}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <AnalyticsIcon color="primary" sx={{ fontSize: 32 }} />
                <Typography variant="h4" fontWeight={800} sx={{ color: 'text.primary', letterSpacing: '-1px' }}>Vyapar Intelligence</Typography>
              </Stack>
              <Typography variant="body1" color="text.secondary" fontWeight={500}>
                {from?.format('DD MMM YYYY')} – {to?.format('DD MMM YYYY')} · compared with the prior equal period
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <MuiTooltip title="Refresh">
                <IconButton onClick={loadAllData} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                  <RefreshIcon />
                </IconButton>
              </MuiTooltip>
              <Paper elevation={0} sx={{ p: 1, display: 'flex', gap: 1, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                <FormControl size="small" variant="standard" sx={{ minWidth: 120, px: 2 }}>
                  <Select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} disableUnderline sx={{ fontWeight: 600, color: 'text.primary' }}>
                    <MenuItem value="xlsx">Excel (.xlsx)</MenuItem>
                    <MenuItem value="pdf">PDF Report</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="contained" startIcon={<DownloadIcon />} sx={{ borderRadius: 2, fontWeight: 700 }} onClick={handleExport}>Export Plan</Button>
              </Paper>
            </Stack>
          </Stack>

          {/* CONTROLS */}
          <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <DatePicker
                  label="From"
                  value={from}
                  onChange={(v) => v && setFrom(v)}
                  slotProps={{ textField: { size: 'small', sx: { width: 180 } } }}
                />
                <DatePicker
                  label="To"
                  value={to}
                  onChange={(v) => v && setTo(v)}
                  slotProps={{ textField: { size: 'small', sx: { width: 180 } } }}
                />
                <Stack direction="row" spacing={0.5}>
                  <Button size="small" variant="text" onClick={() => applyPreset(7)}>7d</Button>
                  <Button size="small" variant="text" onClick={() => applyPreset(30)}>30d</Button>
                  <Button size="small" variant="text" onClick={() => applyPreset(90)}>90d</Button>
                  <Button size="small" variant="text" onClick={() => applyPreset(365)}>1y</Button>
                </Stack>
              </Stack>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={granularity}
                onChange={(_, v) => v && setGranularity(v)}
                aria-label="granularity"
              >
                <ToggleButton value="DAY">Day</ToggleButton>
                <ToggleButton value="WEEK">Week</ToggleButton>
                <ToggleButton value="MONTH">Month</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Paper>

          {loadError && (
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }} onClose={() => setLoadError(null)}>
              {loadError}
            </Alert>
          )}

          {isLoading ? (
            <Box sx={{ textAlign: 'center', py: 20 }}><CircularProgress thickness={5} size={60} /></Box>
          ) : (
            <Grid container spacing={3}>

              {/* KPI ROW */}
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard
                  title="Total Revenue"
                  icon={<AttachMoneyIcon />}
                  color="success"
                  kpi={data.kpis?.totalRevenue}
                  valueRender={(v) => INR(v)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard
                  title="Sales"
                  icon={<ReceiptLongIcon />}
                  color="primary"
                  kpi={data.kpis?.saleCount}
                  valueRender={(v) => NUM(v)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard
                  title="Avg Order Value"
                  icon={<LocalAtmIcon />}
                  color="info"
                  kpi={data.kpis?.avgOrderValue}
                  valueRender={(v) => INR(v)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard
                  title="Unique Customers"
                  icon={<PeopleAltIcon />}
                  color="warning"
                  kpi={data.kpis?.uniqueCustomers}
                  valueRender={(v) => NUM(v)}
                />
              </Grid>

              {/* REVENUE TIME SERIES + PAYMENT MIX */}
              <Grid item xs={12} lg={8}>
                <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: 'none' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TrendingUpIcon color="primary" />
                        <Typography variant="h6" fontWeight={700} color="text.primary">Revenue Time Series</Typography>
                      </Stack>
                      <Chip label={`${granularity.charAt(0)}${granularity.slice(1).toLowerCase()} buckets`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                    </Stack>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={seriesRows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%"  stopColor={CHART_COLORS[0]} stopOpacity={0.35} />
                              <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                          <XAxis dataKey="label" tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => INR(v)} />
                          <Tooltip
                            contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, color: theme.palette.text.primary }}
                            formatter={(value, name) => (name === 'revenue' ? [INR_FULL(value), 'Revenue'] : [NUM(value), 'Sales'])}
                          />
                          <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS[0]} strokeWidth={3} fill="url(#revGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: 'none', height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <PaymentIcon color="primary" />
                      <Typography variant="h6" fontWeight={700} color="text.primary">Payment Mix</Typography>
                    </Stack>
                    {paymentRows.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
                        No sale-side payments in this range.
                      </Typography>
                    ) : (
                      <>
                        <Box sx={{ height: 220 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={paymentRows}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={85}
                                paddingAngle={2}
                              >
                                {paymentRows.map((r, i) => (
                                  <Cell key={r.name} fill={METHOD_COLOR[r.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, color: theme.palette.text.primary }}
                                formatter={(v, n, item) => [INR_FULL(v), item?.payload?.name || n]}
                              />
                              <Legend wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                        <Divider sx={{ my: 1.5 }} />
                        <Stack spacing={0.5}>
                          {paymentRows.map((r) => (
                            <Stack key={r.name} direction="row" justifyContent="space-between" alignItems="center">
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: METHOD_COLOR[r.name] || 'primary.main' }} />
                                <Typography variant="caption" fontWeight={700}>{r.name}</Typography>
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                {INR(r.value)} · {r.percentage.toFixed(1)}%
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* GROSS MARGIN + SEASONAL */}
              <Grid item xs={12} lg={4}>
                <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: 'none', height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <PercentIcon color="primary" />
                      <Typography variant="h6" fontWeight={700} color="text.primary">Gross Margin</Typography>
                    </Stack>
                    {!data.grossMargin ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>Not available</Typography>
                    ) : (
                      <>
                        <Typography variant="h3" fontWeight={800} color="success.main">
                          {(data.grossMargin.grossMarginPct ?? 0).toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {INR_FULL(data.grossMargin.grossMargin)} on {NUM(data.grossMargin.saleCount)} sales
                        </Typography>
                        <Divider sx={{ my: 1.5 }} />
                        <Stack spacing={1.5}>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">Revenue</Typography>
                            <Typography variant="caption" fontWeight={800}>{INR_FULL(data.grossMargin.totalRevenue)}</Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">COGS</Typography>
                            <Typography variant="caption" fontWeight={800}>{INR_FULL(data.grossMargin.totalCost)}</Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">Gross Margin</Typography>
                            <Typography variant="caption" fontWeight={800} color="success.main">{INR_FULL(data.grossMargin.grossMargin)}</Typography>
                          </Stack>
                        </Stack>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} lg={8}>
                <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: 'none', height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CalendarMonthIcon color="primary" />
                        <Typography variant="h6" fontWeight={700} color="text.primary">Monthly Seasonality</Typography>
                      </Stack>
                      <Chip label="Rolling 12 mo" size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                    </Stack>
                    <Box sx={{ height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={seasonalRows}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: theme.palette.text.secondary }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} tickFormatter={(v) => INR(v)} />
                          <Tooltip
                            cursor={{ fill: theme.palette.action.hover }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const p = payload[0].payload;
                                return (
                                  <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', bgcolor: 'background.paper' }}>
                                    <Typography variant="caption" display="block" color="text.secondary" fontWeight={700}>{p.month} · {p.season}</Typography>
                                    <Typography variant="h6" color="primary.main">{INR_FULL(p.revenue)}</Typography>
                                    <Typography variant="caption" display="block" color="text.secondary">Sales: {NUM(p.totalSales)}</Typography>
                                    <Typography variant="caption" color={p.growth >= 0 ? 'success.main' : 'error.main'} fontWeight={800}>
                                      {p.growth >= 0 ? '↑' : '↓'} {Math.abs(p.growth)}% vs prev
                                    </Typography>
                                  </Paper>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="revenue" radius={[4, 4, 0, 0]} barSize={30}>
                            {seasonalRows.map((r, i) => (
                              <Cell key={i} fill={r.revenue > 0 ? '#6366F1' : theme.palette.divider} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* TOP RISING / FALLING + CUSTOMER TRENDS + FINANCIAL LEAKAGE */}
              <Grid item xs={12} md={6} lg={4}>
                <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: 'none', height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <TrendingUpIcon color="success" />
                      <Typography variant="h6" fontWeight={700} color="text.primary">Rising Items</Typography>
                    </Stack>
                    {risingItems.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>Nothing rising in this range.</Typography>
                    ) : (
                      <Stack spacing={1.5}>
                        {risingItems.map((t, i) => (
                          <Stack key={t.itemId || i} direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" fontWeight={700} color="text.primary" noWrap sx={{ maxWidth: '60%' }}>{t.itemName}</Typography>
                            <Chip icon={<TrendingUpIcon />} label={`+${Math.abs(t.changePercent || 0).toFixed(1)}%`} size="small" color="success" variant="outlined" sx={{ fontWeight: 700 }} />
                          </Stack>
                        ))}
                      </Stack>
                    )}
                    <Divider sx={{ my: 2 }} />
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <TrendingDownIcon color="error" />
                      <Typography variant="h6" fontWeight={700} color="text.primary">Falling Items</Typography>
                    </Stack>
                    {fallingItems.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>Nothing falling in this range.</Typography>
                    ) : (
                      <Stack spacing={1.5}>
                        {fallingItems.map((t, i) => (
                          <Stack key={t.itemId || i} direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" fontWeight={700} color="text.primary" noWrap sx={{ maxWidth: '60%' }}>{t.itemName}</Typography>
                            <Chip icon={<TrendingDownIcon />} label={`${(t.changePercent || 0).toFixed(1)}%`} size="small" color="error" variant="outlined" sx={{ fontWeight: 700 }} />
                          </Stack>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6} lg={4}>
                <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: 'none', height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <GroupIcon color="primary" />
                      <Typography variant="h6" fontWeight={700} color="text.primary">Top Buying Behaviors</Typography>
                    </Stack>
                    {data.trends.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No customer activity in this range.</Typography>
                    ) : (
                      <Stack spacing={2}>
                        {data.trends.slice(0, 3).map((trend, i) => (
                          <Paper key={i} variant="outlined" sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Avatar sx={{ bgcolor: CHART_COLORS[i % 6], width: 36, height: 36, fontWeight: 800, color: '#fff' }}>
                                {trend.customerName?.[0] || '?'}
                              </Avatar>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="subtitle2" fontWeight={800} color="text.primary" noWrap>{trend.customerName}</Typography>
                                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>{trend.buyingPattern}</Typography>
                              </Box>
                            </Stack>
                            {trend.frequentlyBoughtItems?.length > 0 && (
                              <>
                                <Divider sx={{ my: 1.5, borderColor: 'divider' }} />
                                <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                                  {trend.frequentlyBoughtItems.map((item, idx) => (
                                    <Chip key={idx} label={item} size="small" sx={{ fontSize: '0.65rem', fontWeight: 600, bgcolor: 'action.hover', color: 'text.primary' }} />
                                  ))}
                                </Stack>
                              </>
                            )}
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={12} lg={4}>
                <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: 'none', height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <WarningAmberIcon color="warning" />
                      <Typography variant="h6" fontWeight={700} color="text.primary">Financial Leakage</Typography>
                    </Stack>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary">Lost opportunity (churn risk)</Typography>
                      <Typography variant="h5" fontWeight={800} color="error.main">{INR_FULL(totalRevenueAtRisk)}</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, (totalRevenueAtRisk / Math.max(1, Number(data.kpis?.totalRevenue?.current || 1))) * 100)}
                        color="error"
                        sx={{ height: 8, borderRadius: 5, mt: 1 }}
                      />
                    </Box>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary">Restocking capital needed</Typography>
                      <Typography variant="h5" fontWeight={800} color="primary.main">{INR_FULL(totalInvestmentNeeded)}</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, (totalInvestmentNeeded / Math.max(1, Number(data.kpis?.totalRevenue?.current || 1))) * 100)}
                        color="primary"
                        sx={{ height: 8, borderRadius: 5, mt: 1 }}
                      />
                    </Box>
                    <Divider sx={{ my: 1.5 }} />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">High-risk customers</Typography>
                      <Typography variant="caption" fontWeight={800}>{data.churn.filter((c) => c.churnProbability > 0.7).length}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">Inventory health</Typography>
                      <Typography variant="caption" fontWeight={800} color={inventoryHealth >= 80 ? 'success.main' : inventoryHealth >= 60 ? 'warning.main' : 'error.main'}>
                        {inventoryHealth}%
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* PROCUREMENT TABLE */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: 'none' }}>
                  <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h6" fontWeight={700} color="text.primary">Procurement Roadmap</Typography>
                    {selectedItems.length > 0 && (
                      <Button
                        variant="contained" color="primary"
                        startIcon={<ShoppingCartIcon />}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                        onClick={() => navigate('/purchase-orders')}
                      >
                        Create Bulk PO ({selectedItems.length} Items)
                      </Button>
                    )}
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                          <TableCell padding="checkbox"><Checkbox onChange={handleSelectAll} checked={selectedItems.length === data.purchase.length && data.purchase.length > 0} /></TableCell>
                          <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>ITEM</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary' }}>SUGGESTED QTY</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary' }}>EST. COST</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary' }}>ACTION</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.purchase.map((order) => (
                          <TableRow key={order.itemId} hover selected={selectedItems.includes(order.itemId)}>
                            <TableCell padding="checkbox">
                              <Checkbox checked={selectedItems.includes(order.itemId)} onChange={() => handleSelectItem(order.itemId)} />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{order.itemName}</TableCell>
                            <TableCell align="right"><Chip label={order.suggestedQuantity} size="small" variant="outlined" sx={{ fontWeight: 700 }} /></TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main' }}>{INR_FULL(order.estimatedCost)}</TableCell>
                            <TableCell align="right">
                              <Button
                                size="small" variant="contained"
                                onClick={() => {
                                  setOrderQty(String(order.suggestedQuantity || 1));
                                  setOrderModal({ open: true, item: order });
                                }}
                                sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 700 }}
                              >
                                Order
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Box>

        {/* PO MODAL */}
        <Dialog open={orderModal.open} onClose={() => setOrderModal({ open: false, item: null })} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' } }}>
          <DialogTitle sx={{ fontWeight: 800, color: 'text.primary' }}>Create Purchase Order</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.primary">Confirming order for: <b style={{ color: 'inherit' }}>{orderModal.item?.itemName}</b></Typography>
              <TextField
                fullWidth label="Order Quantity" type="number"
                value={orderQty}
                onChange={(e) => setOrderQty(e.target.value)}
                variant="outlined"
                inputProps={{ min: 1 }}
              />
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Estimated Investment: <b>{INR_FULL(orderModal.item?.estimatedCost)}</b>
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOrderModal({ open: false, item: null })} color="inherit" sx={{ fontWeight: 700 }}>Cancel</Button>
            <Button
              variant="contained"
              startIcon={<OpenInNewIcon />}
              sx={{ borderRadius: 2, fontWeight: 700 }}
              onClick={() => {
                setOrderModal({ open: false, item: null });
                navigate('/purchase-orders');
              }}
            >
              Go to Purchase Orders
            </Button>
          </DialogActions>
        </Dialog>

        {/* TOAST NOTIFICATION */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default AnalyticsDashboard;
