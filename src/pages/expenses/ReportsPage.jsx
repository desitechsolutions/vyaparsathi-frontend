import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import DownloadIcon from '@mui/icons-material/Download';
import { useExpenseAnalytics } from '../../hooks/useExpenseAnalytics';
import { useExpenseFilters } from '../../hooks/useExpenseFilters';

const ReportsPage = () => {
  const { metrics, categorySpending, loading, error, fetchDashboardMetrics, fetchCategorySpending } = useExpenseAnalytics();
  const [selectedTab, setSelectedTab] = useState(0);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(),
  });
  const [reportType, setReportType] = useState('summary'); // summary, category, employee, trend

  useEffect(() => {
    fetchDashboardMetrics();
    if (dateRange.start && dateRange.end) {
      fetchCategorySpending(null, dateRange.start, dateRange.end);
    }
  }, [dateRange]);

  const handleExportReport = (format) => {
    console.log(`Exporting report as ${format}`);
    // Implement export logic
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Expense Reports
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Detailed analysis of your expenses
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExportReport('pdf')}>
            PDF
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExportReport('csv')}>
            CSV
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExportReport('excel')}>
            Excel
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => setDateRange({ ...dateRange, start: new Date(e.target.value) })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => setDateRange({ ...dateRange, end: new Date(e.target.value) })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select value={reportType} label="Report Type" onChange={(e) => setReportType(e.target.value)}>
                  <MenuItem value="summary">Summary</MenuItem>
                  <MenuItem value="category">By Category</MenuItem>
                  <MenuItem value="employee">By Employee</MenuItem>
                  <MenuItem value="trend">Trend Analysis</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">Error loading reports: {error}</Alert>
      ) : (
        <Box>
          {/* Summary Report */}
          {reportType === 'summary' && (
            <Grid container spacing={3}>
              {/* Key Metrics */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Key Metrics Summary
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                          <Typography variant="caption" color="textSecondary">
                            Total Expenses
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            ₹{metrics?.totalExpenses?.toLocaleString('en-IN') || 0}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                          <Typography variant="caption" color="textSecondary">
                            Number of Expenses
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {metrics?.expenseCount || 0}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                          <Typography variant="caption" color="textSecondary">
                            Average Expense
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            ₹{Math.round((metrics?.totalExpenses || 0) / (metrics?.expenseCount || 1)).toLocaleString('en-IN')}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                          <Typography variant="caption" color="textSecondary">
                            Approved Rate
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {metrics?.approvalRate || 0}%
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Status Distribution */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Status Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Approved', value: metrics?.approvedCount || 0 },
                            { name: 'Pending', value: metrics?.pendingCount || 0 },
                            { name: 'Rejected', value: metrics?.rejectedCount || 0 },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {['Approved', 'Pending', 'Rejected'].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Approval Timeline */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Approval Efficiency
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Avg Days to Approval
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                          {metrics?.avgApprovalDays || 0} days
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Fastest Approval
                        </Typography>
                        <Typography variant="body2">
                          {metrics?.fastestApprovalDays || 0} days
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Slowest Approval
                        </Typography>
                        <Typography variant="body2">
                          {metrics?.slowestApprovalDays || 0} days
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Category Report */}
          {reportType === 'category' && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Expenses by Category
                    </Typography>
                    {categorySpending && categorySpending.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={categorySpending}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="categoryName" />
                          <YAxis />
                          <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                          <Legend />
                          <Bar dataKey="amount" fill="#8884d8" name="Amount" />
                          <Bar dataKey="count" fill="#82ca9d" name="Count" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <Alert severity="info">No data available</Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Trend Report */}
          {reportType === 'trend' && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Expense Trends
                    </Typography>
                    {metrics?.monthlyTrend && metrics.monthlyTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={metrics.monthlyTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                          <Legend />
                          <Line type="monotone" dataKey="amount" stroke="#8884d8" name="Expenses" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <Alert severity="info">No data available</Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Employee Report */}
          {reportType === 'employee' && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Expenses by Employee
                    </Typography>
                    <Alert severity="info">
                      Employee-wise report showing individual expense metrics
                    </Alert>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ReportsPage;
