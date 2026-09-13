/**
 * PaymentDashboard.jsx  — Phase 3A
 *
 * Payment Analytics Dashboard for Finance / Admin users.
 * Route: /payments/dashboard
 *
 * Layout:
 *   xs–sm  : Single-column stacked cards
 *   md+    : 2-column grid for charts, full-width KPI row
 *
 * Sections:
 *   1. Page header      — title, date-range picker, refresh
 *   2. KPI cards row    — Total Collected, Pending, Overdue, Advance Balance
 *   3. Trend chart      — area line (daily / weekly)
 *   4. Method breakdown — pie chart (CASH / CARD / UPI / etc.)
 *   5. Top customers    — horizontal bar chart (top 5 by amount)
 *   6. Aging summary    — 4-bucket overdue breakdown
 */

import React, {
  useState, useEffect, useCallback, useMemo,
} from 'react';
import {
  Box, Button, ButtonGroup, Card, CardContent, CardHeader,
  Chip, Container, Divider, Grid, IconButton,
  LinearProgress, MenuItem, Select, Skeleton,
  Stack, Tooltip, Typography, alpha, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

// Icons
import RefreshIcon          from '@mui/icons-material/Refresh';
import ArrowBackIcon        from '@mui/icons-material/ArrowBack';
import PaymentsIcon         from '@mui/icons-material/Payments';
import HourglassTopIcon     from '@mui/icons-material/HourglassTop';
import WarningAmberIcon     from '@mui/icons-material/WarningAmber';
import SavingsIcon          from '@mui/icons-material/Savings';
import BarChartIcon         from '@mui/icons-material/BarChart';
import PieChartIcon         from '@mui/icons-material/PieChart';
import TrendingUpIcon       from '@mui/icons-material/TrendingUp';
import TableChartIcon       from '@mui/icons-material/TableChart';

import { DatePicker }            from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider }  from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs }          from '@mui/x-date-pickers/AdapterDayjs';
import { useNavigate }           from 'react-router-dom';

// Internal
import { useAppPalette }      from '../../hooks/useAppPalette';
import PaymentMetrics         from '../../components/payments/PaymentMetrics';
import PaymentTrendChart      from '../../components/payments/PaymentTrendChart';
import {
  fetchPaymentStats,
  fetchPaymentTrend,
} from '../../services/api';

dayjs.extend(weekOfYear);

// ── Constants ─────────────────────────────────────────────────────────────────

/** Fixed categorical palette matching AnalyticsDashboard METHOD_COLOR. */
const METHOD_COLOR = {
  CASH:        '#10B981',
  UPI:         '#6366F1',
  CARD:        '#3B82F6',
  NET_BANKING: '#8B5CF6',
  CHEQUE:      '#F59E0B',
  OTHER:       '#94A3B8',
};

/** Bar chart top-5 customers — uses first 5 from the brand palette. */
const CUSTOMER_COLORS = ['#3B82F6', '#6366F1', '#10B981', '#F59E0B', '#EC4899'];

/** Aging bucket colors: good→warn→serious→critical using MUI status semantics. */
const AGING_COLORS = {
  '0–30d':  '#10B981',
  '31–60d': '#F59E0B',
  '61–90d': '#F97316',
  '90d+':   '#DC2626',
};

