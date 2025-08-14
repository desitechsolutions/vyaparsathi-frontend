import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, CircularProgress } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// NOTE: You will need to install recharts: npm install recharts

// Since the original `../services/api` and `../services/endpoints`
// are not available, we will simulate the API calls here for a complete, runnable example.
// In a real application, you would replace this with your actual API service.
const mockApi = {
  getDailyReport: (date) => {
    console.log(`Fetching daily report for: ${date}`);
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          data: {
            totalSales: 8520,
            numberOfSales: 125,
            totalItems: 350,
          }
        });
      }, 500);
    });
  },
  getWeeklySales: () => {
    console.log("Fetching weekly sales data...");
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          data: [
            { name: 'Mon', sales: 4000 },
            { name: 'Tue', sales: 3000 },
            { name: 'Wed', sales: 2000 },
            { name: 'Thu', sales: 2780 },
            { name: 'Fri', sales: 1890 },
            { name: 'Sat', sales: 2390 },
            { name: 'Sun', sales: 3490 },
          ]
        });
      }, 500);
    });
  },
  getCategorySales: () => {
    console.log("Fetching sales by category data...");
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          data: [
            { name: 'Electronics', value: 400 },
            { name: 'Clothing', value: 300 },
            { name: 'Books', value: 300 },
            { name: 'Home Goods', value: 200 },
          ]
        });
      }, 500);
    });
  }
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = () => {
  const [stats, setStats] = useState({ sales: 0, customers: 0, items: 0 });
  const [weeklySalesData, setWeeklySalesData] = useState([]);
  const [categorySalesData, setCategorySalesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // useEffect hook to fetch all necessary data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch today's sales stats using the mock API
        const today = new Date().toISOString().split('T')[0];
        const dailyRes = await mockApi.getDailyReport(today);
        setStats({
          sales: dailyRes.data.totalSales || 0,
          customers: dailyRes.data.numberOfSales || 0,
          items: dailyRes.data.totalItems || 0,
        });

        // Fetch weekly sales data for the LineChart
        const weeklyRes = await mockApi.getWeeklySales();
        setWeeklySalesData(weeklyRes.data);

        // Fetch sales by category data for the PieChart
        const categoryRes = await mockApi.getCategorySales();
        setCategorySalesData(categoryRes.data);

        setIsLoading(false);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []); // Empty dependency array ensures this runs once on mount

  // Conditional rendering for a loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4, color: '#333' }}>
        Dashboard Overview
      </Typography>
      <Grid container spacing={3}>
        {/* Metric Cards */}
        <Grid item xs={12} sm={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center', borderRadius: '12px', backgroundColor: '#fff' }}>
            <Typography variant="h6" color="text.secondary">Today's Sales</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1a237e' }}>₹{stats.sales}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center', borderRadius: '12px', backgroundColor: '#fff' }}>
            <Typography variant="h6" color="text.secondary">Total Customers</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1a237e' }}>{stats.customers}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center', borderRadius: '12px', backgroundColor: '#fff' }}>
            <Typography variant="h6" color="text.secondary">Items Sold Today</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1a237e' }}>{stats.items}</Typography>
          </Paper>
        </Grid>

        {/* Weekly Sales Chart */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: '12px', backgroundColor: '#fff' }}>
            <Typography variant="h6" gutterBottom>Weekly Sales Trend</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklySalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Sales by Category Chart */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: '12px', backgroundColor: '#fff' }}>
            <Typography variant="h6" gutterBottom>Sales by Category</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categorySalesData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
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
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
