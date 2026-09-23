import React, { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useExpenseAnalytics } from '../../hooks/useExpenseAnalytics';
import { useExpenseApprovals } from '../../hooks/useExpenseApprovals';
import BudgetProgressBar from '../../components/expenses/BudgetProgressBar';

const ExpenseDashboard = () => {
  const { metrics, categorySpending, loading: analyticsLoading, error: analyticsError, fetchDashboardMetrics, fetchCategorySpending } = useExpenseAnalytics();
  const { pendingCount, fetchPendingCount } = useExpenseApprovals();
  const [dateRange, setDateRange] = useState({ start: new Date(new Date().getFullYear(), new Date().getMonth(), 1), end: new Date() });

  useEffect(() => {
    fetchDashboardMetrics();
    fetchPendingCount();
    if (dateRange.start && dateRange.end) {
      fetchCategorySpending(undefined, dateRange.start, dateRange.end);
    }
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

  const MetricCard = ({ icon: Icon, label, value, trend, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {label}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : value}
            </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'green' }} />
                <Typography variant="caption" sx={{ color: 'green' }}>
                  {trend}
                </Typography>
              </Box>
            )}
          </Box>
          <Icon sx={{ fontSize: 40, color, opacity: 0.6 }} />
        </Box>
      </CardContent>
    </Card>
  );

  if (analyticsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (analyticsError) {
    return <Alert severity="error">Error loading dashboard: {analyticsError}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Expense Dashboard
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Overview of your expense management system
        </Typography>
      </Box>

      {/* Top Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={AccountBalanceIcon}
            label="Total Expenses"
            value={metrics?.totalExpenses || 0}
            trend="+12% vs last month"
            color="#0088FE"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={PendingActionsIcon}
            label="Pending Approvals"
            value={pendingCount || 0}
            color="#FF8042"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={CheckCircleIcon}
            label="Approved"
            value={metrics?.approvedCount || 0}
            trend="+8% this month"
            color="#00C49F"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {/* EXP-13 fix: the API returns totalExpenses (a count), not a total amount.
              "Average Amount" cannot be computed from count/count. Replaced with
              "Total Expenses Count" until the backend provides totalAmount and
              expenseCount as separate fields in DashboardMetrics. */}
          <MetricCard
            icon={TrendingUpIcon}
            label="Total Expenses"
            value={metrics?.totalExpenses || 0}
            color="#FFBB28"
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Category Spending Pie Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Spending by Category
              </Typography>
              {categorySpending && categorySpending.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categorySpending}
                      dataKey="amount"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {categorySpending.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="textSecondary">No data available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Expense Trend Bar Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Monthly Trend
              </Typography>
              {metrics?.monthlyTrend && metrics.monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                    <Legend />
                    <Bar dataKey="amount" fill="#8884d8" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="textSecondary">No data available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Budget Status */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Budget Status
              </Typography>
              {/* EXP-16 fix: use real category spending data from the API instead of
                  hardcoded placeholder values that never change per shop. */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {categorySpending && categorySpending.length > 0
                  ? categorySpending.map((cat, idx) => (
                      <BudgetProgressBar
                        key={cat.categoryId ?? idx}
                        label={cat.categoryName || `Category ${cat.categoryId}`}
                        spent={cat.amount || 0}
                        budget={cat.budgetThreshold || cat.amount * 1.5 || 1000}
                      />
                    ))
                  : (
                      <Typography color="textSecondary">
                        No category spending data for this period
                      </Typography>
                    )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Quick Stats
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Pending Reimbursement
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      ₹{metrics?.pendingReimbursement || 0}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Rejected This Month
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {metrics?.rejectedCount || 0}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Policy Violations
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {metrics?.violationCount || 0}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Avg Days to Approve
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {metrics?.avgApprovalDays || 0} days
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExpenseDashboard;
