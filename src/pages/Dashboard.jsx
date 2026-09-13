import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import { useAbortableAPI } from "../hooks/useAbortableAPI";
import { useWebSocketContext } from "../context/WebSocketContext";
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Button,
  ButtonGroup,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  InputAdornment,
  Chip,
  Divider,
  Avatar,
  Stack,
  Tooltip as MuiTooltip,
  Alert,
  LinearProgress,
  Skeleton,
  alpha,
} from "@mui/material";
import {
  Search as SearchIcon,
  Close as CloseIcon,
  CurrencyRupee as CurrencyRupeeIcon,
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  TrendingUp as TrendingUpIcon,
  Storefront,
  NorthEast as NorthEastIcon,
  Warning as WarningIcon,
  WhatsApp as WhatsAppIcon,
  Inventory as InventoryIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Settings as SettingsIcon,
  FiberManualRecord as LiveDotIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  fetchShop,
  fetchDailyReport,
  fetchSalesSummary,
  fetchCategorySales,
  fetchItemsSold,
  fetchCustomers,
  fetchAllSales,
} from "../services/api";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useAlerts } from "../context/AlertContext";
import { useTranslation } from "react-i18next";
import { useResponsiveTouchTarget } from "../utils/touchTargets";

dayjs.extend(isBetween);

const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const getContrastAccent = (colorHex, isDark) => {
  if (!isDark) return colorHex;
  const hex = (colorHex || '').toLowerCase();
  if (hex === '#2563eb' || hex === '#1e40af') return '#60a5fa';
  if (hex === '#7c3aed') return '#a78bfa';
  if (hex === '#ea580c') return '#fb923c';
  if (hex === '#dc2626') return '#f87171';
  if (hex === '#16a34a') return '#4ade80';
  return colorHex;
};

const InsightRow = ({ label, value, color, icon: Icon }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const activeColor = getContrastAccent(color, isDark);

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.8 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar sx={{ bgcolor: alpha(activeColor, isDark ? 0.2 : 0.12), color: activeColor, width: 34, height: 34 }}>
          <Icon sx={{ fontSize: 19 }} />
        </Avatar>
        <Typography variant="body2" fontWeight="600" color="text.primary">
          {label}
        </Typography>
      </Box>
      <Typography variant="body2" fontWeight="700" color={activeColor}>
        {value}
      </Typography>
    </Box>
  );
};

