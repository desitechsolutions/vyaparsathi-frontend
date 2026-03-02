import React, { useState, useEffect, useMemo, useCallback } from "react";
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

dayjs.extend(isBetween);

const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const InsightRow = ({ label, value, color, icon: Icon }) => (
  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.8 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Avatar sx={{ bgcolor: `${color}12`, color: color, width: 34, height: 34 }}>
        <Icon sx={{ fontSize: 19 }} />
      </Avatar>
      <Typography variant="body2" fontWeight="600" color="text.primary">
        {label}
      </Typography>
    </Box>
    <Typography variant="body2" fontWeight="700" color={color}>
      {value}
    </Typography>
  </Box>
);

const StatCard = ({ title, value, icon, color = "#1e40af", onClick, trend }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      borderRadius: 3,
      bgcolor: "#ffffff",
      height: "100%",
      border: "1px solid #e2e8f0",
      cursor: onClick ? "pointer" : "default",
      transition: "all 0.22s ease",
      "&:hover": {
        boxShadow: "0 8px 22px rgba(0,0,0,0.06)",
        borderColor: `${color}60`,
        transform: onClick ? "translateY(-3px)" : "none",
      },
    }}
    onClick={onClick}
  >
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
      <Avatar sx={{ bgcolor: `${color}12`, color: color, width: 42, height: 42, borderRadius: "10px" }}>
        {icon}
      </Avatar>
      {trend !== undefined && trend !== null && (
        <MuiTooltip title="Growth vs previous equivalent period">
          <Chip
            icon={<NorthEastIcon sx={{ fontSize: 14 }} />}
            label={`${trend > 0 ? "+" : ""}${trend}%`}
            size="small"
            color={trend >= 0 ? "success" : "error"}
            sx={{ fontWeight: 700 }}
          />
        </MuiTooltip>
      )}
    </Box>
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={600}
        sx={{ textTransform: "uppercase", letterSpacing: "0.5px" }}
      >
        {title}
      </Typography>
      <Typography variant="h5" fontWeight={800} color="#111827" mt={0.4}>
        {value}
      </Typography>
    </Box>
  </Paper>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { alerts: lowStockAlerts, alertCount: stockAlertCount, criticalCount } = useAlerts();
  const { t } = useTranslation();

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
    async (fromDate, toDate) => {
      setIsLoading(true);
      try {
        const todayStr = dayjs().format("YYYY-MM-DD");
        const results = await Promise.allSettled([
          fetchShop(),
          fetchCustomers(),
          fetchSalesSummary(fromDate, toDate),
          fetchCategorySales(fromDate, toDate),
          fetchItemsSold(fromDate, toDate),
          fetchAllSales(fromDate, toDate),
          fetchDailyReport(todayStr),
          fetchAllSales(todayStr, todayStr),
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
        const todaySalesRaw = getRes(results[7], []);

        const todaySalesFiltered = todaySalesRaw.filter(
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
        console.error("Dashboard fetch error:", e);
        setError(t('dashboardPage.errorLoad'));
      } finally {
        setIsLoading(false);
      }
    },
    [shop, t]
  );

  useEffect(() => {
    fetchDashboardData(range.from, range.to);
  }, [range, fetchDashboardData]);

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

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3.5, lg: 4 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      
{profileCompletion < 100 && !isLoading && (
  <Paper
    elevation={0}
    sx={{
      px: 2,
      py: 1.5,
      mb: 3,
      borderRadius: 3,
      border: "1px solid #e5e7eb",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "#ffffff",
      transition: "all 0.2s ease",
      "&:hover": {
        boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
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
      }}
    >
      Complete
    </Button>
  </Paper>
)}
      {/* Professional Shop Header */}
      {shop && (
        <Paper
          elevation={1}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            mb: 4,
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
            boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={2.5}>
            <Box>
              <Typography variant="h4" fontWeight={800} color="#1e293b" sx={{ letterSpacing: "-0.4px", mb: 0.5 }}>
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
              <Typography variant="h6" fontWeight={700} color="#334155">
                {dayjs().format("dddd, DD MMMM YYYY")}
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  {t('dashboardPage.lastUpdated')}: {dayjs(lastUpdated).format("hh:mm A")}
                </Typography>
                <IconButton size="small" onClick={() => fetchDashboardData(range.from, range.to)} sx={{ color: "#64748b" }}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Filter & Quick Actions */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", mb: 4, gap: 2.5 }}>
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            display: "flex",
            gap: 1.5,
            bgcolor: "#ffffff",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <ButtonGroup variant="outlined" size="small" color="primary">
            <Button onClick={() => setRange({ from: dayjs().format("YYYY-MM-DD"), to: dayjs().format("YYYY-MM-DD") })}>
              {t('dashboardPage.today')}
            </Button>
            <Button
              onClick={() => setRange({ from: dayjs().subtract(6, "day").format("YYYY-MM-DD"), to: dayjs().format("YYYY-MM-DD") })}
            >
              {t('dashboardPage.7Days')}
            </Button>
            <Button
              onClick={() => setRange({ from: dayjs().subtract(29, "day").format("YYYY-MM-DD"), to: dayjs().format("YYYY-MM-DD") })}
            >
              {t('dashboardPage.30Days')}
            </Button>
          </ButtonGroup>
          <Divider orientation="vertical" flexItem />
          <TextField
            type="date"
            size="small"
            label={t('dashboardPage.from')}
            value={range.from}
            onChange={(e) => setRange((p) => ({ ...p, from: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 135 }}
          />
          <TextField
            type="date"
            size="small"
            label={t('dashboardPage.to')}
            value={range.to}
            onChange={(e) => setRange((p) => ({ ...p, to: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 135 }}
          />
        </Paper>

        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          <Button variant="contained" startIcon={<ShoppingCartIcon />} onClick={() => navigate("/sales")} sx={{ borderRadius: 2.5, px: 3, fontWeight: 600 }}>
            {t('dashboardPage.newSale')}
          </Button>
          <Button variant="outlined" onClick={() => navigate("/sales?tab=history")} sx={{ borderRadius: 2.5 }}>
            {t('dashboardPage.viewSalesHistory')}
          </Button>
        </Stack>
      </Box>

      {isLoading ? (
        <Box sx={{ textAlign: "center", mt: 12 }}>
          <CircularProgress thickness={5} size={60} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      ) : (
        <>
          {/* Stat Cards */}
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
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

          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0" }} elevation={0}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={700} color="#1e293b">
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
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d) => dayjs(d).format("DD MMM")}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#64748b" }}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                      <Tooltip />
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
              <Paper sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0", height: "100%" }} elevation={0}>
                <Typography variant="h6" fontWeight={700} mb={2.5} color="#1e293b">
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
                      borderColor: stockAlertCount > 0 ? (criticalCount > 0 ? "#f87171" : "#fb923c") : "#86efac",
                      bgcolor: stockAlertCount > 0 ? (criticalCount > 0 ? "#fef2f2" : "#fff7ed") : "#f0fdf4",
                      cursor: stockAlertCount > 0 ? "pointer" : "default",
                      transition: "all 0.2s",
                      "&:hover": stockAlertCount > 0 ? { bgcolor: criticalCount > 0 ? "#fee2e2" : "#ffedd5" } : {},
                    }}
                    onClick={() => stockAlertCount > 0 && navigate("/low-stock-alerts")}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <WarningIcon
                        sx={{
                          color: stockAlertCount > 0 ? (criticalCount > 0 ? "#ef4444" : "#f97316") : "#16a34a",
                          fontSize: 36,
                        }}
                      />
                      <Box>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          color={stockAlertCount > 0 ? (criticalCount > 0 ? "#b91c1c" : "#c2410c") : "#15803d"}
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
                          borderBottom: i < dashboardData.topCustomers.length - 1 ? "1px dashed #e2e8f0" : "none",
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
                            size="small"
                            onClick={() => sendWhatsAppReminder(cust)}
                            sx={{ color: "#16a34a", bgcolor: "#f0fdf4", "&:hover": { bgcolor: "#dcfce7" } }}
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
      <Dialog open={todayModalOpen} onClose={() => setTodayModalOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          {t('dashboardPage.todaysTransactions')}
          <IconButton onClick={() => setTodayModalOpen(false)} sx={{ position: "absolute", right: 16, top: 16 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8fafc" }}>
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
      <Dialog open={itemModalOpen} onClose={() => setItemModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>{t('dashboardPage.productPerformance')}</DialogTitle>
        <DialogContent dividers>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8fafc" }}>
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