import React, { useState, useEffect } from 'react';
import {
  Grid, Paper, Typography, Box, CircularProgress, Button, TextField, Alert
} from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  fetchShop,
  fetchDailyReport,
  fetchSalesSummary,
  fetchSalesWithDue,
  fetchCategorySales,
  fetchCustomers,
  fetchItemsSold
} from '../services/api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A020F0', '#FF6666'];

const Dashboard = () => {
  const { t } = useTranslation();
  const [shop, setShop] = useState(null);
  const [todayStats, setTodayStats] = useState({ sales: 0, numberOfSales: 0, netRevenue: 0 });
  const [summaryStats, setSummaryStats] = useState({
    totalSales: 0, totalSalesCount: 0, netRevenue: 0, outstandingReceivable: 0
  });
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalItemsSold, setTotalItemsSold] = useState(0);
  const [weeklySalesData, setWeeklySalesData] = useState([]);
  const [categorySalesData, setCategorySalesData] = useState([]);
  const [dues, setDues] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD')); // for today's stats
  const [summaryRange, setSummaryRange] = useState({ from: '', to: '' });

  const navigate = useNavigate();

  // Helper function to ignore specific API errors (for endpoints not implemented yet)
  const ignoreApiError = (err) => {
    // Ignore 404s for category-sales/items-sold
    if (err?.response?.config?.url?.includes('category-sales')) return true;
    if (err?.response?.config?.url?.includes('items-sold')) return true;
    return false;
  };

  // Load static/fixed data on mount (shop/customers/items/category)
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError('');
    Promise.allSettled([
      fetchShop(),
      fetchCustomers(),
      fetchItemsSold(),
      fetchCategorySales(),
      fetchSalesWithDue(),
    ]).then((results) => {
      if (!isMounted) return;
      // Results: [{status, value/reason}, ...]
      let hasCriticalError = false;
      // Shop
      if (results[0].status === 'fulfilled') {
        setShop(results[0].value.data);
      } else {
        hasCriticalError = true;
      }
      // Customers
      if (results[1].status === 'fulfilled') {
        setTotalCustomers(Array.isArray(results[1].value.data) ? results[1].value.data.length : 0);
      }
      // Items Sold
      if (results[2].status === 'fulfilled') {
        setTotalItemsSold(results[2].value.data?.totalItemsSold || 0);
      }
      // Category Sales (ignore error if endpoint missing)
      if (results[3].status === 'fulfilled') {
        setCategorySalesData(results[3].value.data || []);
      }
      // Dues
      if (results[4].status === 'fulfilled') {
        const duesRes = results[4].value;
        const totalDue = (duesRes.data || []).reduce((sum, sale) => sum + Number(sale.dueAmount || 0), 0);
        setDues(totalDue);
      }
      setIsLoading(false);
      if (hasCriticalError) setError(t('dashboardPage.errorLoad'));
    }).catch(() => {
      if (!isMounted) return;
      setError(t('dashboardPage.errorLoad'));
      setIsLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  // Load today's stats whenever date changes
  useEffect(() => {
    setTodayStats({ sales: 0, numberOfSales: 0, netRevenue: 0 });
    fetchDailyReport(date)
      .then((dailyRes) => {
        setTodayStats({
          sales: dailyRes.data?.totalSales || 0,
          numberOfSales: dailyRes.data?.numberOfSales || 0,
          netRevenue: dailyRes.data?.netRevenue || 0,
        });
      }).catch(() => {
        // Ignore error, show zeroes
        setTodayStats({ sales: 0, numberOfSales: 0, netRevenue: 0 });
      });
  }, [date]);

  // Load all-time summary (for summary cards) only on mount
  useEffect(() => {
    fetchSalesSummary()
      .then((summaryRes) => {
        setSummaryStats({
          totalSales: summaryRes.data?.totalSales || 0,
          totalSalesCount: summaryRes.data?.totalSalesCount || 0,
          netRevenue: summaryRes.data?.netRevenue || 0,
          outstandingReceivable: summaryRes.data?.outstandingReceivable || 0,
        });
      }).catch(() => {
        setSummaryStats({
          totalSales: 0,
          totalSalesCount: 0,
          netRevenue: 0,
          outstandingReceivable: 0,
        });
      });
  }, []);

  // Weekly sales data for chart: by default load last 7 days, or custom range
  useEffect(() => {
    let cancelled = false;
    async function loadSummary() {
      let summaryData = null;
      try {
        if (summaryRange.from && summaryRange.to) {
          summaryData = await fetchSalesSummary(summaryRange.from, summaryRange.to);
        } else {
          // default last 7 days
          const to = dayjs();
          const from = dayjs().subtract(6, 'day');
          summaryData = await fetchSalesSummary(from.format('YYYY-MM-DD'), to.format('YYYY-MM-DD'));
        }
        if (cancelled) return;
        setWeeklySalesData([
          {
            name: summaryData.data?.fromDate && summaryData.data?.toDate
              ? `${dayjs(summaryData.data?.fromDate).format('DD MMM')} - ${dayjs(summaryData.data?.toDate).format('DD MMM')}`
              : 'Period',
            sales: summaryData.data?.totalSales || 0,
            count: summaryData.data?.totalSalesCount || 0,
            netRevenue: summaryData.data?.netRevenue || 0,
            outstandingReceivable: summaryData.data?.outstandingReceivable || 0,
          }
        ]);
      } catch (err) {
        if (!cancelled) setWeeklySalesData([]);
      }
    }
    loadSummary();
    return () => { cancelled = true; }
  }, [summaryRange]);

  const formatCurrency = (amount) =>
    `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const topCategory = categorySalesData.length
    ? categorySalesData.reduce((a, b) => (a.value > b.value ? a : b)).name
    : '-';

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 }, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      {error && (
        <Box sx={{ p: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      {/* Shop Info */}
      {shop && (
        <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: '#f8fafc' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            {shop.name}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {shop.address}, {shop.state} {shop.gstin ? `| ${t('dashboardPage.gstin')}: ${shop.gstin}` : ''}
          </Typography>
        </Paper>
      )}

      {/* Date Filter and Quick Actions */}
      <Box sx={{
        display: 'flex', flexDirection: { xs: 'column', md: 'row' },
        alignItems: { md: 'center' }, justifyContent: 'space-between', mb: 3, gap: 2
      }}>
        <TextField
          label={t('dashboardPage.selectDate')}
          type="date"
          size="small"
          value={date}
          onChange={e => setDate(e.target.value)}
          sx={{ width: 180, bgcolor: '#fff', borderRadius: 1 }}
          InputLabelProps={{ shrink: true }}
        />
        {/* Optional: Add summary date range filter here for sales summary chart */}
        {/* <TextField
          label="Summary From"
          type="date"
          size="small"
          value={summaryRange.from}
          onChange={e => setSummaryRange({ ...summaryRange, from: e.target.value })}
        />
        <TextField
          label="Summary To"
          type="date"
          size="small"
          value={summaryRange.to}
          onChange={e => setSummaryRange({ ...summaryRange, to: e.target.value })}
        /> */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" color="primary" onClick={() => navigate('/sales')}>
            {t('dashboardPage.addSale')}
          </Button>
          <Button variant="outlined" color="primary" onClick={() => navigate('/sales?tab=history')}>
            {t('dashboardPage.viewSalesHistory')}
          </Button>
        </Box>
      </Box>

      {/* Loading Indicator (if still loading but not error) */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      )}

      {/* Metric Cards */}
      {!isLoading && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center', borderRadius: '12px', bgcolor: '#fff' }}>
              <Typography variant="h6" color="text.secondary">{t('dashboardPage.todaysSales')}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                {formatCurrency(todayStats.sales)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center', borderRadius: '12px', bgcolor: '#fff' }}>
              <Typography variant="h6" color="text.secondary">{t('dashboardPage.totalCustomers')}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                {totalCustomers}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center', borderRadius: '12px', bgcolor: '#fff' }}>
              <Typography variant="h6" color="text.secondary">{t('dashboardPage.totalItemsSold')}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                {totalItemsSold}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center', borderRadius: '12px', bgcolor: '#fff' }}>
              <Typography variant="h6" color="text.secondary">{t('dashboardPage.outstandingDues')}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#b71c1c' }}>
                {formatCurrency(dues)}
              </Typography>
            </Paper>
          </Grid>

          {/* Weekly Sales Chart */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: '12px', bgcolor: '#fff' }}>
              <Typography variant="h6" gutterBottom>{t('dashboardPage.salesSummary')}</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklySalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sales" name={t('dashboardPage.chartSales')} stroke="#1976d2" strokeWidth={2} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="count" name={t('dashboardPage.chartCount')} stroke="#00C49F" strokeWidth={2} />
                  <Line type="monotone" dataKey="netRevenue" name={t('dashboardPage.chartNetRevenue')} stroke="#A020F0" strokeWidth={2} />
                  <Line type="monotone" dataKey="outstandingReceivable" name={t('dashboardPage.chartOutstandingReceivable')} stroke="#b71c1c" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Sales by Category Chart */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: '12px', bgcolor: '#fff' }}>
              <Typography variant="h6" gutterBottom>{t('dashboardPage.salesByCategory')}</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categorySalesData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#1976d2"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categorySalesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('dashboardPage.topCategory')}: <b>{topCategory}</b>
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard;