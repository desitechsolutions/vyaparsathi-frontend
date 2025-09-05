import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Grid, Paper, Typography, Box, CircularProgress, Button, ButtonGroup, TextField, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  fetchShop, fetchDailyReport, fetchSalesSummary, fetchCategorySales, fetchItemsSold,
  fetchCustomers, fetchAllSales,
} from "../services/api";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A020F0", "#FF6666"];
const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

// Custom label renderer for Pie Charts
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
  if (percent < 0.05) {
    return null;
  }
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="12px" fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Reusable StatCard component
const StatCard = ({ title, value, icon, color = "#1a237e", onClick, tooltip }) => (
  <Paper
    elevation={3}
    sx={{
      p: 2, textAlign: "center", borderRadius: "12px", bgcolor: "#fff", height: '100%',
      cursor: onClick ? "pointer" : "default",
      transition: "box-shadow .2s",
      "&:hover": { boxShadow: onClick ? 7 : 3 },
      display: 'flex', flexDirection: 'column', justifyContent: 'center'
    }}
    onClick={onClick}
    title={tooltip}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
      {icon}
      <Typography variant="body2" color="text.secondary">{title}</Typography>
    </Box>
    <Typography variant="h5" sx={{ fontWeight: "bold", color, mt: 1 }}>{value}</Typography>
    {onClick && <Typography variant="caption" color="primary" display="block" sx={{ mt: 0.5 }}>(View details)</Typography>}
  </Paper>
);