const StatCard = ({ title, value, icon, color = "#2563eb", onClick, trend }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const activeColor = getContrastAccent(color, isDark);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: "background.paper",
        height: "100%",
        border: "1px solid",
        borderColor: "divider",
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 150ms ease, box-shadow 150ms ease",
        "&:hover": onClick ? {
          borderColor: alpha(activeColor, 0.35),
          boxShadow: isDark ? "0 4px 14px rgba(0,0,0,0.35)" : "0 2px 8px rgba(15, 23, 42, 0.06)",
        } : {},
      }}
      onClick={onClick}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.25 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: alpha(activeColor, isDark ? 0.18 : 0.1),
            color: activeColor,
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: 20 } })}
        </Box>
        {trend !== undefined && trend !== null && (
          <MuiTooltip title="Growth vs previous equivalent period">
            <Chip
              icon={<NorthEastIcon sx={{ fontSize: 12 }} />}
              label={`${trend > 0 ? "+" : ""}${trend}%`}
              size="small"
              color={trend >= 0 ? "success" : "error"}
              sx={{ fontWeight: 600, height: 22, fontSize: "0.72rem" }}
            />
          </MuiTooltip>
        )}
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          display: "block",
          fontWeight: 600,
          fontSize: "0.72rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          lineHeight: 1.4,
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "text.primary",
          mt: 0.25,
          lineHeight: 1.2,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { alerts: lowStockAlerts, alertCount: stockAlertCount, criticalCount } = useAlerts();
  const { t } = useTranslation();
  const abortController = useAbortableAPI();

  const [shop, setShop] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    todayStats: { sales: 0, numberOfSales: 0 },
    summaryStats: { totalSales: 0, totalSalesCount: 0, outstandingReceivable: 0, netProfit: 0 },
    totalCustomers: 0,
    categorySales: [],
    itemSales: [],
    salesTimeSeries: [],
    todaySales: [],
    topCustomers: [],
  });

  const [range, setRange] = useState({
    from: dayjs().subtract(6, "day").format("YYYY-MM-DD"),
    to: dayjs().format("YYYY-MM-DD"),
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [todayModalOpen, setTodayModalOpen] = useState(false);
  const [salesGrowth, setSalesGrowth] = useState(0);
  const [profitGrowth, setProfitGrowth] = useState(0);

  // ── Real-time sales via WebSocket ────────────────────────────────────────────
  // The `ws:sales` CustomEvent is dispatched by useWebSocket whenever the
  // STOMP broker publishes to /topic/shop/{shopId}/sales.
  // Payload: { saleId, amount, timestamp, cashier }
  // We update the KPI strip and Today's Sales table in-place — no refetch.
  const { connected: wsConnected } = useWebSocketContext();
  const liveNewSaleRef = useRef(0); // count of WS-injected sales since last full reload

  useEffect(() => {
    const handleSale = (e) => {
      const sale = e.detail;
      if (!sale) return;

      liveNewSaleRef.current += 1;

      setDashboardData((prev) => {
        const amount = Number(sale.amount || 0);
        const todayStr = dayjs().format("YYYY-MM-DD");
        const newSaleRow = {
          invoiceNo:   sale.invoiceNo || `#${sale.saleId || '—'}`,
          customer:    { name: sale.customerName || null },
          date:        sale.timestamp || new Date().toISOString(),
          totalAmount: amount,
          dueAmount:   sale.dueAmount ?? 0,
        };

        return {
          ...prev,
          todayStats: {
            ...prev.todayStats,
            sales:         (prev.todayStats.sales || 0) + amount,
            numberOfSales: (prev.todayStats.numberOfSales || 0) + 1,
          },
          // Prepend to today's sales so the newest invoice appears first
          todaySales: [newSaleRow, ...prev.todaySales],
          // Update the time-series last data point for today
          salesTimeSeries: (() => {
            const series = [...(prev.salesTimeSeries || [])];
            const lastIdx = series.findIndex((p) => p.date === todayStr);
            if (lastIdx >= 0) {
              series[lastIdx] = { ...series[lastIdx], totalSales: series[lastIdx].totalSales + amount };
            } else {
              series.push({ date: todayStr, totalSales: amount, count: 1 });
            }
            return series;
          })(),
        };
      });

      setLastUpdated(new Date());
    };

    window.addEventListener('ws:sales', handleSale);
    return () => window.removeEventListener('ws:sales', handleSale);
  }, []);

const setupChecklist = useMemo(() => {
  if (!shop) return [];

  return [
    {
      id: "business",
      label: "Business Info",
      items: [
        !!shop.name,
        !!shop.code,
        !!shop.industryType,
        !!shop.state,
      ],
      weight: 30,
    },
    {
      id: "branding",
      label: "Branding",
      items: [
        !!shop.logoPath,
        !!shop.brandColor,
      ],
      weight: 25,
    },
    {
      id: "compliance",
      label: "Compliance",
      items: [
        !!shop.gstin,
        !!shop.address,
      ],
      weight: 20,
    },
    {
      id: "finance",
      label: "Bank & Signature",
      items: [
        !!shop.bankDetails && shop.bankDetails.trim().length > 10,
        !!shop.signaturePath,
      ],
      weight: 25,
    },
  ];
}, [shop]);

  const profileCompletion = useMemo(() => {
  if (!setupChecklist.length) return 0;

  return setupChecklist.reduce((acc, section) => {
    const completedItems = section.items.filter(Boolean).length;
    const sectionCompletion =
      (completedItems / section.items.length) * section.weight;

    return acc + sectionCompletion;
  }, 0);
}, [setupChecklist]);

  const fetchDashboardData = useCallback(
    async (fromDate, toDate, signal) => {
      setIsLoading(true);
      try {
        const todayStr = dayjs().format("YYYY-MM-DD");
        const results = await Promise.allSettled([
          fetchShop(signal),
          fetchCustomers(signal),
          fetchSalesSummary(fromDate, toDate, signal),
          fetchCategorySales(fromDate, toDate, signal),
          fetchItemsSold(fromDate, toDate, signal),
          fetchAllSales(fromDate, toDate, signal),
          fetchDailyReport(todayStr, signal),
        ]);

        const getRes = (res, fallback = []) =>
          res.status === "fulfilled" ? res.value.data || res.value || fallback : fallback;

        const shopRes = getRes(results[0], null);
        const customersRes = getRes(results[1], []);
        const summaryRes = getRes(results[2], {});
        const categoryRes = getRes(results[3], []);
        const itemsRes = getRes(results[4], []);
        const rangeSalesRaw = getRes(results[5], []);
        const dailyRes = getRes(results[6], {});

        // Derive today's sales from the range result — avoids a duplicate API call.
        // If the selected range doesn't include today (e.g. a past-week report),
        // todaySales will simply be empty, which is the correct behaviour.
        const todaySalesFiltered = rangeSalesRaw.filter(
          (sale) => dayjs(sale.date).format("YYYY-MM-DD") === todayStr
        );

        const byDate = {};
        rangeSalesRaw.forEach((sale) => {
          const d = dayjs(sale.date).format("YYYY-MM-DD");
          if (dayjs(d).isBetween(fromDate, toDate, "day", "[]")) {
            if (!byDate[d]) byDate[d] = { date: d, totalSales: 0, count: 0 };
            byDate[d].totalSales += Number(sale.totalAmount || 0);
            byDate[d].count += 1;
          }
        });

        if (!shop) setShop(shopRes);

        setDashboardData({
          totalCustomers: customersRes.length,
          summaryStats: summaryRes,
          categorySales: categoryRes.map((r) => ({ name: r.categoryName, value: Number(r.totalSales) })),
          itemSales: itemsRes.map((r) => ({
            name: r.itemName,
            value: Number(r.totalSales),
            totalSold: r.totalSold,
          })),
          salesTimeSeries: Object.values(byDate).sort(
            (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix()
          ),
          todayStats: {
            sales: dailyRes.totalSales || 0,
            numberOfSales: dailyRes.numberOfSales || 0,
            netRevenue: dailyRes.netRevenue || 0,
          },
          todaySales: todaySalesFiltered,
          topCustomers: customersRes
            .filter((c) => c.creditBalance > 0)
            .sort((a, b) => b.creditBalance - a.creditBalance)
            .slice(0, 5),
        });

        // Set dynamic growth percentages from backend
        setSalesGrowth(Number(summaryRes.salesGrowthPercent || 0));
        setProfitGrowth(Number(summaryRes.profitGrowthPercent || 0));

        setLastUpdated(new Date());
      } catch (e) {
        if (axios.isCancel(e)) return; // component unmounted — discard silently
        console.error("Dashboard fetch error:", e);
        setError(t('dashboardPage.errorLoad'));
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    fetchDashboardData(range.from, range.to, abortController?.signal);
  }, [range, fetchDashboardData, abortController]);


  const avgTicketSize = useMemo(() => {
    const total = dashboardData.summaryStats.totalSales || 0;
    const count = dashboardData.summaryStats.totalSalesCount || 0;
    return count > 0 ? formatCurrency(total / count) : "₹0";
  }, [dashboardData.summaryStats]);

  const sendWhatsAppReminder = (customer) => {
    const message = `${t('dashboardPage.hello')} ${customer.name}, ${t('dashboardPage.reminderFrom')} ${shop?.name || t('dashboardPage.ourShop')} ${t('dashboardPage.pendingBalance')} ₹${customer.creditBalance}. ${t('dashboardPage.pleaseClear')}`;
    const url = `https://wa.me/91${customer.phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const chartColor = theme.palette.text.secondary;
  const chartGrid = theme.palette.divider;

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, bgcolor: "background.default", minHeight: "100vh" }}>
      
{profileCompletion < 100 && !isLoading && (
  <Paper
    elevation={0}
    sx={{
      px: 2,
      py: 1.5,
      mb: 3,
      borderRadius: 3,
      border: "1px solid",
      borderColor: "divider",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      bgcolor: "background.paper",
      transition: "all 0.2s ease",
      "&:hover": {
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
      },
    }}
  >
    <Stack direction="row" spacing={2} alignItems="center">
      
      {/* Compact Circular Progress */}
      <Box sx={{ position: "relative", display: "inline-flex" }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={42}
          thickness={3}
          sx={{ color: "#f1f5f9", position: "absolute" }}
        />
        <CircularProgress
          variant="determinate"
          value={profileCompletion}
          size={42}
          thickness={4}
          sx={{
            color:
              profileCompletion > 80
                ? "#10b981"
                : profileCompletion > 40
                ? "#3b82f6"
                : "#f59e0b",
            strokeLinecap: "round",
          }}
        />
        <Box
          sx={{
            inset: 0,
            position: "absolute",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: 800, fontSize: "0.7rem" }}
          >
            {Math.round(profileCompletion)}%
          </Typography>
        </Box>
      </Box>

      {/* Text Content */}
      <Box>
        <Typography fontWeight={700} fontSize="0.85rem">
          Complete Your Business Profile
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Finalize your branding and bank details to generate professional, GST-compliant invoices.
        </Typography>
      </Box>
    </Stack>

    <Button
      size="small"
      onClick={() => navigate("/admin/settings")}
      sx={{
        textTransform: "none",
        fontWeight: 700,
        borderRadius: 2,
        minWidth: "auto",
        minHeight: 44,
        py: { xs: 1, md: 1.5 },
      }}
    >
      Complete
    </Button>
  </Paper>
)}
      {/* Professional Shop Header */}
      {shop && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 2.5 },
            mb: 3,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={2.5}>
            <Box>
              <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: "-0.4px", mb: 0.5 }}>
                {shop.name}
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ opacity: 0.9 }}>
                <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                  <Storefront fontSize="small" /> {shop.address}
                </Typography>
                {shop.gstin && (
                  <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                    • GSTIN: {shop.gstin}
                  </Typography>
                )}
              </Stack>
            </Box>

            <Stack alignItems={{ md: "flex-end" }} spacing={0.5}>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                {dayjs().format("dddd, DD MMMM YYYY")}
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                {/* LIVE indicator — pulses when the WebSocket is connected */}
                {wsConnected && (
                  <MuiTooltip title="Live data — updates automatically via WebSocket">
                    <Chip
                      icon={<LiveDotIcon sx={{ fontSize: '10px !important', animation: 'vs-pulse 1.6s ease-in-out infinite', '@keyframes vs-pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} />}
                      label="LIVE"
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', px: 0.5, '& .MuiChip-icon': { ml: 0.5 } }}
                    />
                  </MuiTooltip>
                )}
                <Typography variant="caption" color="text.secondary">
                  {t('dashboardPage.lastUpdated')}: {dayjs(lastUpdated).format("hh:mm A")}
                </Typography>
                <IconButton
                  onClick={() => fetchDashboardData(range.from, range.to)}
                  sx={{ color: "text.secondary", minWidth: 44, minHeight: 44 }}
                  aria-label="Refresh dashboard"
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Unified control bar — date range on the left, primary actions on the right.
          One Paper, one hairline border. Segmented button group + inline date pickers. */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, md: 1.75 },
          mb: 3,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { md: "center" },
          justifyContent: "space-between",
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <ButtonGroup
            variant="outlined"
            size="small"
            color="primary"
            sx={{
              "& .MuiButton-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.8rem",
                px: 1.5,
              },
            }}
          >
            <Button onClick={() => setRange({ from: dayjs().format("YYYY-MM-DD"), to: dayjs().format("YYYY-MM-DD") })}>
              {t('dashboardPage.today')}
            </Button>
            <Button onClick={() => setRange({ from: dayjs().subtract(6, "day").format("YYYY-MM-DD"), to: dayjs().format("YYYY-MM-DD") })}>
              {t('dashboardPage.7Days')}
            </Button>
            <Button onClick={() => setRange({ from: dayjs().subtract(29, "day").format("YYYY-MM-DD"), to: dayjs().format("YYYY-MM-DD") })}>
              {t('dashboardPage.30Days')}
            </Button>
          </ButtonGroup>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
          <TextField
            type="date"
            size="small"
            label={t('dashboardPage.from')}
            value={range.from}
            onChange={(e) => setRange((p) => ({ ...p, from: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 145 }}
          />
          <TextField
            type="date"
            size="small"
            label={t('dashboardPage.to')}
            value={range.to}
            onChange={(e) => setRange((p) => ({ ...p, to: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 145 }}
          />
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate("/sales?tab=history")}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, minHeight: 44, py: { xs: 1, md: 1.5 } }}
          >
            {t('dashboardPage.viewSalesHistory')}
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<ShoppingCartIcon />}
            onClick={() => navigate("/sales")}
            sx={{ borderRadius: 2, px: 2.25, textTransform: "none", fontWeight: 600, minHeight: 44, py: { xs: 1, md: 1.5 } }}
          >
            {t('dashboardPage.newSale')}
          </Button>
        </Stack>
      </Paper>

      {isLoading ? (
        <Box>
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Grid item xs={6} sm={4} md={2.4} key={i}>
                <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: "background.paper" }} elevation={0}>
                  <Skeleton variant="circular" width={42} height={42} sx={{ mb: 1.5 }} />
                  <Skeleton variant="text" width="60%" height={20} />
                  <Skeleton variant="text" width="80%" height={32} />
                </Paper>
              </Grid>
            ))}
          </Grid>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 3, borderRadius: 3, bgcolor: "background.paper", height: 350 }} elevation={0}>
                <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" width="100%" height={250} sx={{ borderRadius: 2 }} />
              </Paper>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 3, borderRadius: 3, bgcolor: "background.paper", height: 350 }} elevation={0}>
                <Skeleton variant="text" width="50%" height={30} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" width="100%" height={250} sx={{ borderRadius: 2 }} />
              </Paper>
            </Grid>
          </Grid>
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      ) : (
        <>
          {/* Stat Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={4} md={2.4}>
              <StatCard
                title={t('dashboardPage.todaysSales')}
                value={formatCurrency(dashboardData.todayStats.sales)}
                icon={<CurrencyRupeeIcon />}
                color="#2563eb"
                onClick={() => setTodayModalOpen(true)}
                trend={salesGrowth}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <StatCard title={t('dashboardPage.totalCustomers')} value={dashboardData.totalCustomers} icon={<PeopleIcon />} color="#7c3aed" />
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <StatCard
                title={t('dashboardPage.totalItemsSold')}
                value={dashboardData.itemSales.reduce((s, i) => s + (i.totalSold || 0), 0)}
                icon={<InventoryIcon />}
                color="#ea580c"
                onClick={() => setItemModalOpen(true)}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <StatCard
                title={t('dashboardPage.outstandingDues')}
                value={formatCurrency(dashboardData.summaryStats.outstandingReceivable)}
                icon={<AccountBalanceWalletIcon />}
                color="#dc2626"
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <StatCard
                title={t('dashboardPage.netProfit')}
                value={formatCurrency(dashboardData.summaryStats.netProfit)}
                icon={<TrendingUpIcon />}
                color="#16a34a"
                trend={profitGrowth}
              />
            </Grid>
          </Grid>

          {/* Recent Invoices + Stock Alerts — enterprise-grade activity strip.
              Left col (7/12): today's transactions with status pills. Uses the
              same todaySales data source the Today's Sales modal reads — no
              additional API round-trips. Right col (5/12): stock alert widget
              summarizing critical vs warning items from the shared AlertContext. */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} lg={7}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <Box sx={{
                  px: 2.5, py: 1.75,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid",
                  borderBottomColor: "divider",
                }}>
                  <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: "text.primary" }}>
                    Recent Invoices
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => navigate("/sales?tab=history")}
                    sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.78rem" }}
                  >
                    View all
                  </Button>
                </Box>
                <Box sx={{ overflowX: "auto", flex: 1 }}>
                  <Table size="small" sx={{
                    "& .MuiTableCell-root": { borderBottomColor: "divider", py: 1.25, fontSize: "0.82rem" },
                  }}>
                    <TableHead>
                      <TableRow sx={{
                        "& .MuiTableCell-root": {
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          textTransform: "uppercase",
                          letterSpacing: 0.4,
                          color: "text.secondary",
                          bgcolor: "transparent",
                          py: 1,
                        },
                      }}>
                        <TableCell>Invoice</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right" />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData.todaySales.length > 0 ? (
                        dashboardData.todaySales.slice(0, 6).map((s, i) => {
                          const isPaid = !s.dueAmount || Number(s.dueAmount) <= 0;
                          const isPartial = Number(s.dueAmount) > 0 && Number(s.dueAmount) < Number(s.totalAmount);
                          const statusMeta = isPaid
                            ? { label: "PAID", color: theme.palette.success.main }
                            : isPartial
                              ? { label: "PARTIAL", color: theme.palette.warning.main }
                              : { label: "UNPAID", color: theme.palette.error.main };
                          return (
                            <TableRow
                              key={i}
                              hover
                              sx={{ cursor: "pointer" }}
                              onClick={() => navigate("/sales?tab=history")}
                            >
                              <TableCell sx={{
                                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                                fontWeight: 600,
                              }}>
                                {s.invoiceNo || "—"}
                              </TableCell>
                              <TableCell>{s.customer?.name || s.customerName || t('dashboardPage.walkIn')}</TableCell>
                              <TableCell sx={{ color: "text.secondary" }}>
                                {s.date ? dayjs(s.date).format("DD MMM, hh:mm A") : "—"}
                              </TableCell>
                              <TableCell align="right" sx={{
                                fontWeight: 600,
                                fontVariantNumeric: "tabular-nums",
                                whiteSpace: "nowrap",
                              }}>
                                {formatCurrency(s.totalAmount)}
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
                                  <Box
                                    component="span"
                                    sx={{
                                      width: 7,
                                      height: 7,
                                      borderRadius: "50%",
                                      bgcolor: statusMeta.color,
                                      boxShadow: `0 0 0 2px ${alpha(statusMeta.color, 0.15)}`,
                                    }}
                                  />
                                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
                                    {statusMeta.label}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                <IconButton
                                  onClick={(e) => { e.stopPropagation(); navigate("/sales?tab=history"); }}
                                  aria-label="Open invoice"
                                  sx={{ minWidth: 44, minHeight: 44 }}
                                >
                                  <NorthEastIcon sx={{ fontSize: 15 }} />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 5, color: "text.secondary" }}>
                            <Typography variant="body2">No invoices for the selected period.</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={5}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box sx={{
                  px: 2.5, py: 1.75,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid",
                  borderBottomColor: "divider",
                }}>
                  <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: "text.primary" }}>
                    Stock Alerts
                  </Typography>
                  <Chip
                    label={stockAlertCount > 0 ? `${stockAlertCount} item${stockAlertCount === 1 ? "" : "s"}` : "All healthy"}
                    size="small"
                    color={criticalCount > 0 ? "error" : stockAlertCount > 0 ? "warning" : "success"}
                    variant="outlined"
                    sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                  />
                </Box>
                <Box sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Stack direction="row" spacing={1.5}>
                    <Box
                      sx={{
                        flex: 1,
                        p: 1.5,
                        borderRadius: 1.5,
                        border: "1px solid",
                        borderColor: alpha(theme.palette.error.main, 0.2),
                        bgcolor: alpha(theme.palette.error.main, isDark ? 0.14 : 0.05),
                      }}
                    >
                      <Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.4 }}>
                        Critical
                      </Typography>
                      <Typography sx={{ fontSize: "1.5rem", fontWeight: 700, color: "error.main", lineHeight: 1.2, mt: 0.25, fontVariantNumeric: "tabular-nums" }}>
                        {criticalCount}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        flex: 1,
                        p: 1.5,
                        borderRadius: 1.5,
                        border: "1px solid",
                        borderColor: alpha(theme.palette.warning.main, 0.2),
                        bgcolor: alpha(theme.palette.warning.main, isDark ? 0.14 : 0.05),
                      }}
                    >
                      <Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.4 }}>
                        Warning
                      </Typography>
                      <Typography sx={{ fontSize: "1.5rem", fontWeight: 700, color: "warning.main", lineHeight: 1.2, mt: 0.25, fontVariantNumeric: "tabular-nums" }}>
                        {Math.max(0, stockAlertCount - criticalCount)}
                      </Typography>
                    </Box>
                  </Stack>
                  <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", mt: 0.5 }}>
                    {lowStockAlerts && lowStockAlerts.length > 0 ? (
                      lowStockAlerts.slice(0, 4).map((alert, i) => (
                        <Box
                          key={i}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            py: 1,
                            borderBottom: i < Math.min(3, lowStockAlerts.length - 1) ? "1px solid" : "none",
                            borderBottomColor: "divider",
                          }}
                        >
                          <Box sx={{ minWidth: 0, flex: 1, pr: 1 }}>
                            <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "text.primary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {alert.itemName || alert.name || "Item"}
                            </Typography>
                            <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                              Stock: {alert.currentStock ?? alert.stock ?? 0}
                            </Typography>
                          </Box>
                          <Box
                            component="span"
                            sx={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              bgcolor: (alert.currentStock ?? 0) === 0 ? "error.main" : "warning.main",
                              flexShrink: 0,
                            }}
                          />
                        </Box>
                      ))
                    ) : (
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 3, gap: 1 }}>
                        <CheckCircleIcon sx={{ fontSize: 16, color: "success.main" }} />
                        <Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>
                          All stock levels are healthy.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  {stockAlertCount > 0 && (
                    <Button
                      size="small"
                      variant="outlined"
                      fullWidth
                      onClick={() => navigate("/low-stock-alerts")}
                      sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5 }}
                    >
                      View all alerts
                    </Button>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={2.5}>
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }} elevation={0}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={700} color="text.primary">
                    {t('dashboardPage.revenueTrend')}
                  </Typography>
                  {salesGrowth !== 0 && (
                    <MuiTooltip title={t('dashboardPage.growthVsPrevious')}>
                      <Chip
                        icon={<NorthEastIcon sx={{ fontSize: 14 }} />}
                        label={`Period: ${salesGrowth > 0 ? "+" : ""}${salesGrowth}%`}
                        size="small"
                        color={salesGrowth >= 0 ? "success" : "error"}
                      />
                    </MuiTooltip>
                  )}
                </Stack>
                <Box sx={{ height: 360 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardData.salesTimeSeries}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d) => dayjs(d).format("DD MMM")}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: chartColor }}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: chartColor }} />
                      <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, color: theme.palette.text.primary }} />
                      <Line
                        type="monotone"
                        dataKey="totalSales"
                        name={t('dashboardPage.chartSales')}
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ r: 5, strokeWidth: 2 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", height: "100%" }} elevation={0}>
                <Typography variant="h6" fontWeight={700} mb={2.5} color="text.primary">
                  {t('dashboardPage.quickInsights')}
                </Typography>

                {criticalCount > 0 && (
                  <Alert
                    severity="error"
                    variant="filled"
                    icon={<WarningIcon />}
                    action={
                      <Button
                        color="inherit"
                        size="small"
                        sx={{ fontWeight: 600, whiteSpace: "nowrap" }}
                        onClick={() => navigate("/low-stock-alerts")}
                      >
                        {t('dashboardPage.reviewNow')}
                      </Button>
                    }
                    sx={{ mb: 3, borderRadius: 2, fontWeight: 500 }}
                  >
                    {criticalCount} {t('dashboardPage.criticalLowStockItems')} — {t('dashboardPage.restockUrgently')}
                  </Alert>
                )}

                <Box sx={{ mb: 3.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={1.5} sx={{ textTransform: "uppercase", letterSpacing: "0.6px" }}>
                    {t('dashboardPage.inventoryStatus')}
                  </Typography>

                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: 2.5,
                      borderColor: stockAlertCount > 0 ? (criticalCount > 0 ? "error.main" : "warning.main") : "success.main",
                      bgcolor: alpha(
                        stockAlertCount > 0
                          ? (criticalCount > 0 ? theme.palette.error.main : theme.palette.warning.main)
                          : theme.palette.success.main,
                        theme.palette.mode === 'dark' ? 0.18 : 0.08
                      ),
                      cursor: stockAlertCount > 0 ? "pointer" : "default",
                      transition: "all 0.2s",
                    }}
                    onClick={() => stockAlertCount > 0 && navigate("/low-stock-alerts")}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <WarningIcon
                        sx={{
                          color: stockAlertCount > 0 ? (criticalCount > 0 ? "error.main" : "warning.main") : "success.main",
                          fontSize: 36,
                        }}
                      />
                      <Box>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          color={stockAlertCount > 0 ? (criticalCount > 0 ? "error.main" : "warning.main") : "success.main"}
                        >
                          {criticalCount > 0
                            ? `${criticalCount} ${t('dashboardPage.critical')}`
                            : stockAlertCount > 0
                            ? `${stockAlertCount} ${t('dashboardPage.lowStock')}`
                            : t('dashboardPage.healthyStock')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stockAlertCount > 0 ? t('dashboardPage.clickToViewRestock') : t('dashboardPage.noAlerts')}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={1.5} sx={{ textTransform: "uppercase", letterSpacing: "0.6px" }}>
                    {t('dashboardPage.topOutstanding')}
                  </Typography>
                  {dashboardData.topCustomers.length > 0 ? (
                    dashboardData.topCustomers.map((cust, i) => (
                      <Box
                        key={i}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1.8,
                          pb: 1.2,
                          borderBottom: i < dashboardData.topCustomers.length - 1 ? "1px dashed" : "none",
                          borderColor: "divider",
                        }}
                      >
                        <Box>
                          <Typography variant="body1" fontWeight={600}>
                            {cust.name}
                          </Typography>
                          <Typography variant="caption" color="error.main" fontWeight={600}>
                            {formatCurrency(cust.creditBalance)}
                          </Typography>
                        </Box>
                        <MuiTooltip title={t('dashboardPage.sendWhatsAppReminder')}>
                          <IconButton
                            onClick={() => sendWhatsAppReminder(cust)}
                            sx={{
                              color: "success.main",
                              bgcolor: alpha(theme.palette.success.main, 0.15),
                              "&:hover": { bgcolor: alpha(theme.palette.success.main, 0.25) },
                              minWidth: 44,
                              minHeight: 44,
                            }}
                            aria-label={`Send WhatsApp reminder to ${cust.name}`}
                          >
                            <WhatsAppIcon fontSize="small" />
                          </IconButton>
                        </MuiTooltip>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      {t('dashboardPage.noPendingReceivables')}
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}

      {/* Today's Sales Modal */}
      <Dialog open={todayModalOpen} onClose={() => setTodayModalOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile} PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          {t('dashboardPage.todaysTransactions')}
          <IconButton
            onClick={() => setTodayModalOpen(false)}
            sx={{ position: "absolute", right: 16, top: 16, minWidth: 44, minHeight: 44 }}
            aria-label="Close dialog"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell>{t('dashboardPage.invoice')}</TableCell>
                <TableCell>{t('dashboardPage.customer')}</TableCell>
                <TableCell align="right">{t('dashboardPage.amount')}</TableCell>
                <TableCell align="right">{t('dashboardPage.status')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dashboardData.todaySales.length > 0 ? (
                dashboardData.todaySales.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <b>{s.invoiceNo}</b>
                    </TableCell>
                    <TableCell>{s.customer?.name || t('dashboardPage.walkIn')}</TableCell>
                    <TableCell align="right">
                      <b>{formatCurrency(s.totalAmount)}</b>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={s.dueAmount > 0 ? t('dashboardPage.due') : t('dashboardPage.paid')}
                        color={s.dueAmount > 0 ? "error" : "success"}
                        size="small"
                        sx={{ fontWeight: "bold" }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">{t('dashboardPage.noTransactionsToday')}</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Items Sold Modal */}
      <Dialog open={itemModalOpen} onClose={() => setItemModalOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile} PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>{t('dashboardPage.productPerformance')}</DialogTitle>
        <DialogContent dividers>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>{t('dashboardPage.item')}</TableCell>
                <TableCell align="right">{t('dashboardPage.qtySold')}</TableCell>
                <TableCell align="right">{t('dashboardPage.revenue')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dashboardData.itemSales.length > 0 ? (
                dashboardData.itemSales.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="right">{item.totalSold || 0}</TableCell>
                    <TableCell align="right">
                      <b>{formatCurrency(item.value)}</b>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">{t('dashboardPage.noItemsSold')}</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Dashboard;