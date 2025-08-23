import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  fetchItemDemand,
  exportItemDemand,
  fetchCustomerTrends,
  fetchFuturePurchaseOrders,
  fetchTopItems,
  fetchSeasonalTrends,
  fetchChurnPrediction,
} from '../services/api';

const CHART_COLORS = ['#3B82F6', '#6366F1', '#A78BFA', '#E879F9', '#EC4899', '#F472B6'];

const AnalyticsDashboard = () => {
  const [itemDemand, setItemDemand] = useState([]);
  const [customerTrends, setCustomerTrends] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [seasonalTrends, setSeasonalTrends] = useState([]);
  const [churnPrediction, setChurnPrediction] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exportFormat, setExportFormat] = useState('xlsx');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [
          demandRes,
          trendsRes,
          topItemsRes,
          seasonalRes,
          churnRes,
          purchaseRes,
        ] = await Promise.all([
          fetchItemDemand(),
          fetchCustomerTrends(),
          fetchTopItems(),
          fetchSeasonalTrends(),
          fetchChurnPrediction(),
          fetchFuturePurchaseOrders(),
        ]);
        setItemDemand(demandRes.data || []);
        setCustomerTrends(trendsRes.data || []);
        setTopItems(topItemsRes.data || []);
        setSeasonalTrends(seasonalRes.data || []);
        setChurnPrediction(churnRes.data || []);
        setPurchaseOrders(purchaseRes.data || []);
      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExport = async () => {
    try {
      const res = await exportItemDemand(exportFormat);
      let filename = `item-demand-analytics.${exportFormat}`;
      if (exportFormat === 'excel' || exportFormat === 'xlsx') filename = 'item-demand-analytics.xlsx';
      if (exportFormat === 'pdf') filename = 'item-demand-analytics.pdf';
      if (exportFormat === 'csv') filename = 'item-demand-analytics.csv';
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export item demand analytics.');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f6fa', p: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        {/* Header Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Business Analytics Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small">
              <InputLabel id="export-format-label">Format</InputLabel>
              <Select
                labelId="export-format-label"
                value={exportFormat}
                label="Format"
                onChange={e => setExportFormat(e.target.value)}
                sx={{ minWidth: 100 }}
              >
                <MenuItem value="xlsx">Excel (.xlsx)</MenuItem>
                <MenuItem value="csv">CSV (.csv)</MenuItem>
                <MenuItem value="pdf">PDF (.pdf)</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="primary"
              onClick={handleExport}
              sx={{ borderRadius: 8, px: 4, fontWeight: 'bold' }}
            >
              Export Item Demand
            </Button>
          </Box>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 300, justifyContent: 'center' }}>
            <CircularProgress size={48} color="primary" />
            <Typography variant="h6" sx={{ mt: 2 }}>Loading data...</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Item Demand Analytics Card */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom align="center">
                  Item Demand Prediction
                </Typography>
                <Box sx={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={itemDemand}>
                      <XAxis dataKey="itemName" stroke="#888" angle={-45} textAnchor="end" height={60} />
                      <YAxis stroke="#888" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="predictedDemandNextMonth" name="Predicted Demand" fill="#3B82F6" barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Top Selling Items Card */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom align="center">
                  Top Selling Items
                </Typography>
                <Box sx={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={topItems}>
                      <XAxis dataKey="itemName" stroke="#888" angle={-45} textAnchor="end" height={60} />
                      <YAxis stroke="#888" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="changePercent" name="Change (%)" stroke="#A78BFA" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Churn Prediction Card */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom align="center">
                  Customer Churn Risk
                </Typography>
                <Box sx={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={churnPrediction}
                        dataKey="churnProbability"
                        nameKey="customerName"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {
                          churnPrediction.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))
                        }
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Customer Trends Card */}
            <Grid item xs={12} md={12} lg={8}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom align="center">
                  Customer Buying Trends
                </Typography>
                <Grid container spacing={2}>
                  {customerTrends.map(trend => (
                    <Grid item xs={12} md={4} key={trend.customerId}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc' }}>
                        <Typography fontWeight="bold">{trend.customerName}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1 }}>
                          Pattern: {trend.buyingPattern}
                        </Typography>
                        <Typography variant="body2">
                          <b>Freq. Items:</b> {trend.frequentlyBoughtItems.join(', ')}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>

            {/* Seasonal Trends Card */}
            <Grid item xs={12} md={4} lg={4}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom align="center">
                  Seasonal Trends
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {seasonalTrends.map((trend, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography fontWeight="bold">{trend.season}</Typography>
                    <Typography variant="body2" color="text.secondary">{trend.trendDescription}</Typography>
                  </Box>
                ))}
              </Paper>
            </Grid>

            {/* Future Purchase Orders Card */}
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom align="center">
                  Future Purchase Order Suggestions
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><b>Item ID</b></TableCell>
                        <TableCell><b>Item Name</b></TableCell>
                        <TableCell><b>Suggested Quantity</b></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {purchaseOrders.map((order, index) => (
                        <TableRow key={index}>
                          <TableCell>{order.itemId}</TableCell>
                          <TableCell>{order.itemName}</TableCell>
                          <TableCell>{order.suggestedQuantity}</TableCell>
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
    </Box>
  );
};

export default AnalyticsDashboard;