// Component to display in the center of a chart when there's no data
const NoDataDisplay = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
    <Typography color="text.secondary">No data available for this period</Typography>
  </Box>
);

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State Management
  const [shop, setShop] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    todayStats: { sales: 0, numberOfSales: 0, netRevenue: 0 },
    summaryStats: { totalSales: 0, totalSalesCount: 0, netRevenue: 0, outstandingReceivable: 0, netProfit: 0, totalPaid: 0, totalCOGS: 0 },
    totalCustomers: 0,
    categorySales: [],
    itemSales: [],
    salesTimeSeries: [],
    todaySales: [],
  });
  const [range, setRange] = useState({ from: dayjs().subtract(6, "day").format("YYYY-MM-DD"), to: dayjs().format("YYYY-MM-DD") });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Dialogs State
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemFilter, setItemFilter] = useState("");
  const [todayModalOpen, setTodayModalOpen] = useState(false);
  const [todayFilter, setTodayFilter] = useState("");

  // Centralized data fetching function
  const fetchDashboardData = useCallback(async (fromDate, toDate) => {
    setIsLoading(true);
    setError("");
    try {
      const today = dayjs().format("YYYY-MM-DD");
      const results = await Promise.allSettled([
        fetchShop(),
        fetchCustomers(),
        fetchSalesSummary(fromDate, toDate),
        fetchCategorySales(fromDate, toDate),
        fetchItemsSold(fromDate, toDate),
        fetchAllSales(fromDate, toDate),
        fetchDailyReport(today),
        fetchAllSales(today, today), // <-- This fetches ONLY today's sales
      ]);

      const getResultData = (result, fallback = null) => result.status === 'fulfilled' ? (result.value.data || fallback) : fallback;

      // Process all results first
      const shopRes = getResultData(results[0]);
      const customersRes = getResultData(results[1], []);
      const summaryRes = getResultData(results[2], {});
      const categoryRes = getResultData(results[3], []);
      const itemsRes = getResultData(results[4], []);
      const rangeSales = getResultData(results[5], []);
      const dailyRes = getResultData(results[6], {});
      const todaySalesRes = getResultData(results[7], []); // <-- Only today's sales

      // Prepare data for state update
      const itemMap = {};
      itemsRes.forEach(row => {
        if (!itemMap[row.itemName]) {
          itemMap[row.itemName] = { name: row.itemName, value: 0, totalSold: 0 };
        }
        itemMap[row.itemName].value += Number(row.totalSales || 0);
        itemMap[row.itemName].totalSold += Number(row.totalSold || 0);
      });

      const byDate = {};
      rangeSales.forEach(sale => {
        const date = sale.date ? sale.date.substring(0, 10) : "";
        if (!byDate[date]) byDate[date] = { date, totalSales: 0, count: 0 };
        byDate[date].totalSales += Number(sale.totalAmount || 0);
        byDate[date].count += 1;
      });
      const chartData = Object.values(byDate).sort((a, b) => new Date(a.date) - new Date(b.date));

      // Set shop info only if it's not already set
      if (!shop) setShop(shopRes);

      // Update all dashboard data in a single call
      setDashboardData({
        totalCustomers: customersRes.length,
        summaryStats: {
          totalSales: summaryRes.totalSales || 0,
          totalSalesCount: summaryRes.totalSalesCount || 0,
          netRevenue: summaryRes.netRevenue || 0,
          outstandingReceivable: summaryRes.outstandingReceivable || 0,
          netProfit: summaryRes.netProfit || 0,
          totalPaid: summaryRes.totalPaid || 0,
          totalCOGS: summaryRes.totalCOGS || 0,
        },
        categorySales: categoryRes.map(row => ({ name: row.categoryName, value: Number(row.totalSales || 0) })),
        itemSales: Object.values(itemMap),
        salesTimeSeries: chartData,
        todayStats: {
          sales: dailyRes.totalSales || 0,
          numberOfSales: dailyRes.numberOfSales || 0,
          netRevenue: dailyRes.netRevenue || 0,
        },
        todaySales: todaySalesRes, // <-- Only today's sales
      });

    } catch (e) {
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [shop]);

  useEffect(() => {
    fetchDashboardData(range.from, range.to);
  }, [range, fetchDashboardData]);

  const handleSetRange = (preset) => {
    let from, to = dayjs().format("YYYY-MM-DD");
    if (preset === 'today') {
      from = to;
    } else if (preset === '7days') {
      from = dayjs().subtract(6, 'day').format("YYYY-MM-DD");
    } else if (preset === '30days') {
      from = dayjs().subtract(29, 'day').format("YYYY-MM-DD");
    }
    setRange({ from, to });
  };

  // Memoized filters for dialogs
  const filteredItemSalesData = useMemo(() => dashboardData.itemSales.filter(item => item.name.toLowerCase().includes(itemFilter.toLowerCase())), [dashboardData.itemSales, itemFilter]);
  const filteredTodaySales = useMemo(() => {
    if (!todayFilter) {
      return dashboardData.todaySales;
    }
    return dashboardData.todaySales.filter(sale =>
      (sale.customerName && sale.customerName.toLowerCase().includes(todayFilter.toLowerCase())) ||
      (sale.invoiceNo && sale.invoiceNo.toLowerCase().includes(todayFilter.toLowerCase()))
    );
  }, [dashboardData.todaySales, todayFilter]);


  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 }, backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {shop && (
        <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: "#f8fafc" }}>
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "#1976d2" }}>{shop.name}</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>{shop.address}, {shop.state} {shop.gstin ? `| ${t("dashboardPage.gstin")}: ${shop.gstin}` : ""}</Typography>
        </Paper>
      )}

      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { md: "center" }, justifyContent: "space-between", mb: 3, gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ButtonGroup variant="outlined" size="small">
            <Button onClick={() => handleSetRange('today')}>Today</Button>
            <Button onClick={() => handleSetRange('7days')}>Last 7 Days</Button>
            <Button onClick={() => handleSetRange('30days')}>Last 30 Days</Button>
          </ButtonGroup>
          <TextField label="From" type="date" size="small" value={range.from} onChange={(e) => setRange(prev => ({ ...prev, from: e.target.value }))} sx={{ width: 160, bgcolor: "#fff", borderRadius: 1 }} InputLabelProps={{ shrink: true }} />
          <TextField label="To" type="date" size="small" value={range.to} onChange={(e) => setRange(prev => ({ ...prev, to: e.target.value }))} sx={{ width: 160, bgcolor: "#fff", borderRadius: 1 }} InputLabelProps={{ shrink: true }} />
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="contained" color="primary" onClick={() => navigate("/sales")}>{t("dashboardPage.addSale")}</Button>
          <Button variant="outlined" color="primary" onClick={() => navigate("/sales?tab=history")}>{t("dashboardPage.viewSalesHistory")}</Button>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}><CircularProgress /></Box>
      ) : (
        <>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2.4}><StatCard title={t("dashboardPage.todaysSales")} value={formatCurrency(dashboardData.todayStats.sales)} icon={<CurrencyRupeeIcon color="primary" />} onClick={() => setTodayModalOpen(true)} tooltip="Click to see today's sales details" /></Grid>
            <Grid item xs={12} sm={6} md={2.4}><StatCard title={t("dashboardPage.totalCustomers")} value={dashboardData.totalCustomers} icon={<PeopleIcon color="primary" />} /></Grid>
            <Grid item xs={12} sm={6} md={2.4}><StatCard title={t("dashboardPage.totalItemsSold")} value={dashboardData.itemSales.reduce((sum, i) => sum + i.totalSold, 0)} icon={<ShoppingCartIcon color="primary" />} onClick={() => setItemModalOpen(true)} tooltip="Click to view item-wise details" /></Grid>
            <Grid item xs={12} sm={6} md={2.4}><StatCard title={t("dashboardPage.outstandingDues")} value={formatCurrency(dashboardData.summaryStats.outstandingReceivable)} icon={<AccountBalanceWalletIcon color="error" />} color="#b71c1c" /></Grid>
            <Grid item xs={12} sm={6} md={2.4}><StatCard title={t("dashboardPage.netProfit")} value={formatCurrency(dashboardData.summaryStats.netProfit)} icon={<TrendingUpIcon color="success" />} color="#388e3c" /></Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mt: 4 }}>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: "12px", bgcolor: "#fff", height: 340 }}>
                <Typography variant="h6" gutterBottom align="center">Sales by Category</Typography>
                {dashboardData.categorySales.length > 0 ? (
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie 
                        data={dashboardData.categorySales} 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={100} 
                        fill="#1976d2" 
                        dataKey="value" 
                        nameKey="name"
                        labelLine={false}
                        label={renderCustomizedLabel}
                      >
                        {dashboardData.categorySales.map((entry, index) => (<Cell key={`cell-cat-${index}`} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <NoDataDisplay />}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: "12px", bgcolor: "#fff", height: 340 }}>
                <Typography variant="h6" gutterBottom align="center">Sales by Item</Typography>
                {dashboardData.itemSales.length > 0 ? (
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie 
                        data={dashboardData.itemSales} 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={100} 
                        fill="#388e3c" 
                        dataKey="value" 
                        nameKey="name"
                        labelLine={false}
                        label={renderCustomizedLabel}
                      >
                        {dashboardData.itemSales.map((entry, index) => (<Cell key={`cell-item-${index}`} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <NoDataDisplay />}
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mt: 4 }}>
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: "12px", bgcolor: "#fff" }}>
                <Typography variant="h6" gutterBottom>Sales Trend</Typography>
                {dashboardData.salesTimeSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={dashboardData.salesTimeSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => dayjs(date).format('MMM DD')}
                        padding={{ left: 20, right: 20 }}
                      />
                      <YAxis 
                        yAxisId="left" 
                        tickFormatter={(value) => `₹${value >= 1000 ? `${value/1000}k` : value}`}
                        label={{ value: 'Sales Amount (₹)', angle: -90, position: 'insideLeft', offset: 10, style: { textAnchor: 'middle' } }}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right"
                        label={{ value: 'Number of Sales', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
                      />
                      <Tooltip formatter={(value, name) => {
                        if (name === 'totalSales') return [formatCurrency(value), 'Sales'];
                        if (name === 'count') return [value, 'No. of Sales'];
                        return [value, name];
                      }} />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="totalSales" name="Sales" stroke="#1976d2" strokeWidth={2} activeDot={{ r: 8 }} />
                      <Line yAxisId="right" type="monotone" dataKey="count" name="No. of Sales" stroke="#00C49F" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <NoDataDisplay />}
              </Paper>
            </Grid>
          </Grid>
        </>
      )}

      {/* Dialogs */}
      <Dialog open={itemModalOpen} onClose={() => setItemModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Items Sold Details<IconButton aria-label="close" onClick={() => setItemModalOpen(false)} sx={{ position: "absolute", right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}><CloseIcon /></IconButton></DialogTitle>
        <DialogContent dividers>
          <TextField placeholder="Search by name" value={itemFilter} onChange={(e) => setItemFilter(e.target.value)} size="small" fullWidth sx={{ mb: 2 }} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>), }} />
          <Table size="small">
            <TableHead><TableRow><TableCell><b>Item Name</b></TableCell><TableCell align="right"><b>Quantity Sold</b></TableCell><TableCell align="right"><b>Total Sales</b></TableCell></TableRow></TableHead>
            <TableBody>
              {filteredItemSalesData.length === 0 ? (<TableRow><TableCell colSpan={3} align="center">No items sold found.</TableCell></TableRow>) : (filteredItemSalesData.map((item) => (<TableRow key={item.name}><TableCell>{item.name}</TableCell><TableCell align="right">{item.totalSold}</TableCell><TableCell align="right">{formatCurrency(item.value)}</TableCell></TableRow>)))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions><Button onClick={() => setItemModalOpen(false)} color="primary">Close</Button></DialogActions>
      </Dialog>
      <Dialog open={todayModalOpen} onClose={() => setTodayModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Today's Sales Details<IconButton aria-label="close" onClick={() => setTodayModalOpen(false)} sx={{ position: "absolute", right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}><CloseIcon /></IconButton></DialogTitle>
        <DialogContent dividers>
          <TextField placeholder="Search by customer or invoice" value={todayFilter} onChange={(e) => setTodayFilter(e.target.value)} size="small" fullWidth sx={{ mb: 2 }} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>), }} />
          <Table size="small">
            <TableHead><TableRow><TableCell><b>Invoice No</b></TableCell><TableCell><b>Customer Name</b></TableCell><TableCell align="right"><b>Total Amount</b></TableCell><TableCell align="right"><b>Total Paid</b></TableCell><TableCell align="right"><b>Due Amount</b></TableCell><TableCell align="right"><b>Date/Time</b></TableCell></TableRow></TableHead>
            <TableBody>
              {filteredTodaySales.length === 0 ? (<TableRow><TableCell colSpan={6} align="center">No sale for today.</TableCell></TableRow>) : (filteredTodaySales.map((sale, idx) => (<TableRow key={sale.invoiceNo || idx}><TableCell>{sale.invoiceNo || "-"}</TableCell><TableCell>{sale.customerName || "-"}</TableCell><TableCell align="right">{formatCurrency(sale.totalAmount)}</TableCell><TableCell align="right">{formatCurrency(sale.paidAmount)}</TableCell><TableCell align="right">{formatCurrency(sale.dueAmount)}</TableCell><TableCell align="right">{sale.date ? dayjs(sale.date).format('YYYY-MM-DD HH:mm') : "-"}</TableCell></TableRow>)))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions><Button onClick={() => setTodayModalOpen(false)} color="primary">Close</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;