const PRESET_RANGES = [
  { label: 'This Month',    key: 'THIS_MONTH' },
  { label: 'Last 3 Months', key: 'LAST_3M'    },
  { label: 'This Year',     key: 'THIS_YEAR'  },
  { label: 'Custom',        key: 'CUSTOM'     },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatINR = (n) => {
  const num = Number(n ?? 0);
  if (Number.isNaN(num)) return '₹0';
  const abs = Math.abs(num);
  if (abs >= 1e7) return `₹${(num / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `₹${(num / 1e5).toFixed(2)}L`;
  if (abs >= 1e3) return `₹${(num / 1e3).toFixed(1)}k`;
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const pct = (curr, prev) => {
  if (!prev || prev === 0) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
};

function rangeFromPreset(key) {
  const today = dayjs();
  switch (key) {
    case 'THIS_MONTH':
      return { from: today.startOf('month'), to: today };
    case 'LAST_3M':
      return { from: today.subtract(3, 'month').startOf('month'), to: today };
    case 'THIS_YEAR':
      return { from: today.startOf('year'), to: today };
    default:
      return { from: today.startOf('month'), to: today };
  }
}

// ── Sub-component: Aging bucket row ──────────────────────────────────────────

function AgingRow({ label, amount, total, color, loading }) {
  const pctVal = total > 0 ? (amount / total) * 100 : 0;
  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} aria-hidden />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
        </Stack>
        {loading
          ? <Skeleton width={60} height={18} />
          : <Typography variant="body2" sx={{ fontWeight: 700, color }}>{formatINR(amount)}</Typography>
        }
      </Stack>
      {loading
        ? <Skeleton variant="rectangular" height={6} sx={{ borderRadius: 1 }} />
        : (
          <LinearProgress
            variant="determinate"
            value={Math.min(pctVal, 100)}
            sx={{
              height: 6,
              borderRadius: 1,
              bgcolor: alpha(color, 0.12),
              '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 1 },
            }}
            aria-label={`${label}: ${pctVal.toFixed(1)}%`}
          />
        )
      }
    </Box>
  );
}

// ── Custom pie tooltip ────────────────────────────────────────────────────────

const PieCustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        px: 1.5, py: 1,
        boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 700, color: d.payload?.color ?? 'text.primary' }}>
        {d.name}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 800 }}>
        {formatINR(d.value)}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {d.payload?.pctLabel}
      </Typography>
    </Box>
  );
};

// ── Custom bar tooltip ────────────────────────────────────────────────────────

const BarCustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        px: 1.5, py: 1,
        boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
        maxWidth: 220,
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5, wordBreak: 'break-word' }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: '0.95rem' }}>
        {formatINR(payload[0]?.value)}
      </Typography>
    </Box>
  );
};

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyChart({ icon: Icon, label, height = 200, color = '#94a3b8' }) {
  return (
    <Box
      sx={{
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 2,
        gap: 1,
      }}
      role="img"
      aria-label={label}
    >
      {Icon && <Icon sx={{ fontSize: 32, color, opacity: 0.45 }} />}
      <Typography variant="body2" color="text.secondary">{label}</Typography>
    </Box>
  );
}

// ── Error card ────────────────────────────────────────────────────────────────

function ErrorCard({ message, onRetry }) {
  return (
    <Box
      sx={{
        p: 2, border: '1px solid', borderColor: 'error.light',
        borderRadius: 2, bgcolor: alpha('#dc2626', 0.05),
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
      }}
      role="alert"
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <WarningAmberIcon sx={{ color: 'error.main', fontSize: 20 }} />
        <Typography variant="body2" color="error.main">{message}</Typography>
      </Stack>
      {onRetry && (
        <Button size="small" variant="outlined" color="error" onClick={onRetry} startIcon={<RefreshIcon />}>
          Retry
        </Button>
      )}
    </Box>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const PaymentDashboard = () => {
  const theme   = useTheme();
  const palette = useAppPalette();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // ── Date range state ──────────────────────────────────────────────────────
  const [preset, setPreset]   = useState('THIS_MONTH');
  const [customFrom, setCustomFrom] = useState(dayjs().startOf('month'));
  const [customTo,   setCustomTo]   = useState(dayjs());
  const [granularity, setGranularity] = useState('DAY');

  const { from, to } = useMemo(() => {
    if (preset === 'CUSTOM') return { from: customFrom, to: customTo };
    return rangeFromPreset(preset);
  }, [preset, customFrom, customTo]);

  const fromStr = from?.format('YYYY-MM-DD');
  const toStr   = to?.format('YYYY-MM-DD');

  // ── Data state ────────────────────────────────────────────────────────────
  const [stats,     setStats]     = useState(null);
  const [trend,     setTrend]     = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [statsError,   setStatsError]   = useState(null);
  const [trendError,   setTrendError]   = useState(null);
  const [lastRefresh,  setLastRefresh]  = useState(null);

  // ── Fetch helpers ─────────────────────────────────────────────────────────

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const data = await fetchPaymentStats(fromStr, toStr);
      setStats(data);
    } catch (err) {
      if (err?.code !== 'ERR_CANCELED') {
        setStatsError('Failed to load payment statistics. Please try again.');
      }
    } finally {
      setStatsLoading(false);
    }
  }, [fromStr, toStr]);

  const loadTrend = useCallback(async () => {
    setTrendLoading(true);
    setTrendError(null);
    try {
      const data = await fetchPaymentTrend(fromStr, toStr, granularity);
      setTrend(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err?.code !== 'ERR_CANCELED') {
        setTrendError('Failed to load trend data.');
      }
    } finally {
      setTrendLoading(false);
    }
  }, [fromStr, toStr, granularity]);

  const refresh = useCallback(() => {
    loadStats();
    loadTrend();
    setLastRefresh(new Date());
  }, [loadStats, loadTrend]);

  useEffect(() => {
    loadStats();
    loadTrend();
  }, [loadStats, loadTrend]);

  // ── Derived chart data ────────────────────────────────────────────────────

  const methodData = useMemo(() => {
    const raw = stats?.methodBreakdown ?? [];
    if (!raw.length) return [];
    const total = raw.reduce((s, d) => s + (d.amount ?? 0), 0);
    return raw.map((d) => ({
      name:     d.method,
      value:    d.amount ?? 0,
      color:    METHOD_COLOR[d.method] ?? METHOD_COLOR.OTHER,
      pctLabel: total > 0 ? `${((d.amount / total) * 100).toFixed(1)}% of total` : '',
    }));
  }, [stats]);

  const topCustomerData = useMemo(() => {
    const raw = (stats?.topCustomers ?? []).slice(0, 5);
    return raw.map((c, i) => ({
      name:   c.customerName ?? `Customer ${i + 1}`,
      amount: c.totalPaid ?? 0,
      color:  CUSTOMER_COLORS[i] ?? CUSTOMER_COLORS[0],
    }));
  }, [stats]);

  const agingTotal = useMemo(() => {
    const a = stats?.agingSummary;
    if (!a) return 0;
    return (a.bucket0_30 ?? 0) + (a.bucket31_60 ?? 0) + (a.bucket61_90 ?? 0) + (a.bucket90plus ?? 0);
  }, [stats]);

  // ── Trend indicators (% vs prev period) ──────────────────────────────────
  const collectedTrend  = pct(stats?.totalCollected,  stats?.totalCollectedPrev);
  const pendingTrend    = pct(stats?.pendingAmount,    stats?.pendingAmountPrev);
  const overdueTrend    = pct(stats?.overdueAmount,    stats?.overdueAmountPrev);
  const advanceTrend    = pct(stats?.advanceBalance,   stats?.advanceBalancePrev);

  // ── Y-axis formatter for bar chart ────────────────────────────────────────
  const barYFormatter = (v) => formatINR(v);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 6 }}
        role="main"
        aria-label="Payment Analytics Dashboard"
      >
        <Container maxWidth="xl" sx={{ pt: { xs: 2, md: 3 } }}>

          {/* ── Header ───────────────────────────────────────────────────── */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={{ xs: 1.5, sm: 2 }}
            sx={{ mb: { xs: 2.5, md: 3 } }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <IconButton
                onClick={() => navigate('/payments/customer')}
                aria-label="Back to Payments"
                size="small"
                sx={{ color: palette.textSecondary }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PaymentsIcon sx={{ color: palette.teal, fontSize: 26 }} aria-hidden />
                  <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                    Payment Analytics
                  </Typography>
                </Stack>
                {lastRefresh && (
                  <Typography variant="caption" color="text.secondary">
                    Updated {dayjs(lastRefresh).format('h:mm A')}
                  </Typography>
                )}
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Tooltip title="Refresh all data" arrow>
                <IconButton
                  onClick={refresh}
                  disabled={statsLoading || trendLoading}
                  aria-label="Refresh dashboard"
                  size="small"
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          {/* ── Date range controls ──────────────────────────────────────── */}
          <Card
            elevation={0}
            sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}
          >
            <CardContent sx={{ py: '12px !important', px: 2 }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 1.5, sm: 2 }}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                flexWrap="wrap"
              >
                {/* Preset buttons */}
                <ButtonGroup
                  size="small"
                  variant="outlined"
                  aria-label="Date range preset"
                  sx={{ flexWrap: 'wrap', gap: 0.5, '& .MuiButtonGroup-grouped': { borderRadius: 1.5 } }}
                >
                  {PRESET_RANGES.map((r) => (
                    <Button
                      key={r.key}
                      variant={preset === r.key ? 'contained' : 'outlined'}
                      onClick={() => setPreset(r.key)}
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.78rem',
                        bgcolor: preset === r.key ? palette.teal : undefined,
                        borderColor: preset === r.key ? palette.teal : undefined,
                        color: preset === r.key ? '#fff' : undefined,
                        '&:hover': { bgcolor: preset === r.key ? palette.teal : undefined },
                      }}
                    >
                      {r.label}
                    </Button>
                  ))}
                </ButtonGroup>

                {/* Custom date pickers — shown only when Custom is selected */}
                {preset === 'CUSTOM' && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <DatePicker
                      label="From"
                      value={customFrom}
                      onChange={(v) => v && setCustomFrom(v)}
                      slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                      maxDate={customTo}
                    />
                    <Typography color="text.secondary">–</Typography>
                    <DatePicker
                      label="To"
                      value={customTo}
                      onChange={(v) => v && setCustomTo(v)}
                      slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                      minDate={customFrom}
                      maxDate={dayjs()}
                    />
                  </Stack>
                )}

                {/* Granularity toggle */}
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml: { sm: 'auto' } }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mr: 0.5 }}>
                    View:
                  </Typography>
                  {(['DAY', 'WEEK']).map((g) => (
                    <Chip
                      key={g}
                      label={g === 'DAY' ? 'Daily' : 'Weekly'}
                      size="small"
                      variant={granularity === g ? 'filled' : 'outlined'}
                      onClick={() => setGranularity(g)}
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        bgcolor: granularity === g ? alpha(palette.teal, 0.1) : undefined,
                        borderColor: granularity === g ? palette.teal : undefined,
                        color: granularity === g ? palette.teal : undefined,
                        cursor: 'pointer',
                      }}
                      aria-pressed={granularity === g}
                    />
                  ))}
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* ── Errors ───────────────────────────────────────────────────── */}
          {statsError && (
            <Box sx={{ mb: 2 }}>
              <ErrorCard message={statsError} onRetry={loadStats} />
            </Box>
          )}

          {/* ── KPI Cards row ─────────────────────────────────────────────── */}
          <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2.5, md: 3 } }}>
            <Grid item xs={12} sm={6} md={3}>
              <PaymentMetrics
                title="Total Collected (MTD)"
                value={stats?.totalCollected ?? 0}
                trend={collectedTrend}
                icon={PaymentsIcon}
                color="#059669"
                loading={statsLoading}
                tooltip="Sum of all completed payment collections for the selected range"
                subLabel="vs previous period"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <PaymentMetrics
                title="Pending Payments"
                value={stats?.pendingAmount ?? 0}
                trend={pendingTrend}
                icon={HourglassTopIcon}
                color="#d97706"
                loading={statsLoading}
                tooltip="Total value of payments in PENDING status"
                subLabel="awaiting settlement"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <PaymentMetrics
                title="Overdue (>30 days)"
                value={stats?.overdueAmount ?? 0}
                trend={overdueTrend}
                icon={WarningAmberIcon}
                color="#dc2626"
                loading={statsLoading}
                tooltip="Outstanding dues that are more than 30 days past due date"
                subLabel="requires follow-up"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <PaymentMetrics
                title="Advance Balance"
                value={stats?.advanceBalance ?? 0}
                trend={advanceTrend}
                icon={SavingsIcon}
                color="#2563eb"
                loading={statsLoading}
                tooltip="Total unallocated advance credit across all customers"
                subLabel="unallocated prepaid"
              />
            </Grid>
          </Grid>

          {/* ── Charts row 1: Trend + Pie ──────────────────────────────────── */}
          <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 1.5, md: 2 } }}>

            {/* Trend chart */}
            <Grid item xs={12} md={8}>
              <Card
                elevation={0}
                sx={{ height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}
              >
                <CardHeader
                  avatar={<TrendingUpIcon sx={{ color: palette.teal }} aria-hidden />}
                  title={
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Collections Trend
                    </Typography>
                  }
                  subheader={
                    <Typography variant="caption" color="text.secondary">
                      {granularity === 'DAY' ? 'Daily' : 'Weekly'} payment receipts
                    </Typography>
                  }
                  sx={{ pb: 0 }}
                />
                <CardContent sx={{ pt: 1 }}>
                  {trendError ? (
                    <ErrorCard message={trendError} onRetry={loadTrend} />
                  ) : (
                    <PaymentTrendChart
                      data={trend}
                      granularity={granularity}
                      loading={trendLoading}
                      color={palette.teal}
                      height={isMobile ? 200 : 260}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Payment method breakdown */}
            <Grid item xs={12} md={4}>
              <Card
                elevation={0}
                sx={{ height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}
              >
                <CardHeader
                  avatar={<PieChartIcon sx={{ color: '#6366F1' }} aria-hidden />}
                  title={
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Payment Methods
                    </Typography>
                  }
                  subheader={
                    <Typography variant="caption" color="text.secondary">
                      Breakdown by mode
                    </Typography>
                  }
                  sx={{ pb: 0 }}
                />
                <CardContent sx={{ pt: 1 }}>
                  {statsLoading ? (
                    <Skeleton variant="circular" width={180} height={180} sx={{ mx: 'auto', display: 'block', mt: 2 }} />
                  ) : !methodData.length ? (
                    <EmptyChart icon={PieChartIcon} label="No payment method data" height={220} color="#6366F1" />
                  ) : (
                    <Box sx={{ width: '100%', height: 240 }} role="img" aria-label="Payment method breakdown pie chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={methodData}
                            cx="50%"
                            cy="45%"
                            innerRadius={52}
                            outerRadius={82}
                            paddingAngle={2}
                            dataKey="value"
                            nameKey="name"
                            isAnimationActive
                            animationDuration={600}
                          >
                            {methodData.map((entry, idx) => (
                              <Cell
                                key={`cell-${idx}`}
                                fill={entry.color}
                                stroke={theme.palette.background.paper}
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <ReTooltip content={<PieCustomTooltip />} />
                          <Legend
                            iconType="circle"
                            iconSize={8}
                            formatter={(value) => (
                              <Typography component="span" variant="caption" sx={{ fontWeight: 600 }}>
                                {value}
                              </Typography>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ── Charts row 2: Top Customers + Aging ───────────────────────── */}
          <Grid container spacing={{ xs: 1.5, sm: 2 }}>

            {/* Top 5 customers bar chart */}
            <Grid item xs={12} md={7}>
              <Card
                elevation={0}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}
              >
                <CardHeader
                  avatar={<BarChartIcon sx={{ color: '#3B82F6' }} aria-hidden />}
                  title={
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Top 5 Customers
                    </Typography>
                  }
                  subheader={
                    <Typography variant="caption" color="text.secondary">
                      By total payment amount in period
                    </Typography>
                  }
                  sx={{ pb: 0 }}
                />
                <CardContent sx={{ pt: 1 }}>
                  {statsLoading ? (
                    <Stack spacing={1.5} sx={{ mt: 1 }}>
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} variant="rectangular" height={32} sx={{ borderRadius: 1 }} />
                      ))}
                    </Stack>
                  ) : !topCustomerData.length ? (
                    <EmptyChart icon={BarChartIcon} label="No customer payment data" height={200} color="#3B82F6" />
                  ) : (
                    <Box
                      sx={{ width: '100%', height: isMobile ? 220 : 260 }}
                      role="img"
                      aria-label="Top 5 customers by payment amount bar chart"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={topCustomerData}
                          layout="vertical"
                          margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} horizontal={false} />
                          <XAxis
                            type="number"
                            tickFormatter={barYFormatter}
                            tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={isMobile ? 80 : 110}
                            tick={{
                              fontSize: 11,
                              fill: theme.palette.text.secondary,
                            }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => v.length > 14 ? `${v.slice(0, 13)}…` : v}
                          />
                          <ReTooltip content={<BarCustomTooltip />} cursor={{ fill: alpha('#3B82F6', 0.06) }} />
                          <Bar dataKey="amount" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={600}>
                            {topCustomerData.map((entry, idx) => (
                              <Cell key={`bar-${idx}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Aging summary */}
            <Grid item xs={12} md={5}>
              <Card
                elevation={0}
                sx={{ height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}
              >
                <CardHeader
                  avatar={<TableChartIcon sx={{ color: '#F97316' }} aria-hidden />}
                  title={
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Receivables Aging
                    </Typography>
                  }
                  subheader={
                    <Typography variant="caption" color="text.secondary">
                      Outstanding by overdue period
                    </Typography>
                  }
                  sx={{ pb: 0 }}
                />
                <CardContent sx={{ pt: 2 }}>
                  {/* Aging rows */}
                  <AgingRow
                    label="0–30 days"
                    amount={stats?.agingSummary?.bucket0_30 ?? 0}
                    total={agingTotal}
                    color={AGING_COLORS['0–30d']}
                    loading={statsLoading}
                  />
                  <AgingRow
                    label="31–60 days"
                    amount={stats?.agingSummary?.bucket31_60 ?? 0}
                    total={agingTotal}
                    color={AGING_COLORS['31–60d']}
                    loading={statsLoading}
                  />
                  <AgingRow
                    label="61–90 days"
                    amount={stats?.agingSummary?.bucket61_90 ?? 0}
                    total={agingTotal}
                    color={AGING_COLORS['61–90d']}
                    loading={statsLoading}
                  />
                  <AgingRow
                    label="90+ days"
                    amount={stats?.agingSummary?.bucket90plus ?? 0}
                    total={agingTotal}
                    color={AGING_COLORS['90d+']}
                    loading={statsLoading}
                  />

                  <Divider sx={{ my: 1.5 }} />

                  {/* Total */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      Total Outstanding
                    </Typography>
                    {statsLoading
                      ? <Skeleton width={70} height={20} />
                      : (
                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          {formatINR(agingTotal)}
                        </Typography>
                      )
                    }
                  </Stack>

                  {/* Accessibility: table view */}
                  <Box
                    component="table"
                    sx={{ display: 'none' }}
                    aria-label="Aging summary table"
                  >
                    <caption>Receivables Aging Summary</caption>
                    <thead>
                      <tr>
                        <th scope="col">Bucket</th>
                        <th scope="col">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['0–30 days',  stats?.agingSummary?.bucket0_30],
                        ['31–60 days', stats?.agingSummary?.bucket31_60],
                        ['61–90 days', stats?.agingSummary?.bucket61_90],
                        ['90+ days',   stats?.agingSummary?.bucket90plus],
                      ].map(([label, val]) => (
                        <tr key={label}>
                          <td>{label}</td>
                          <td>{formatINR(val)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

        </Container>
      </Box>
    </LocalizationProvider>
  );
};

export default PaymentDashboard;
